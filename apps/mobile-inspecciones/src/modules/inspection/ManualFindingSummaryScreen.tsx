import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import type { UserResponse } from '@aurelia/contracts';
import { colors, fontWeight } from '../../shared/theme/tokens';
import { OfflineBanner } from '../../shared/components/form/ManualFormUi';
import { ManualFlowFooter, ManualFlowHeader } from '../../shared/components/form/ManualFlowScaffold';
import { ManualFormStepper } from './ManualSelectionUi';
import { fetchResponsibleUsersLocalFirst } from '../../shared/services/api/inspection-responsibles.api';
import { useMobileSession } from '../auth/mobileSession.store';
import { useManualConnectivityStatus } from './useManualConnectivityStatus';
import { useManualInspectionDraft, type ManualFindingObservationDraft } from './manualInspection.store';
import { useManualInspectionFlowStore } from './manualInspectionFlow.store';
import { usePersistManualInspectionDraft } from './hooks/usePersistManualInspectionDraft';
import { useSaveManualFindingInspectionOffline } from './hooks/useSaveManualFindingInspectionOffline';
import { markManualInspectionDraftCompleted } from './manualInspectionDrafts.storage';

function trimLocationLabel(value: string): string {
  return value.replace(/ ± .*/, '').trim();
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? 'N'}${parts[1]?.[0] ?? 'A'}`.toUpperCase();
}

function severityStyle(label: string | null | undefined) {
  const value = (label ?? '').toLowerCase();
  if (value.includes('grave') || value.includes('crít')) return { box: styles.badgeCritical, text: styles.badgeCriticalText };
  if (value.includes('alto')) return { box: styles.badgeHigh, text: styles.badgeHighText };
  if (value.includes('moderado') || value.includes('medio')) return { box: styles.badgeMedium, text: styles.badgeMediumText };
  return { box: styles.badgeLow, text: styles.badgeLowText };
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return <View style={styles.card}><View style={styles.cardHeader}><FontAwesome5 name={icon} size={10} color={colors.muted} /><Text style={styles.cardHeaderText}>{title}</Text></View>{children}</View>;
}

function SummaryRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={[styles.rowValue, mono && styles.rowValueMono]} numberOfLines={2}>{value}</Text></View>;
}

function ObservationRow({ observation, index }: { observation: ManualFindingObservationDraft; index: number }) {
  const label = observation.severityLabel ?? 'Sin criticidad';
  const badge = severityStyle(label);
  return <View style={styles.observationRow}><View style={styles.observationBadges}><View style={styles.obsBadge}><Text style={styles.obsBadgeText}>Obs. {index + 1}</Text></View><View style={[styles.severityBadge, badge.box]}><Text style={[styles.severityBadgeText, badge.text]}>{label}</Text></View></View><Text style={styles.observationText}>{observation.detectedCondition || 'Sin descripción'}</Text><View style={styles.slaRow}><Text style={styles.rowLabel}>SLA calculado</Text><Text style={styles.slaValue}>{observation.severityClosureTimeLabel ?? 'xx días hábiles'}</Text></View></View>;
}

function ResponsiblesCard({ companyName, users, selectedIds, currentUserId }: { companyName: string | null; users: UserResponse[]; selectedIds: string[]; currentUserId: string | null }) {
  const selected = selectedIds.map((id) => users.find((user) => user.id === id)).filter(Boolean) as UserResponse[];
  return <SectionCard title="Responsables" icon="user-tie"><SummaryRow label="EECC" value={companyName ?? '-'} />{selected.map((user, index) => <View key={user.id} style={styles.personRow}><View style={[styles.avatar, index === 0 ? styles.avatarGold : styles.avatarBlue]}><Text style={[styles.avatarText, index === 0 ? styles.avatarGoldText : styles.avatarBlueText]}>{initials(user.fullName)}</Text></View><View style={styles.personCopy}><Text style={styles.personName}>{user.fullName}</Text><Text style={styles.personRole}>{user.position || user.roles?.[0]?.name || 'Sin perfil'}</Text></View>{currentUserId && user.id === currentUserId ? <View style={styles.youBadge}><Text style={styles.youBadgeText}>Tú</Text></View> : null}</View>)}</SectionCard>;
}

function OfflineNotice() {
  return <View style={styles.offlineNotice}><FontAwesome5 name="info-circle" size={18} color={colors.white} /><View style={styles.offlineCopy}><Text style={styles.offlineTitle}>Guardado offline</Text><Text style={styles.offlineDescription}>Este proceso cuenta con guardado localmente. En caso que no cuente con señal, el formulario será enviado una vez esta sea recuperada.</Text></View></View>;
}

export function ManualFindingSummaryScreen() {
  usePersistManualInspectionDraft();
  const { online, hasSession } = useManualConnectivityStatus();
  const draft = useManualInspectionDraft();
  const currentUserId = useMobileSession((state) => state.user?.id ?? null);
  const setLastSavedResult = useManualInspectionDraft((state) => state.setLastSavedResult);
  const goToObservations = useManualInspectionFlowStore((state) => state.goToObservations);
  const goToSummary = useManualInspectionFlowStore((state) => state.goToSummary);
  const [users, setUsers] = React.useState<UserResponse[]>([]);
  const observations = draft.findingObservations.filter((item) => item.saved);
  const saveMutation = useSaveManualFindingInspectionOffline();

  React.useEffect(() => { goToSummary(); }, [goToSummary]);

  React.useEffect(() => {
    let mounted = true;
    if (!draft.findingCompanyId) return () => { mounted = false; };
    fetchResponsibleUsersLocalFirst(draft.findingCompanyId).then((items) => { if (mounted) setUsers(items); }).catch(() => { if (mounted) setUsers([]); });
    return () => { mounted = false; };
  }, [draft.findingCompanyId]);

  function back() { goToObservations(); router.replace('/inspection/manual/observations'); }
  function save() {
    if (observations.length === 0) {
      Alert.alert('Observación requerida', 'Debes registrar al menos una observación antes de guardar.');
      return;
    }
    if (!draft.findingCompanyId) {
      Alert.alert('Empresa requerida', 'Selecciona la empresa responsable antes de guardar.');
      return;
    }
    if (draft.findingResponsibleIds.length === 0) {
      Alert.alert('Responsables requeridos', 'Selecciona al menos un responsable antes de guardar.');
      return;
    }

    saveMutation.mutate(
      { draft, trySyncNow: online && hasSession },
      {
        onSuccess: (result) => {
          if (draft.draftId) void markManualInspectionDraftCompleted(draft.draftId);
          setLastSavedResult(result);
          router.replace('/inspection/manual/saved');
        },
        onError: (error) => {
          Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Ocurrió un error al guardar la inspección.');
        },
      },
    );
  }

  return <SafeAreaProvider><SafeAreaView style={styles.safe} edges={['top', 'bottom']}><View style={styles.screen}><ManualFlowHeader title="Observaciones" subtitle="Paso 4 de 5" badge="GF HSE" onBack={back} /><OfflineBanner online={online} hasSession={hasSession} /><ManualFormStepper activeStep={4} steps={['Datos', 'Tipo', 'Obs.', 'Resumen']} /><ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}><View style={styles.copyBlock}><Text style={styles.title}>Resumen</Text><Text style={styles.subtitle}>Revisa antes de guardar · se sincronizará al recuperar red</Text></View><SectionCard title="Quién realizó la inspección" icon="user-tie"><SummaryRow label="Nombre" value={draft.inspectorName} /><SummaryRow label="Empresa" value={draft.inspectorCompanyName} /></SectionCard><SectionCard title="Donde y cuándo" icon="map-marked-alt"><SummaryRow label="Área · Sector" value={`${draft.areaName ?? '-'} · ${draft.sectorName ?? '-'}`} /><SummaryRow label="Fecha" value={draft.inspectionDate} /><SummaryRow label="Tipo" value="Hallazgo" /><SummaryRow label="Ubicación UTM" value={trimLocationLabel(draft.locationLabel)} mono /></SectionCard><SectionCard title={`Observaciones (${observations.length})`} icon="tasks">{observations.map((observation, index) => <ObservationRow key={observation.id} observation={observation} index={index} />)}</SectionCard><ResponsiblesCard companyName={draft.findingCompanyName} users={users} selectedIds={draft.findingResponsibleIds} currentUserId={currentUserId} /><OfflineNotice /></ScrollView><ManualFlowFooter secondaryLabel="Atrás" secondaryIcon="arrow-left" onSecondary={back} onPrimary={save} primaryDisabled={saveMutation.isPending} primaryLabel={saveMutation.isPending ? 'Guardando...' : 'Guardar inspección'} primaryVariant="success" primaryIcon="check" /></View></SafeAreaView></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navyDark },
  screen: { flex: 1, backgroundColor: '#F7F7F7' },
  content: { flex: 1 },
  contentInner: { gap: 12, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24 },
  copyBlock: { gap: 4 },
  title: { fontSize: 18, lineHeight: 21.6, fontWeight: fontWeight.bold, color: colors.primary },
  subtitle: { fontSize: 12, lineHeight: 16.8, color: colors.muted },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden', shadowColor: '#000000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  cardHeader: { minHeight: 29, backgroundColor: '#F7F7F7', borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12 },
  cardHeaderText: { fontSize: 10, lineHeight: 13, fontWeight: fontWeight.bold, color: colors.muted, letterSpacing: 0.5, textTransform: 'uppercase' },
  row: { minHeight: 34, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 9, gap: 12 },
  rowLabel: { fontSize: 12, lineHeight: 14.5, fontWeight: fontWeight.medium, color: colors.muted },
  rowValue: { flex: 1, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold, color: colors.primary, textAlign: 'right' },
  rowValueMono: { fontFamily: 'monospace', fontSize: 11 },
  observationRow: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 12, paddingTop: 9, paddingBottom: 10, gap: 8 },
  observationBadges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  obsBadge: { height: 19, borderRadius: 6, backgroundColor: colors.blueSurf, justifyContent: 'center', paddingHorizontal: 8 },
  obsBadgeText: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.blueLink },
  severityBadge: { height: 20, borderRadius: 8, justifyContent: 'center', paddingHorizontal: 8 },
  severityBadgeText: { fontSize: 10, fontWeight: fontWeight.bold },
  badgeCritical: { backgroundColor: colors.dangerSurf },
  badgeCriticalText: { color: colors.dangerTxt },
  badgeHigh: { backgroundColor: colors.ocreSurf },
  badgeHighText: { color: colors.ocreTxt },
  badgeMedium: { backgroundColor: colors.warnSurf },
  badgeMediumText: { color: colors.warnTxt },
  badgeLow: { backgroundColor: colors.successSurf },
  badgeLowText: { color: colors.successTxt },
  observationText: { fontSize: 12, lineHeight: 16.8, color: colors.primary },
  slaRow: { borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10 },
  slaValue: { fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold, color: colors.primary },
  personRow: { borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarGold: { backgroundColor: colors.gold },
  avatarBlue: { backgroundColor: colors.blueLink },
  avatarText: { fontSize: 12, fontWeight: fontWeight.bold },
  avatarGoldText: { color: colors.navy },
  avatarBlueText: { color: colors.white },
  personCopy: { flex: 1 },
  personName: { fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold, color: colors.primary },
  personRole: { fontSize: 11, lineHeight: 14, color: colors.muted },
  youBadge: { height: 16, borderRadius: 5, backgroundColor: colors.tealSurf, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  youBadgeText: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.teal },
  offlineNotice: { borderRadius: 12, backgroundColor: '#4A90C4', flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  offlineCopy: { flex: 1 },
  offlineTitle: { fontSize: 13, lineHeight: 17, fontWeight: fontWeight.bold, color: colors.white },
  offlineDescription: { marginTop: 2, fontSize: 11, lineHeight: 15.4, color: 'rgba(255,255,255,0.88)' },
});
