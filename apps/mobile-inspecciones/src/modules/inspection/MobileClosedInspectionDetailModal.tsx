import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import type {
  InspectionDetailEvidenceResponse,
  InspectionDetailFindingItemResponse,
  InspectionDetailResponse,
} from '@aurelia/contracts';
import { API_URL } from '../../shared/services/http-client';
import { colors, fontWeight } from '../../shared/theme/tokens';
import { useMobileSession } from '../auth/mobileSession.store';
import { useMobileInspectionDetail } from './hooks/useMobileInspectionManagement';
import { MobileInspectionChecklistResultPanel } from './MobileInspectionChecklistResultPanel';
import {
  MobileInspectionFollowupIcon,
  MobileInspectionPdfIcon,
  MobileInspectionSlaAlertIcon,
  MobileInspectionTimelineCompletedIcon,
  MobileInspectionTimelinePendingIcon,
} from './MobileInspectionDetailIcons';

type DetailTab = 'observations' | 'result' | 'followups' | 'general';

type Props = {
  visible: boolean;
  inspectionId: string | null;
  onClose: () => void;
};

type FollowupStep = {
  id: string;
  title: string;
  date: string;
  summary?: string;
  completed: boolean;
  occurredAt?: string | null;
};

const apiOrigin = API_URL.replace(/\/api\/?$/, '');

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
}

function toTimestamp(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Number.NaN : date.getTime();
}

function allFindings(detail: InspectionDetailResponse): InspectionDetailFindingItemResponse[] {
  return [
    ...detail.findings.executed,
    ...detail.findings.open,
    ...detail.findings.closed,
    ...detail.findings.rejected,
  ];
}

function latestClosedAt(detail: InspectionDetailResponse): string | null {
  const values = allFindings(detail)
    .map((item) => item.closedAt)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => toTimestamp(right) - toTimestamp(left));
  return values[0] ?? null;
}

function closureDays(start: string | null | undefined, end: string | null | undefined): string {
  const startAt = toTimestamp(start);
  const endAt = toTimestamp(end);
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt)) return '—';
  const days = Math.max(0, Math.ceil((endAt - startAt) / 86_400_000));
  return `${days} ${days === 1 ? 'día' : 'días'}`;
}

function evidenceUrl(evidence: InspectionDetailEvidenceResponse | undefined): string | null {
  if (!evidence) return null;
  if (evidence.fileId) return `${apiOrigin}/api/files/${encodeURIComponent(evidence.fileId)}/content`;
  if (!evidence.url) return null;
  if (evidence.url.startsWith('http')) return evidence.url;
  if (evidence.url.startsWith('/api/')) return `${apiOrigin}${evidence.url}`;
  return evidence.url;
}

function severityColors(label: string): { background: string; color: string } {
  const normalized = label.toLowerCase();
  if (normalized.includes('crít') || normalized.includes('crit')) {
    return { background: '#ffd0db', color: '#570b1d' };
  }
  if (normalized.includes('alto') || normalized.includes('grave')) {
    return { background: '#ffe1cd', color: '#532a0e' };
  }
  if (normalized.includes('moder')) {
    return { background: '#fbe1d0', color: '#69462e' };
  }
  return { background: '#e0ffd3', color: '#2a5c16' };
}

function checklistPresentation(detail: InspectionDetailResponse) {
  const title = [detail.general.areaName, detail.general.companyName]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' · ') || detail.header.title;
  const templateName = detail.general.templateName?.trim() || null;
  const templateCode = detail.general.templateCode?.trim() || null;
  const templateParts = [
    templateName,
    templateCode && !templateName?.includes(templateCode) ? templateCode : null,
  ].filter((value): value is string => Boolean(value));
  const metadataLine1 = templateParts.length > 0
    ? `Checklist · ${templateParts.join(' - ')}`
    : detail.header.metadataLine1;
  const location = detail.general.locationLabel?.trim()
    || detail.general.sectorName?.trim()
    || detail.general.areaName?.trim()
    || null;
  const date = formatDate(detail.general.scheduledAt);
  const metadataLine2 = [date === '—' ? null : date, location]
    .filter((value): value is string => Boolean(value))
    .join(' · ') || detail.header.metadataLine2;
  return { title, metadataLine1, metadataLine2 };
}

function findingTypeLine(detail: InspectionDetailResponse): string | null {
  const value = detail.header.metadataLine2?.trim();
  if (!value) return null;
  return value.toLowerCase().startsWith('tipo de hallazgo') ? value : `Tipo de hallazgo: ${value}`;
}

function EvidenceBox({
  title,
  evidence,
  after = false,
}: {
  title: string;
  evidence?: InspectionDetailEvidenceResponse;
  after?: boolean;
}) {
  const token = useMobileSession((state) => state.accessToken);
  const uri = evidenceUrl(evidence);
  return (
    <View style={styles.evidenceBox}>
      <View style={styles.evidenceHeader}><Text style={styles.evidenceTitle}>{title}</Text></View>
      {uri ? (
        <Image
          source={{ uri, headers: token ? { Authorization: `Bearer ${token}` } : undefined }}
          style={styles.evidenceImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.evidenceEmpty, after && styles.evidenceAfterEmpty]}>
          <FontAwesome5 name="image" size={after ? 20 : 17} color={after ? colors.successTxt : colors.blueLink} />
        </View>
      )}
    </View>
  );
}

function TextBlock({
  label,
  value,
  bordered = false,
}: {
  label: string;
  value: string | null;
  bordered?: boolean;
}) {
  return (
    <View style={[styles.textBlock, bordered && styles.textBlockBordered]}>
      <Text style={styles.blockLabel}>{label}</Text>
      <Text style={styles.blockValue}>{value || '—'}</Text>
    </View>
  );
}

function closedFindingIndex(detail: InspectionDetailResponse, item: InspectionDetailFindingItemResponse): number {
  if (detail.header.kind === 'checklist' && item.checklistItemId) {
    const checklistItems = detail.checklistResult?.sections.flatMap((section) => section.items) ?? [];
    const checklistIndex = checklistItems.findIndex((candidate) => candidate.checklistItemId === item.checklistItemId);
    if (checklistIndex >= 0) return checklistIndex + 1;
  }
  const findingIndex = allFindings(detail).findIndex((candidate) => candidate.findingId === item.findingId);
  return findingIndex >= 0 ? findingIndex + 1 : 1;
}

function checklistQuestion(detail: InspectionDetailResponse, item: InspectionDetailFindingItemResponse): string | null {
  if (detail.header.kind !== 'checklist' || !item.checklistItemId) return null;
  const checklistItem = detail.checklistResult?.sections
    .flatMap((section) => section.items)
    .find((candidate) => candidate.checklistItemId === item.checklistItemId);
  return checklistItem?.question?.trim() || item.title?.trim() || null;
}

function ClosedFindingCard({
  detail,
  item,
}: {
  detail: InspectionDetailResponse;
  item: InspectionDetailFindingItemResponse;
}) {
  const severity = severityColors(item.severityLabel);
  const index = closedFindingIndex(detail, item);
  const question = checklistQuestion(detail, item);
  const label = detail.header.kind === 'checklist' ? `Ítem. ${index}` : `Obs. ${index}`;
  return (
    <View style={styles.findingCard}>
      <View style={styles.findingTop}>
        <View style={styles.pillRow}>
          <View style={styles.indexPill}><Text style={styles.indexPillText}>{label}</Text></View>
          <View style={[styles.severityPill, { backgroundColor: severity.background }]}>
            <Text style={[styles.severityPillText, { color: severity.color }]}>{item.severityLabel}</Text>
          </View>
        </View>
        <View style={styles.closedPill}>
          <FontAwesome5 name="circle" size={5} color={colors.successTxt} solid />
          <Text style={styles.closedPillText}>Cerrado</Text>
        </View>
      </View>

      <View style={styles.findingCopy}>
        {question ? <Text style={styles.question}>{question}</Text> : null}
        <TextBlock label="CONDICIÓN DETECTADA" value={item.condition} bordered />
        <TextBlock label="MEDIDA CORRECTIVA PROPUESTA" value={item.proposedCorrectiveAction} />
        <TextBlock label="DESCRIPCIÓN DE LA ACCIÓN TOMADA" value={item.executedActionDescription} />
        <View style={styles.evidenceRow}>
          <EvidenceBox title="ANTES" evidence={item.beforeEvidence[0]} />
          <EvidenceBox title="DESPUÉS" evidence={item.afterEvidence[0]} after />
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>SLA cerrado</Text>
          <View style={styles.infoValueRow}>
            <MobileInspectionSlaAlertIcon color={colors.ocreTxt} />
            <Text style={[styles.infoValue, { color: colors.ocreTxt }]}>{closureDays(detail.general.scheduledAt, item.closedAt)}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Fecha de cierre</Text>
          <Text style={[styles.infoValue, { color: colors.muted }]}>{formatDate(item.closedAt)}</Text>
        </View>
      </View>
    </View>
  );
}

function ClosedObservationsPanel({ detail }: { detail: InspectionDetailResponse }) {
  const items = detail.findings.closed ?? [];
  return (
    <View style={styles.observationsPanel}>
      <View style={styles.closedGroupRow}>
        <FontAwesome5 name="check-circle" size={14} color={colors.successTxt} solid />
        <Text style={styles.closedGroupLabel}>CERRADAS</Text>
        <View style={styles.closedGroupCount}><Text style={styles.closedGroupCountText}>{items.length}</Text></View>
      </View>
      {items.length > 0 ? (
        <View style={styles.cardsList}>
          {items.map((item) => <ClosedFindingCard key={item.findingId} detail={detail} item={item} />)}
        </View>
      ) : (
        <View style={styles.emptyState}><Text style={styles.emptyStateText}>No hay observaciones cerradas.</Text></View>
      )}
    </View>
  );
}

function buildFollowupSteps(detail: InspectionDetailResponse): FollowupStep[] {
  const findings = allFindings(detail);
  const events: FollowupStep[] = detail.followups.map((followup) => ({
    id: `followup-${followup.followupId}`,
    title: followup.title || `Seguimiento ${followup.sequenceNumber}`,
    date: formatDate(followup.performedAt),
    summary: followup.description,
    completed: followup.completed,
    occurredAt: followup.performedAt,
  }));
  findings.forEach((item, index) => {
    const label = detail.header.kind === 'checklist' ? `Ítem ${index + 1}` : `Obs. ${index + 1}`;
    if (item.executedAt) {
      events.push({
        id: `executed-${item.findingId}`,
        title: `${label} ejecutada`,
        date: formatDate(item.executedAt),
        summary: item.executedActionDescription ?? 'Observación marcada como ejecutada',
        completed: true,
        occurredAt: item.executedAt,
      });
    }
    if (item.closedAt) {
      events.push({
        id: `closed-${item.findingId}`,
        title: `${label} cerrada`,
        date: formatDate(item.closedAt),
        summary: 'Cierre aprobado por Admin GF HSE',
        completed: true,
        occurredAt: item.closedAt,
      });
    }
  });
  events.sort((left, right) => {
    const leftTime = toTimestamp(left.occurredAt);
    const rightTime = toTimestamp(right.occurredAt);
    return (Number.isFinite(leftTime) ? leftTime : Number.MAX_SAFE_INTEGER)
      - (Number.isFinite(rightTime) ? rightTime : Number.MAX_SAFE_INTEGER);
  });
  return [{
    id: 'initial',
    title: 'Inspección inicial',
    date: formatDate(detail.general.scheduledAt),
    summary: findings.length === 1 ? '1 observación detectada' : `${findings.length} observaciones detectadas`,
    completed: true,
    occurredAt: detail.general.scheduledAt,
  }, ...events];
}

function FollowupsPanel({ detail }: { detail: InspectionDetailResponse }) {
  const steps = useMemo(() => buildFollowupSteps(detail), [detail]);
  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeading}>
        <MobileInspectionFollowupIcon />
        <Text style={styles.sectionHeadingText}>HISTORIAL DE SEGUIMIENTOS</Text>
      </View>
      <View style={styles.timeline}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <View key={step.id} style={styles.timelineRow}>
              <View style={styles.timelineAxis}>
                {step.completed ? <MobileInspectionTimelineCompletedIcon /> : <MobileInspectionTimelinePendingIcon />}
                {!isLast ? <View style={styles.timelineLine} /> : null}
              </View>
              <View style={[styles.timelineCopy, !isLast && styles.timelineCopySpacing]}>
                <Text style={styles.timelineTitle}>{step.title}</Text>
                <Text style={styles.timelineDate}>{step.date}</Text>
                {step.summary ? <Text style={styles.timelineSummary}>{step.summary}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function GeneralRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.generalRow}>
      <Text style={styles.generalLabel}>{label}</Text>
      <Text style={styles.generalValue}>{value}</Text>
    </View>
  );
}

function GeneralSection({ title, icon, children }: { title: string; icon: React.ComponentProps<typeof FontAwesome5>['name']; children: React.ReactNode }) {
  return (
    <View style={styles.generalSection}>
      <View style={styles.generalSectionHeader}>
        <FontAwesome5 name={icon} size={11} color={colors.muted} />
        <Text style={styles.generalSectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function GeneralPanel({ detail }: { detail: InspectionDetailResponse }) {
  const location = [detail.general.areaName, detail.general.sectorName].filter(Boolean).join(' · ') || '—';
  return (
    <View style={styles.tabContent}>
      <GeneralSection title="QUIÉN REALIZÓ LA INSPECCIÓN" icon="user-tie">
        <GeneralRow label="Nombre" value={detail.general.inspectorName ?? '—'} />
        <GeneralRow label="Empresa" value={detail.general.inspectorCompanyName ?? detail.general.companyName ?? '—'} />
      </GeneralSection>
      <GeneralSection title="DÓNDE Y CUÁNDO" icon="map-marker-alt">
        <GeneralRow label="Área · Sector" value={location} />
        <GeneralRow label="Fecha" value={formatDate(detail.general.scheduledAt)} />
        <GeneralRow label="Tipo" value={detail.header.kind === 'checklist' ? 'Checklist normativo' : 'Hallazgo'} />
        {detail.general.templateName ? <GeneralRow label="Plantilla" value={detail.general.templateName} /> : null}
        {detail.general.templateCode ? <GeneralRow label="Código" value={detail.general.templateCode} /> : null}
      </GeneralSection>
      <GeneralSection title="CIERRE" icon="check-circle">
        <GeneralRow label="Fecha de cierre" value={formatDate(latestClosedAt(detail))} />
        <GeneralRow label="Observaciones cerradas" value={String(detail.findings.closed.length)} />
      </GeneralSection>
    </View>
  );
}

export function MobileClosedInspectionDetailModal({ visible, inspectionId, onClose }: Props) {
  const detailQuery = useMobileInspectionDetail(inspectionId, visible);
  const [activeTab, setActiveTab] = useState<DetailTab>('observations');
  const detail = detailQuery.data;

  useEffect(() => {
    if (visible) setActiveTab('observations');
  }, [visible, inspectionId]);

  const tabs: Array<{ key: DetailTab; label: string }> = detail?.header.kind === 'checklist'
    ? [
        { key: 'observations', label: 'Ítems No' },
        { key: 'result', label: 'Resultado completo' },
        { key: 'followups', label: 'Seguimientos' },
        { key: 'general', label: 'Datos generales' },
      ]
    : [
        { key: 'observations', label: 'Observaciones' },
        { key: 'followups', label: 'Seguimientos' },
        { key: 'general', label: 'Datos generales' },
      ];

  const header = detail
    ? detail.header.kind === 'checklist'
      ? checklistPresentation(detail)
      : {
          title: detail.header.title,
          metadataLine1: detail.header.metadataLine1,
          metadataLine2: findingTypeLine(detail),
        }
    : null;

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} accessibilityLabel="Cerrar detalle" />
        <View style={styles.screen}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerEyebrow}>{detail ? `#${detail.header.inspectionNumber.replace(/^#/, '')}` : 'DETALLE'}</Text>
              <Text style={styles.headerTitle} numberOfLines={2}>{header?.title ?? 'Cargando inspección'}</Text>
              {header ? (
                <View style={styles.headerMetadata}>
                  <Text style={styles.headerMetaText}>{header.metadataLine1}</Text>
                  {detail?.header.kind === 'checklist' && header.metadataLine2 ? <Text style={styles.headerMetaText}>{header.metadataLine2}</Text> : null}
                  <Text style={styles.headerMetaText}>Fecha de cierre · {detail ? formatDate(latestClosedAt(detail)) : '—'}</Text>
                  {detail?.header.kind === 'finding' && header.metadataLine2 ? <Text style={styles.headerMetaText}>{header.metadataLine2}</Text> : null}
                </View>
              ) : null}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel="Cerrar detalle">
              <Feather name="x" size={21} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {detail ? (
            <View style={styles.tabs}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {detailQuery.isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.gold} />
              <Text style={styles.loadingText}>Cargando inspección cerrada…</Text>
            </View>
          ) : null}
          {detailQuery.isError ? (
            <View style={styles.loading}>
              <Text style={styles.errorTitle}>No fue posible cargar el detalle</Text>
              <Text style={styles.loadingText}>Verifica tu conexión y permisos.</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => { void detailQuery.refetch(); }}>
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {detail ? (
            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
              {activeTab === 'observations' ? <ClosedObservationsPanel detail={detail} /> : null}
              {activeTab === 'result' ? <MobileInspectionChecklistResultPanel result={detail.checklistResult} /> : null}
              {activeTab === 'followups' ? <FollowupsPanel detail={detail} /> : null}
              {activeTab === 'general' ? <GeneralPanel detail={detail} /> : null}
            </ScrollView>
          ) : null}

          {detail ? (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.pdfButton}
                onPress={() => Alert.alert('Descargar PDF', 'La exportación PDF autenticada está disponible actualmente desde la versión web.')}
              >
                <MobileInspectionPdfIcon />
                <Text style={styles.pdfButtonText}>Descargar PDF</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(19,19,19,0.75)' },
  screen: { width: '100%', height: '99%', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden', backgroundColor: colors.white },
  header: { minHeight: 106, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerCopy: { flex: 1, paddingRight: 12 },
  headerEyebrow: { color: colors.navy, fontSize: 13, lineHeight: 16, fontWeight: fontWeight.bold },
  headerTitle: { color: '#2a2a2a', fontSize: 16, lineHeight: 22, letterSpacing: 0.32, fontWeight: fontWeight.bold },
  headerMetadata: { marginTop: 1, alignItems: 'flex-start' },
  headerMetaText: { color: colors.muted, fontSize: 11, lineHeight: 13, fontWeight: fontWeight.bold },
  closeButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  tabs: { minHeight: 39, flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: colors.border, backgroundColor: '#f7f7f7' },
  tab: { flex: 1, minHeight: 37, borderBottomWidth: 2, borderBottomColor: 'transparent', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, paddingBottom: 2 },
  tabActive: { borderBottomColor: colors.gold },
  tabText: { color: colors.muted, fontSize: 12, lineHeight: 14, fontWeight: fontWeight.semibold, textAlign: 'center' },
  tabTextActive: { color: colors.goldDark },
  body: { flex: 1, backgroundColor: colors.white },
  bodyContent: { flexGrow: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 },
  loadingText: { marginTop: 10, color: colors.muted, fontSize: 12, textAlign: 'center' },
  errorTitle: { color: colors.navy, fontSize: 16, fontWeight: fontWeight.bold },
  retryButton: { marginTop: 16, height: 42, borderRadius: 12, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  retryText: { color: colors.white, fontSize: 13, fontWeight: fontWeight.bold },
  observationsPanel: { backgroundColor: colors.white },
  closedGroupRow: { height: 56, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 16 },
  closedGroupLabel: { color: colors.successTxt, fontSize: 10, lineHeight: 13, letterSpacing: 0.6, fontWeight: fontWeight.bold },
  closedGroupCount: { minWidth: 19, height: 14, borderRadius: 8, backgroundColor: colors.successSurf, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  closedGroupCountText: { color: colors.successTxt, fontSize: 10, lineHeight: 12, letterSpacing: 0.6, fontWeight: fontWeight.bold },
  cardsList: { gap: 24, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24, backgroundColor: colors.white },
  emptyState: { minHeight: 120, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyStateText: { color: colors.muted, fontSize: 12, fontWeight: fontWeight.semibold, textAlign: 'center' },
  findingCard: { borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#f7f7f7', padding: 13.5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 1.5, elevation: 1 },
  findingTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  indexPill: { minHeight: 19, borderRadius: 6, backgroundColor: colors.blueSurf, justifyContent: 'center', paddingHorizontal: 8 },
  indexPillText: { color: colors.blueLink, fontSize: 11, lineHeight: 13, fontWeight: fontWeight.bold },
  severityPill: { minHeight: 19, borderRadius: 6, justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  severityPillText: { fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  closedPill: { minHeight: 19, borderRadius: 6, backgroundColor: colors.successSurf, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  closedPillText: { color: colors.successTxt, fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  findingCopy: { marginTop: 12, gap: 4 },
  question: { color: colors.primary, fontSize: 12, lineHeight: 18, fontWeight: fontWeight.medium },
  textBlock: { borderRadius: 8, backgroundColor: colors.white, paddingHorizontal: 10, paddingVertical: 8 },
  textBlockBordered: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 11, paddingVertical: 9 },
  blockLabel: { color: colors.muted, fontSize: 9, lineHeight: 11, letterSpacing: 1.5, fontWeight: fontWeight.bold },
  blockValue: { marginTop: 3, color: colors.primary, fontSize: 12, lineHeight: 16.8 },
  evidenceRow: { flexDirection: 'row', gap: 4, paddingTop: 8 },
  evidenceBox: { flex: 1, height: 91, borderRadius: 6, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.white },
  evidenceHeader: { height: 20, justifyContent: 'center', paddingHorizontal: 8, backgroundColor: colors.navy },
  evidenceTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 9, lineHeight: 11, fontWeight: fontWeight.bold },
  evidenceImage: { flex: 1, width: '100%' },
  evidenceEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#d8eff9' },
  evidenceAfterEmpty: { backgroundColor: '#dafccb' },
  infoRow: { minHeight: 33, marginTop: 4, borderRadius: 8, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 9 },
  infoLabel: { color: colors.muted, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.medium },
  infoValueRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  infoValue: { fontSize: 11, lineHeight: 13, fontWeight: fontWeight.bold },
  tabContent: { flexGrow: 1, backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 16, gap: 12 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionHeadingText: { color: colors.muted, fontSize: 11, lineHeight: 14, letterSpacing: 0.45, fontWeight: fontWeight.bold },
  timeline: { marginTop: 6 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineAxis: { width: 34, alignItems: 'center' },
  timelineLine: { width: 2, flex: 1, minHeight: 36, backgroundColor: colors.border, marginTop: 2 },
  timelineCopy: { flex: 1, paddingTop: 1 },
  timelineCopySpacing: { paddingBottom: 16 },
  timelineTitle: { color: colors.primary, fontSize: 13, lineHeight: 16, fontWeight: fontWeight.bold },
  timelineDate: { marginTop: 2, color: colors.muted, fontSize: 11, lineHeight: 14 },
  timelineSummary: { marginTop: 3, color: colors.muted, fontSize: 11, lineHeight: 15 },
  generalSection: { borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, overflow: 'hidden' },
  generalSectionHeader: { height: 38, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: '#f7f7f7', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12 },
  generalSectionTitle: { color: colors.muted, fontSize: 10, lineHeight: 12, letterSpacing: 0.55, fontWeight: fontWeight.bold },
  generalRow: { minHeight: 42, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 12, paddingVertical: 9 },
  generalLabel: { color: colors.muted, fontSize: 11, lineHeight: 14 },
  generalValue: { flex: 1, color: colors.primary, fontSize: 11, lineHeight: 14, fontWeight: fontWeight.semibold, textAlign: 'right' },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white, paddingHorizontal: 20, paddingTop: 15, paddingBottom: 14 },
  pdfButton: { height: 40, borderRadius: 8, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  pdfButtonText: { color: colors.body, fontSize: 13, lineHeight: 16, fontWeight: fontWeight.semibold },
});