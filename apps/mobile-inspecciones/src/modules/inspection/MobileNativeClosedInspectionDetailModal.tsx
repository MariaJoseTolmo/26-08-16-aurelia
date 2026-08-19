import React, { useEffect, useState } from 'react';
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
import { MobileInspectionChecklistResultPanel } from './MobileInspectionChecklistResultPanel';
import {
  MobileInspectionFollowupIcon,
  MobileInspectionPdfIcon,
  MobileInspectionTimelineCompletedIcon,
  MobileInspectionTimelinePendingIcon,
} from './MobileInspectionDetailIcons';
import { useMobileInspectionDetail } from './hooks/useMobileInspectionManagement';

type DetailTab = 'observations' | 'result' | 'followups' | 'general';
type Props = { visible: boolean; inspectionId: string | null; onClose: () => void };
type FollowupStep = { id: string; title: string; date: string; summary?: string; bullets?: string[]; reason?: string; completed: boolean; occurredAt?: string | null };

const apiOrigin = API_URL.replace(/\/api\/?$/, '');

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
}

function timestamp(value: string | null | undefined) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const result = new Date(value).getTime();
  return Number.isNaN(result) ? Number.MAX_SAFE_INTEGER : result;
}

function allFindings(detail: InspectionDetailResponse) {
  return [...detail.findings.executed, ...detail.findings.open, ...detail.findings.closed, ...detail.findings.rejected];
}

function evidenceUrl(evidence: InspectionDetailEvidenceResponse | undefined) {
  if (!evidence) return null;
  if (evidence.fileId) return `${apiOrigin}/api/files/${encodeURIComponent(evidence.fileId)}/content`;
  if (!evidence.url) return null;
  if (evidence.url.startsWith('http')) return evidence.url;
  return evidence.url.startsWith('/api/') ? `${apiOrigin}${evidence.url}` : evidence.url;
}

function severityColors(label: string) {
  const value = label.toLowerCase();
  if (value.includes('crít') || value.includes('critic')) return { background: colors.dangerSurf, color: colors.dangerTxt };
  if (value.includes('alto') || value.includes('grave')) return { background: colors.ocreSurf, color: colors.ocreTxt };
  if (value.includes('moder')) return { background: '#fbe1d0', color: '#69462e' };
  return { background: colors.successSurf, color: colors.successTxt };
}

function EvidenceBox({ title, evidence, after }: { title: string; evidence?: InspectionDetailEvidenceResponse; after?: boolean }) {
  const token = useMobileSession((state) => state.accessToken);
  const uri = evidenceUrl(evidence);
  return <View style={styles.evidenceBox}><View style={styles.evidenceHeader}><Text style={styles.evidenceTitle}>{title}</Text></View>{uri ? <Image source={{ uri, headers: token ? { Authorization: `Bearer ${token}` } : undefined }} style={styles.evidenceImage} resizeMode="cover" /> : <View style={[styles.evidenceEmpty, after && styles.evidenceAfter]}><FontAwesome5 name="image" size={18} color={after ? colors.successTxt : colors.blueLink} /><Text style={styles.evidenceEmptyText}>Sin evidencia</Text></View>}</View>;
}

function TextBlock({ label, value, bordered }: { label: string; value: string | null; bordered?: boolean }) {
  return <View style={[styles.textBlock, bordered && styles.textBlockBordered]}><Text style={styles.blockLabel}>{label}</Text><Text style={styles.blockValue}>{value || '—'}</Text></View>;
}

function ClosedFindingCard({ detail, item, index }: { detail: InspectionDetailResponse; item: InspectionDetailFindingItemResponse; index: number }) {
  const severity = severityColors(item.severityLabel);
  const label = detail.header.kind === 'checklist' ? `Ítem ${index + 1}` : `Obs. ${index + 1}`;
  return <View style={styles.findingCard}><View style={styles.findingTop}><View style={styles.pillRow}><View style={styles.indexPill}><Text style={styles.indexText}>{label}</Text></View><View style={[styles.severityPill, { backgroundColor: severity.background }]}><Text style={[styles.severityText, { color: severity.color }]}>{item.severityLabel}</Text></View></View><View style={styles.closedPill}><FontAwesome5 name="check-circle" size={8} color={colors.successTxt} solid /><Text style={styles.closedText}>Cerrado</Text></View></View><View style={styles.copy}><TextBlock label="CONDICIÓN DETECTADA" value={item.condition} bordered /><TextBlock label="MEDIDA CORRECTIVA PROPUESTA" value={item.proposedCorrectiveAction} /><TextBlock label="DESCRIPCIÓN DE LA ACCIÓN TOMADA" value={item.executedActionDescription} /><View style={styles.evidenceRow}><EvidenceBox title="ANTES" evidence={item.beforeEvidence[0]} /><EvidenceBox title="DESPUÉS" evidence={item.afterEvidence[0]} after /></View><View style={styles.infoRow}><Text style={styles.infoLabel}>Fecha de cierre</Text><Text style={styles.infoValue}>{formatDate(item.closedAt)}</Text></View></View></View>;
}

function ObservationsPanel({ detail }: { detail: InspectionDetailResponse }) {
  const findings = allFindings(detail);
  return <ScrollView style={styles.body} contentContainerStyle={styles.observations}>{findings.length ? findings.map((item, index) => <ClosedFindingCard key={item.findingId} detail={detail} item={item} index={index} />) : <Text style={styles.empty}>No hay observaciones registradas.</Text>}</ScrollView>;
}

function buildFollowupSteps(detail: InspectionDetailResponse): FollowupStep[] {
  const findings = allFindings(detail);
  const total = findings.length;
  const percent = (value: number) => total === 0 ? 0 : Math.round((value / total) * 100);
  const bulletsAt = (date: string | null) => {
    const closed = date ? findings.filter((item) => item.closedAt && timestamp(item.closedAt) <= timestamp(date)).length : detail.header.counts.closed;
    const normalized = Math.max(0, Math.min(total, closed));
    const pending = Math.max(0, total - normalized);
    return [`Observaciones cerradas: ${normalized} obs / ${percent(normalized)}%`, `Observaciones pendientes: ${pending} obs / ${percent(pending)}%`];
  };
  const grouped = new Map<number, typeof detail.followups>();
  detail.followups.forEach((item) => grouped.set(item.sequenceNumber, [...(grouped.get(item.sequenceNumber) ?? []), item]));
  let followups = Array.from(grouped.entries()).sort(([a], [b]) => a - b).map(([sequence, records]) => {
    const dates = records.map((item) => item.performedAt).filter((value): value is string => Boolean(value)).sort((a, b) => timestamp(a) - timestamp(b));
    const occurredAt = dates.at(-1) ?? null;
    const completed = records.some((item) => item.completed);
    return { id: `followup-${sequence}`, title: `Seguimiento ${sequence}`, date: completed ? formatDate(occurredAt) : '—', bullets: completed ? bulletsAt(occurredAt) : undefined, completed, occurredAt } satisfies FollowupStep;
  });
  if (!followups.length) {
    const dates = findings.flatMap((item) => [item.executedAt, item.rejectedAt, item.closedAt]).filter((value): value is string => Boolean(value));
    followups = [...new Set(dates.map((value) => new Date(value).toISOString().slice(0, 10)))].sort().slice(0, 3).map((date, index) => ({ id: `derived-${index + 1}`, title: `Seguimiento ${index + 1}`, date: formatDate(date), bullets: bulletsAt(date), completed: true, occurredAt: date }));
  }
  const completed = followups.filter((item) => item.completed);
  const pending = Array.from({ length: Math.max(0, 3 - completed.length) }, (_, index) => ({ id: `pending-${completed.length + index + 1}`, title: `Seguimiento ${completed.length + index + 1}`, date: '—', completed: false, occurredAt: null } satisfies FollowupStep));
  const slaEvents = (detail.slaReassignments ?? []).map((event) => ({ id: `sla-${event.id}`, title: `Observación “${event.findingNumber}” SLA reasignado`, date: formatDate(event.reassignedAt), bullets: [`SLA anterior: ${event.previousSlaBusinessDays} ${event.previousSlaBusinessDays === 1 ? 'día hábil' : 'días hábiles'}`, `Nuevo SLA: ${event.newSlaBusinessDays} ${event.newSlaBusinessDays === 1 ? 'día hábil' : 'días hábiles'}`], reason: event.reason, completed: true, occurredAt: event.reassignedAt } satisfies FollowupStep));
  const activities = [...completed, ...slaEvents].sort((a, b) => timestamp(a.occurredAt) - timestamp(b.occurredAt));
  return [{ id: 'initial', title: 'Inspección inicial', date: formatDate(detail.general.scheduledAt), summary: total === 1 ? '1 observación detectada' : `${total} observaciones detectadas`, completed: true, occurredAt: detail.general.scheduledAt }, ...activities, ...pending];
}

function FollowupsPanel({ detail }: { detail: InspectionDetailResponse }) {
  const steps = buildFollowupSteps(detail);
  return <ScrollView style={styles.body} contentContainerStyle={styles.followups}><View style={styles.followupHeading}><MobileInspectionFollowupIcon /><Text style={styles.followupHeadingText}>HISTORIAL DE SEGUIMIENTOS</Text></View>{steps.map((step, index) => <View key={step.id} style={styles.timelineRow}><View style={styles.timelineRail}>{step.completed ? <MobileInspectionTimelineCompletedIcon /> : <MobileInspectionTimelinePendingIcon />}{index < steps.length - 1 ? <View style={styles.timelineLine} /> : null}</View><View style={[styles.timelineCopy, index < steps.length - 1 && styles.timelineSpaced]}><Text style={styles.timelineTitle}>{step.title}</Text><Text style={styles.timelineDate}>{step.date}</Text>{step.summary ? <Text style={styles.timelineSummary}>{step.summary}</Text> : null}{step.bullets?.map((bullet) => <Text key={bullet} style={styles.timelineBullet}>• {bullet}</Text>)}{step.reason ? <View style={styles.timelineReason}><Text style={styles.timelineReasonLabel}>Motivo:</Text><Text style={styles.timelineReasonText}>{step.reason}</Text></View> : null}</View></View>)}</ScrollView>;
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return <View style={[styles.infoRow, last && styles.noBorder]}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

function GeneralPanel({ detail }: { detail: InspectionDetailResponse }) {
  const findings = allFindings(detail);
  return <ScrollView style={styles.body} contentContainerStyle={styles.general}><View style={styles.generalCard}><Text style={styles.generalHeading}>QUIÉN REALIZÓ LA INSPECCIÓN</Text><InfoRow label="Nombre" value={detail.general.inspectorName ?? '—'} /><InfoRow label="Empresa" value={detail.general.inspectorCompanyName ?? detail.general.companyName ?? '—'} last /></View><View style={styles.generalCard}><Text style={styles.generalHeading}>DONDE Y CUÁNDO</Text><InfoRow label="Área · Sector" value={[detail.general.areaName, detail.general.sectorName].filter(Boolean).join(' · ') || '—'} /><InfoRow label="Fecha" value={formatDate(detail.general.scheduledAt)} /><InfoRow label="Tipo" value={detail.header.kind === 'checklist' ? 'Checklist normativo' : 'Hallazgo'} /><InfoRow label="Ubicación UTM" value={detail.general.latitude && detail.general.longitude ? `${detail.general.latitude} · ${detail.general.longitude}` : detail.general.locationLabel ?? '—'} last /></View>{detail.general.generalEvidence.length ? <View style={styles.generalCard}><Text style={styles.generalHeading}>FOTOGRAFÍA GENERAL DE LA INSPECCIÓN</Text><View style={styles.generalPhoto}><EvidenceBox title="FOTO GENERAL" evidence={detail.general.generalEvidence[0]} /></View></View> : null}<View style={styles.generalCard}><Text style={styles.generalHeading}>OBSERVACIONES ({findings.length})</Text>{findings.map((item, index) => <View key={item.findingId} style={[styles.generalFinding, index === findings.length - 1 && styles.noBorder]}><Text style={styles.generalFindingTitle}>Obs. {index + 1} · {item.severityLabel}</Text><Text style={styles.generalFindingText}>{item.condition ?? '—'}</Text></View>)}</View><View style={styles.generalCard}><Text style={styles.generalHeading}>RESPONSABLES</Text>{detail.general.responsibles.length ? detail.general.responsibles.map((item, index) => <View key={item.userId} style={[styles.responsibleRow, index === detail.general.responsibles.length - 1 && styles.noBorder]}><View style={styles.avatar}><Text style={styles.avatarText}>{item.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</Text></View><View><Text style={styles.responsibleName}>{item.fullName}</Text><Text style={styles.responsiblePosition}>{item.position ?? 'Sin cargo'}</Text></View></View>) : <Text style={styles.emptyResponsibles}>Sin responsables registrados.</Text>}</View></ScrollView>;
}

function Header({ detail, onClose }: { detail: InspectionDetailResponse; onClose: () => void }) {
  const title = detail.header.kind === 'checklist' ? [detail.general.areaName, detail.general.companyName].filter(Boolean).join(' · ') || detail.header.title : detail.header.title;
  return <View style={styles.header}><View style={styles.headerCopy}><Text style={styles.number}>#{detail.header.inspectionNumber}</Text><Text style={styles.title}>{title}</Text><Text style={styles.metadata}>{detail.header.metadataLine1}</Text>{detail.header.metadataLine2 ? <Text style={styles.metadata}>{detail.header.metadataLine2}</Text> : null}</View><TouchableOpacity style={styles.closeButton} onPress={onClose}><Feather name="x" size={30} color={colors.primary} /></TouchableOpacity></View>;
}

function Progress({ detail }: { detail: InspectionDetailResponse }) {
  return <View style={styles.progress}><View style={styles.progressTop}><Text style={styles.progressLabel}>Progreso de observaciones</Text><Text style={styles.progressValue}>{detail.header.progressPercent}%</Text></View><View style={styles.progressRail}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, detail.header.progressPercent))}%` }]} /></View><View style={styles.progressChips}><View style={styles.closedSummaryChip}><Text style={styles.closedSummaryText}>{detail.header.counts.closed} Cerradas</Text></View>{detail.header.counts.rejected > 0 ? <View style={styles.rejectedSummaryChip}><Text style={styles.rejectedSummaryText}>{detail.header.counts.rejected} Rechazadas</Text></View> : null}</View></View>;
}

function Tabs({ detail, active, onChange }: { detail: InspectionDetailResponse; active: DetailTab; onChange: (tab: DetailTab) => void }) {
  const tabs = detail.header.kind === 'checklist' ? [{ id: 'observations' as const, label: 'Ítems No' }, { id: 'result' as const, label: 'Resultado' }, { id: 'followups' as const, label: 'Seguimientos' }, { id: 'general' as const, label: 'Datos generales' }] : [{ id: 'observations' as const, label: 'Observaciones' }, { id: 'followups' as const, label: 'Seguimientos' }, { id: 'general' as const, label: 'Datos generales' }];
  return <View style={styles.tabs}>{tabs.map((tab) => <TouchableOpacity key={tab.id} style={[styles.tab, active === tab.id && styles.tabActive]} onPress={() => onChange(tab.id)}><Text style={[styles.tabText, active === tab.id && styles.tabTextActive]} numberOfLines={1}>{tab.label}</Text></TouchableOpacity>)}</View>;
}

function PdfFooter({ inspectionId }: { inspectionId: string }) {
  return <View style={styles.pdfFooter}><TouchableOpacity style={styles.pdfButton} onPress={() => Alert.alert('Descargar PDF', `${apiOrigin}/api/inspections/${inspectionId}/export/pdf`)}><MobileInspectionPdfIcon /><Text style={styles.pdfText}>Descargar PDF</Text></TouchableOpacity></View>;
}

export function MobileNativeClosedInspectionDetailModal({ visible, inspectionId, onClose }: Props) {
  const query = useMobileInspectionDetail(inspectionId, visible);
  const [active, setActive] = useState<DetailTab>('observations');
  useEffect(() => { if (visible) setActive('observations'); }, [visible, inspectionId]);
  const detail = query.data;
  return <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}><View style={styles.screen}>{query.isLoading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.gold} /></View> : query.isError || !detail ? <View style={styles.center}><Text style={styles.errorTitle}>No fue posible cargar el detalle</Text><Text style={styles.errorText}>{query.error instanceof Error ? query.error.message : 'Intenta nuevamente.'}</Text><TouchableOpacity style={styles.retry} onPress={() => { void query.refetch(); }}><Text style={styles.retryText}>Reintentar</Text></TouchableOpacity></View> : <><Header detail={detail} onClose={onClose} /><Progress detail={detail} /><Tabs detail={detail} active={active} onChange={setActive} />{active === 'observations' ? <ObservationsPanel detail={detail} /> : null}{active === 'followups' ? <FollowupsPanel detail={detail} /> : null}{active === 'general' ? <GeneralPanel detail={detail} /> : null}{active === 'result' && detail.header.kind === 'checklist' ? <MobileInspectionChecklistResultPanel result={detail.checklistResult} /> : null}<PdfFooter inspectionId={detail.header.inspectionId} /></>}</View></Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  errorTitle: { fontSize: 18, fontWeight: fontWeight.bold, color: colors.primary, textAlign: 'center' },
  errorText: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  retry: { marginTop: 8, borderRadius: 10, backgroundColor: colors.gold, paddingHorizontal: 22, paddingVertical: 12 },
  retryText: { color: colors.white, fontWeight: fontWeight.bold },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingBottom: 12, paddingTop: 42 },
  headerCopy: { flex: 1 },
  number: { fontSize: 15, fontWeight: fontWeight.bold, color: colors.primary },
  title: { marginTop: 4, fontSize: 21, lineHeight: 26, fontWeight: fontWeight.bold, color: '#2a2a2a' },
  metadata: { marginTop: 2, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.semiBold, color: colors.muted },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progress: { backgroundColor: '#143049', paddingHorizontal: 14, paddingVertical: 10 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 11, color: 'rgba(255,255,255,.55)' },
  progressValue: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.white },
  progressRail: { height: 5, marginTop: 6, overflow: 'hidden', borderRadius: 3, backgroundColor: 'rgba(255,255,255,.18)' },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: colors.successSurf },
  progressChips: { flexDirection: 'row', gap: 6, marginTop: 7 },
  closedSummaryChip: { borderRadius: 6, backgroundColor: colors.successSurf, paddingHorizontal: 8, paddingVertical: 3 },
  closedSummaryText: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.successTxt },
  rejectedSummaryChip: { borderRadius: 6, backgroundColor: '#f7f7f7', paddingHorizontal: 8, paddingVertical: 3 },
  rejectedSummaryText: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.muted },
  tabs: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#e3e3e3', backgroundColor: '#f7f7f7' },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', paddingHorizontal: 3 },
  tabActive: { borderBottomColor: colors.gold },
  tabText: { fontSize: 12, fontWeight: fontWeight.semiBold, color: colors.muted },
  tabTextActive: { color: '#8e6e3e' },
  body: { flex: 1 },
  observations: { gap: 18, padding: 14, paddingBottom: 24 },
  empty: { paddingVertical: 40, textAlign: 'center', color: colors.muted },
  findingCard: { borderRadius: 12, borderWidth: 1.5, borderColor: '#e3e3e3', backgroundColor: '#f7f7f7', padding: 13 },
  findingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  pillRow: { flexDirection: 'row', gap: 8 },
  indexPill: { borderRadius: 6, backgroundColor: '#e6f3ff', paddingHorizontal: 8, paddingVertical: 4 },
  indexText: { fontSize: 11, fontWeight: fontWeight.bold, color: '#24588b' },
  severityPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  severityText: { fontSize: 10, fontWeight: fontWeight.bold },
  closedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, backgroundColor: colors.successSurf, paddingHorizontal: 8, paddingVertical: 4 },
  closedText: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.successTxt },
  copy: { marginTop: 12, gap: 6 },
  textBlock: { borderRadius: 8, backgroundColor: colors.white, paddingHorizontal: 10, paddingVertical: 8 },
  textBlockBordered: { borderWidth: 1, borderColor: '#e3e3e3' },
  blockLabel: { fontSize: 9, letterSpacing: 1.5, fontWeight: fontWeight.bold, color: colors.muted },
  blockValue: { marginTop: 4, fontSize: 12, lineHeight: 17, color: '#131313' },
  evidenceRow: { flexDirection: 'row', gap: 5, marginTop: 2 },
  evidenceBox: { flex: 1, height: 105, overflow: 'hidden', borderRadius: 7, borderWidth: 1, borderColor: '#e3e3e3' },
  evidenceHeader: { height: 22, justifyContent: 'center', backgroundColor: colors.primary, paddingHorizontal: 8 },
  evidenceTitle: { fontSize: 9, fontWeight: fontWeight.bold, color: colors.white },
  evidenceImage: { flex: 1, width: '100%' },
  evidenceEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#e8f4fd' },
  evidenceAfter: { backgroundColor: '#dafccb' },
  evidenceEmptyText: { fontSize: 10, color: colors.muted },
  infoRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e3e3e3', paddingHorizontal: 12 },
  infoLabel: { fontSize: 12, color: colors.muted },
  infoValue: { maxWidth: '62%', textAlign: 'right', fontSize: 12, fontWeight: fontWeight.bold, color: '#131313' },
  followups: { paddingHorizontal: 18, paddingVertical: 22 },
  followupHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  followupHeadingText: { fontSize: 13, letterSpacing: .5, fontWeight: fontWeight.bold, color: colors.muted },
  timelineRow: { flexDirection: 'row', gap: 14 },
  timelineRail: { width: 28, alignItems: 'center' },
  timelineLine: { width: 2, minHeight: 24, flex: 1, backgroundColor: '#e3e3e3' },
  timelineCopy: { flex: 1, paddingTop: 2 },
  timelineSpaced: { paddingBottom: 18 },
  timelineTitle: { fontSize: 15, fontWeight: fontWeight.bold, color: '#131313' },
  timelineDate: { marginTop: 4, fontSize: 13, color: colors.muted },
  timelineSummary: { marginTop: 5, fontSize: 13, color: colors.muted },
  timelineBullet: { marginTop: 3, fontSize: 13, lineHeight: 18, color: colors.muted },
  timelineReason: { marginTop: 2 },
  timelineReasonLabel: { fontSize: 13, lineHeight: 18, fontWeight: fontWeight.bold, color: colors.muted },
  timelineReasonText: { fontSize: 13, lineHeight: 18, fontWeight: fontWeight.regular, color: colors.muted },
  general: { padding: 14, gap: 12 },
  generalCard: { overflow: 'hidden', borderRadius: 12, borderWidth: 1, borderColor: '#e3e3e3', backgroundColor: colors.white },
  generalHeading: { minHeight: 34, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#f7f7f7', fontSize: 10, letterSpacing: .5, fontWeight: fontWeight.bold, color: colors.muted },
  noBorder: { borderBottomWidth: 0 },
  generalPhoto: { padding: 10 },
  generalFinding: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#e3e3e3' },
  generalFindingTitle: { fontSize: 12, fontWeight: fontWeight.bold, color: '#24588b' },
  generalFindingText: { marginTop: 7, fontSize: 12, lineHeight: 17, color: '#131313' },
  responsibleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: '#e3e3e3' },
  avatar: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: colors.gold },
  avatarText: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.primary },
  responsibleName: { fontSize: 13, fontWeight: fontWeight.bold, color: '#131313' },
  responsiblePosition: { marginTop: 3, fontSize: 11, color: colors.muted },
  emptyResponsibles: { padding: 14, color: colors.muted },
  pdfFooter: { borderTopWidth: 1, borderTopColor: '#e3e3e3', backgroundColor: colors.white, paddingHorizontal: 20, paddingBottom: 18, paddingTop: 12 },
  pdfButton: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#d1d1d1' },
  pdfText: { fontSize: 14, fontWeight: fontWeight.semiBold, color: '#333' },
});
