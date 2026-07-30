import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import type {
  InspectionDetailLegacyMilestoneResponse,
  InspectionDetailLegacySummaryResponse,
  InspectionDetailResponse,
} from '@aurelia/contracts';
import { colors, fontWeight } from '../../shared/theme/tokens';
import {
  MobileInspectionFollowupIcon,
  MobileInspectionPdfIcon,
  MobileInspectionTimelineCompletedIcon,
  MobileInspectionTimelinePendingIcon,
} from './MobileInspectionDetailIcons';

type LegacyTab = 'observations' | 'followups' | 'general';

type Props = {
  visible: boolean;
  detail: InspectionDetailResponse;
  onClose: () => void;
};

const tabs: Array<{ key: LegacyTab; label: string }> = [
  { key: 'observations', label: 'Observaciones' },
  { key: 'followups', label: 'Seguimientos' },
  { key: 'general', label: 'Datos generales' },
];

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getUTCFullYear()}`;
}

function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function closurePercentage(legacy: InspectionDetailLegacySummaryResponse): number {
  if (legacy.totalObservations <= 0) return 0;
  return clampPercentage((legacy.closedObservations / legacy.totalObservations) * 100);
}

function milestonePercentage(
  legacy: InspectionDetailLegacySummaryResponse,
  milestone: InspectionDetailLegacyMilestoneResponse,
): number {
  if (milestone.closedPercentage !== null) return clampPercentage(milestone.closedPercentage);
  if (legacy.totalObservations <= 0) return 0;
  return clampPercentage(((legacy.totalObservations - milestone.pendingAfter) / legacy.totalObservations) * 100);
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: 'total' | 'closed' | 'open' }) {
  const palette = tone === 'closed'
    ? { backgroundColor: '#f1ffec', borderColor: '#b9eaaa', color: '#2a5c16' }
    : tone === 'open'
      ? { backgroundColor: '#fff8e7', borderColor: '#f4d28b', color: '#694b08' }
      : { backgroundColor: '#f5faff', borderColor: '#c9dced', color: '#24588b' };
  return (
    <View style={[styles.metricCard, { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor }]}>
      <Text style={[styles.metricLabel, { color: palette.color }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: palette.color }]}>{value}</Text>
    </View>
  );
}

function ObservationsPanel({ legacy }: { legacy: InspectionDetailLegacySummaryResponse }) {
  const percent = closurePercentage(legacy);
  return (
    <View style={styles.panel}>
      <View style={styles.sectionTitleRow}>
        <FontAwesome5 name="list-ul" size={11} color={colors.muted} />
        <Text style={styles.sectionTitle}>RESUMEN HISTÓRICO DE OBSERVACIONES</Text>
      </View>
      <View style={styles.metricsRow}>
        <MetricCard label="TOTAL" value={legacy.totalObservations} tone="total" />
        <MetricCard label="CERRADAS" value={legacy.closedObservations} tone="closed" />
        <MetricCard label="PENDIENTES" value={legacy.openObservations} tone="open" />
      </View>
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Avance de cierre</Text>
          <Text style={styles.progressValue}>{Math.round(percent)}%</Text>
        </View>
        <View style={styles.progressRail}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
      </View>
      <View style={styles.infoNotice}>
        <Text style={styles.infoNoticeText}>
          La fuente histórica conserva cantidades y avance agregado. No contiene descripción, severidad, responsables ni evidencias por cada observación.
        </Text>
      </View>
    </View>
  );
}

function FollowupCopy({ milestone, legacy }: { milestone: InspectionDetailLegacyMilestoneResponse; legacy: InspectionDetailLegacySummaryResponse }) {
  const percent = milestonePercentage(legacy, milestone);
  const cumulativeClosed = Math.max(0, legacy.totalObservations - milestone.pendingAfter);
  const pendingPercent = milestone.pendingPercentage ?? 100 - percent;
  return (
    <View style={styles.bulletList}>
      <Text style={styles.bulletText}>• Cerradas en este seguimiento: {milestone.closedIncrement} obs.</Text>
      <Text style={styles.bulletText}>• Cierre acumulado: {cumulativeClosed} obs. / {Math.round(percent)}%</Text>
      <Text style={styles.bulletText}>• Pendientes posteriores: {milestone.pendingAfter} obs. / {Math.round(pendingPercent)}%</Text>
    </View>
  );
}

function FollowupRow({
  title,
  date,
  completed,
  last,
  children,
}: {
  title: string;
  date: string;
  completed: boolean;
  last: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.timelineRow, !last && styles.timelineSpacing]}>
      <View style={styles.timelineAxis}>
        {completed ? <MobileInspectionTimelineCompletedIcon /> : <MobileInspectionTimelinePendingIcon />}
      </View>
      {!last ? <View style={styles.timelineLine} /> : null}
      <View style={styles.timelineContent}>
        <Text style={styles.timelineTitle}>{title}</Text>
        <Text style={styles.timelineDate}>{date}</Text>
        {children}
      </View>
    </View>
  );
}

function FollowupsPanel({ detail, legacy }: { detail: InspectionDetailResponse; legacy: InspectionDetailLegacySummaryResponse }) {
  const milestones = useMemo(
    () => new Map(legacy.milestones.map((milestone) => [milestone.sequenceNumber, milestone])),
    [legacy.milestones],
  );
  return (
    <View style={styles.panel}>
      <View style={styles.sectionTitleRow}>
        <MobileInspectionFollowupIcon />
        <Text style={styles.sectionTitle}>HISTORIAL DE SEGUIMIENTOS</Text>
      </View>
      <View style={styles.timeline}>
        <FollowupRow title="Inspección inicial" date={formatDate(detail.general.scheduledAt)} completed last={false}>
          <Text style={styles.timelineSummary}>
            {legacy.totalObservations} {legacy.totalObservations === 1 ? 'observación detectada' : 'observaciones detectadas'}
          </Text>
        </FollowupRow>
        {[1, 2, 3].map((sequenceNumber, index) => {
          const milestone = milestones.get(sequenceNumber);
          return (
            <FollowupRow
              key={sequenceNumber}
              title={`Seguimiento ${sequenceNumber}`}
              date={milestone ? formatDate(milestone.occurredAt) : '—'}
              completed={Boolean(milestone)}
              last={index === 2}
            >
              {milestone ? <FollowupCopy milestone={milestone} legacy={legacy} /> : null}
            </FollowupRow>
          );
        })}
      </View>
    </View>
  );
}

function InfoSection({ title, icon, rows }: { title: string; icon: React.ComponentProps<typeof FontAwesome5>['name']; rows: Array<{ label: string; value: string }> }) {
  return (
    <View style={styles.infoSection}>
      <View style={styles.infoSectionHeader}>
        <FontAwesome5 name={icon} size={10} color={colors.muted} />
        <Text style={styles.infoSectionTitle}>{title}</Text>
      </View>
      {rows.map((row, index) => (
        <View key={row.label} style={[styles.infoRow, index < rows.length - 1 && styles.infoRowBorder]}>
          <Text style={styles.infoLabel}>{row.label}</Text>
          <Text style={styles.infoValue}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

function GeneralPanel({ detail, legacy }: { detail: InspectionDetailResponse; legacy: InspectionDetailLegacySummaryResponse }) {
  const participantNames = legacy.participants
    .map((participant) => participant.fullName)
    .filter((value): value is string => Boolean(value))
    .join(', ');
  return (
    <View style={styles.panel}>
      <InfoSection
        title="QUIÉN REALIZÓ LA INSPECCIÓN"
        icon="user-tie"
        rows={[
          { label: 'Nombre original', value: legacy.originalInspectorName || participantNames || detail.general.inspectorName || '—' },
          { label: 'Empresa inspeccionada', value: legacy.originalCompanyName || detail.general.companyName || '—' },
        ]}
      />
      <InfoSection
        title="DÓNDE Y CUÁNDO"
        icon="map-marker-alt"
        rows={[
          { label: 'Área · Sector', value: [legacy.originalAreaName, legacy.originalSectorName].filter(Boolean).join(' · ') || '—' },
          { label: 'Fecha inicial', value: formatDate(detail.general.scheduledAt) },
          { label: 'Tipo', value: legacy.mode === 'checklist' ? 'Checklist' : 'Hallazgo' },
          { label: 'Clave histórica', value: `${legacy.legacyYear}-${String(legacy.legacyNumber).padStart(3, '0')}` },
        ]}
      />
      <InfoSection
        title="DETALLE ORIGINAL"
        icon="file-alt"
        rows={[
          { label: 'Detalle', value: legacy.originalDetail || 'Sin detalle original' },
          { label: 'Disponibilidad', value: 'Resumen agregado; sin observaciones, imágenes ni comentarios individuales' },
        ]}
      />
    </View>
  );
}

function latestMilestoneDate(legacy: InspectionDetailLegacySummaryResponse): string | null {
  const values = legacy.milestones
    .map((milestone) => milestone.occurredAt)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime());
  return values[0] ?? null;
}

export function MobileLegacyClosedInspectionDetailModal({ visible, detail, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<LegacyTab>('observations');
  const legacy = detail.legacy;
  if (!legacy) return null;
  const title = legacy.originalDetail || detail.header.title;
  const context = [legacy.originalAreaName, legacy.originalSectorName, formatDate(detail.general.scheduledAt)]
    .filter((value) => value && value !== '—')
    .join(' · ');

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} accessibilityLabel="Cerrar detalle" />
        <View style={styles.screen}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerEyebrow}>#{legacy.legacyYear}-{String(legacy.legacyNumber).padStart(3, '0')}</Text>
              <Text style={styles.headerTitle} numberOfLines={2}>{title}</Text>
              <Text style={styles.headerMeta}>{context}</Text>
              <Text style={styles.headerMeta}>Fecha de cierre · {formatDate(latestMilestoneDate(legacy))}</Text>
              <Text style={styles.headerSource}>Inspección restaurada desde planilla histórica</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel="Cerrar detalle">
              <FontAwesome5 name="times" size={25} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            {tabs.map((tab) => (
              <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key)}>
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {activeTab === 'observations' ? <ObservationsPanel legacy={legacy} /> : null}
            {activeTab === 'followups' ? <FollowupsPanel detail={detail} legacy={legacy} /> : null}
            {activeTab === 'general' ? <GeneralPanel detail={detail} legacy={legacy} /> : null}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.pdfButton} onPress={() => Alert.alert('Descargar PDF', 'La exportación PDF autenticada está disponible actualmente desde la versión web.')}>
              <MobileInspectionPdfIcon />
              <Text style={styles.pdfButtonText}>Descargar PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(19,19,19,0.75)' },
  screen: { width: '100%', height: '99%', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden', backgroundColor: colors.white },
  header: { minHeight: 122, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.white },
  headerCopy: { flex: 1, paddingRight: 10 },
  headerEyebrow: { color: colors.navy, fontSize: 13, lineHeight: 16, fontWeight: fontWeight.bold },
  headerTitle: { marginTop: 4, color: '#2a2a2a', fontSize: 16, lineHeight: 21, fontWeight: fontWeight.bold },
  headerMeta: { marginTop: 3, color: colors.muted, fontSize: 11, lineHeight: 14, fontWeight: fontWeight.bold },
  headerSource: { marginTop: 3, color: colors.muted, fontSize: 10, lineHeight: 13 },
  closeButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  tabs: { minHeight: 42, flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#e3e3e3', backgroundColor: '#f7f7f7' },
  tab: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', paddingHorizontal: 4 },
  tabActive: { borderBottomColor: '#c8a064' },
  tabText: { color: colors.muted, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.semibold, textAlign: 'center' },
  tabTextActive: { color: '#8e6e3e' },
  body: { flex: 1, backgroundColor: colors.white },
  bodyContent: { flexGrow: 1 },
  panel: { paddingHorizontal: 14, paddingVertical: 18, gap: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { color: colors.muted, fontSize: 11, lineHeight: 14, letterSpacing: 0.55, fontWeight: fontWeight.bold },
  metricsRow: { flexDirection: 'row', gap: 7 },
  metricCard: { flex: 1, minHeight: 70, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 10 },
  metricLabel: { fontSize: 8.5, lineHeight: 11, letterSpacing: 0.5, fontWeight: fontWeight.bold },
  metricValue: { marginTop: 5, fontSize: 22, lineHeight: 25, fontWeight: fontWeight.bold },
  progressCard: { borderWidth: 1, borderColor: '#e3e3e3', borderRadius: 10, backgroundColor: '#f7f7f7', padding: 12 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: { color: colors.muted, fontSize: 11, fontWeight: fontWeight.semibold },
  progressValue: { color: '#2a5c16', fontSize: 12, fontWeight: fontWeight.bold },
  progressRail: { marginTop: 7, height: 7, borderRadius: 4, backgroundColor: '#e3e3e3', overflow: 'hidden' },
  progressFill: { height: 7, borderRadius: 4, backgroundColor: '#6cc24a' },
  infoNotice: { borderWidth: 1, borderColor: '#c9dced', borderRadius: 10, backgroundColor: '#f5faff', padding: 12 },
  infoNoticeText: { color: '#31506d', fontSize: 11, lineHeight: 16 },
  timeline: { paddingTop: 2 },
  timelineRow: { position: 'relative', flexDirection: 'row', gap: 12 },
  timelineSpacing: { paddingBottom: 18 },
  timelineAxis: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  timelineLine: { position: 'absolute', left: 11, top: 24, bottom: 0, width: 2, backgroundColor: '#e3e3e3' },
  timelineContent: { flex: 1, paddingTop: 2 },
  timelineTitle: { color: '#131313', fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold },
  timelineDate: { marginTop: 3, color: colors.muted, fontSize: 11, lineHeight: 14 },
  timelineSummary: { marginTop: 4, color: colors.muted, fontSize: 11, lineHeight: 15 },
  bulletList: { marginTop: 3, gap: 1 },
  bulletText: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  infoSection: { overflow: 'hidden', borderWidth: 1, borderColor: '#e3e3e3', borderRadius: 12, backgroundColor: colors.white },
  infoSectionHeader: { minHeight: 30, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: '#e3e3e3', backgroundColor: '#f7f7f7' },
  infoSectionTitle: { color: colors.muted, fontSize: 10, lineHeight: 13, letterSpacing: 0.5, fontWeight: fontWeight.bold },
  infoRow: { minHeight: 38, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#e3e3e3' },
  infoLabel: { color: colors.muted, fontSize: 12, lineHeight: 16, fontWeight: fontWeight.medium },
  infoValue: { flex: 1, color: '#131313', fontSize: 12, lineHeight: 16, fontWeight: fontWeight.bold, textAlign: 'right' },
  footer: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18, borderTopWidth: 1, borderTopColor: '#e3e3e3', backgroundColor: colors.white },
  pdfButton: { height: 42, borderWidth: 1.5, borderColor: '#d1d1d1', borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  pdfButtonText: { color: '#333', fontSize: 13, lineHeight: 16, fontWeight: fontWeight.semibold },
});
