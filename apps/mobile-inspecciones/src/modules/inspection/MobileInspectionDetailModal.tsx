import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import type {
  InspectionDetailEvidenceResponse,
  InspectionDetailFindingGroupKey,
  InspectionDetailFindingItemResponse,
  InspectionDetailResponse,
  InspectionDetailResponsibleResponse,
  UserResponse,
} from '@aurelia/contracts';
import { API_URL } from '../../shared/services/http-client';
import { fetchInspectionResponsibleUsers } from '../../shared/services/inspections.api';
import { colors, fontWeight } from '../../shared/theme/tokens';
import { useMobileSession } from '../auth/mobileSession.store';
import { MobileFindingExecutionModal } from './MobileFindingExecutionModal';
import {
  MobileFindingReviewDialog,
  MobileFindingReviewSnackbar,
  type MobileFindingReviewMode,
} from './MobileFindingReviewFeedback';
import { MobileInspectionChecklistResultPanel } from './MobileInspectionChecklistResultPanel';
import {
  MobileInspectionApproveIcon,
  MobileInspectionFollowupIcon,
  MobileInspectionPdfIcon,
  MobileInspectionRejectIcon,
  MobileInspectionTimelineCompletedIcon,
  MobileInspectionTimelinePendingIcon,
} from './MobileInspectionDetailIcons';
import {
  useMobileInspectionDetail,
  useMobileInspectionFindingActions,
  type MobileFindingEvidenceInput,
} from './hooks/useMobileInspectionManagement';

type DetailTab = 'observations' | 'result' | 'followups' | 'general';
type ItemLabel = 'Obs.' | 'Ítem';

type Props = {
  visible: boolean;
  inspectionId: string | null;
  requestedFindingId?: string | null;
  requestedGroup?: string | null;
  forceReadOnly?: boolean;
  onClose: () => void;
};

type GroupConfig = {
  key: InspectionDetailFindingGroupKey;
  label: string;
  singular: string;
  color: string;
  background: string;
  icon: React.ComponentProps<typeof FontAwesome5>['name'];
};

type FollowupStep = {
  id: string;
  title: string;
  date: string;
  summary?: string;
  bullets?: string[];
  completed: boolean;
  occurredAt?: string | null;
};

const groups: GroupConfig[] = [
  { key: 'executed', label: 'Ejecutadas', singular: 'Ejecutada', color: colors.dangerTxt, background: colors.dangerSurf, icon: 'exclamation-circle' },
  { key: 'open', label: 'Abiertas', singular: 'Abierta', color: colors.warnTxt, background: colors.warnSurf, icon: 'clock' },
  { key: 'closed', label: 'Cerradas', singular: 'Cerrada', color: colors.successTxt, background: colors.successSurf, icon: 'check-circle' },
  { key: 'rejected', label: 'Rechazadas', singular: 'Rechazada', color: colors.muted, background: '#f7f7f7', icon: 'times-circle' },
];
const apiOrigin = API_URL.replace(/\/api\/?$/, '');

function validGroup(value: string | null | undefined): InspectionDetailFindingGroupKey | null {
  return groups.some((group) => group.key === value) ? value as InspectionDetailFindingGroupKey : null;
}

function allFindings(detail: InspectionDetailResponse): InspectionDetailFindingItemResponse[] {
  return groups.flatMap((group) => detail.findings[group.key] ?? []);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
}

function toTimestamp(value: string | null | undefined): number {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const result = new Date(value).getTime();
  return Number.isNaN(result) ? Number.MAX_SAFE_INTEGER : result;
}

function businessDaysUntil(value: string | null | undefined): number {
  if (!value) return 0;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  let days = 0;
  while (cursor.getTime() < target.getTime()) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) days += 1;
  }
  return days;
}

function slaLabel(value: string | null | undefined, fallback = 'X días hábiles'): string {
  if (!value) return fallback;
  const days = businessDaysUntil(value);
  return `${days} ${days === 1 ? 'día hábil' : 'días hábiles'}`;
}

function evidenceUrl(evidence: InspectionDetailEvidenceResponse | undefined): string | null {
  if (!evidence) return null;
  if (evidence.fileId) return `${apiOrigin}/api/files/${encodeURIComponent(evidence.fileId)}/content`;
  if (!evidence.url) return null;
  if (evidence.url.startsWith('http')) return evidence.url;
  if (evidence.url.startsWith('/api/')) return `${apiOrigin}${evidence.url}`;
  return evidence.url;
}

function severityColors(label: string) {
  const value = label.toLowerCase();
  if (value.includes('crít') || value.includes('critic')) return { background: colors.dangerSurf, color: colors.dangerTxt };
  if (value.includes('alto') || value.includes('grave')) return { background: colors.ocreSurf, color: colors.ocreTxt };
  if (value.includes('moder')) return { background: '#fbe1d0', color: '#69462e' };
  return { background: colors.successSurf, color: colors.successTxt };
}

function statusLabel(group: InspectionDetailFindingGroupKey) {
  if (group === 'executed') return 'Ejecutado';
  if (group === 'closed') return 'Cerrado';
  if (group === 'rejected') return 'Rechazado';
  return 'Abierto';
}

function EvidenceBox({ title, evidence, after, completed }: { title: string; evidence?: InspectionDetailEvidenceResponse; after?: boolean; completed?: boolean }) {
  const token = useMobileSession((state) => state.accessToken);
  const uri = evidenceUrl(evidence);
  return <View style={styles.evidenceBox}><View style={styles.evidenceHeader}><Text style={styles.evidenceTitle}>{title}</Text></View>{uri ? <Image source={{ uri, headers: token ? { Authorization: `Bearer ${token}` } : undefined }} style={styles.evidenceImage} resizeMode="cover" /> : <View style={[styles.evidenceEmpty, after && styles.evidenceAfter, completed && styles.evidenceCompleted]}>{after && !completed ? null : <FontAwesome5 name="image" size={16} color={completed ? colors.successTxt : colors.blueLink} />}<Text style={styles.evidenceEmptyText}>{after && !completed ? 'Pendiente EECC' : 'Sin evidencia'}</Text></View>}</View>;
}

function SlaReassignSheet({ visible, item, pending, onClose, onApply }: { visible: boolean; item: InspectionDetailFindingItemResponse; pending: boolean; onClose: () => void; onApply: (days: number, reason: string) => Promise<void> | void }) {
  const [days, setDays] = useState(0);
  const [reason, setReason] = useState('');
  const canApply = days > 0 && reason.trim().length >= 3 && !pending;
  useEffect(() => { if (visible) { setDays(0); setReason(''); } }, [visible]);
  if (!visible) return null;
  return <Modal visible transparent statusBarTranslucent animationType="slide" onRequestClose={onClose}><View style={styles.slaOverlay}><TouchableOpacity style={styles.slaBackdrop} activeOpacity={1} onPress={onClose} /><View style={styles.slaPanel}><View style={styles.slaHandle} /><Text style={styles.slaTitle}>Reasignar SLA</Text><View style={styles.slaCurrent}><Text style={styles.slaCurrentLabel}>SLA calculado</Text><Text style={styles.slaCurrentValue}>{slaLabel(item.dueAt, 'Sin plazo')}</Text></View><View style={styles.slaEditor}><Text style={styles.slaEditorLabel}>INGRESE EL NUEVO SLA</Text><View style={styles.slaStepper}><TouchableOpacity style={styles.slaStepButton} onPress={() => setDays((value) => Math.max(0, value - 1))} disabled={pending}><Feather name="minus" size={18} color={colors.muted} /></TouchableOpacity><View style={styles.slaStepValue}><Text style={styles.slaStepText}>{days} {days === 1 ? 'Día hábil' : 'Días hábiles'}</Text></View><TouchableOpacity style={styles.slaStepButton} onPress={() => setDays((value) => Math.min(365, value + 1))} disabled={pending}><Feather name="plus" size={18} color={colors.muted} /></TouchableOpacity></View><Text style={styles.slaHint}>Este será el SLA final para esta observación</Text><Text style={styles.slaReasonLabel}>Ingrese el motivo de la modificación</Text><TextInput value={reason} onChangeText={(value) => setReason(value.slice(0, 1000))} placeholder="Escriba el motivo acá..." placeholderTextColor="#8a8a8a" multiline textAlignVertical="top" editable={!pending} style={styles.slaReasonInput} /></View><View style={styles.slaActions}><TouchableOpacity style={styles.slaCancel} onPress={onClose} disabled={pending}><Text style={styles.slaCancelText}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={[styles.slaApply, !canApply && styles.slaApplyDisabled]} onPress={() => { if (canApply) void onApply(days, reason.trim()); }} disabled={!canApply}>{pending ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={[styles.slaApplyText, !canApply && styles.slaApplyTextDisabled]}>Reasignar SLA</Text>}</TouchableOpacity></View></View></View></Modal>;
}

function FindingCard({ inspectionId, item, index, itemLabel, readOnly, actions, onExecute, onReview, onSlaSuccess }: { inspectionId: string; item: InspectionDetailFindingItemResponse; index: number; itemLabel: ItemLabel; readOnly: boolean; actions: ReturnType<typeof useMobileInspectionFindingActions>; onExecute: (item: InspectionDetailFindingItemResponse, index: number) => void; onReview: (mode: MobileFindingReviewMode, item: InspectionDetailFindingItemResponse) => void; onSlaSuccess: () => void }) {
  const [slaOpen, setSlaOpen] = useState(false);
  const group = groups.find((entry) => entry.key === item.statusGroup) ?? groups[1]!;
  const severity = severityColors(item.severityLabel);
  const canExecute = !readOnly && actions.canExecute && (item.statusGroup === 'open' || item.statusGroup === 'rejected');
  const canReview = !readOnly && actions.canReview && item.statusGroup === 'executed';
  const canReassign = !readOnly && actions.canReassign && item.statusGroup === 'open';

  async function reassign(days: number, reason: string) {
    try {
      await actions.reassignFindingSla(inspectionId, item.findingId, days, reason);
      setSlaOpen(false);
      onSlaSuccess();
    } catch (error) {
      Alert.alert('No se pudo reasignar el SLA', error instanceof Error ? error.message : 'Intenta nuevamente.');
    }
  }

  return <View style={styles.findingCard}><View style={styles.findingTop}><View style={styles.pillRow}><View style={styles.indexPill}><Text style={styles.indexText}>{itemLabel} {index + 1}</Text></View><View style={[styles.severityPill, { backgroundColor: severity.background }]}><Text style={[styles.severityText, { color: severity.color }]}>{item.severityLabel}</Text></View></View><View style={[styles.statusPill, { backgroundColor: group.background }]}><FontAwesome5 name={group.icon} size={8} color={group.color} solid /><Text style={[styles.statusText, { color: group.color }]}>{statusLabel(item.statusGroup)}</Text></View></View><View style={styles.copyBlock}><View style={styles.textBlockBordered}><Text style={styles.blockLabel}>CONDICIÓN DETECTADA</Text><Text style={styles.blockValue}>{item.condition || '—'}</Text></View><View style={styles.textBlock}><Text style={styles.blockLabel}>MEDIDA CORRECTIVA PROPUESTA</Text><Text style={styles.blockValue}>{item.proposedCorrectiveAction || '—'}</Text></View>{item.statusGroup !== 'open' ? <View style={styles.textBlock}><Text style={styles.blockLabel}>DESCRIPCIÓN DE LA ACCIÓN TOMADA</Text><Text style={styles.blockValue}>{item.executedActionDescription || '—'}</Text></View> : null}{item.statusGroup === 'rejected' ? <View style={styles.textBlock}><Text style={styles.blockLabel}>MOTIVO DE RECHAZO</Text><Text style={styles.blockValue}>{item.rejectionReason || '—'}</Text></View> : null}<View style={styles.evidenceRow}><EvidenceBox title="ANTES" evidence={item.beforeEvidence[0]} /><EvidenceBox title="DESPUÉS" evidence={item.afterEvidence[0]} after completed={item.statusGroup !== 'open'} /></View>{item.statusGroup === 'open' ? <View style={styles.openSla}><View><Text style={styles.openSlaLabel}>SLA CALCULADO</Text><Text style={styles.openSlaValue}>{slaLabel(item.dueAt)}</Text></View>{canReassign ? <TouchableOpacity style={styles.reassignButton} onPress={() => setSlaOpen(true)} disabled={actions.isPending}><Text style={styles.reassignText}>Reasignar SLA</Text></TouchableOpacity> : null}</View> : null}{item.statusGroup === 'closed' ? <View style={styles.infoRow}><Text style={styles.infoLabel}>Fecha de cierre</Text><Text style={styles.infoValue}>{formatDate(item.closedAt)}</Text></View> : null}{canExecute ? <TouchableOpacity style={styles.primaryAction} onPress={() => onExecute(item, index)} disabled={actions.isPending}><Text style={styles.primaryActionText}>{item.statusGroup === 'rejected' ? 'Ejecutar observación rechazada' : 'Ejecutar observación'}</Text></TouchableOpacity> : null}{canReview ? <View style={styles.reviewActions}><TouchableOpacity style={styles.rejectAction} onPress={() => onReview('reject', item)} disabled={actions.isPending}><MobileInspectionRejectIcon /><Text style={styles.rejectText}>Rechazar</Text></TouchableOpacity><TouchableOpacity style={styles.approveAction} onPress={() => onReview('approve', item)} disabled={actions.isPending}><MobileInspectionApproveIcon /><Text style={styles.approveText}>Aprobar cierre</Text></TouchableOpacity></View> : null}</View><SlaReassignSheet visible={slaOpen} item={item} pending={actions.isPending} onClose={() => setSlaOpen(false)} onApply={reassign} /></View>;
}

function ObservationPanel({ detail, readOnly, actions, requestedFindingId, requestedGroup, onExecute, onReview, onSlaSuccess }: { detail: InspectionDetailResponse; readOnly: boolean; actions: ReturnType<typeof useMobileInspectionFindingActions>; requestedFindingId?: string | null; requestedGroup?: string | null; onExecute: (item: InspectionDetailFindingItemResponse, index: number) => void; onReview: (mode: MobileFindingReviewMode, item: InspectionDetailFindingItemResponse) => void; onSlaSuccess: () => void }) {
  const targetGroup = validGroup(requestedGroup) ?? groups.find((group) => detail.findings[group.key].some((item) => item.findingId === requestedFindingId))?.key ?? 'open';
  const [expanded, setExpanded] = useState<InspectionDetailFindingGroupKey | null>(targetGroup);
  useEffect(() => setExpanded(targetGroup), [targetGroup, detail.header.inspectionId]);
  const itemLabel: ItemLabel = detail.header.kind === 'checklist' ? 'Ítem' : 'Obs.';
  let index = 0;
  return <ScrollView style={styles.body} contentContainerStyle={styles.observationContent}>{groups.map((group) => { const items = detail.findings[group.key] ?? []; const indices = items.map(() => index++); const open = expanded === group.key; return <View key={group.key}><TouchableOpacity style={styles.groupHeader} onPress={() => setExpanded((current) => current === group.key ? null : group.key)}><View style={styles.groupHeaderLeft}><FontAwesome5 name={group.icon} size={12} color={group.color} solid /><Text style={[styles.groupLabel, { color: group.color }]}>{group.label.toUpperCase()}</Text><View style={[styles.groupCount, { backgroundColor: group.background }]}><Text style={[styles.groupCountText, { color: group.color }]}>{items.length}</Text></View></View><Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} /></TouchableOpacity>{open ? <View style={styles.groupItems}>{items.length ? items.map((item, position) => <FindingCard key={item.findingId} inspectionId={detail.header.inspectionId} item={item} index={indices[position] ?? position} itemLabel={itemLabel} readOnly={readOnly} actions={actions} onExecute={onExecute} onReview={onReview} onSlaSuccess={onSlaSuccess} />) : <Text style={styles.emptyGroup}>No hay registros en esta categoría.</Text>}</View> : null}</View>; })}</ScrollView>;
}

function buildFollowupSteps(detail: InspectionDetailResponse): FollowupStep[] {
  const findings = allFindings(detail);
  const total = findings.length;
  const percentage = (value: number) => total === 0 ? 0 : Math.round((value / total) * 100);
  const bulletsAt = (date: string | null) => {
    const closed = date ? findings.filter((item) => item.closedAt && toTimestamp(item.closedAt) <= toTimestamp(date)).length : detail.header.counts.closed;
    const normalized = Math.max(0, Math.min(total, closed));
    const pending = Math.max(0, total - normalized);
    return [`Observaciones cerradas: ${normalized} obs / ${percentage(normalized)}%`, `Observaciones pendientes: ${pending} obs / ${percentage(pending)}%`];
  };
  const grouped = new Map<number, typeof detail.followups>();
  detail.followups.forEach((item) => grouped.set(item.sequenceNumber, [...(grouped.get(item.sequenceNumber) ?? []), item]));
  let recorded = Array.from(grouped.entries()).sort(([a], [b]) => a - b).map(([sequence, records]) => {
    const dates = records.map((item) => item.performedAt).filter((value): value is string => Boolean(value)).sort((a, b) => toTimestamp(a) - toTimestamp(b));
    const occurredAt = dates.at(-1) ?? null;
    const completed = records.some((item) => item.completed);
    return { id: `followup-${sequence}`, title: `Seguimiento ${sequence}`, date: completed ? formatDate(occurredAt) : '—', bullets: completed ? bulletsAt(occurredAt) : undefined, completed, occurredAt } satisfies FollowupStep;
  });
  if (!recorded.length) {
    const dates = findings.flatMap((item) => [item.executedAt, item.rejectedAt, item.closedAt]).filter((value): value is string => Boolean(value));
    recorded = [...new Set(dates.map((value) => new Date(value).toISOString().slice(0, 10)))].sort().slice(0, 3).map((date, position) => ({ id: `derived-${position + 1}`, title: `Seguimiento ${position + 1}`, date: formatDate(date), bullets: bulletsAt(date), completed: true, occurredAt: date }));
  }
  const completed = recorded.filter((item) => item.completed);
  const pendingCount = Math.max(0, 3 - completed.length);
  const pending = Array.from({ length: pendingCount }, (_, position) => ({ id: `pending-${completed.length + position + 1}`, title: `Seguimiento ${completed.length + position + 1}`, date: '—', completed: false, occurredAt: null } satisfies FollowupStep));
  const slaSteps = (detail.slaReassignments ?? []).map((event) => ({ id: `sla-${event.id}`, title: `Observación “${event.findingNumber}” SLA reasignado`, date: formatDate(event.reassignedAt), bullets: [`SLA anterior: ${event.previousSlaBusinessDays} ${event.previousSlaBusinessDays === 1 ? 'día hábil' : 'días hábiles'}`, `Nuevo SLA: ${event.newSlaBusinessDays} ${event.newSlaBusinessDays === 1 ? 'día hábil' : 'días hábiles'}`, `Motivo: ${event.reason}`], completed: true, occurredAt: event.reassignedAt } satisfies FollowupStep));
  const activities = [...completed, ...slaSteps].sort((a, b) => toTimestamp(a.occurredAt) - toTimestamp(b.occurredAt));
  return [{ id: 'initial', title: 'Inspección inicial', date: formatDate(detail.general.scheduledAt), summary: total === 1 ? '1 observación detectada' : `${total} observaciones detectadas`, completed: true, occurredAt: detail.general.scheduledAt }, ...activities, ...pending];
}

function FollowupsPanel({ detail }: { detail: InspectionDetailResponse }) {
  const steps = buildFollowupSteps(detail);
  return <ScrollView style={styles.body} contentContainerStyle={styles.followupContent}><View style={styles.followupTitle}><MobileInspectionFollowupIcon /><Text style={styles.followupTitleText}>HISTORIAL DE SEGUIMIENTOS</Text></View>{steps.map((step, index) => <View key={step.id} style={styles.timelineRow}><View style={styles.timelineRail}>{step.completed ? <MobileInspectionTimelineCompletedIcon /> : <MobileInspectionTimelinePendingIcon />}{index < steps.length - 1 ? <View style={styles.timelineLine} /> : null}</View><View style={[styles.timelineCopy, index < steps.length - 1 && styles.timelineCopySpaced]}><Text style={styles.timelineTitle}>{step.title}</Text><Text style={styles.timelineDate}>{step.date}</Text>{step.summary ? <Text style={styles.timelineSummary}>{step.summary}</Text> : null}{step.bullets?.map((bullet) => <Text key={bullet} style={styles.timelineBullet}>• {bullet}</Text>)}</View></View>)}</ScrollView>;
}

function GeneralPanel({ detail, readOnly, onReassign }: { detail: InspectionDetailResponse; readOnly: boolean; onReassign: () => void }) {
  const findings = allFindings(detail);
  return <ScrollView style={styles.body} contentContainerStyle={styles.generalContent}><View style={styles.generalCard}><Text style={styles.generalTitle}>QUIÉN REALIZÓ LA INSPECCIÓN</Text><InfoRow label="Nombre" value={detail.general.inspectorName ?? '—'} /><InfoRow label="Empresa" value={detail.general.inspectorCompanyName ?? detail.general.companyName ?? '—'} last /></View><View style={styles.generalCard}><Text style={styles.generalTitle}>DONDE Y CUÁNDO</Text><InfoRow label="Área · Sector" value={[detail.general.areaName, detail.general.sectorName].filter(Boolean).join(' · ') || '—'} /><InfoRow label="Fecha" value={formatDate(detail.general.scheduledAt)} /><InfoRow label="Tipo" value={detail.header.kind === 'checklist' ? 'Checklist normativo' : 'Hallazgo'} /><InfoRow label="Ubicación UTM" value={detail.general.latitude && detail.general.longitude ? `${detail.general.latitude} · ${detail.general.longitude}` : detail.general.locationLabel ?? '—'} last /></View><View style={styles.generalCard}><Text style={styles.generalTitle}>OBSERVACIONES ({findings.length})</Text>{findings.map((item, index) => <View key={item.findingId} style={[styles.generalFinding, index === findings.length - 1 && styles.noBorder]}><Text style={styles.generalFindingTitle}>Obs. {index + 1} · {item.severityLabel}</Text><Text style={styles.generalFindingText}>{item.condition ?? '—'}</Text><View style={styles.generalFindingSla}><Text style={styles.infoLabel}>SLA calculado</Text><Text style={styles.infoValue}>{slaLabel(item.dueAt, '—')}</Text></View></View>)}</View><View style={styles.generalCard}><Text style={styles.generalTitle}>RESPONSABLES</Text>{detail.general.responsibles.map((item, index) => <View key={item.userId} style={[styles.responsibleRow, index === detail.general.responsibles.length - 1 && styles.noBorder]}><View style={styles.avatar}><Text style={styles.avatarText}>{item.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</Text></View><View><Text style={styles.responsibleName}>{item.fullName}</Text><Text style={styles.responsiblePosition}>{item.position ?? 'Sin cargo'}</Text></View></View>)}{!readOnly ? <TouchableOpacity style={styles.responsibleButton} onPress={onReassign}><Feather name="user-plus" size={16} color={colors.blueLink} /><Text style={styles.responsibleButtonText}>Reasignar responsables</Text></TouchableOpacity> : null}</View></ScrollView>;
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return <View style={[styles.infoRow, last && styles.noBorder]}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

function ResponsibleSelector({ visible, detail, pending, onClose, onConfirm }: { visible: boolean; detail: InspectionDetailResponse; pending: boolean; onClose: () => void; onConfirm: (ids: string[]) => void }) {
  const companyId = allFindings(detail).find((item) => item.responsibleCompanyId)?.responsibleCompanyId ?? detail.general.responsibles.find((item) => item.companyId)?.companyId ?? null;
  const currentIds = useMemo(() => detail.general.responsibles.map((item) => item.userId), [detail.general.responsibles]);
  const [selected, setSelected] = useState(currentIds);
  const query = useQuery({ queryKey: ['mobile-inspecciones', 'responsible-users', companyId], queryFn: () => fetchInspectionResponsibleUsers(companyId ?? ''), enabled: visible && Boolean(companyId), staleTime: 60_000 });
  useEffect(() => { if (visible) setSelected(currentIds); }, [visible, currentIds.join('|')]);
  if (!visible) return null;
  const options: InspectionDetailResponsibleResponse[] = (query.data ?? []).map((user: UserResponse) => ({ userId: user.id, fullName: user.fullName, position: user.position, companyId: user.companyId, companyName: user.companies?.find((company) => company.id === user.companyId)?.name ?? null, currentUser: currentIds.includes(user.id) }));
  return <Modal visible transparent statusBarTranslucent animationType="fade" onRequestClose={onClose}><View style={styles.selectorOverlay}><View style={styles.selectorPanel}><Text style={styles.selectorTitle}>Reasignar responsables</Text>{query.isLoading ? <ActivityIndicator color={colors.gold} /> : <ScrollView style={styles.selectorList}>{(options.length ? options : detail.general.responsibles).map((option) => <TouchableOpacity key={option.userId} style={styles.selectorRow} onPress={() => setSelected((current) => current.includes(option.userId) ? current.filter((id) => id !== option.userId) : [...current, option.userId])}><View><Text style={styles.responsibleName}>{option.fullName}</Text><Text style={styles.responsiblePosition}>{option.position ?? 'Sin cargo'}</Text></View><View style={[styles.selectorCircle, selected.includes(option.userId) && styles.selectorCircleSelected]}><Text style={styles.selectorCheck}>{selected.includes(option.userId) ? '✓' : ''}</Text></View></TouchableOpacity>)}</ScrollView>}<View style={styles.selectorActions}><TouchableOpacity style={styles.slaCancel} onPress={onClose} disabled={pending}><Text style={styles.slaCancelText}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={styles.slaApply} onPress={() => onConfirm(selected)} disabled={pending}>{pending ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.slaApplyText}>Reasignar</Text>}</TouchableOpacity></View></View></View></Modal>;
}

function DetailHeader({ detail, onClose }: { detail: InspectionDetailResponse; onClose: () => void }) {
  const checklist = detail.header.kind === 'checklist';
  const title = checklist ? [detail.general.areaName, detail.general.companyName].filter(Boolean).join(' · ') || detail.header.title : detail.header.title;
  return <View style={styles.header}><View style={styles.headerCopy}><Text style={styles.number}>#{detail.header.inspectionNumber}</Text><Text style={styles.title}>{title}</Text><Text style={styles.metadata}>{detail.header.metadataLine1}</Text>{detail.header.metadataLine2 ? <Text style={styles.metadata}>{detail.header.metadataLine2}</Text> : null}</View><TouchableOpacity style={styles.closeButton} onPress={onClose}><Feather name="x" size={30} color={colors.primary} /></TouchableOpacity></View>;
}

function Progress({ detail }: { detail: InspectionDetailResponse }) {
  return <View style={styles.progress}><View style={styles.progressTop}><Text style={styles.progressLabel}>Progreso de observaciones</Text><Text style={styles.progressValue}>{detail.header.progressPercent}%</Text></View><View style={styles.progressRail}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, detail.header.progressPercent))}%` }]} /></View><View style={styles.progressChips}>{groups.map((group) => <View key={group.key} style={[styles.progressChip, { backgroundColor: group.background }]}><Text style={[styles.progressChipText, { color: group.color }]}>{detail.header.counts[group.key]} {group.singular}</Text></View>)}</View></View>;
}

function Tabs({ detail, active, onChange }: { detail: InspectionDetailResponse; active: DetailTab; onChange: (tab: DetailTab) => void }) {
  const tabs = detail.header.kind === 'checklist' ? [{ id: 'observations' as const, label: 'Ítems No' }, { id: 'result' as const, label: 'Resultado' }, { id: 'followups' as const, label: 'Seguimientos' }, { id: 'general' as const, label: 'Datos generales' }] : [{ id: 'observations' as const, label: 'Observaciones' }, { id: 'followups' as const, label: 'Seguimientos' }, { id: 'general' as const, label: 'Datos generales' }];
  return <View style={styles.tabs}>{tabs.map((tab) => <TouchableOpacity key={tab.id} style={[styles.tab, active === tab.id && styles.tabActive]} onPress={() => onChange(tab.id)}><Text style={[styles.tabText, active === tab.id && styles.tabTextActive]} numberOfLines={1}>{tab.label}</Text></TouchableOpacity>)}</View>;
}

function PdfButton({ inspectionId }: { inspectionId: string }) {
  return <View style={styles.pdfFooter}><TouchableOpacity style={styles.pdfButton} onPress={() => Alert.alert('Descargar PDF', `${apiOrigin}/api/inspections/${inspectionId}/export/pdf`)}><MobileInspectionPdfIcon /><Text style={styles.pdfText}>Descargar PDF</Text></TouchableOpacity></View>;
}

export function MobileInspectionDetailModal({ visible, inspectionId, requestedFindingId, requestedGroup, forceReadOnly = false, onClose }: Props) {
  const detailQuery = useMobileInspectionDetail(inspectionId, visible);
  const actions = useMobileInspectionFindingActions();
  const [activeTab, setActiveTab] = useState<DetailTab>('observations');
  const [execution, setExecution] = useState<{ item: InspectionDetailFindingItemResponse; index: number } | null>(null);
  const [reviewMode, setReviewMode] = useState<MobileFindingReviewMode>(null);
  const [reviewTarget, setReviewTarget] = useState<InspectionDetailFindingItemResponse | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [responsiblesOpen, setResponsiblesOpen] = useState(false);
  useEffect(() => { if (visible) setActiveTab('observations'); }, [visible, inspectionId]);
  useEffect(() => { if (!snackbar) return; const timer = setTimeout(() => setSnackbar(null), 5000); return () => clearTimeout(timer); }, [snackbar]);

  const detail = detailQuery.data;
  const itemLabel: ItemLabel = detail?.header.kind === 'checklist' ? 'Ítem' : 'Obs.';

  async function submitExecution(description: string, evidence: MobileFindingEvidenceInput) {
    if (!detail || !execution) return;
    await actions.executeWithEvidence({ inspectionId: detail.header.inspectionId, findingId: execution.item.findingId, description, evidence, latitude: detail.general.latitude, longitude: detail.general.longitude, resubmission: execution.item.statusGroup === 'rejected', rejectionReason: execution.item.rejectionReason ?? undefined });
  }

  async function confirmReview(reason?: string) {
    if (!detail || !reviewTarget || !reviewMode) return;
    try {
      if (reviewMode === 'approve') await actions.approve(detail.header.inspectionId, reviewTarget.findingId);
      else await actions.reject(detail.header.inspectionId, reviewTarget.findingId, reason ?? '');
      setSnackbar(reviewMode === 'approve' ? 'Observación cerrada correctamente.' : 'Observación rechazada correctamente.');
      setReviewMode(null);
      setReviewTarget(null);
    } catch (error) {
      Alert.alert('No fue posible completar la acción', error instanceof Error ? error.message : 'Intenta nuevamente.');
    }
  }

  return <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}><View style={styles.screen}>{detailQuery.isLoading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.gold} /></View> : detailQuery.isError || !detail ? <View style={styles.center}><Text style={styles.errorTitle}>No fue posible cargar el detalle</Text><Text style={styles.errorText}>{detailQuery.error instanceof Error ? detailQuery.error.message : 'Intenta nuevamente.'}</Text><TouchableOpacity style={styles.retryButton} onPress={() => { void detailQuery.refetch(); }}><Text style={styles.retryText}>Reintentar</Text></TouchableOpacity></View> : <><DetailHeader detail={detail} onClose={onClose} /><Progress detail={detail} /><Tabs detail={detail} active={activeTab} onChange={setActiveTab} />{activeTab === 'observations' ? <ObservationPanel detail={detail} readOnly={forceReadOnly} actions={actions} requestedFindingId={requestedFindingId} requestedGroup={requestedGroup} onExecute={(item, index) => setExecution({ item, index })} onReview={(mode, item) => { setReviewMode(mode); setReviewTarget(item); }} onSlaSuccess={() => setSnackbar('SLA modificado. El motivo se ha registrado en la tab “Seguimiento”.')} /> : null}{activeTab === 'followups' ? <FollowupsPanel detail={detail} /> : null}{activeTab === 'general' ? <GeneralPanel detail={detail} readOnly={forceReadOnly || !actions.canReassign} onReassign={() => setResponsiblesOpen(true)} /> : null}{activeTab === 'result' && detail.header.kind === 'checklist' ? <MobileInspectionChecklistResultPanel result={detail.checklistResult} /> : null}<PdfButton inspectionId={detail.header.inspectionId} /><ResponsibleSelector visible={responsiblesOpen && actions.canReassign && !forceReadOnly} detail={detail} pending={actions.isPending} onClose={() => setResponsiblesOpen(false)} onConfirm={async (ids) => { try { await actions.reassignResponsibles(detail.header.inspectionId, allFindings(detail).map((item) => item.findingId), ids); setResponsiblesOpen(false); setSnackbar('Responsables reasignados correctamente.'); } catch (error) { Alert.alert('No fue posible reasignar', error instanceof Error ? error.message : 'Intenta nuevamente.'); } }} /><MobileFindingReviewDialog mode={reviewMode} pending={actions.isPending} onClose={() => { setReviewMode(null); setReviewTarget(null); }} onApprove={() => { void confirmReview(); }} onReject={(reason) => { void confirmReview(reason); }} /><MobileFindingReviewSnackbar message={snackbar} onClose={() => setSnackbar(null)} />{execution ? <MobileFindingExecutionModal visible detail={detail} item={execution.item} index={execution.index} itemLabel={itemLabel} pending={actions.isPending} canReview={actions.canReview} onClose={() => setExecution(null)} onFinish={() => { setExecution(null); setSnackbar('Observación ejecutada correctamente.'); }} onSubmit={submitExecution} /> : null}</>}</View></Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  errorTitle: { fontSize: 18, fontWeight: fontWeight.bold, color: colors.primary, textAlign: 'center' },
  errorText: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  retryButton: { marginTop: 8, borderRadius: 10, backgroundColor: colors.gold, paddingHorizontal: 22, paddingVertical: 12 },
  retryText: { color: colors.white, fontWeight: fontWeight.bold },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingBottom: 12, paddingTop: 42, backgroundColor: colors.white },
  headerCopy: { flex: 1 },
  number: { fontSize: 15, lineHeight: 18, fontWeight: fontWeight.bold, color: colors.primary },
  title: { marginTop: 4, fontSize: 21, lineHeight: 26, fontWeight: fontWeight.bold, color: '#2a2a2a' },
  metadata: { marginTop: 2, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.semiBold, color: colors.muted },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progress: { backgroundColor: '#143049', paddingHorizontal: 14, paddingVertical: 10 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 11, color: 'rgba(255,255,255,.55)' },
  progressValue: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.white },
  progressRail: { height: 5, marginTop: 6, overflow: 'hidden', borderRadius: 3, backgroundColor: 'rgba(255,255,255,.18)' },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: colors.successSurf },
  progressChips: { marginTop: 7, flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  progressChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  progressChipText: { fontSize: 10, fontWeight: fontWeight.semiBold },
  tabs: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#e3e3e3', backgroundColor: '#f7f7f7' },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', paddingHorizontal: 3 },
  tabActive: { borderBottomColor: colors.gold },
  tabText: { fontSize: 12, fontWeight: fontWeight.semiBold, color: colors.muted },
  tabTextActive: { color: '#8e6e3e' },
  body: { flex: 1, backgroundColor: colors.white },
  observationContent: { paddingBottom: 24 },
  groupHeader: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e3e3e3', paddingHorizontal: 16 },
  groupHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  groupLabel: { fontSize: 12, letterSpacing: .7, fontWeight: fontWeight.bold },
  groupCount: { minWidth: 22, borderRadius: 11, alignItems: 'center', paddingHorizontal: 7, paddingVertical: 2 },
  groupCountText: { fontSize: 10, fontWeight: fontWeight.bold },
  groupItems: { gap: 18, paddingHorizontal: 14, paddingVertical: 14 },
  emptyGroup: { paddingVertical: 24, textAlign: 'center', color: colors.muted },
  findingCard: { borderRadius: 12, borderWidth: 1.5, borderColor: '#e3e3e3', backgroundColor: '#f7f7f7', padding: 13 },
  findingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  indexPill: { borderRadius: 6, backgroundColor: '#e6f3ff', paddingHorizontal: 8, paddingVertical: 4 },
  indexText: { fontSize: 11, fontWeight: fontWeight.bold, color: '#24588b' },
  severityPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  severityText: { fontSize: 10, fontWeight: fontWeight.bold },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: fontWeight.bold },
  copyBlock: { marginTop: 12, gap: 6 },
  textBlock: { borderRadius: 8, backgroundColor: colors.white, paddingHorizontal: 10, paddingVertical: 8 },
  textBlockBordered: { borderRadius: 8, borderWidth: 1, borderColor: '#e3e3e3', backgroundColor: colors.white, paddingHorizontal: 10, paddingVertical: 8 },
  blockLabel: { fontSize: 9, letterSpacing: 1.5, fontWeight: fontWeight.bold, color: colors.muted },
  blockValue: { marginTop: 4, fontSize: 12, lineHeight: 17, color: '#131313' },
  evidenceRow: { flexDirection: 'row', gap: 5, marginTop: 2 },
  evidenceBox: { flex: 1, height: 105, overflow: 'hidden', borderRadius: 7, borderWidth: 1, borderColor: '#e3e3e3' },
  evidenceHeader: { height: 22, justifyContent: 'center', backgroundColor: colors.primary, paddingHorizontal: 8 },
  evidenceTitle: { fontSize: 9, fontWeight: fontWeight.bold, color: colors.white },
  evidenceImage: { flex: 1, width: '100%' },
  evidenceEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#e8f4fd' },
  evidenceAfter: { backgroundColor: '#d8edf7' },
  evidenceCompleted: { backgroundColor: '#dafccb' },
  evidenceEmptyText: { fontSize: 10, color: '#acacac' },
  openSla: { minHeight: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, borderWidth: 1.5, borderColor: '#d1d1d1', paddingHorizontal: 15, marginTop: 3 },
  openSlaLabel: { fontSize: 9, letterSpacing: .6, fontWeight: fontWeight.bold, color: '#333' },
  openSlaValue: { marginTop: 3, fontSize: 20, lineHeight: 22, fontWeight: fontWeight.bold, color: '#532a0e' },
  reassignButton: { height: 40, justifyContent: 'center', borderRadius: 8, borderWidth: 1.5, borderColor: '#d1d1d1', backgroundColor: colors.white, paddingHorizontal: 15 },
  reassignText: { fontSize: 13, fontWeight: fontWeight.semiBold, color: '#333' },
  infoRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e3e3e3', paddingHorizontal: 12 },
  infoLabel: { fontSize: 12, color: colors.muted },
  infoValue: { maxWidth: '62%', textAlign: 'right', fontSize: 12, fontWeight: fontWeight.bold, color: '#131313' },
  primaryAction: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.gold, marginTop: 2 },
  primaryActionText: { fontSize: 15, fontWeight: fontWeight.bold, color: colors.white },
  reviewActions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  rejectAction: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 10, borderWidth: 2, borderColor: '#c4365a', paddingHorizontal: 16 },
  rejectText: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.dangerTxt },
  approveAction: { height: 44, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 10, backgroundColor: '#3a9b3a' },
  approveText: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.white },
  slaOverlay: { flex: 1, justifyContent: 'flex-end' },
  slaBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(19,19,19,.72)' },
  slaPanel: { borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: colors.white, paddingHorizontal: 14, paddingBottom: 24, paddingTop: 12 },
  slaHandle: { width: 40, height: 4, alignSelf: 'center', borderRadius: 2, backgroundColor: '#d1d1d1' },
  slaTitle: { marginTop: 28, fontSize: 18, fontWeight: fontWeight.bold, color: '#131313' },
  slaCurrent: { marginTop: 26, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e3e3e3' },
  slaCurrentLabel: { fontSize: 14, fontWeight: fontWeight.medium, color: colors.muted },
  slaCurrentValue: { fontSize: 14, fontWeight: fontWeight.bold, color: '#131313' },
  slaEditor: { marginTop: 26, borderRadius: 12, borderWidth: 1, borderColor: '#e3e3e3', paddingHorizontal: 10, paddingVertical: 14 },
  slaEditorLabel: { fontSize: 10, letterSpacing: .7, fontWeight: fontWeight.bold, color: colors.muted },
  slaStepper: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  slaStepButton: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#e3e3e3', backgroundColor: colors.white },
  slaStepValue: { flex: 1, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1.5, borderColor: '#d1d1d1', backgroundColor: '#f6faff' },
  slaStepText: { fontSize: 16, fontWeight: fontWeight.medium, color: '#131313' },
  slaHint: { marginTop: 5, fontSize: 11, color: '#acacac' },
  slaReasonLabel: { marginTop: 18, fontSize: 14, lineHeight: 18, fontWeight: fontWeight.bold, color: '#131313' },
  slaReasonInput: { minHeight: 100, marginTop: 8, borderRadius: 12, borderWidth: 1.5, borderColor: '#d1d1d1', backgroundColor: '#f6faff', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, lineHeight: 20, color: '#131313' },
  slaActions: { flexDirection: 'row', gap: 8, marginTop: 26 },
  slaCancel: { height: 48, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 2, borderColor: colors.gold, backgroundColor: colors.white },
  slaCancelText: { fontSize: 14, fontWeight: fontWeight.bold, color: colors.gold },
  slaApply: { height: 48, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.gold },
  slaApplyDisabled: { backgroundColor: '#d1d1d1' },
  slaApplyText: { fontSize: 15, fontWeight: fontWeight.bold, color: colors.white },
  slaApplyTextDisabled: { color: '#acacac' },
  followupContent: { paddingHorizontal: 18, paddingVertical: 22 },
  followupTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  followupTitleText: { fontSize: 13, letterSpacing: .5, fontWeight: fontWeight.bold, color: colors.muted },
  timelineRow: { flexDirection: 'row', gap: 14 },
  timelineRail: { width: 28, alignItems: 'center' },
  timelineLine: { width: 2, minHeight: 24, flex: 1, backgroundColor: '#e3e3e3' },
  timelineCopy: { flex: 1, paddingTop: 2 },
  timelineCopySpaced: { paddingBottom: 18 },
  timelineTitle: { fontSize: 15, fontWeight: fontWeight.bold, color: '#131313' },
  timelineDate: { marginTop: 4, fontSize: 13, color: colors.muted },
  timelineSummary: { marginTop: 5, fontSize: 13, color: colors.muted },
  timelineBullet: { marginTop: 3, fontSize: 13, lineHeight: 18, color: colors.muted },
  generalContent: { padding: 14, gap: 12 },
  generalCard: { overflow: 'hidden', borderRadius: 12, borderWidth: 1, borderColor: '#e3e3e3', backgroundColor: colors.white },
  generalTitle: { minHeight: 34, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#f7f7f7', fontSize: 10, letterSpacing: .5, fontWeight: fontWeight.bold, color: colors.muted },
  noBorder: { borderBottomWidth: 0 },
  generalFinding: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#e3e3e3' },
  generalFindingTitle: { fontSize: 12, fontWeight: fontWeight.bold, color: '#24588b' },
  generalFindingText: { marginTop: 7, fontSize: 12, lineHeight: 17, color: '#131313' },
  generalFindingSla: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e3e3e3' },
  responsibleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: '#e3e3e3' },
  avatar: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: colors.gold },
  avatarText: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.primary },
  responsibleName: { fontSize: 13, fontWeight: fontWeight.bold, color: '#131313' },
  responsiblePosition: { marginTop: 3, fontSize: 11, color: colors.muted },
  responsibleButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 12, borderRadius: 9, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#d1d1d1', backgroundColor: '#f7f7f7' },
  responsibleButtonText: { fontSize: 12, fontWeight: fontWeight.semiBold, color: colors.blueLink },
  selectorOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(19,19,19,.75)', paddingHorizontal: 16 },
  selectorPanel: { width: '100%', maxWidth: 340, maxHeight: '75%', borderRadius: 16, backgroundColor: colors.white, padding: 16 },
  selectorTitle: { fontSize: 18, fontWeight: fontWeight.bold, color: '#131313', marginBottom: 14 },
  selectorList: { maxHeight: 340 },
  selectorRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e3e3e3' },
  selectorCircle: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 2, borderColor: '#d1d1d1' },
  selectorCircleSelected: { borderColor: '#00b398', backgroundColor: '#00b398' },
  selectorCheck: { color: colors.white, fontWeight: fontWeight.bold },
  selectorActions: { flexDirection: 'row', gap: 8, marginTop: 20 },
  pdfFooter: { borderTopWidth: 1, borderTopColor: '#e3e3e3', backgroundColor: colors.white, paddingHorizontal: 20, paddingBottom: 18, paddingTop: 12 },
  pdfButton: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#d1d1d1' },
  pdfText: { fontSize: 14, fontWeight: fontWeight.semiBold, color: '#333' },
});
