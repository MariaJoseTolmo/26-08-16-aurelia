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
import { FontAwesome5 } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import type {
  InspectionDetailEvidenceResponse,
  InspectionDetailFindingItemResponse,
  InspectionDetailResponse,
  InspectionDetailResponsibleResponse,
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
type GeneralIconName = React.ComponentProps<typeof FontAwesome5>['name'];

type Props = {
  visible: boolean;
  inspectionId: string | null;
  onClose: () => void;
};

type FollowupStep = {
  id: string;
  sequenceNumber?: number;
  title: string;
  date: string;
  summary?: string;
  bullets?: string[];
  completed: boolean;
  occurredAt?: string | null;
};

type GeneralInfoRow = {
  label: string;
  value: string;
  mono?: boolean;
};

const apiOrigin = API_URL.replace(/\/api\/?$/, '');
const avatarPalette = [
  { backgroundColor: '#c8a064', color: '#001e39' },
  { backgroundColor: '#24588b', color: colors.white },
  { backgroundColor: '#00b398', color: colors.white },
  { backgroundColor: '#532a0e', color: colors.white },
];

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'dd-mm-aaaa · 00:00';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'dd-mm-aaaa · 00:00';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()} · ${hours}:${minutes}`;
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

function closedSlaDays(dueAt: string | null | undefined, closedAt: string | null | undefined): string {
  const due = toTimestamp(dueAt);
  const closed = toTimestamp(closedAt);
  if (!Number.isFinite(due) || !Number.isFinite(closed)) return '—';
  const days = Math.max(0, Math.ceil((closed - due) / 86_400_000));
  return `${days} ${days === 1 ? 'día' : 'días'}`;
}

function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NA';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function ClosedChipIcon() {
  return (
    <Svg width={8} height={6} viewBox="0 0 8 6" fill="none">
      <Circle cx={3.75} cy={3} r={3} fill={colors.successTxt} />
    </Svg>
  );
}

function ClosedRowIcon() {
  return (
    <Svg width={14} height={11} viewBox="0 0 14 11" fill="none">
      <Circle cx={5.5} cy={5.5} r={5.5} fill={colors.successTxt} />
      <Path d="M3.15 5.55L4.75 7.15L8.35 3.65" stroke="white" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EvidenceImageIcon({ after = false }: { after?: boolean }) {
  const tone = after ? colors.successTxt : colors.blueLink;
  return (
    <Svg width={after ? 25 : 23} height={after ? 20 : 18} viewBox="0 0 23 18" fill="none">
      <Path d="M4 1H19C20.6569 1 22 2.34315 22 4V14C22 15.6569 20.6569 17 19 17H4C2.34315 17 1 15.6569 1 14V4C1 2.34315 2.34315 1 4 1Z" fill={tone} />
      <Circle cx={7.2} cy={6} r={2} fill="white" />
      <Path d="M4.3 14.2L9.1 9.6L12.2 12.4L15.3 8.8L19.2 14.2H4.3Z" fill="white" />
    </Svg>
  );
}

function CloseIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <Path d="M7.5 7.5L24.5 24.5M24.5 7.5L7.5 24.5" stroke={colors.primary} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
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
          <EvidenceImageIcon after={after} />
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

function FindingPills({ detail, item }: { detail: InspectionDetailResponse; item: InspectionDetailFindingItemResponse }) {
  const index = closedFindingIndex(detail, item);
  const severity = severityColors(item.severityLabel);
  const label = detail.header.kind === 'checklist' ? `Ítem ${index}` : `Obs. ${index}`;
  return (
    <View style={styles.pillRow}>
      <View style={styles.indexPill}><Text style={styles.indexPillText}>{label}</Text></View>
      <View style={[styles.severityPill, { backgroundColor: severity.background }]}>
        <Text style={[styles.severityPillText, { color: severity.color }]}>{item.severityLabel}</Text>
      </View>
    </View>
  );
}

function ClosedFindingCard({
  detail,
  item,
}: {
  detail: InspectionDetailResponse;
  item: InspectionDetailFindingItemResponse;
}) {
  const question = checklistQuestion(detail, item);
  return (
    <View style={styles.findingCard}>
      <View style={styles.findingTop}>
        <FindingPills detail={detail} item={item} />
        <View style={styles.closedPill}>
          <ClosedChipIcon />
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
            <Text style={[styles.infoValue, { color: colors.ocreTxt }]}>{closedSlaDays(item.dueAt, item.closedAt)}</Text>
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
        <ClosedRowIcon />
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
  const total = findings.length;
  const percentage = (value: number) => total === 0 ? 0 : Math.round((value / total) * 100);
  const bulletsAt = (occurredAt: string | null) => {
    const closed = occurredAt
      ? findings.filter((item) => item.closedAt && toTimestamp(item.closedAt) <= toTimestamp(occurredAt)).length
      : detail.header.counts.closed;
    const normalizedClosed = Math.max(0, Math.min(total, closed));
    const pending = Math.max(0, total - normalizedClosed);
    return [
      `Observaciones cerradas: ${normalizedClosed} obs / ${percentage(normalizedClosed)}%`,
      `Observaciones pendientes: ${pending} obs / ${percentage(pending)}%`,
    ];
  };

  const followupsBySequence = new Map<number, typeof detail.followups>();
  detail.followups.forEach((followup) => {
    const current = followupsBySequence.get(followup.sequenceNumber) ?? [];
    current.push(followup);
    followupsBySequence.set(followup.sequenceNumber, current);
  });

  let recordedSteps: FollowupStep[] = Array.from(followupsBySequence.entries())
    .sort(([left], [right]) => left - right)
    .map(([sequenceNumber, records]) => {
      const dates = records
        .map((record) => record.performedAt)
        .filter((value): value is string => Boolean(value))
        .sort((left, right) => toTimestamp(left) - toTimestamp(right));
      const occurredAt = dates.length > 0 ? dates[dates.length - 1] : null;
      const completed = records.some((record) => record.completed);
      return {
        id: `followup-${sequenceNumber}`,
        sequenceNumber,
        title: `Seguimiento ${sequenceNumber}`,
        date: completed ? formatDate(occurredAt) : '—',
        bullets: completed ? bulletsAt(occurredAt) : undefined,
        completed,
        occurredAt,
      };
    });

  if (recordedSteps.length === 0) {
    const latestActivityByDate = new Map<string, string>();
    findings.forEach((item) => {
      [item.executedAt, item.rejectedAt, item.closedAt].forEach((value) => {
        if (!value) return;
        const timestamp = toTimestamp(value);
        if (!Number.isFinite(timestamp)) return;
        const dateKey = new Date(timestamp).toISOString().slice(0, 10);
        const current = latestActivityByDate.get(dateKey);
        if (!current || toTimestamp(value) > toTimestamp(current)) latestActivityByDate.set(dateKey, value);
      });
    });
    recordedSteps = Array.from(latestActivityByDate.values())
      .sort((left, right) => toTimestamp(left) - toTimestamp(right))
      .slice(0, 3)
      .map((occurredAt, index) => ({
        id: `derived-followup-${index + 1}`,
        sequenceNumber: index + 1,
        title: `Seguimiento ${index + 1}`,
        date: formatDate(occurredAt),
        bullets: bulletsAt(occurredAt),
        completed: true,
        occurredAt,
      }));
  }

  const stepBySequence = new Map(recordedSteps.map((step, index) => [step.sequenceNumber ?? index + 1, step]));
  const highestSequence = Math.max(3, ...Array.from(stepBySequence.keys()));
  const followupSteps = Array.from({ length: highestSequence }, (_, index) => {
    const sequenceNumber = index + 1;
    return stepBySequence.get(sequenceNumber) ?? {
      id: `pending-followup-${sequenceNumber}`,
      sequenceNumber,
      title: `Seguimiento ${sequenceNumber}`,
      date: '—',
      completed: false,
      occurredAt: null,
    };
  });

  return [{
    id: 'initial',
    title: 'Inspección inicial',
    date: formatDate(detail.general.scheduledAt),
    summary: total === 1 ? '1 observación detectada' : `${total} observaciones detectadas`,
    completed: true,
    occurredAt: detail.general.scheduledAt,
  }, ...followupSteps];
}

function FollowupsPanel({ detail }: { detail: InspectionDetailResponse }) {
  const steps = useMemo(() => buildFollowupSteps(detail), [detail]);
  return (
    <View style={styles.followupsPanel}>
      <View style={styles.sectionHeading}>
        <MobileInspectionFollowupIcon />
        <Text style={styles.sectionHeadingText}>HISTORIAL DE SEGUIMIENTOS</Text>
      </View>
      <View style={styles.timeline}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const longConnector = Boolean(step.summary || step.bullets);
          return (
            <View key={step.id} style={[styles.timelineRow, !isLast && styles.timelineRowSpacing]}>
              <View style={styles.timelineAxis}>
                {step.completed ? <MobileInspectionTimelineCompletedIcon /> : <MobileInspectionTimelinePendingIcon />}
              </View>
              {!isLast ? <View style={[styles.timelineLine, longConnector && styles.timelineLineLong]} /> : null}
              <View style={styles.timelineCopy}>
                <Text style={styles.timelineTitle}>{step.title}</Text>
                <Text style={styles.timelineDate}>{step.date}</Text>
                {step.summary ? <Text style={styles.timelineSummary}>{step.summary}</Text> : null}
                {step.bullets ? (
                  <View style={styles.timelineBulletList}>
                    {step.bullets.map((bullet) => (
                      <View key={bullet} style={styles.timelineBulletRow}>
                        <Text style={styles.timelineBullet}>•</Text>
                        <Text style={styles.timelineBulletText}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function GeneralSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: GeneralIconName;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.generalSection}>
      <View style={styles.generalSectionHeader}>
        <View style={styles.generalSectionIcon}>
          <FontAwesome5 name={icon} size={10} color={colors.muted} />
        </View>
        <Text style={styles.generalSectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function GeneralInfoRows({ rows }: { rows: GeneralInfoRow[] }) {
  return (
    <View>
      {rows.map((row, index) => (
        <View key={row.label} style={[styles.generalRow, index < rows.length - 1 && styles.generalRowBorder]}>
          <Text style={styles.generalLabel}>{row.label}</Text>
          <Text style={[styles.generalValue, row.mono && styles.generalValueMono]}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

function GeneralPhotoGallery({ evidences }: { evidences: InspectionDetailEvidenceResponse[] }) {
  const token = useMobileSession((state) => state.accessToken);
  const evidence = evidences[0];
  const uri = evidenceUrl(evidence);
  return (
    <View style={styles.generalPhotoFrame}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="closedInspectionPhoto" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#1e3050" />
            <Stop offset="1" stopColor="#0f1f35" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#closedInspectionPhoto)" />
      </Svg>
      {uri ? (
        <Image
          source={{ uri, headers: token ? { Authorization: `Bearer ${token}` } : undefined }}
          style={styles.generalPhoto}
          resizeMode="cover"
        />
      ) : null}
      <View style={styles.generalPhotoLabel}><Text style={styles.generalPhotoLabelText}>FOTO GENERAL</Text></View>
      <View style={styles.generalPhotoDate}><Text style={styles.generalPhotoDateText}>{formatDateTime(evidence?.capturedAt)}</Text></View>
    </View>
  );
}

function GeneralObservations({ detail }: { detail: InspectionDetailResponse }) {
  const findings = allFindings(detail);
  const title = detail.header.kind === 'checklist' ? `ÍTEMS (${findings.length})` : `OBSERVACIONES (${findings.length})`;
  return (
    <GeneralSection title={title} icon="list-ul">
      {findings.length > 0 ? findings.map((item, index) => (
        <View key={item.findingId} style={[styles.generalObservation, index < findings.length - 1 && styles.generalObservationBorder]}>
          <FindingPills detail={detail} item={item} />
          <Text style={styles.generalObservationText}>{item.condition ?? '—'}</Text>
        </View>
      )) : (
        <Text style={styles.generalEmptyText}>No hay observaciones registradas.</Text>
      )}
    </GeneralSection>
  );
}

function ResponsibleAvatar({ responsible, index }: { responsible: InspectionDetailResponsibleResponse; index: number }) {
  const palette = avatarPalette[index % avatarPalette.length] ?? avatarPalette[0];
  return (
    <View style={[styles.avatar, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.avatarText, { color: palette.color }]}>{initials(responsible.fullName)}</Text>
    </View>
  );
}

function ResponsiblesSection({ detail }: { detail: InspectionDetailResponse }) {
  const responsibles = detail.general.responsibles;
  return (
    <GeneralSection title="RESPONSABLES" icon="users">
      <GeneralInfoRows rows={[{ label: 'EECC', value: detail.general.companyName ?? '—' }]} />
      <View style={styles.responsiblesList}>
        {responsibles.length > 0 ? responsibles.map((responsible, index) => (
          <View
            key={responsible.userId}
            style={[styles.responsibleRow, index < responsibles.length - 1 && styles.responsibleRowBorder]}
          >
            <ResponsibleAvatar responsible={responsible} index={index} />
            <View style={styles.responsibleCopy}>
              <Text style={styles.responsibleName} numberOfLines={1}>{responsible.fullName}</Text>
              <Text style={styles.responsibleRole}>{responsible.position ?? 'Sin cargo'}</Text>
            </View>
            {responsible.currentUser ? (
              <View style={styles.currentUserChip}><Text style={styles.currentUserChipText}>Tú</Text></View>
            ) : null}
          </View>
        )) : (
          <Text style={styles.generalEmptyText}>Sin responsables asignados.</Text>
        )}
      </View>
    </GeneralSection>
  );
}

function GeneralPanel({ detail }: { detail: InspectionDetailResponse }) {
  const general = detail.general;
  const locationRows: GeneralInfoRow[] = [
    { label: 'Área · Sector', value: [general.areaName, general.sectorName].filter(Boolean).join(' · ') || '—' },
    { label: 'Fecha', value: formatDate(general.scheduledAt) },
    { label: 'Tipo', value: detail.header.kind === 'checklist' ? 'Checklist normativo' : 'Hallazgo' },
    {
      label: 'Ubicación UTM',
      value: general.latitude && general.longitude
        ? `${general.latitude} · ${general.longitude}`
        : general.locationLabel ?? '—',
      mono: true,
    },
  ];
  return (
    <View style={styles.generalPanel}>
      <GeneralSection title="QUIÉN REALIZÓ LA INSPECCIÓN" icon="user-tie">
        <GeneralInfoRows rows={[
          { label: 'Nombre', value: general.inspectorName ?? '—' },
          { label: 'Empresa', value: general.inspectorCompanyName ?? general.companyName ?? '—' },
        ]} />
      </GeneralSection>
      <GeneralSection title="DÓNDE Y CUÁNDO" icon="map-marker-alt">
        <GeneralInfoRows rows={locationRows} />
      </GeneralSection>
      <GeneralSection title="FOTOGRAFÍA GENERAL DE LA INSPECCIÓN" icon="camera">
        <View style={styles.generalPhotoContent}>
          <GeneralPhotoGallery evidences={general.generalEvidence} />
        </View>
      </GeneralSection>
      <GeneralObservations detail={detail} />
      <ResponsiblesSection detail={detail} />
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
              <CloseIcon />
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
  followupsPanel: { flexGrow: 1, backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 20 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionHeadingText: { color: colors.muted, fontSize: 11, lineHeight: 13, letterSpacing: 0.55, fontWeight: fontWeight.bold },
  timeline: { marginTop: 10 },
  timelineRow: { position: 'relative', flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  timelineRowSpacing: { paddingBottom: 16 },
  timelineAxis: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  timelineLine: { position: 'absolute', left: 11, top: 24, width: 2, height: 23, backgroundColor: colors.border },
  timelineLineLong: { height: 38 },
  timelineCopy: { flex: 1, minWidth: 0, paddingTop: 2 },
  timelineTitle: { color: colors.primary, fontSize: 12, lineHeight: 14, fontWeight: fontWeight.bold },
  timelineDate: { marginTop: 4, color: colors.muted, fontSize: 11, lineHeight: 13 },
  timelineSummary: { marginTop: 5, color: colors.muted, fontSize: 11, lineHeight: 15 },
  timelineBulletList: { marginTop: 2 },
  timelineBulletRow: { flexDirection: 'row', alignItems: 'flex-start', paddingRight: 8 },
  timelineBullet: { width: 12, color: colors.muted, fontSize: 11, lineHeight: 14 },
  timelineBulletText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 14 },
  generalPanel: { flexGrow: 1, backgroundColor: colors.white, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 20, gap: 12 },
  generalSection: { borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  generalSectionHeader: { height: 29, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: '#f7f7f7', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12 },
  generalSectionIcon: { width: 13, height: 11, alignItems: 'center', justifyContent: 'center' },
  generalSectionTitle: { flex: 1, color: colors.muted, fontSize: 10, lineHeight: 12, letterSpacing: 0.5, fontWeight: fontWeight.bold },
  generalRow: { minHeight: 33, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 12, paddingVertical: 9 },
  generalRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  generalLabel: { color: colors.muted, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.medium },
  generalValue: { flex: 1, color: colors.primary, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold, textAlign: 'right' },
  generalValueMono: { fontFamily: 'monospace', fontSize: 11 },
  generalPhotoContent: { paddingHorizontal: 12, paddingVertical: 9 },
  generalPhotoFrame: { position: 'relative', height: 80, borderRadius: 8, overflow: 'hidden', backgroundColor: '#0f1f35' },
  generalPhoto: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  generalPhotoLabel: { position: 'absolute', left: 8, top: 6, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 7, paddingVertical: 2 },
  generalPhotoLabelText: { color: colors.white, fontSize: 9, lineHeight: 11, letterSpacing: 1.5, fontWeight: fontWeight.bold },
  generalPhotoDate: { position: 'absolute', right: 8, bottom: 6, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2 },
  generalPhotoDateText: { color: 'rgba(255,255,255,0.8)', fontSize: 9, lineHeight: 11 },
  generalObservation: { gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  generalObservationBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  generalObservationText: { color: colors.primary, fontSize: 12, lineHeight: 16.8 },
  generalEmptyText: { color: colors.muted, fontSize: 11, lineHeight: 15, paddingHorizontal: 12, paddingVertical: 12 },
  responsiblesList: { borderTopWidth: 1, borderTopColor: colors.border },
  responsibleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  responsibleRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 12, lineHeight: 14, fontWeight: fontWeight.bold },
  responsibleCopy: { flex: 1, minWidth: 0 },
  responsibleName: { color: colors.primary, fontSize: 12, lineHeight: 14, fontWeight: fontWeight.bold },
  responsibleRole: { marginTop: 4, color: colors.muted, fontSize: 11, lineHeight: 13 },
  currentUserChip: { height: 16, borderRadius: 5, backgroundColor: '#c5fff6', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  currentUserChipText: { color: '#00b398', fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white, paddingHorizontal: 20, paddingTop: 15, paddingBottom: 14 },
  pdfButton: { height: 40, borderRadius: 8, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  pdfButtonText: { color: colors.body, fontSize: 13, lineHeight: 16, fontWeight: fontWeight.semibold },
});
