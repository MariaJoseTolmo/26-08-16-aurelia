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
type ItemLabel = 'Obs.' | 'Ítem';
type FontAwesomeName = React.ComponentProps<typeof FontAwesome5>['name'];

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
  icon: 'check-circle' | 'clock' | 'times-circle' | 'exclamation-circle';
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
  { key: 'executed', label: 'Ejecutadas', singular: 'Ejecutada', color: colors.dangerTxt, background: colors.dangerSurf, icon: 'exclamation-circle' },
  { key: 'open', label: 'Abiertas', singular: 'Abierta', color: colors.warnTxt, background: colors.warnSurf, icon: 'clock' },
  { key: 'closed', label: 'Cerradas', singular: 'Cerrada', color: colors.successTxt, background: colors.successSurf, icon: 'check-circle' },
  { key: 'rejected', label: 'Rechazadas', singular: 'Rechazada', color: colors.muted, background: '#f7f7f7', icon: 'exclamation-circle' },
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
  return groups.some((group) => group.key === value)
    ? value as InspectionDetailFindingGroupKey
    : null;
}

function allFindings(detail: InspectionDetailResponse): InspectionDetailFindingItemResponse[] {
  return groups.flatMap((group) => detail.findings[group.key] ?? []);
}

function groupCounterLabel(group: GroupConfig, count: number): string {
  return count === 1 ? group.singular : group.label;
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
  const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000));
  return `${days} ${days === 1 ? 'día' : 'días'}`;
}

function slaCalculatedLabel(value: string | null | undefined): string {
  if (!value) return 'Sin plazo';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin plazo';
  const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000));
  return `${days} ${days === 1 ? 'día hábil' : 'días hábiles'}`;
}

function dueDateFromDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
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
      <View style={styles.evidenceHeader}>
        <Text style={styles.evidenceTitle}>{title}</Text>
      </View>
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

function SlaReassignSheet({
  visible,
  item,
  pending,
  onClose,
  onApply,
}: {
  visible: boolean;
  item: InspectionDetailFindingItemResponse;
  pending: boolean;
  onClose: () => void;
  onApply: (days: number) => void;
}) {
  const [days, setDays] = useState(0);
  const severity = severityColors(item.severityLabel);
  const canApply = days > 0 && !pending;

  useEffect(() => {
    if (visible) setDays(0);
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.slaSheetOverlay}>
        <TouchableOpacity style={styles.slaSheetBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.slaSheetPanel}>
          <View style={styles.slaSheetHandle} />
          <Text style={styles.slaSheetTitle}>Reasignar SLA</Text>

          <View style={styles.slaContent}>
            <View style={styles.slaSummary}>
            <View style={styles.slaSummaryRow}>
              <Text style={styles.slaSummaryLabel}>SLA calculado</Text>
              <Text style={styles.slaSummaryValue}>{slaCalculatedLabel(item.dueAt)}</Text>
            </View>
            <View style={[styles.slaSummaryRow, styles.slaSummaryLastRow]}>
              <Text style={styles.slaSummaryLabel}>Criticidad</Text>
              <View style={[styles.slaSeverity, { backgroundColor: severity.background }]}>
                <Text style={[styles.slaSeverityText, { color: severity.color }]}>{item.severityLabel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.slaEditor}>
            <Text style={styles.slaEditorLabel}>INGRESE EL NUEVO SLA</Text>
            <View style={styles.slaStepper}>
              <TouchableOpacity style={styles.slaStepButton} onPress={() => setDays((value) => Math.max(0, value - 1))}>
                <FontAwesome5 name="minus" size={14} color={colors.muted} />
              </TouchableOpacity>
              <View style={styles.slaStepValue}>
                <Text style={styles.slaStepValueText}>{days} {days === 1 ? 'Día hábil' : 'Días hábiles'}</Text>
              </View>
              <TouchableOpacity style={styles.slaStepButton} onPress={() => setDays((value) => value + 1)}>
                <FontAwesome5 name="plus" size={14} color={colors.muted} />
              </TouchableOpacity>
            </View>
              <Text style={styles.slaEditorHint}>Este será el SLA final para esta observación</Text>
            </View>
          </View>

          <View style={styles.slaActions}>
            <TouchableOpacity style={styles.slaCancelButton} onPress={onClose} disabled={pending}>
              <Text style={styles.slaCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.slaApplyButton, !canApply && styles.slaApplyDisabled]}
              onPress={() => onApply(days)}
              disabled={!canApply}
            >
              {pending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[styles.slaApplyText, !canApply && styles.slaApplyTextDisabled]}>Reasignar SLA</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FindingCard({
  inspectionId,
  item,
  index,
  itemLabel,
  readOnly,
  actions,
  onExecute,
  onReject,
}: {
  inspectionId: string;
  item: InspectionDetailFindingItemResponse;
  index: number;
  itemLabel: ItemLabel;
  readOnly: boolean;
  actions: ReturnType<typeof useMobileInspectionFindingActions>;
  onExecute: (item: InspectionDetailFindingItemResponse) => void;
  onReject: (item: InspectionDetailFindingItemResponse) => void;
}) {
  const severity = severityColors(item.severityLabel);
  const group = groups.find((config) => config.key === item.statusGroup) ?? fallbackGroup;
  const canExecute = !readOnly
    && actions.canExecute
    && (item.statusGroup === 'open' || item.statusGroup === 'rejected');
  const canReview = !readOnly && actions.canReview && item.statusGroup === 'executed';
  const canReassignSla = !readOnly && actions.canReassign && item.statusGroup === 'open';
  const [slaSheetOpen, setSlaSheetOpen] = useState(false);

  async function reschedule(days: number) {
    try {
      await actions.rescheduleFinding(inspectionId, item.findingId, dueDateFromDays(days));
      setSlaSheetOpen(false);
    } catch (error) {
      Alert.alert('No se pudo reasignar el SLA', error instanceof Error ? error.message : 'Intenta nuevamente.');
    }
  }

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
    <View style={styles.findingCard}>
      <View style={styles.findingTop}>
        <View style={styles.pillRow}>
          <View style={styles.indexPill}>
            <Text style={styles.indexPillText}>{itemLabel} {index + 1}</Text>
          </View>
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
        <View style={[styles.textBlock, styles.conditionTextBlock]}>
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
          <View style={styles.rejectBlock}>
            <Text style={styles.blockLabel}>MOTIVO DE RECHAZO</Text>
            <Text style={[styles.blockValue, styles.rejectValue]}>{item.rejectionReason || '—'}</Text>
          </View>
        ) : null}

        <View style={styles.evidenceRow}>
          <EvidenceBox title="ANTES" evidence={item.beforeEvidence[0]} emptyLabel="Pendiente" />
          <EvidenceBox title="DESPUÉS" evidence={item.afterEvidence[0]} after emptyLabel="Pendiente EECC" />
        </View>

        {item.statusGroup === 'open' ? (
          <View style={styles.openSlaCard}>
            <View style={styles.openSlaCopy}>
              <Text style={styles.openSlaLabel}>SLA CALCULADO</Text>
              <Text style={styles.openSlaValue}>{daysLabel(item.dueAt, 'X Días')}</Text>
            </View>
            {canReassignSla ? (
              <TouchableOpacity
                style={styles.reassignSlaButton}
                disabled={actions.isPending}
                onPress={() => setSlaSheetOpen(true)}
              >
                <Text style={styles.reassignSlaButtonText}>Reasignar SLA</Text>
              </TouchableOpacity>
            ) : null}
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
              {item.statusGroup === 'rejected' ? 'Reenviar evidencia' : 'Ejecutar observación'}
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
          <View style={styles.waitingReview}>
            <Text style={styles.waitingReviewText}>En espera de revisión Gold Fields</Text>
          </View>
        ) : null}
      </View>
      <SlaReassignSheet
        visible={slaSheetOpen}
        item={item}
        pending={actions.isPending}
        onClose={() => setSlaSheetOpen(false)}
        onApply={(days) => { void reschedule(days); }}
      />
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
        <PhotoSourceSheet
          visible={photoSheet}
          onClose={() => setPhotoSheet(false)}
          onCamera={() => { void pick('camera'); }}
          onGallery={() => { void pick('gallery'); }}
        />
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
            <TouchableOpacity style={styles.dialogCancel} onPress={onClose}>
              <Text style={styles.dialogCancelText}>Cancelar</Text>
            </TouchableOpacity>
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
  const itemLabel: ItemLabel = detail.header.kind === 'checklist' ? 'Ítem' : 'Obs.';
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
              <FontAwesome5 name={open ? 'chevron-up' : 'chevron-down'} size={12} color={colors.primary} solid />
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
                    itemLabel={itemLabel}
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

function GeneralSectionCard({ icon, title, children }: { icon: FontAwesomeName; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.generalSectionCard}>
      <View style={styles.generalSectionHeader}>
        <FontAwesome5 name={icon} size={11} color={colors.muted} />
        <Text style={styles.generalSectionTitle}>{title}</Text>
      </View>
      <View>{children}</View>
    </View>
  );
}

function GeneralPhotoCard({ detail }: { detail: InspectionDetailResponse }) {
  const token = useMobileSession((state) => state.accessToken);
  const evidence = detail.general.generalEvidence[0];
  const uri = evidenceUrl(evidence);
  return (
    <GeneralSectionCard icon="camera" title="FOTOGRAFÍA GENERAL DE LA INSPECCIÓN">
      <View style={styles.generalPhotoFrame}>
        {uri ? (
          <Image
            source={{ uri, headers: token ? { Authorization: `Bearer ${token}` } : undefined }}
            style={styles.generalPhoto}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.generalPhotoEmpty}>
            <FontAwesome5 name="image" size={18} color="rgba(255,255,255,0.7)" />
            <Text style={styles.generalPhotoEmptyText}>Sin fotografía general</Text>
          </View>
        )}
        <View style={styles.generalPhotoLabel}>
          <Text style={styles.generalPhotoLabelText}>FOTO GENERAL</Text>
        </View>
        <View style={styles.generalPhotoDate}>
          <Text style={styles.generalPhotoDateText}>{formatDate(evidence?.capturedAt)}</Text>
        </View>
      </View>
    </GeneralSectionCard>
  );
}

function GeneralObservationsCard({ detail }: { detail: InspectionDetailResponse }) {
  const findings = allFindings(detail);
  const itemLabel: ItemLabel = detail.header.kind === 'checklist' ? 'Ítem' : 'Obs.';
  return (
    <GeneralSectionCard icon="list-ul" title={`${detail.header.kind === 'checklist' ? 'ÍTEMS NO' : 'OBSERVACIONES'} (${findings.length})`}>
      {findings.length ? findings.map((item, index) => {
        const severity = severityColors(item.severityLabel);
        return (
          <View key={item.findingId} style={[styles.generalObservation, index < findings.length - 1 && styles.generalObservationBorder]}>
            <View style={styles.generalObservationChips}>
              <View style={styles.indexPill}>
                <Text style={styles.indexPillText}>{itemLabel} {index + 1}</Text>
              </View>
              <View style={[styles.severityPill, { backgroundColor: severity.background }]}> 
                <Text style={[styles.severityPillText, { color: severity.color }]}>{item.severityLabel}</Text>
              </View>
            </View>
            <Text style={styles.generalObservationText}>{item.condition || item.title || '—'}</Text>
            <View style={styles.generalObservationSla}>
              <Text style={styles.generalObservationSlaLabel}>SLA calculado</Text>
              <Text style={styles.generalObservationSlaValue}>{daysLabel(item.dueAt, 'Sin plazo')}</Text>
            </View>
          </View>
        );
      }) : <Text style={styles.generalEmptyText}>No hay observaciones registradas.</Text>}
    </GeneralSectionCard>
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
  const inspectionType = detail.header.kind === 'checklist' ? 'Checklist normativo' : 'Hallazgo';
  const areaSector = [general.areaName, general.sectorName].filter(Boolean).join(' · ') || '—';
  return (
    <View style={styles.tabContent}>
      <GeneralSectionCard icon="user-tie" title="QUIÉN REALIZÓ LA INSPECCIÓN">
        <GeneralRow label="Nombre" value={general.inspectorName ?? '—'} />
        <GeneralRow label="Empresa" value={general.inspectorCompanyName ?? general.companyName ?? '—'} />
      </GeneralSectionCard>

      <GeneralSectionCard icon="map-marker-alt" title="DÓNDE Y CUÁNDO">
        <GeneralRow label="Área · Sector" value={areaSector} />
        <GeneralRow label="Fecha" value={formatDate(general.scheduledAt)} />
        <GeneralRow label="Tipo" value={inspectionType} />
        {general.templateName ? <GeneralRow label="Plantilla" value={general.templateName} /> : null}
        {general.templateCode ? <GeneralRow label="Código" value={general.templateCode} /> : null}
        <GeneralRow label="Ubicación UTM" value={coordinates(detail)} mono />
      </GeneralSectionCard>

      <GeneralPhotoCard detail={detail} />
      <GeneralObservationsCard detail={detail} />

      {general.responsibles.length > 0 ? (
        <GeneralSectionCard icon="user-friends" title="RESPONSABLES">
          <GeneralRow label="EECC" value={general.companyName ?? '—'} />
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
              <FontAwesome5 name="user-plus" size={13} color={colors.blueLink} />
              <Text style={styles.reassignText}>Reasignar a otro compañero</Text>
            </TouchableOpacity>
          ) : null}
        </GeneralSectionCard>
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
    const requestedFinding = requestedFindingId
      ? allFindings(detail).find((item) => item.findingId === requestedFindingId)
      : null;
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
      await actions.reassignResponsibles(
        detail.header.inspectionId,
        allFindings(detail).map((item) => item.findingId),
        ids,
      );
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

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} accessibilityLabel="Cerrar detalle" />
        <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>{detail ? `#${detail.header.inspectionNumber.replace(/^#/, '')}` : 'DETALLE'}</Text>
            <Text style={styles.headerTitle} numberOfLines={2}>{detail?.header.title ?? 'Cargando inspección'}</Text>
            {detail ? (
              <View style={styles.headerMetadata}>
                <Text style={styles.headerMetaText}>{detail.header.metadataLine1}</Text>
                {detail.header.metadataLine2 ? <Text style={styles.headerMetaText}>{detail.header.metadataLine2}</Text> : null}
              </View>
            ) : null}
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel="Cerrar detalle">
            <FontAwesome5 name="times" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {detail ? (
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
                  <Text style={[styles.counterText, { color: group.color }]}>{detail.header.counts[group.key]} {groupCounterLabel(group, detail.header.counts[group.key])}</Text>
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
            <TouchableOpacity style={styles.retryButton} onPress={() => { void detailQuery.refetch(); }}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
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

        {detail ? (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.pdfButton}
              onPress={() => Alert.alert('Descargar PDF', 'La exportación PDF autenticada está disponible actualmente desde la versión web.')}
            >
              <FontAwesome5 name="file-pdf" size={13} color={colors.body} />
              <Text style={styles.pdfButtonText}>Descargar PDF</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        </View>
      </View>

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
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(19,19,19,0.75)' },
  screen: { width: '100%', height: '95.375%', maxHeight: 763, backgroundColor: colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' },
  header: { minHeight: 111, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerCopy: { flex: 1, paddingRight: 12 },
  headerEyebrow: { color: colors.navy, fontSize: 13, lineHeight: 16, fontWeight: fontWeight.bold },
  headerTitle: { color: colors.body, fontSize: 16, lineHeight: 22, letterSpacing: 0.32, fontWeight: fontWeight.bold },
  headerMetadata: { alignItems: 'flex-start' },
  headerMetaText: { color: colors.muted, fontSize: 11, lineHeight: 13, fontWeight: fontWeight.bold },
  headerReadOnly: { color: colors.blueLink, fontSize: 10, lineHeight: 13, fontWeight: fontWeight.semibold },
  closeButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  progressPanel: { backgroundColor: '#143049', paddingHorizontal: 14, paddingVertical: 10 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, lineHeight: 12 },
  progressValue: { color: colors.white, fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  progressRail: { marginTop: 5, height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.15)' },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: colors.successSurf },
  counterRow: { marginTop: 6, minHeight: 16, flexDirection: 'row', alignItems: 'center', gap: 5 },
  counter: { height: 16, borderRadius: 5, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2 },
  counterText: { fontSize: 10, lineHeight: 12, fontWeight: fontWeight.semibold },
  tabs: { minHeight: 37, flexDirection: 'row', backgroundColor: '#f7f7f7', borderBottomWidth: 2, borderBottomColor: colors.border },
  tab: { flex: 1, minHeight: 37, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.gold },
  tabText: { color: colors.muted, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.semibold, textAlign: 'center' },
  tabTextActive: { color: colors.goldDark },
  body: { flex: 1, backgroundColor: colors.white },
  bodyContent: { flexGrow: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 },
  loadingText: { marginTop: 10, color: colors.muted, fontSize: 12, textAlign: 'center' },
  errorTitle: { color: colors.navy, fontSize: 16, fontWeight: fontWeight.bold },
  retryButton: { marginTop: 16, height: 42, borderRadius: 12, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  retryText: { color: colors.white, fontSize: 13, fontWeight: fontWeight.bold },
  observationPanel: { backgroundColor: colors.white },
  groupRow: { minHeight: 56, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
  groupCopy: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  groupLabel: { fontSize: 10, lineHeight: 13, letterSpacing: 0.6, fontWeight: fontWeight.bold },
  groupCount: { minWidth: 20, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  groupCountText: { fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  groupBody: { gap: 24, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24, backgroundColor: colors.white },
  emptyGroup: { minHeight: 92, paddingVertical: 32, color: colors.muted, fontSize: 12, textAlign: 'center', fontWeight: fontWeight.semibold },
  findingCard: { borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#f7f7f7', paddingHorizontal: 13, paddingVertical: 13, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 1.5, elevation: 1 },
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
  conditionTextBlock: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 11, paddingVertical: 9 },
  rejectBlock: { borderRadius: 8, backgroundColor: '#fff0f4', borderWidth: 1, borderColor: colors.dangerSurf, paddingHorizontal: 10, paddingVertical: 8 },
  blockLabel: { color: colors.muted, fontSize: 9, lineHeight: 11, letterSpacing: 1.2, fontWeight: fontWeight.bold },
  blockValue: { marginTop: 3, color: colors.primary, fontSize: 12, lineHeight: 17 },
  rejectValue: { color: colors.dangerTxt },
  responsibleLine: { minHeight: 21, flexDirection: 'row', alignItems: 'center', gap: 7, paddingTop: 6 },
  responsibleLineText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 14 },
  evidenceRow: { flexDirection: 'row', gap: 4, paddingTop: 8 },
  evidenceBox: { flex: 1, height: 91, borderRadius: 6, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.white },
  evidenceHeader: { height: 20, justifyContent: 'center', paddingHorizontal: 8, backgroundColor: colors.navy },
  evidenceTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 9, lineHeight: 11, letterSpacing: 0.45, fontWeight: fontWeight.bold },
  evidenceImage: { flex: 1, width: '100%' },
  evidenceEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#d8eff9' },
  evidenceAfterEmpty: { backgroundColor: '#d8eff9' },
  evidenceEmptyText: { color: colors.placeholder, fontSize: 10, lineHeight: 12 },
  openSlaCard: { minHeight: 64, marginTop: 4, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: '#f7f7f7', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 15 },
  openSlaCopy: { flexShrink: 1 },
  openSlaLabel: { color: colors.body, fontSize: 9, lineHeight: 11, letterSpacing: 0.63, fontWeight: fontWeight.bold },
  openSlaValue: { marginTop: 2, color: '#532a0e', fontSize: 20, lineHeight: 20, fontWeight: fontWeight.bold },
  reassignSlaButton: { height: 40, borderRadius: 8, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15.5 },
  reassignSlaButtonText: { color: colors.body, fontSize: 13, lineHeight: 16, fontWeight: fontWeight.semibold },
  compactInfoRow: { minHeight: 33, marginTop: 4, borderRadius: 8, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  compactInfoLabel: { color: colors.muted, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.medium },
  compactInfoValue: { fontSize: 11, lineHeight: 13, fontWeight: fontWeight.bold },
  primaryAction: { height: 52, marginTop: 0, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', shadowColor: colors.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 2 },
  primaryActionText: { color: colors.white, fontSize: 15, lineHeight: 18, fontWeight: fontWeight.bold },
  reviewActions: { marginTop: 4, flexDirection: 'row', gap: 8, borderRadius: 8, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 9 },
  rejectAction: { height: 40, flex: 1, borderRadius: 9, borderWidth: 2, borderColor: '#c4365a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  rejectActionText: { color: colors.dangerTxt, fontSize: 12, fontWeight: fontWeight.bold },
  approveAction: { height: 40, flex: 1.4, borderRadius: 9, backgroundColor: '#3a9b3a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  approveActionText: { color: colors.white, fontSize: 12, fontWeight: fontWeight.bold },
  waitingReview: { marginTop: 4, borderRadius: 8, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 10 },
  waitingReviewText: { color: colors.muted, fontSize: 11, textAlign: 'center', fontWeight: fontWeight.semibold },
  slaSheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  slaSheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  slaSheetPanel: { borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: colors.white, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24, gap: 24 },
  slaSheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderMid, marginTop: 10 },
  slaSheetTitle: { color: colors.primary, fontSize: 14, lineHeight: 17, fontWeight: fontWeight.bold },
  slaContent: { gap: 8 },
  slaSummary: { paddingVertical: 9 },
  slaSummaryRow: { minHeight: 41, borderTopWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  slaSummaryLastRow: { borderBottomWidth: 1 },
  slaSummaryLabel: { color: colors.muted, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.medium },
  slaSummaryValue: { color: colors.primary, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold },
  slaSeverity: { minHeight: 20, borderRadius: 8, justifyContent: 'center', paddingHorizontal: 9, paddingVertical: 5 },
  slaSeverityText: { fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  slaEditor: { borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: 9, paddingVertical: 13, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 1.5, elevation: 1 },
  slaEditorLabel: { color: colors.muted, fontSize: 10, lineHeight: 12, letterSpacing: 0.6, fontWeight: fontWeight.bold },
  slaStepper: { marginTop: 8, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  slaStepButton: { width: 52, height: 50, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  slaStepValue: { flex: 1, height: 50, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: '#f6faff', alignItems: 'center', justifyContent: 'center' },
  slaStepValueText: { color: colors.primary, fontSize: 14, lineHeight: 17, fontWeight: fontWeight.medium, textAlign: 'center' },
  slaEditorHint: { marginTop: 2, color: colors.placeholder, fontSize: 11, lineHeight: 14.3 },
  slaActions: { flexDirection: 'row', gap: 8 },
  slaCancelButton: { height: 44, flex: 1, borderRadius: 14, borderWidth: 2, borderColor: colors.gold, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  slaCancelText: { color: colors.gold, fontSize: 13, lineHeight: 16, fontWeight: fontWeight.bold },
  slaApplyButton: { height: 44, flex: 1, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', shadowColor: colors.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 2 },
  slaApplyDisabled: { backgroundColor: colors.borderMid, shadowOpacity: 0, elevation: 0 },
  slaApplyText: { color: colors.white, fontSize: 15, lineHeight: 18, fontWeight: fontWeight.bold },
  slaApplyTextDisabled: { color: colors.placeholder },
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
  tabContent: { flexGrow: 1, backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 16, gap: 12 },
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
  generalSectionCard: { borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 1.5, elevation: 1 },
  generalSectionHeader: { minHeight: 29, backgroundColor: '#f7f7f7', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12 },
  generalSectionTitle: { color: colors.muted, fontSize: 10, lineHeight: 13, letterSpacing: 0.5, fontWeight: fontWeight.bold },
  generalRow: { minHeight: 34, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingHorizontal: 12, paddingVertical: 9 },
  generalRowLabel: { color: colors.muted, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.medium },
  generalRowValue: { flex: 1, color: colors.primary, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.semibold, textAlign: 'right' },
  generalRowMono: { fontSize: 10, letterSpacing: 0.3 },
  generalPhotoFrame: { height: 112, margin: 12, borderRadius: 8, overflow: 'hidden', backgroundColor: '#142d50' },
  generalPhoto: { width: '100%', height: '100%' },
  generalPhotoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#142d50' },
  generalPhotoEmptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  generalPhotoLabel: { position: 'absolute', top: 8, left: 8, borderRadius: 3, backgroundColor: colors.navy, paddingHorizontal: 7, paddingVertical: 3 },
  generalPhotoLabelText: { color: colors.white, fontSize: 8, lineHeight: 10, letterSpacing: 1.1, fontWeight: fontWeight.bold },
  generalPhotoDate: { position: 'absolute', right: 8, bottom: 7, borderRadius: 3, backgroundColor: 'rgba(0,30,57,0.78)', paddingHorizontal: 6, paddingVertical: 3 },
  generalPhotoDateText: { color: 'rgba(255,255,255,0.8)', fontSize: 8, lineHeight: 10 },
  generalObservation: { paddingHorizontal: 12, paddingVertical: 11 },
  generalObservationBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  generalObservationChips: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  generalObservationText: { marginTop: 8, color: colors.body, fontSize: 12, lineHeight: 17 },
  generalObservationSla: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  generalObservationSlaLabel: { color: colors.muted, fontSize: 11, lineHeight: 14 },
  generalObservationSlaValue: { color: colors.body, fontSize: 11, lineHeight: 14, fontWeight: fontWeight.bold },
  generalEmptyText: { paddingHorizontal: 12, paddingVertical: 20, color: colors.muted, fontSize: 11, textAlign: 'center' },
  generalResponsible: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 9 },
  generalResponsibleBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  youPill: { minHeight: 16, borderRadius: 5, backgroundColor: colors.tealSurf, justifyContent: 'center', paddingHorizontal: 7 },
  youPillText: { color: colors.teal, fontSize: 10, fontWeight: fontWeight.bold },
  reassignButton: { minHeight: 42, margin: 12, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.borderMid, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  reassignText: { color: colors.blueLink, fontSize: 12, fontWeight: fontWeight.semibold },
  footer: { minHeight: 70, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white, justifyContent: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 14 },
  pdfButton: { height: 40, borderRadius: 8, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pdfButtonText: { color: colors.body, fontSize: 13, lineHeight: 16, fontWeight: fontWeight.semibold },
});