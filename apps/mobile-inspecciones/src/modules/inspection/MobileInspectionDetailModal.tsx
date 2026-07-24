import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
import { PhotoSourceSheet } from '../../shared/components/form/PhotoSourceSheet';
import { MobileInspectionChecklistResultPanel } from './MobileInspectionChecklistResultPanel';
import { colors, fontWeight } from '../../shared/theme/tokens';
import { useMobileSession } from '../auth/mobileSession.store';
import {
  useMobileInspectionDetail,
  useMobileInspectionFindingActions,
  type MobileFindingEvidenceInput,
} from './hooks/useMobileInspectionManagement';

type DetailTab = 'observations' | 'result' | 'followups' | 'general';
type ActionMode = 'execute' | 'reject' | null;

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
  icon: 'check-circle' | 'clock' | 'times-circle';
};

type FollowupStep = {
  id: string;
  title: string;
  date: string;
  summary?: string;
  completed: boolean;
  occurredAt?: string | null;
};

const groups: GroupConfig[] = [
  { key: 'executed', label: 'Ejecutadas', singular: 'Ejecutada', color: colors.dangerTxt, background: colors.dangerSurf, icon: 'check-circle' },
  { key: 'open', label: 'Abiertas', singular: 'Abierta', color: colors.warnTxt, background: colors.warnSurf, icon: 'clock' },
  { key: 'closed', label: 'Cerradas', singular: 'Cerrada', color: colors.successTxt, background: colors.successSurf, icon: 'check-circle' },
  { key: 'rejected', label: 'Rechazadas', singular: 'Rechazada', color: colors.muted, background: '#f7f7f7', icon: 'times-circle' },
];

const fallbackGroup = groups[1] ?? {
  key: 'open' as const,
  label: 'Abiertas',
  singular: 'Abierta',
  color: colors.warnTxt,
  background: colors.warnSurf,
  icon: 'clock' as const,
};
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
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
}

function toTimestamp(value: string | null | undefined): number {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime();
}

function daysLabel(value: string | null | undefined, fallback = 'Sin plazo'): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  const days = Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days < 0) return `${Math.abs(days)} días vencido`;
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'NA';
}

function severityColors(label: string): { background: string; color: string; border: string } {
  const normalized = label.toLowerCase();
  if (normalized.includes('crít') || normalized.includes('crit')) {
    return { background: colors.dangerSurf, color: colors.dangerTxt, border: '#e090a8' };
  }
  if (normalized.includes('alto') || normalized.includes('grave')) {
    return { background: colors.ocreSurf, color: colors.ocreTxt, border: '#d6a06f' };
  }
  if (normalized.includes('moder')) {
    return { background: colors.warnSurf, color: colors.warnTxt, border: '#e8c45f' };
  }
  return { background: colors.successSurf, color: colors.successTxt, border: '#9bd98a' };
}

function highestSeverity(detail: InspectionDetailResponse): string | null {
  const rank = (value: string) => {
    const normalized = value.toLowerCase();
    if (normalized.includes('crít') || normalized.includes('crit')) return 4;
    if (normalized.includes('alto') || normalized.includes('grave')) return 3;
    if (normalized.includes('moder')) return 2;
    return 1;
  };
  return allFindings(detail)
    .map((item) => item.severityLabel)
    .sort((left, right) => rank(right) - rank(left))[0] ?? null;
}

function responsibleLabel(item: InspectionDetailFindingItemResponse): string {
  const person = item.responsibleUsers[0]?.fullName;
  return [person, item.responsibleCompanyName].filter(Boolean).join(' · ') || 'Responsable no asignado';
}

function coordinates(detail: InspectionDetailResponse): string {
  if (detail.general.latitude && detail.general.longitude) {
    return `${detail.general.latitude} · ${detail.general.longitude}`;
  }
  return detail.general.locationLabel ?? '—';
}

function EvidenceBox({
  title,
  evidence,
  after = false,
  emptyLabel,
}: {
  title: string;
  evidence?: InspectionDetailEvidenceResponse;
  after?: boolean;
  emptyLabel: string;
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
          {after ? null : <FontAwesome5 name="image" size={16} color={colors.blueLink} />}
          <Text style={styles.evidenceEmptyText}>{emptyLabel}</Text>
        </View>
      )}
    </View>
  );
}

function CompactInfoRow({ label, value, valueColor = colors.primary }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.compactInfoRow}>
      <Text style={styles.compactInfoLabel}>{label}</Text>
      <Text style={[styles.compactInfoValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function FindingCard({
  inspectionId,
  item,
  index,
  readOnly,
  actions,
  onExecute,
  onReject,
}: {
  inspectionId: string;
  item: InspectionDetailFindingItemResponse;
  index: number;
  readOnly: boolean;
  actions: ReturnType<typeof useMobileInspectionFindingActions>;
  onExecute: (item: InspectionDetailFindingItemResponse) => void;
  onReject: (item: InspectionDetailFindingItemResponse) => void;
}) {
  const severity = severityColors(item.severityLabel);
  const group = groups.find((config) => config.key === item.statusGroup) ?? fallbackGroup;
  const canExecute = !readOnly && actions.canExecute && (item.statusGroup === 'open' || item.statusGroup === 'rejected');
  const canReview = !readOnly && actions.canReview && item.statusGroup === 'executed';

  function approve() {
    Alert.alert('Aprobar cierre', '¿Confirmas el cierre de esta observación?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aprobar',
        onPress: () => {
          void actions.approve(inspectionId, item.findingId).catch((error: Error) => {
            Alert.alert('No se pudo aprobar', error.message);
          });
        },
      },
    ]);
  }

  return (
    <View style={[styles.findingCard, item.statusGroup === 'executed' && styles.findingCardReview]}>
      <View style={styles.findingTop}>
        <View style={styles.pillRow}>
          <View style={styles.indexPill}><Text style={styles.indexPillText}>Obs. {index + 1}</Text></View>
          <View style={[styles.severityPill, { backgroundColor: severity.background }]}>
            <Text style={[styles.severityPillText, { color: severity.color }]}>{item.severityLabel}</Text>
          </View>
        </View>
        <View style={[styles.statusPill, { backgroundColor: group.background }]}>
          <FontAwesome5 name={group.icon} size={8} color={group.color} solid />
          <Text style={[styles.statusPillText, { color: group.color }]}>{group.singular}</Text>
        </View>
      </View>

      <View style={styles.findingCopy}>
        <View style={[styles.textBlock, styles.textBlockBordered]}>
          <Text style={styles.blockLabel}>CONDICIÓN DETECTADA</Text>
          <Text style={styles.blockValue}>{item.condition || '—'}</Text>
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.blockLabel}>MEDIDA CORRECTIVA PROPUESTA</Text>
          <Text style={styles.blockValue}>{item.proposedCorrectiveAction || '—'}</Text>
        </View>
        {item.statusGroup !== 'open' ? (
          <View style={styles.textBlock}>
            <Text style={styles.blockLabel}>DESCRIPCIÓN DE LA ACCIÓN TOMADA</Text>
            <Text style={styles.blockValue}>{item.executedActionDescription || '—'}</Text>
          </View>
        ) : null}
        {item.statusGroup === 'rejected' ? (
          <View style={[styles.textBlock, styles.rejectBlock]}>
            <Text style={styles.blockLabel}>MOTIVO DE RECHAZO</Text>
            <Text style={[styles.blockValue, styles.rejectValue]}>{item.rejectionReason || '—'}</Text>
          </View>
        ) : null}

        <View style={styles.responsibleLine}>
          <FontAwesome5 name="user" size={10} color={colors.placeholder} solid />
          <Text style={styles.responsibleLineText}>{responsibleLabel(item)}</Text>
        </View>

        <View style={styles.evidenceRow}>
          <EvidenceBox title="ANTES" evidence={item.beforeEvidence[0]} emptyLabel="Pendiente" />
          <EvidenceBox title="DESPUÉS" evidence={item.afterEvidence[0]} after emptyLabel="Pendiente EECC" />
        </View>

        {item.statusGroup === 'open' ? (
          <View style={styles.openSlaCard}>
            <Text style={styles.openSlaLabel}>SLA CALCULADO</Text>
            <Text style={styles.openSlaValue}>{daysLabel(item.dueAt, 'X Días')}</Text>
          </View>
        ) : null}
        {item.statusGroup === 'executed' || item.statusGroup === 'rejected' ? (
          <CompactInfoRow label="SLA calculado" value={daysLabel(item.dueAt)} valueColor={colors.dangerTxt} />
        ) : null}
        {item.statusGroup === 'closed' ? (
          <>
            <CompactInfoRow label="SLA cerrado" value={daysLabel(item.dueAt)} valueColor={colors.ocreTxt} />
            <CompactInfoRow label="Fecha de cierre" value={formatDate(item.closedAt)} valueColor={colors.muted} />
          </>
        ) : null}

        {canExecute ? (
          <TouchableOpacity style={styles.primaryAction} disabled={actions.isPending} onPress={() => onExecute(item)}>
            <Text style={styles.primaryActionText}>
              {item.statusGroup === 'rejected' ? 'Ejecutar observación rechazada' : 'Ejecutar observación'}
            </Text>
          </TouchableOpacity>
        ) : null}
        {canReview ? (
          <View style={styles.reviewActions}>
            <TouchableOpacity style={styles.rejectAction} disabled={actions.isPending} onPress={() => onReject(item)}>
              <FontAwesome5 name="times-circle" size={13} color={colors.dangerTxt} />
              <Text style={styles.rejectActionText}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveAction} disabled={actions.isPending} onPress={approve}>
              <FontAwesome5 name="check-circle" size={13} color={colors.white} solid />
              <Text style={styles.approveActionText}>Aprobar cierre</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {!readOnly && item.statusGroup === 'executed' && !actions.canReview ? (
          <View style={styles.waitingReview}><Text style={styles.waitingReviewText}>En espera de revisión Gold Fields</Text></View>
        ) : null}
      </View>
    </View>
  );
}

function ActionDialog({
  mode,
  item,
  pending,
  onClose,
  onSubmit,
}: {
  mode: ActionMode;
  item: InspectionDetailFindingItemResponse | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: (description: string, evidence: MobileFindingEvidenceInput | null) => void;
}) {
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<MobileFindingEvidenceInput | null>(null);
  const [photoSheet, setPhotoSheet] = useState(false);

  useEffect(() => {
    setDescription(mode === 'execute' ? item?.proposedCorrectiveAction ?? '' : '');
    setEvidence(null);
  }, [item, mode]);

  async function pick(source: 'camera' | 'gallery') {
    setPhotoSheet(false);
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Debes autorizar el acceso para adjuntar evidencia.');
      return;
    }
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;
    setEvidence({
      uri: asset.uri,
      filename: asset.fileName ?? `evidencia-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
    });
  }

  if (!mode || !item) return null;
  const isExecute = mode === 'execute';
  const valid = description.trim().length > 0 && (!isExecute || Boolean(evidence));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.dialogOverlay}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>
            {isExecute
              ? item.statusGroup === 'rejected' ? 'Reenviar evidencia' : 'Ejecutar observación'
              : 'Rechazar ejecución'}
          </Text>
          <Text style={styles.dialogSubtitle}>
            {isExecute
              ? 'Describe la acción realizada y adjunta una fotografía posterior.'
              : 'Registra un motivo claro para devolver la observación.'}
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder={isExecute ? 'Acción ejecutada' : 'Motivo de rechazo'}
            placeholderTextColor={colors.placeholder}
            style={styles.dialogInput}
          />
          {isExecute ? (
            <TouchableOpacity style={[styles.photoButton, evidence && styles.photoButtonReady]} onPress={() => setPhotoSheet(true)}>
              <FontAwesome5 name={evidence ? 'check-circle' : 'camera'} size={16} color={evidence ? colors.successTxt : colors.blueLink} solid={Boolean(evidence)} />
              <Text style={[styles.photoButtonText, evidence && styles.photoButtonTextReady]}>
                {evidence ? evidence.filename : 'Adjuntar fotografía después'}
              </Text>
            </TouchableOpacity>
          ) : null}
          <View style={styles.dialogActions}>
            <TouchableOpacity style={styles.dialogCancel} onPress={onClose} disabled={pending}>
              <Text style={styles.dialogCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dialogConfirm, !valid && styles.dialogConfirmDisabled]} onPress={() => onSubmit(description.trim(), evidence)} disabled={!valid || pending}>
              {pending ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.dialogConfirmText}>Confirmar</Text>}
            </TouchableOpacity>
          </View>
        </View>
        <PhotoSourceSheet visible={photoSheet} onClose={() => setPhotoSheet(false)} onCamera={() => { void pick('camera'); }} onGallery={() => { void pick('gallery'); }} />
      </View>
    </Modal>
  );
}

function ResponsibleSelector({
  visible,
  detail,
  pending,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  detail: InspectionDetailResponse;
  pending: boolean;
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}) {
  const companyId = allFindings(detail).find((item) => item.responsibleCompanyId)?.responsibleCompanyId
    ?? detail.general.responsibles.find((item) => item.companyId)?.companyId
    ?? null;
  const currentIds = useMemo(() => detail.general.responsibles.map((item) => item.userId), [detail.general.responsibles]);
  const currentIdsKey = currentIds.join('|');
  const [selected, setSelected] = useState<string[]>(currentIds);
  const query = useQuery({
    queryKey: ['mobile-inspecciones', 'responsible-users', companyId],
    queryFn: () => fetchInspectionResponsibleUsers(companyId ?? ''),
    enabled: visible && Boolean(companyId),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (visible) setSelected(currentIds);
  }, [currentIds, currentIdsKey, visible]);

  const options = useMemo<InspectionDetailResponsibleResponse[]>(() => {
    const users = query.data ?? [];
    if (users.length === 0) return detail.general.responsibles;
    return users.map((user: UserResponse) => ({
      userId: user.id,
      fullName: user.fullName,
      position: user.position,
      companyId: user.companyId,
      companyName: user.companies?.find((company) => company.id === user.companyId)?.name ?? null,
      currentUser: currentIds.includes(user.id),
    }));
  }, [currentIds, detail.general.responsibles, query.data]);

  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetPanel}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Reasignar responsables</Text>
          <Text style={styles.sheetSubtitle}>La selección se aplicará a los hallazgos de esta inspección.</Text>
          <ScrollView style={styles.responsibleList}>
            {query.isLoading ? <ActivityIndicator color={colors.gold} /> : null}
            {options.map((option) => {
              const active = selected.includes(option.userId);
              return (
                <TouchableOpacity
                  key={option.userId}
                  style={styles.responsibleOption}
                  onPress={() => setSelected((current) => active ? current.filter((id) => id !== option.userId) : [...current, option.userId])}
                >
                  <View style={styles.avatar}><Text style={styles.avatarText}>{initials(option.fullName)}</Text></View>
                  <View style={styles.responsibleCopy}>
                    <Text style={styles.responsibleName}>{option.fullName}</Text>
                    <Text style={styles.responsibleRole}>{option.position ?? 'Sin cargo'}</Text>
                  </View>
                  <FontAwesome5 name={active ? 'check-circle' : 'circle'} size={20} color={active ? colors.teal : colors.borderMid} solid={active} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.dialogActions}>
            <TouchableOpacity style={styles.dialogCancel} onPress={onClose}><Text style={styles.dialogCancelText}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.dialogConfirm, selected.length === 0 && styles.dialogConfirmDisabled]} disabled={selected.length === 0 || pending} onPress={() => onConfirm(selected)}>
              <Text style={styles.dialogConfirmText}>Reasignar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ObservationsPanel({
  detail,
  expanded,
  onExpanded,
  readOnly,
  actions,
  onExecute,
  onReject,
}: {
  detail: InspectionDetailResponse;
  expanded: InspectionDetailFindingGroupKey | null;
  onExpanded: (group: InspectionDetailFindingGroupKey | null) => void;
  readOnly: boolean;
  actions: ReturnType<typeof useMobileInspectionFindingActions>;
  onExecute: (item: InspectionDetailFindingItemResponse) => void;
  onReject: (item: InspectionDetailFindingItemResponse) => void;
}) {
  return (
    <View style={styles.observationPanel}>
      {groups.map((group) => {
        const items = detail.findings[group.key] ?? [];
        const open = expanded === group.key;
        return (
          <View key={group.key}>
            <TouchableOpacity style={styles.groupRow} onPress={() => onExpanded(open ? null : group.key)}>
              <View style={styles.groupCopy}>
                <FontAwesome5 name={group.icon} size={15} color={group.color} solid />
                <Text style={[styles.groupLabel, { color: group.color }]}>{group.label.toUpperCase()}</Text>
                <View style={[styles.groupCount, { backgroundColor: group.background }]}>
                  <Text style={[styles.groupCountText, { color: group.color }]}>{items.length}</Text>
                </View>
              </View>
              <FontAwesome5 name={open ? 'chevron-up' : 'chevron-down'} size={13} color={colors.muted} />
            </TouchableOpacity>
            {open ? (
              <View style={styles.groupBody}>
                {items.length === 0 ? <Text style={styles.emptyGroup}>No hay observaciones en este estado.</Text> : null}
                {items.map((item, index) => (
                  <FindingCard
                    key={item.findingId}
                    inspectionId={detail.header.inspectionId}
                    item={item}
                    index={index}
                    readOnly={readOnly}
                    actions={actions}
                    onExecute={onExecute}
                    onReject={onReject}
                  />
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function buildFollowupSteps(detail: InspectionDetailResponse): FollowupStep[] {
  const observedCount = allFindings(detail).length;
  const events: FollowupStep[] = [];
  detail.followups.forEach((step) => {
    events.push({
      id: `followup-${step.followupId}`,
      title: step.title || `Seguimiento ${step.sequenceNumber}`,
      date: formatDate(step.performedAt),
      summary: step.description,
      completed: step.completed,
      occurredAt: step.performedAt,
    });
  });
  allFindings(detail).forEach((item, index) => {
    const observationLabel = `Obs. ${index + 1}`;
    if (item.executedAt) events.push({ id: `executed-${item.findingId}`, title: `${observationLabel} ejecutada`, date: formatDate(item.executedAt), summary: item.executedActionDescription ?? 'Observación marcada como ejecutada', completed: true, occurredAt: item.executedAt });
    if (item.rejectedAt) events.push({ id: `rejected-${item.findingId}`, title: `${observationLabel} rechazada`, date: formatDate(item.rejectedAt), summary: item.rejectionReason ?? 'Observación rechazada y devuelta a corrección', completed: true, occurredAt: item.rejectedAt });
    if (item.closedAt) events.push({ id: `closed-${item.findingId}`, title: `${observationLabel} cerrada`, date: formatDate(item.closedAt), summary: 'Cierre aprobado por Gold Fields', completed: true, occurredAt: item.closedAt });
  });
  const sorted = events.sort((left, right) => toTimestamp(left.occurredAt) - toTimestamp(right.occurredAt));
  return [{ id: 'initial', title: 'Inspección inicial', date: formatDate(detail.general.scheduledAt), summary: `${observedCount} observaciones detectadas`, completed: true, occurredAt: detail.general.scheduledAt }, ...sorted];
}

function FollowupsPanel({ detail }: { detail: InspectionDetailResponse }) {
  const steps = useMemo(() => buildFollowupSteps(detail), [detail]);
  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeading}>
        <FontAwesome5 name="users" size={11} color={colors.blueLink} />
        <Text style={styles.sectionHeadingText}>HISTORIAL DE SEGUIMIENTOS</Text>
      </View>
      <View style={styles.timeline}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <View key={step.id} style={[styles.timelineRow, !isLast && styles.timelineRowSpacing]}>
              <View style={styles.timelineAxis}>
                <View style={[styles.timelineMarker, !step.completed && styles.timelineMarkerPending]}>
                  <Text style={[styles.timelineMarkerText, !step.completed && styles.timelineMarkerTextPending]}>{step.completed ? '✓' : '○'}</Text>
                </View>
                {!isLast ? <View style={styles.timelineLine} /> : null}
              </View>
              <View style={styles.timelineCopy}>
                <Text style={styles.timelineTitle}>{step.title}</Text>
                <Text style={styles.timelineDate}>{step.date}</Text>
                {step.summary ? <Text style={styles.timelineDescription}>{step.summary}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function GeneralRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.generalRow}>
      <Text style={styles.generalRowLabel}>{label}</Text>
      <Text style={[styles.generalRowValue, mono && styles.generalRowMono]}>{value}</Text>
    </View>
  );
}

function GeneralPanel({
  detail,
  readOnly,
  canReassign,
  onReassign,
}: {
  detail: InspectionDetailResponse;
  readOnly: boolean;
  canReassign: boolean;
  onReassign: () => void;
}) {
  const general = detail.general;
  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeading}>
        <FontAwesome5 name="info-circle" size={11} color={colors.blueLink} solid />
        <Text style={styles.sectionHeadingText}>DATOS DE LA INSPECCIÓN</Text>
      </View>
      <View style={styles.generalTable}>
        <GeneralRow label="Inspector" value={general.inspectorName ?? '—'} />
        <GeneralRow label="Empresa (EECC)" value={general.companyName ?? general.inspectorCompanyName ?? '—'} />
        <GeneralRow label="Área" value={general.areaName ?? '—'} />
        <GeneralRow label="Sector" value={general.sectorName ?? '—'} />
        <GeneralRow label="Fecha" value={formatDate(general.scheduledAt)} />
        <GeneralRow label="Tipo" value={detail.header.kind === 'checklist' ? 'Checklist normativo' : 'Hallazgo'} />
        <GeneralRow label="Ubicación UTM" value={coordinates(detail)} mono />
      </View>

      {general.responsibles.length > 0 ? (
        <View style={styles.responsiblesSection}>
          <View style={styles.sectionHeading}>
            <FontAwesome5 name="user-friends" size={11} color={colors.blueLink} />
            <Text style={styles.sectionHeadingText}>RESPONSABLES</Text>
          </View>
          <View style={styles.responsibleCard}>
            {general.responsibles.map((responsible, index) => (
              <View key={responsible.userId} style={[styles.generalResponsible, index < general.responsibles.length - 1 && styles.generalResponsibleBorder]}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{initials(responsible.fullName)}</Text></View>
                <View style={styles.responsibleCopy}>
                  <Text style={styles.responsibleName}>{responsible.fullName}</Text>
                  <Text style={styles.responsibleRole}>{responsible.position ?? responsible.companyName ?? 'Sin cargo'}</Text>
                </View>
                {responsible.currentUser ? <View style={styles.youPill}><Text style={styles.youPillText}>Tú</Text></View> : null}
              </View>
            ))}
            {!readOnly && canReassign ? (
              <TouchableOpacity style={styles.reassignButton} onPress={onReassign}>
                <FontAwesome5 name="user-edit" size={13} color={colors.blueLink} />
                <Text style={styles.reassignText}>Reasignar responsables</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function MobileInspectionDetailModal({
  visible,
  inspectionId,
  requestedFindingId,
  requestedGroup,
  forceReadOnly = false,
  onClose,
}: Props) {
  const detailQuery = useMobileInspectionDetail(inspectionId, visible);
  const actions = useMobileInspectionFindingActions();
  const [activeTab, setActiveTab] = useState<DetailTab>('observations');
  const [expandedGroup, setExpandedGroup] = useState<InspectionDetailFindingGroupKey | null>(validGroup(requestedGroup));
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [actionTarget, setActionTarget] = useState<InspectionDetailFindingItemResponse | null>(null);
  const [reassignVisible, setReassignVisible] = useState(false);

  const detail = detailQuery.data;
  const readOnly = forceReadOnly || (!actions.canExecute && !actions.canReview && !actions.canReassign);

  useEffect(() => {
    if (!visible) return;
    setActiveTab('observations');
    if (!detail) {
      setExpandedGroup(validGroup(requestedGroup));
      return;
    }
    const requestedFinding = requestedFindingId ? allFindings(detail).find((item) => item.findingId === requestedFindingId) : null;
    setExpandedGroup(requestedFinding?.statusGroup ?? validGroup(requestedGroup));
  }, [detail, requestedFindingId, requestedGroup, visible]);

  function openAction(mode: Exclude<ActionMode, null>, item: InspectionDetailFindingItemResponse) {
    setActionTarget(item);
    setActionMode(mode);
  }

  async function submitAction(description: string, evidence: MobileFindingEvidenceInput | null) {
    if (!detail || !actionTarget) return;
    try {
      if (actionMode === 'reject') {
        await actions.reject(detail.header.inspectionId, actionTarget.findingId, description);
      } else if (actionMode === 'execute' && evidence) {
        await actions.executeWithEvidence({
          inspectionId: detail.header.inspectionId,
          findingId: actionTarget.findingId,
          description,
          evidence,
          latitude: detail.general.latitude,
          longitude: detail.general.longitude,
          resubmission: actionTarget.statusGroup === 'rejected',
          rejectionReason: actionTarget.rejectionReason ?? undefined,
        });
      }
      setActionMode(null);
      setActionTarget(null);
    } catch (error) {
      Alert.alert('No se pudo completar la acción', error instanceof Error ? error.message : 'Intenta nuevamente.');
    }
  }

  async function confirmReassign(ids: string[]) {
    if (!detail) return;
    try {
      await actions.reassignResponsibles(detail.header.inspectionId, allFindings(detail).map((item) => item.findingId), ids);
      setReassignVisible(false);
    } catch (error) {
      Alert.alert('No se pudo reasignar', error instanceof Error ? error.message : 'Intenta nuevamente.');
    }
  }

  const tabs: Array<{ key: DetailTab; label: string }> = detail?.header.kind === 'checklist'
    ? [
        { key: 'observations', label: 'Ítems NO' },
        { key: 'result', label: 'Resultado completo' },
        { key: 'followups', label: 'Seguimientos' },
        { key: 'general', label: 'Datos generales' },
      ]
    : [
        { key: 'observations', label: 'Observaciones' },
        { key: 'followups', label: 'Seguimientos' },
        { key: 'general', label: 'Datos generales' },
      ];
  const severityLabel = detail ? highestSeverity(detail) : null;
  const severity = severityLabel ? severityColors(severityLabel) : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>{detail ? `#${detail.header.inspectionNumber.replace(/^#/, '')}` : 'DETALLE'}</Text>
            <Text style={styles.headerTitle} numberOfLines={2}>{detail?.header.title ?? 'Cargando inspección'}</Text>
            {detail ? (
              <View style={styles.headerMetadata}>
                {severity && severityLabel ? (
                  <View style={[styles.headerSeverity, { backgroundColor: severity.background, borderColor: severity.border }]}>
                    <Text style={[styles.headerSeverityText, { color: severity.color }]}>{severityLabel}</Text>
                  </View>
                ) : null}
                {detail.general.templateName ? <Text style={styles.headerMetaText}>· {detail.general.templateName}</Text> : null}
                <Text style={styles.headerMetaText}>· {formatDate(detail.general.scheduledAt)}</Text>
                {readOnly ? <Text style={styles.headerReadOnly}>· Solo lectura</Text> : null}
              </View>
            ) : null}
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel="Cerrar detalle">
            <FontAwesome5 name="times" size={16} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>
        </View>

        {detail && !forceReadOnly ? (
          <View style={styles.progressPanel}>
            <View style={styles.progressTop}>
              <Text style={styles.progressLabel}>Progreso de observaciones</Text>
              <Text style={styles.progressValue}>{detail.header.progressPercent}%</Text>
            </View>
            <View style={styles.progressRail}>
              <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, detail.header.progressPercent))}%` }]} />
            </View>
            <View style={styles.counterRow}>
              {groups.map((group) => (
                <View key={group.key} style={[styles.counter, { backgroundColor: group.background }]}>
                  <FontAwesome5 name={group.icon} size={8} color={group.color} solid />
                  <Text style={[styles.counterText, { color: group.color }]}>{detail.header.counts[group.key]} {group.label}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {detail ? (
          <View style={styles.tabs}>
            {tabs.map((tab) => (
              <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key)}>
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {detailQuery.isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.gold} />
            <Text style={styles.loadingText}>Cargando detalle real…</Text>
          </View>
        ) : null}
        {detailQuery.isError ? (
          <View style={styles.loading}>
            <Text style={styles.errorTitle}>No fue posible cargar el detalle</Text>
            <Text style={styles.loadingText}>Verifica tu conexión y permisos.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => { void detailQuery.refetch(); }}><Text style={styles.retryText}>Reintentar</Text></TouchableOpacity>
          </View>
        ) : null}

        {detail ? (
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {activeTab === 'observations' ? (
              <ObservationsPanel
                detail={detail}
                expanded={expandedGroup}
                onExpanded={setExpandedGroup}
                readOnly={readOnly}
                actions={actions}
                onExecute={(item) => openAction('execute', item)}
                onReject={(item) => openAction('reject', item)}
              />
            ) : null}
            {activeTab === 'result' ? <MobileInspectionChecklistResultPanel result={detail.checklistResult} /> : null}
            {activeTab === 'followups' ? <FollowupsPanel detail={detail} /> : null}
            {activeTab === 'general' ? (
              <GeneralPanel detail={detail} readOnly={readOnly} canReassign={actions.canReassign} onReassign={() => setReassignVisible(true)} />
            ) : null}
          </ScrollView>
        ) : null}
      </SafeAreaView>

      <ActionDialog
        mode={actionMode}
        item={actionTarget}
        pending={actions.isPending}
        onClose={() => { setActionMode(null); setActionTarget(null); }}
        onSubmit={(description, evidence) => { void submitAction(description, evidence); }}
      />
      {detail ? (
        <ResponsibleSelector
          visible={reassignVisible}
          detail={detail}
          pending={actions.isPending}
          onClose={() => setReassignVisible(false)}
          onConfirm={(ids) => { void confirmReassign(ids); }}
        />
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { minHeight: 91, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerCopy: { flex: 1, paddingRight: 12 },
  headerEyebrow: { color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 16, fontWeight: fontWeight.bold },
  headerTitle: { marginTop: 2, color: colors.white, fontSize: 16, lineHeight: 20, fontWeight: fontWeight.bold },
  headerMetadata: { minHeight: 22, marginTop: 4, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  headerSeverity: { minHeight: 18, borderRadius: 6, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 9, paddingVertical: 2 },
  headerSeverityText: { fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  headerMetaText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 13 },
  headerReadOnly: { color: '#9ed1ff', fontSize: 10, lineHeight: 13, fontWeight: fontWeight.semibold },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  progressPanel: { backgroundColor: '#143049', paddingHorizontal: 14, paddingVertical: 10 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, lineHeight: 12 },
  progressValue: { color: colors.white, fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  progressRail: { marginTop: 5, height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.15)' },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: colors.successSurf },
  counterRow: { marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  counter: { minHeight: 16, borderRadius: 5, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2 },
  counterText: { fontSize: 9, lineHeight: 11, fontWeight: fontWeight.bold },
  tabs: { minHeight: 37, flexDirection: 'row', backgroundColor: '#f7f7f7', borderBottomWidth: 2, borderBottomColor: colors.border },
  tab: { flex: 1, minHeight: 37, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.gold },
  tabText: { color: colors.muted, fontSize: 11, lineHeight: 14, fontWeight: fontWeight.semibold, textAlign: 'center' },
  tabTextActive: { color: colors.goldDark },
  body: { flex: 1, backgroundColor: colors.white },
  bodyContent: { flexGrow: 1, paddingBottom: 28 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 },
  loadingText: { marginTop: 10, color: colors.muted, fontSize: 12, textAlign: 'center' },
  errorTitle: { color: colors.navy, fontSize: 16, fontWeight: fontWeight.bold },
  retryButton: { marginTop: 16, height: 42, borderRadius: 12, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  retryText: { color: colors.white, fontSize: 13, fontWeight: fontWeight.bold },
  observationPanel: { backgroundColor: colors.white },
  groupRow: { minHeight: 56, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
  groupCopy: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  groupLabel: { fontSize: 11, lineHeight: 13, letterSpacing: 0.66, fontWeight: fontWeight.bold },
  groupCount: { minWidth: 20, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  groupCountText: { fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  groupBody: { gap: 24, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24, backgroundColor: colors.white },
  emptyGroup: { minHeight: 92, paddingVertical: 32, color: colors.muted, fontSize: 12, textAlign: 'center', fontWeight: fontWeight.semibold },
  findingCard: { borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, borderLeftWidth: 3, borderLeftColor: colors.borderMid, backgroundColor: '#f7f7f7', paddingHorizontal: 13, paddingVertical: 13, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 1.5, elevation: 1 },
  findingCardReview: { borderColor: '#e7b1bf', borderLeftColor: colors.danger },
  findingTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  indexPill: { minHeight: 19, borderRadius: 6, backgroundColor: colors.blueSurf, justifyContent: 'center', paddingHorizontal: 8 },
  indexPillText: { color: colors.blueLink, fontSize: 11, lineHeight: 13, fontWeight: fontWeight.bold },
  severityPill: { minHeight: 19, borderRadius: 6, justifyContent: 'center', paddingHorizontal: 8 },
  severityPillText: { fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  statusPill: { minHeight: 19, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2 },
  statusPillText: { fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  findingCopy: { marginTop: 12, gap: 4 },
  textBlock: { borderRadius: 8, backgroundColor: colors.white, paddingHorizontal: 10, paddingVertical: 8 },
  textBlockBordered: { borderWidth: 1, borderColor: colors.border },
  rejectBlock: { backgroundColor: '#fff0f4', borderWidth: 1, borderColor: colors.dangerSurf },
  blockLabel: { color: colors.muted, fontSize: 9, lineHeight: 11, letterSpacing: 1.2, fontWeight: fontWeight.bold },
  blockValue: { marginTop: 3, color: colors.primary, fontSize: 12, lineHeight: 17 },
  rejectValue: { color: colors.dangerTxt },
  responsibleLine: { minHeight: 21, flexDirection: 'row', alignItems: 'center', gap: 7, paddingTop: 6 },
  responsibleLineText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 14 },
  evidenceRow: { flexDirection: 'row', gap: 6, paddingTop: 4 },
  evidenceBox: { flex: 1, height: 91, borderRadius: 6, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.white },
  evidenceHeader: { height: 20, justifyContent: 'center', paddingHorizontal: 8, backgroundColor: colors.navy },
  evidenceTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 9, lineHeight: 11, letterSpacing: 0.45, fontWeight: fontWeight.bold },
  evidenceImage: { flex: 1, width: '100%' },
  evidenceEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#d8eff9' },
  evidenceAfterEmpty: { backgroundColor: '#dfffd1' },
  evidenceEmptyText: { color: colors.placeholder, fontSize: 10, lineHeight: 12 },
  openSlaCard: { minHeight: 64, marginTop: 4, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: '#f7f7f7', justifyContent: 'center', paddingHorizontal: 15 },
  openSlaLabel: { color: colors.body, fontSize: 9, lineHeight: 11, letterSpacing: 0.63, fontWeight: fontWeight.bold },
  openSlaValue: { marginTop: 2, color: colors.ocreTxt, fontSize: 20, lineHeight: 22, fontWeight: fontWeight.bold },
  compactInfoRow: { minHeight: 33, marginTop: 4, borderRadius: 8, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  compactInfoLabel: { color: colors.muted, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.medium },
  compactInfoValue: { fontSize: 11, lineHeight: 13, fontWeight: fontWeight.bold },
  primaryAction: { height: 52, marginTop: 4, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', shadowColor: colors.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 2 },
  primaryActionText: { color: colors.white, fontSize: 14, lineHeight: 17, fontWeight: fontWeight.bold },
  reviewActions: { marginTop: 4, flexDirection: 'row', gap: 8, borderRadius: 8, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 9 },
  rejectAction: { height: 40, flex: 1, borderRadius: 9, borderWidth: 2, borderColor: '#c4365a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  rejectActionText: { color: colors.dangerTxt, fontSize: 12, fontWeight: fontWeight.bold },
  approveAction: { height: 40, flex: 1.4, borderRadius: 9, backgroundColor: colors.ok, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  approveActionText: { color: colors.white, fontSize: 12, fontWeight: fontWeight.bold },
  waitingReview: { marginTop: 4, borderRadius: 8, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 10 },
  waitingReviewText: { color: colors.muted, fontSize: 11, textAlign: 'center', fontWeight: fontWeight.semibold },
  dialogOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20 },
  dialog: { width: '100%', maxWidth: 420, borderRadius: 18, backgroundColor: colors.white, padding: 18 },
  dialogTitle: { color: colors.navy, fontSize: 18, fontWeight: fontWeight.bold },
  dialogSubtitle: { marginTop: 5, color: colors.muted, fontSize: 12, lineHeight: 17 },
  dialogInput: { marginTop: 16, minHeight: 110, borderRadius: 12, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: '#f6faff', color: colors.body, fontSize: 13, lineHeight: 18, padding: 12, textAlignVertical: 'top' },
  photoButton: { marginTop: 12, minHeight: 48, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#b4d1ed', backgroundColor: '#f6faff', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  photoButtonReady: { borderStyle: 'solid', borderColor: '#9bd98a', backgroundColor: '#efffea' },
  photoButtonText: { flex: 1, color: colors.blueLink, fontSize: 12, fontWeight: fontWeight.semibold },
  photoButtonTextReady: { color: colors.successTxt },
  dialogActions: { marginTop: 18, flexDirection: 'row', gap: 8 },
  dialogCancel: { height: 46, flex: 1, borderRadius: 14, borderWidth: 2, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  dialogCancelText: { color: colors.gold, fontSize: 13, fontWeight: fontWeight.bold },
  dialogConfirm: { height: 46, flex: 1.3, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  dialogConfirmDisabled: { backgroundColor: colors.borderMid },
  dialogConfirmText: { color: colors.white, fontSize: 13, fontWeight: fontWeight.bold },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheetPanel: { maxHeight: '78%', borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: colors.white, paddingHorizontal: 16, paddingTop: 9, paddingBottom: 22 },
  sheetHandle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: colors.borderMid },
  sheetTitle: { marginTop: 15, color: colors.navy, fontSize: 18, fontWeight: fontWeight.bold },
  sheetSubtitle: { marginTop: 4, color: colors.muted, fontSize: 11 },
  responsibleList: { marginTop: 14, maxHeight: 360 },
  responsibleOption: { minHeight: 62, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gold },
  avatarText: { color: colors.navy, fontSize: 12, fontWeight: fontWeight.bold },
  responsibleCopy: { flex: 1 },
  responsibleName: { color: colors.primary, fontSize: 12, fontWeight: fontWeight.bold },
  responsibleRole: { marginTop: 3, color: colors.muted, fontSize: 10 },
  tabContent: { flexGrow: 1, backgroundColor: colors.white, paddingHorizontal: 20, paddingVertical: 20 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionHeadingText: { color: colors.muted, fontSize: 11, lineHeight: 13, letterSpacing: 0.55, fontWeight: fontWeight.bold },
  timeline: { marginTop: 10 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineRowSpacing: { minHeight: 64 },
  timelineAxis: { width: 24, alignItems: 'center' },
  timelineMarker: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success },
  timelineMarkerPending: { backgroundColor: colors.border },
  timelineMarkerText: { color: colors.white, fontSize: 10, lineHeight: 12 },
  timelineMarkerTextPending: { color: colors.placeholder },
  timelineLine: { width: 2, flex: 1, minHeight: 38, backgroundColor: colors.border },
  timelineCopy: { flex: 1, paddingTop: 2, paddingLeft: 12, paddingBottom: 16 },
  timelineTitle: { color: colors.primary, fontSize: 12, lineHeight: 14, fontWeight: fontWeight.bold },
  timelineDate: { marginTop: 4, color: colors.muted, fontSize: 11, lineHeight: 13 },
  timelineDescription: { marginTop: 4, color: colors.muted, fontSize: 11, lineHeight: 15 },
  generalTable: { marginTop: 10 },
  generalRow: { minHeight: 34, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingVertical: 8 },
  generalRowLabel: { color: colors.muted, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.medium },
  generalRowValue: { flex: 1, color: colors.primary, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.semibold, textAlign: 'right' },
  generalRowMono: { fontSize: 10, letterSpacing: 0.3 },
  responsiblesSection: { marginTop: 24 },
  responsibleCard: { marginTop: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.white },
  generalResponsible: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 9 },
  generalResponsibleBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  youPill: { minHeight: 16, borderRadius: 5, backgroundColor: colors.tealSurf, justifyContent: 'center', paddingHorizontal: 7 },
  youPillText: { color: colors.teal, fontSize: 10, fontWeight: fontWeight.bold },
  reassignButton: { minHeight: 42, margin: 12, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.borderMid, backgroundColor: '#f7f7f7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  reassignText: { color: colors.blueLink, fontSize: 12, fontWeight: fontWeight.semibold },
});