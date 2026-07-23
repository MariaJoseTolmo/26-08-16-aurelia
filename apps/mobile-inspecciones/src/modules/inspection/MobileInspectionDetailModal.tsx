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

const groups: GroupConfig[] = [
  { key: 'executed', label: 'Ejecutadas', singular: 'Ejecutada', color: '#570b1d', background: '#ffd0db', icon: 'check-circle' },
  { key: 'open', label: 'Abiertas', singular: 'Abierta', color: '#463100', background: '#ffeab8', icon: 'clock' },
  { key: 'closed', label: 'Cerradas', singular: 'Cerrada', color: '#2a5c16', background: '#e0ffd3', icon: 'check-circle' },
  { key: 'rejected', label: 'Rechazadas', singular: 'Rechazada', color: '#646464', background: '#f1f1f1', icon: 'times-circle' },
];

const fallbackGroup: GroupConfig = groups[1] ?? {
  key: 'open',
  label: 'Abiertas',
  singular: 'Abierta',
  color: '#463100',
  background: '#ffeab8',
  icon: 'clock',
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
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function daysLabel(value: string | null | undefined): string {
  if (!value) return 'Sin plazo';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin plazo';
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

function severityColors(label: string): { background: string; color: string } {
  const normalized = label.toLowerCase();
  if (normalized.includes('crít') || normalized.includes('crit')) return { background: '#ffd0db', color: '#570b1d' };
  if (normalized.includes('alto') || normalized.includes('grave')) return { background: '#ffe1cd', color: '#532a0e' };
  if (normalized.includes('moder')) return { background: '#ffeab8', color: '#463100' };
  return { background: '#e0ffd3', color: '#2a5c16' };
}

function EvidenceBox({ title, evidence }: { title: string; evidence?: InspectionDetailEvidenceResponse }) {
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
        <View style={styles.evidenceEmpty}>
          <FontAwesome5 name="image" size={16} color={colors.placeholder} />
          <Text style={styles.evidenceEmptyText}>Sin evidencia</Text>
        </View>
      )}
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
  const canExecute = !readOnly
    && actions.canExecute
    && (item.statusGroup === 'open' || item.statusGroup === 'rejected');
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
          <FontAwesome5 name={group.icon} size={9} color={group.color} solid />
          <Text style={[styles.statusPillText, { color: group.color }]}>{group.singular}</Text>
        </View>
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.blockLabel}>CONDICIÓN DETECTADA</Text>
        <Text style={styles.blockValue}>{item.condition || '—'}</Text>
      </View>
      <View style={[styles.textBlock, styles.textBlockMuted]}>
        <Text style={styles.blockLabel}>MEDIDA CORRECTIVA PROPUESTA</Text>
        <Text style={styles.blockValue}>{item.proposedCorrectiveAction || '—'}</Text>
      </View>
      {item.executedActionDescription ? (
        <View style={styles.textBlock}>
          <Text style={styles.blockLabel}>ACCIÓN EJECUTADA</Text>
          <Text style={styles.blockValue}>{item.executedActionDescription}</Text>
        </View>
      ) : null}
      {item.rejectionReason ? (
        <View style={[styles.textBlock, styles.rejectBlock]}>
          <Text style={styles.blockLabel}>MOTIVO DE RECHAZO</Text>
          <Text style={styles.blockValue}>{item.rejectionReason}</Text>
        </View>
      ) : null}

      <View style={styles.evidenceRow}>
        <EvidenceBox title="ANTES" evidence={item.beforeEvidence[0]} />
        <EvidenceBox title="DESPUÉS" evidence={item.afterEvidence[0]} />
      </View>

      <View style={styles.dueRow}>
        <Text style={styles.dueLabel}>{item.statusGroup === 'closed' ? 'Fecha de cierre' : 'SLA calculado'}</Text>
        <Text style={styles.dueValue}>{item.statusGroup === 'closed' ? formatDate(item.closedAt) : daysLabel(item.dueAt)}</Text>
      </View>

      {canExecute ? (
        <TouchableOpacity
          style={styles.primaryAction}
          disabled={actions.isPending}
          onPress={() => onExecute(item)}
        >
          <Text style={styles.primaryActionText}>
            {item.statusGroup === 'rejected' ? 'Reenviar evidencia' : 'Ejecutar observación'}
          </Text>
        </TouchableOpacity>
      ) : null}
      {canReview ? (
        <View style={styles.reviewActions}>
          <TouchableOpacity
            style={styles.rejectAction}
            disabled={actions.isPending}
            onPress={() => onReject(item)}
          >
            <Text style={styles.rejectActionText}>Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.approveAction}
            disabled={actions.isPending}
            onPress={approve}
          >
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
            <TouchableOpacity
              style={[styles.photoButton, evidence && styles.photoButtonReady]}
              onPress={() => setPhotoSheet(true)}
            >
              <FontAwesome5
                name={evidence ? 'check-circle' : 'camera'}
                size={16}
                color={evidence ? '#2a5c16' : '#24588b'}
                solid={Boolean(evidence)}
              />
              <Text style={[styles.photoButtonText, evidence && styles.photoButtonTextReady]}>
                {evidence ? evidence.filename : 'Adjuntar fotografía después'}
              </Text>
            </TouchableOpacity>
          ) : null}
          <View style={styles.dialogActions}>
            <TouchableOpacity style={styles.dialogCancel} onPress={onClose} disabled={pending}>
              <Text style={styles.dialogCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dialogConfirm, !valid && styles.dialogConfirmDisabled]}
              onPress={() => onSubmit(description.trim(), evidence)}
              disabled={!valid || pending}
            >
              {pending
                ? <ActivityIndicator size="small" color={colors.white} />
                : <Text style={styles.dialogConfirmText}>Confirmar</Text>}
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
  const currentIds = useMemo(
    () => detail.general.responsibles.map((item) => item.userId),
    [detail.general.responsibles],
  );
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
                  onPress={() => setSelected((current) => (
                    active
                      ? current.filter((id) => id !== option.userId)
                      : [...current, option.userId]
                  ))}
                >
                  <View style={styles.avatar}><Text style={styles.avatarText}>{initials(option.fullName)}</Text></View>
                  <View style={styles.responsibleCopy}>
                    <Text style={styles.responsibleName}>{option.fullName}</Text>
                    <Text style={styles.responsibleRole}>{option.position ?? 'Sin cargo'}</Text>
                  </View>
                  <FontAwesome5
                    name={active ? 'check-circle' : 'circle'}
                    size={20}
                    color={active ? colors.teal : colors.borderMid}
                    solid={active}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.dialogActions}>
            <TouchableOpacity style={styles.dialogCancel} onPress={onClose}>
              <Text style={styles.dialogCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dialogConfirm, selected.length === 0 && styles.dialogConfirmDisabled]}
              disabled={selected.length === 0 || pending}
              onPress={() => onConfirm(selected)}
            >
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
            <TouchableOpacity
              style={styles.groupRow}
              onPress={() => onExpanded(open ? null : group.key)}
            >
              <View style={styles.groupCopy}>
                <FontAwesome5 name={group.icon} size={16} color={group.color} solid />
                <Text style={[styles.groupLabel, { color: group.color }]}>{group.label.toUpperCase()}</Text>
                <View style={[styles.groupCount, { backgroundColor: group.background }]}>
                  <Text style={[styles.groupCountText, { color: group.color }]}>{items.length}</Text>
                </View>
              </View>
              <FontAwesome5
                name={open ? 'chevron-up' : 'chevron-down'}
                size={13}
                color={colors.muted}
              />
            </TouchableOpacity>
            {open ? (
              <View style={styles.groupBody}>
                {items.length === 0
                  ? <Text style={styles.emptyGroup}>No hay observaciones en este estado.</Text>
                  : null}
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

function FollowupsPanel({ detail }: { detail: InspectionDetailResponse }) {
  const events = useMemo(() => {
    const direct = detail.followups.map((item) => ({
      id: `followup-${item.followupId}`,
      title: item.title || `Seguimiento ${item.sequenceNumber}`,
      description: item.description,
      date: item.performedAt,
    }));
    const findingEvents = allFindings(detail).flatMap((item, index) => {
      const rows: Array<{ id: string; title: string; description: string; date: string | null }> = [];
      if (item.executedAt) {
        rows.push({
          id: `executed-${item.findingId}`,
          title: `Obs. ${index + 1} ejecutada`,
          description: item.executedActionDescription ?? 'Ejecución registrada',
          date: item.executedAt,
        });
      }
      if (item.rejectedAt) {
        rows.push({
          id: `rejected-${item.findingId}`,
          title: `Obs. ${index + 1} rechazada`,
          description: item.rejectionReason ?? 'Ejecución rechazada',
          date: item.rejectedAt,
        });
      }
      if (item.closedAt) {
        rows.push({
          id: `closed-${item.findingId}`,
          title: `Obs. ${index + 1} cerrada`,
          description: 'Cierre aprobado',
          date: item.closedAt,
        });
      }
      return rows;
    });
    return [...direct, ...findingEvents]
      .sort((left, right) => Date.parse(right.date ?? '') - Date.parse(left.date ?? ''));
  }, [detail]);

  return (
    <View style={styles.tabContent}>
      {events.length === 0 ? <Text style={styles.emptyGroup}>No hay seguimientos registrados.</Text> : null}
      {events.map((event, index) => (
        <View key={event.id} style={styles.timelineRow}>
          <View style={styles.timelineMarker}><Text style={styles.timelineMarkerText}>{index + 1}</Text></View>
          <View style={styles.timelineCopy}>
            <Text style={styles.timelineTitle}>{event.title}</Text>
            <Text style={styles.timelineDate}>{formatDate(event.date)}</Text>
            <Text style={styles.timelineDescription}>{event.description}</Text>
          </View>
        </View>
      ))}
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
      <View style={styles.generalSection}>
        <Text style={styles.generalTitle}>Quién realizó la inspección</Text>
        <Text style={styles.generalLabel}>Nombre</Text>
        <Text style={styles.generalValue}>{general.inspectorName ?? '—'}</Text>
        <Text style={styles.generalLabel}>Empresa</Text>
        <Text style={styles.generalValue}>{general.inspectorCompanyName ?? general.companyName ?? '—'}</Text>
      </View>
      <View style={styles.generalSection}>
        <Text style={styles.generalTitle}>Dónde y cuándo</Text>
        <Text style={styles.generalLabel}>Área · Sector</Text>
        <Text style={styles.generalValue}>
          {[general.areaName, general.sectorName].filter(Boolean).join(' · ') || '—'}
        </Text>
        <Text style={styles.generalLabel}>Fecha</Text>
        <Text style={styles.generalValue}>{formatDate(general.scheduledAt)}</Text>
        <Text style={styles.generalLabel}>Ubicación</Text>
        <Text style={styles.generalValue}>
          {general.latitude && general.longitude
            ? `${general.latitude} · ${general.longitude}`
            : general.locationLabel ?? '—'}
        </Text>
      </View>
      <View style={styles.generalSection}>
        <Text style={styles.generalTitle}>Responsables</Text>
        {general.responsibles.map((responsible) => (
          <View key={responsible.userId} style={styles.generalResponsible}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials(responsible.fullName)}</Text></View>
            <View style={styles.responsibleCopy}>
              <Text style={styles.responsibleName}>{responsible.fullName}</Text>
              <Text style={styles.responsibleRole}>
                {responsible.position ?? responsible.companyName ?? 'Sin cargo'}
              </Text>
            </View>
          </View>
        ))}
        {!readOnly && canReassign ? (
          <TouchableOpacity style={styles.reassignButton} onPress={onReassign}>
            <FontAwesome5 name="user-edit" size={13} color="#24588b" />
            <Text style={styles.reassignText}>Reasignar responsables</Text>
          </TouchableOpacity>
        ) : null}
      </View>
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
      Alert.alert(
        'No se pudo completar la acción',
        error instanceof Error ? error.message : 'Intenta nuevamente.',
      );
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
        { key: 'observations', label: 'Ítems No' },
        { key: 'result', label: 'Resultado' },
        { key: 'followups', label: 'Seguimientos' },
        { key: 'general', label: 'Datos' },
      ]
    : [
        { key: 'observations', label: 'Observaciones' },
        { key: 'followups', label: 'Seguimientos' },
        { key: 'general', label: 'Datos' },
      ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.back} onPress={onClose}>
            <FontAwesome5 name="arrow-left" size={17} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>
              {detail ? `#${detail.header.inspectionNumber.replace(/^#/, '')}` : 'DETALLE'}
            </Text>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {detail?.header.title ?? 'Cargando inspección'}
            </Text>
          </View>
          {readOnly ? (
            <View style={styles.readOnlyPill}>
              <FontAwesome5 name="eye" size={9} color="#24588b" />
              <Text style={styles.readOnlyText}>Solo lectura</Text>
            </View>
          ) : null}
        </View>

        {detail ? (
          <View style={styles.progressPanel}>
            <View style={styles.progressTop}>
              <Text style={styles.progressLabel}>Progreso de observaciones</Text>
              <Text style={styles.progressValue}>{detail.header.progressPercent}%</Text>
            </View>
            <View style={styles.progressRail}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.max(0, Math.min(100, detail.header.progressPercent))}%` },
                ]}
              />
            </View>
            <View style={styles.counterRow}>
              {groups.map((group) => (
                <View key={group.key} style={[styles.counter, { backgroundColor: group.background }]}>
                  <Text style={[styles.counterText, { color: group.color }]}>
                    {detail.header.counts[group.key]} {group.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {detail ? (
          <View style={styles.tabs}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
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
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
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
            {activeTab === 'result' ? (
              <View style={styles.tabContent}>
                <View style={styles.generalSection}>
                  <Text style={styles.generalTitle}>Resultado completo</Text>
                  <Text style={styles.resultText}>
                    La API de detalle actual expone el resumen y los ítems no conformes. El reporte completo
                    continúa disponible en la exportación de la inspección.
                  </Text>
                </View>
              </View>
            ) : null}
            {activeTab === 'followups' ? <FollowupsPanel detail={detail} /> : null}
            {activeTab === 'general' ? (
              <GeneralPanel
                detail={detail}
                readOnly={readOnly}
                canReassign={actions.canReassign}
                onReassign={() => setReassignVisible(true)}
              />
            ) : null}
          </ScrollView>
        ) : null}
      </View>

      <ActionDialog
        mode={actionMode}
        item={actionTarget}
        pending={actions.isPending}
        onClose={() => {
          setActionMode(null);
          setActionTarget(null);
        }}
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
  screen: { flex: 1, backgroundColor: '#f7f7f7' },
  header: { minHeight: 88, paddingTop: 18, paddingHorizontal: 14, paddingBottom: 12, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  headerCopy: { flex: 1 },
  headerEyebrow: { color: colors.gold, fontSize: 11, fontWeight: fontWeight.bold },
  headerTitle: { marginTop: 3, color: colors.white, fontSize: 16, lineHeight: 20, fontWeight: fontWeight.bold },
  readOnlyPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, backgroundColor: '#e6f3ff', paddingHorizontal: 8, paddingVertical: 5 },
  readOnlyText: { color: '#24588b', fontSize: 9, fontWeight: fontWeight.bold },
  progressPanel: { backgroundColor: '#143049', paddingHorizontal: 14, paddingVertical: 10 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  progressValue: { color: colors.white, fontSize: 10, fontWeight: fontWeight.bold },
  progressRail: { marginTop: 6, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: '#e0ffd3' },
  counterRow: { marginTop: 7, flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  counter: { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  counterText: { fontSize: 9, fontWeight: fontWeight.bold },
  tabs: { minHeight: 44, flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.gold },
  tabText: { color: colors.muted, fontSize: 10, fontWeight: fontWeight.semibold, textAlign: 'center' },
  tabTextActive: { color: colors.goldDark },
  body: { flex: 1 },
  bodyContent: { paddingBottom: 28 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 },
  loadingText: { marginTop: 10, color: colors.muted, fontSize: 12, textAlign: 'center' },
  errorTitle: { color: colors.primary, fontSize: 16, fontWeight: fontWeight.bold },
  retryButton: { marginTop: 16, height: 42, borderRadius: 12, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  retryText: { color: colors.white, fontSize: 13, fontWeight: fontWeight.bold },
  observationPanel: { backgroundColor: colors.white },
  groupRow: { minHeight: 56, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
  groupCopy: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  groupLabel: { fontSize: 11, letterSpacing: 0.6, fontWeight: fontWeight.bold },
  groupCount: { minWidth: 20, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  groupCountText: { fontSize: 10, fontWeight: fontWeight.bold },
  groupBody: { gap: 12, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#f7f7f7' },
  emptyGroup: { paddingVertical: 24, color: colors.muted, fontSize: 12, textAlign: 'center' },
  findingCard: { borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white, padding: 13, gap: 7 },
  findingCardReview: { borderColor: '#e7b1bf' },
  findingTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  indexPill: { borderRadius: 6, backgroundColor: '#e6f3ff', paddingHorizontal: 8, paddingVertical: 4 },
  indexPillText: { color: '#24588b', fontSize: 10, fontWeight: fontWeight.bold },
  severityPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  severityPillText: { fontSize: 10, fontWeight: fontWeight.bold },
  statusPill: { borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  statusPillText: { fontSize: 9, fontWeight: fontWeight.bold },
  textBlock: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: 10, paddingVertical: 8 },
  textBlockMuted: { borderWidth: 0, backgroundColor: '#f7f7f7' },
  rejectBlock: { backgroundColor: '#fff0f4', borderColor: '#ffd0db' },
  blockLabel: { color: colors.muted, fontSize: 9, letterSpacing: 1.2, fontWeight: fontWeight.bold },
  blockValue: { marginTop: 4, color: colors.body, fontSize: 12, lineHeight: 17 },
  evidenceRow: { flexDirection: 'row', gap: 6 },
  evidenceBox: { flex: 1, height: 96, borderRadius: 7, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.white },
  evidenceHeader: { height: 22, justifyContent: 'center', paddingHorizontal: 8, backgroundColor: colors.primary },
  evidenceTitle: { color: 'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: fontWeight.bold },
  evidenceImage: { flex: 1, width: '100%' },
  evidenceEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: '#f6faff' },
  evidenceEmptyText: { color: colors.placeholder, fontSize: 9 },
  dueRow: { minHeight: 34, borderRadius: 8, backgroundColor: '#f7f7f7', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11 },
  dueLabel: { color: colors.muted, fontSize: 11 },
  dueValue: { color: colors.primary, fontSize: 11, fontWeight: fontWeight.bold },
  primaryAction: { height: 48, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  primaryActionText: { color: colors.white, fontSize: 13, fontWeight: fontWeight.bold },
  reviewActions: { flexDirection: 'row', gap: 8 },
  rejectAction: { height: 44, flex: 1, borderRadius: 12, borderWidth: 2, borderColor: '#c4365a', alignItems: 'center', justifyContent: 'center' },
  rejectActionText: { color: '#570b1d', fontSize: 12, fontWeight: fontWeight.bold },
  approveAction: { height: 44, flex: 1.4, borderRadius: 12, backgroundColor: '#3a9b3a', alignItems: 'center', justifyContent: 'center' },
  approveActionText: { color: colors.white, fontSize: 12, fontWeight: fontWeight.bold },
  waitingReview: { borderRadius: 8, backgroundColor: '#f7f7f7', padding: 10 },
  waitingReviewText: { color: colors.muted, fontSize: 11, textAlign: 'center', fontWeight: fontWeight.semibold },
  dialogOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20 },
  dialog: { width: '100%', maxWidth: 420, borderRadius: 18, backgroundColor: colors.white, padding: 18 },
  dialogTitle: { color: colors.primary, fontSize: 18, fontWeight: fontWeight.bold },
  dialogSubtitle: { marginTop: 5, color: colors.muted, fontSize: 12, lineHeight: 17 },
  dialogInput: { marginTop: 16, minHeight: 110, borderRadius: 12, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: '#f6faff', color: colors.body, fontSize: 13, lineHeight: 18, padding: 12, textAlignVertical: 'top' },
  photoButton: { marginTop: 12, minHeight: 48, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#b4d1ed', backgroundColor: '#f6faff', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  photoButtonReady: { borderStyle: 'solid', borderColor: '#9bd98a', backgroundColor: '#efffea' },
  photoButtonText: { flex: 1, color: '#24588b', fontSize: 12, fontWeight: fontWeight.semibold },
  photoButtonTextReady: { color: '#2a5c16' },
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
  sheetTitle: { marginTop: 15, color: colors.primary, fontSize: 18, fontWeight: fontWeight.bold },
  sheetSubtitle: { marginTop: 4, color: colors.muted, fontSize: 11 },
  responsibleList: { marginTop: 14, maxHeight: 360 },
  responsibleOption: { minHeight: 62, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gold },
  avatarText: { color: colors.primary, fontSize: 12, fontWeight: fontWeight.bold },
  responsibleCopy: { flex: 1 },
  responsibleName: { color: colors.primary, fontSize: 12, fontWeight: fontWeight.bold },
  responsibleRole: { marginTop: 3, color: colors.muted, fontSize: 10 },
  tabContent: { paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  timelineRow: { flexDirection: 'row', gap: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: 12 },
  timelineMarker: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6cc24a' },
  timelineMarkerText: { color: colors.white, fontSize: 10, fontWeight: fontWeight.bold },
  timelineCopy: { flex: 1 },
  timelineTitle: { color: colors.primary, fontSize: 12, fontWeight: fontWeight.bold },
  timelineDate: { marginTop: 2, color: colors.muted, fontSize: 10 },
  timelineDescription: { marginTop: 5, color: colors.body, fontSize: 11, lineHeight: 16 },
  generalSection: { borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: 13 },
  generalTitle: { color: colors.primary, fontSize: 14, fontWeight: fontWeight.bold, marginBottom: 10 },
  generalLabel: { marginTop: 7, color: colors.muted, fontSize: 9, letterSpacing: 0.7, fontWeight: fontWeight.bold, textTransform: 'uppercase' },
  generalValue: { marginTop: 3, color: colors.body, fontSize: 12, lineHeight: 17 },
  generalResponsible: { minHeight: 54, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  reassignButton: { marginTop: 10, height: 42, borderRadius: 9, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.borderMid, backgroundColor: '#f7f7f7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  reassignText: { color: '#24588b', fontSize: 12, fontWeight: fontWeight.semibold },
  resultText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
