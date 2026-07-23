import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { InspectionManagementTableRowResponse } from '@aurelia/contracts';
import { colors, fontWeight } from '../../shared/theme/tokens';
import type { MobileInspectionManagementFilters, MobileInspectionManagementMode } from '../../shared/services/inspections.api';
import { useMobileSession } from '../auth/mobileSession.store';
import { getManualInspectionDraftById } from './manualInspectionDrafts.storage';
import { useManualInspectionDrafts } from './hooks/useManualInspectionDrafts';
import { useManualInspectionDraft } from './manualInspection.store';
import { useManualInspectionFlowStore } from './manualInspectionFlow.store';
import { useMobileInspectionCapabilities } from './mobileInspectionCapabilities';
import { useMobileInspectionManagement } from './hooks/useMobileInspectionManagement';
import { countMobileInspectionFilters, MobileInspectionFiltersSheet } from './MobileInspectionFiltersSheet';
import { MobileInspectionDetailModal } from './MobileInspectionDetailModal';
import BellIcon from '../../../assets/icons/home-bell.svg';
import FilterIcon from '../../../assets/icons/home-filter.svg';
import PlusIcon from '../../../assets/icons/home-plus.svg';
import ShieldIcon from '../../../assets/icons/home-shield.svg';
import FindingIcon from '../../../assets/icons/home-finding.svg';
import LogoMobile from '../../../assets/icons/logo_mobile.svg';

type Tone = 'red' | 'orange' | 'gold' | 'green' | 'gray';

type Counter = {
  key: 'executed' | 'open' | 'closed' | 'rejected';
  count: number;
  singular: string;
  plural: string;
  tone: Tone;
};

const emptyFilters: MobileInspectionManagementFilters = { page: 1, pageSize: 10 };

const tonePalette: Record<Tone, { background: string; foreground: string; line: string }> = {
  red: { background: '#ffd0db', foreground: '#570b1d', line: '#c4365a' },
  orange: { background: '#ffe1cd', foreground: '#532a0e', line: '#e8a820' },
  gold: { background: '#ffeab8', foreground: '#463100', line: '#e8a820' },
  green: { background: '#e0ffd3', foreground: '#2a5c16', line: '#2a5c16' },
  gray: { background: '#f1f1f1', foreground: '#646464', line: '#8a8a8a' },
};

function HeaderGradient() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
      <Defs><LinearGradient id="managementHeader" x1="0" y1="0" x2="0" y2="1"><Stop offset="0%" stopColor="#012659" /><Stop offset="100%" stopColor="#002659" /></LinearGradient></Defs>
      <Rect width="100%" height="100%" fill="url(#managementHeader)" />
    </Svg>
  );
}

function FooterGradient() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
      <Defs><LinearGradient id="managementFooter" x1="0" y1="0" x2="0" y2="1"><Stop offset="2%" stopColor="#002659" /><Stop offset="100%" stopColor="#004a3a" /></LinearGradient></Defs>
      <Rect width="100%" height="100%" fill="url(#managementFooter)" />
    </Svg>
  );
}

function Metric({ value, label, color }: { value: string; label: string; color: string }) {
  return <View style={styles.metric}><Text style={[styles.metricValue, { color }]}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function normalizeRoleLabel(value: string): string {
  return value.replace(/_/g, ' ').trim().toLowerCase().replace(/(^|\s)\p{L}/gu, (letter) => letter.toUpperCase());
}

function acronym(value: string | null | undefined): string {
  if (!value) return '';
  const words = value.replace(/[^A-Za-z0-9\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return words[0]?.slice(0, 3).toUpperCase() ?? '';
  return words.slice(0, 3).map((word) => word[0]?.toUpperCase()).join('');
}

function profileBadge(roles: string[], companyName?: string | null, areaName?: string | null): string {
  const normalized = roles.map(normalizeRoleLabel).filter(Boolean);
  const primary = normalized.find((role) => role.toLowerCase().includes('inspector')) ?? normalized[0] ?? 'Usuario';
  const admin = normalized.find((role) => role.toLowerCase().includes('admin'));
  const company = acronym(companyName);
  const rawArea = acronym(areaName);
  const area = rawArea === 'MA' ? 'HSE' : rawArea;
  const context = [admin, company && area ? `${company} ${area}` : company || area].filter(Boolean).join(' · ');
  return context ? `${primary} · ${context}` : primary;
}

function statusTone(row: InspectionManagementTableRowResponse): Tone {
  const label = row.urgencyLabel.toLowerCase();
  if (label.includes('cerrada')) return 'green';
  if (row.urgencySeverity === 'critical' || row.urgencySeverity === 'high') return 'red';
  if (row.urgencySeverity === 'medium') return label.includes('ejecutada') ? 'orange' : 'gold';
  if (row.urgencySeverity === 'low') return 'green';
  return 'gray';
}

function formatDate(value: string | null): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function counters(row: InspectionManagementTableRowResponse): Counter[] {
  return [
    { key: 'executed', count: row.observations.executed, singular: 'ejecutada', plural: 'ejecutadas', tone: 'red' },
    { key: 'open', count: row.observations.open, singular: 'abierta', plural: 'abiertas', tone: 'gold' },
    { key: 'closed', count: row.observations.closed, singular: 'cerrada', plural: 'cerradas', tone: 'green' },
    { key: 'rejected', count: row.observations.rejected, singular: 'rechazada', plural: 'rechazadas', tone: 'gray' },
  ].filter((counter) => counter.count > 0) as Counter[];
}

function TypeChip({ value }: { value: string }) {
  const checklist = value.toLowerCase().includes('check');
  return (
    <View style={[styles.typeChip, checklist ? styles.typeChipChecklist : styles.typeChipFinding]}>
      {checklist ? <FontAwesome5 name="clipboard-check" size={9} color="#006153" /> : <FindingIcon width={12} height={9} />}
      <Text style={[styles.typeChipText, { color: checklist ? '#006153' : '#24588b' }]}>{checklist ? 'Checklist' : 'Hallazgo'}</Text>
    </View>
  );
}

function CounterRow({ counter }: { counter: Counter }) {
  const palette = tonePalette[counter.tone];
  const icon = counter.key === 'rejected' ? 'times-circle' : counter.key === 'open' ? 'clock' : 'check-circle';
  return (
    <View style={styles.counterRow}>
      <View style={styles.counterLeft}>
        <FontAwesome5 name={icon} size={10} color={palette.foreground} solid />
        <Text style={[styles.counterLabel, { color: palette.foreground }]}>{counter.count} {counter.count === 1 ? counter.singular : counter.plural}</Text>
      </View>
    </View>
  );
}

function InspectionCard({ row, onPress }: { row: InspectionManagementTableRowResponse; onPress: () => void }) {
  const tone = statusTone(row);
  const palette = tonePalette[tone];
  const rows = counters(row);
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.82} onPress={onPress}>
      <View style={[styles.cardLine, { backgroundColor: palette.line }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardId}>{row.inspectionNumber.startsWith('#') ? row.inspectionNumber : `#${row.inspectionNumber}`}</Text>
          <View style={styles.cardChips}><TypeChip value={row.type} /><View style={[styles.statusChip, { backgroundColor: palette.background }]}><FontAwesome5 name={row.urgencyLabel.toLowerCase().includes('ejecutada') ? 'check-circle' : 'clock'} size={9} color={palette.foreground} solid /><Text style={[styles.statusChipText, { color: palette.foreground }]}>{row.urgencyLabel}</Text></View></View>
        </View>
        <Text style={styles.cardTitle}>{row.areaSector} · {row.company}</Text>
        <View style={styles.cardMeta}><FontAwesome5 name="map-marker-alt" size={10} color={colors.placeholder} /><Text style={styles.cardMetaText}>{formatDate(row.date)} · {row.daysOpen} días</Text></View>
        <View style={styles.cardCounters}>
          {rows.length > 0 ? rows.map((counter) => <CounterRow key={counter.key} counter={counter} />) : <View style={styles.counterRow}><Text style={styles.counterEmpty}>Sin observaciones</Text></View>}
        </View>
        <View style={styles.cardProgress}><View style={styles.cardProgressRail}><View style={[styles.cardProgressFill, { width: `${Math.max(0, Math.min(100, row.closureRate))}%` }]} /></View><Text style={styles.cardProgressText}>{Math.round(row.closureRate)}%</Text></View>
      </View>
    </TouchableOpacity>
  );
}

function DraftBox({ title, detail, progress, currentStep, onPress }: { title: string; detail: string; progress: number; currentStep: number; onPress: () => void }) {
  const safeProgress = Math.max(5, Math.min(progress, 100));
  return (
    <View style={styles.drafts}>
      <View style={styles.draftHeader}><View><Text style={styles.draftTitle}>Formularios inconclusos</Text><Text style={styles.draftSub}>Continúa donde lo dejaste · guardados localmente</Text></View><View style={styles.redDot} /></View>
      <TouchableOpacity style={styles.draftBody} onPress={onPress}>
        <View style={styles.draftIcon}><FontAwesome5 name="file-signature" size={18} color="#463100" /></View>
        <View style={styles.draftCopy}><Text style={styles.draftName}>{title}</Text><Text style={styles.draftMeta}>{detail}</Text><View style={styles.progressWrap}><View style={styles.progressRail}><View style={[styles.progressFill, { width: `${safeProgress}%` }]} /></View><Text style={styles.progressText}>{safeProgress}%</Text></View></View>
        <Text style={styles.chevron}>›</Text><View style={styles.step}><Text style={styles.stepText}>Paso {currentStep}/5</Text></View>
      </TouchableOpacity>
    </View>
  );
}

function draftTitle(record: import('./manualInspectionDrafts.storage').PersistedManualInspectionDraft): string {
  return `${record.inspectionType === 'environmental' ? 'Hallazgo' : 'Checklist'} · ${record.draft.areaName ?? 'Sin área'}`;
}

function relativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const now = new Date();
  const elapsed = now.getTime() - date.getTime();
  const time = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' }).format(date);
  if (elapsed >= 0 && elapsed < 24 * 60 * 60 * 1000 && now.getDate() === date.getDate()) return `Hoy ${time}`;
  if (elapsed >= 0 && elapsed < 48 * 60 * 60 * 1000) return `Ayer ${time}`;
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short' }).format(date);
}

function draftDetail(record: import('./manualInspectionDrafts.storage').PersistedManualInspectionDraft): string {
  return [record.draft.sectorName, record.draft.findingCompanyName, relativeTime(record.updatedAt)].filter(Boolean).join(' · ');
}

function activeFilterLabels(filters: MobileInspectionManagementFilters): string[] {
  return [
    filters.id ? `N° ${filters.id}` : '',
    filters.type ?? '',
    filters.urgency ?? '',
    filters.obs ? `Obs. ${filters.obs}` : '',
    filters.area ?? '',
    filters.company ?? '',
  ].filter(Boolean);
}

export function MobileInspectionManagementScreen() {
  const params = useLocalSearchParams<{ inspectionId?: string | string[]; findingId?: string | string[]; group?: string | string[] }>();
  const deepInspectionId = Array.isArray(params.inspectionId) ? params.inspectionId[0] : params.inspectionId;
  const deepFindingId = Array.isArray(params.findingId) ? params.findingId[0] : params.findingId;
  const deepGroup = Array.isArray(params.group) ? params.group[0] : params.group;
  const user = useMobileSession((state) => state.user);
  const capabilities = useMobileInspectionCapabilities();
  const [mode, setMode] = useState<MobileInspectionManagementMode>('management');
  const [filters, setFilters] = useState<MobileInspectionManagementFilters>(emptyFilters);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(deepInspectionId ?? null);
  const hydrateDraft = useManualInspectionDraft((state) => state.hydrate);
  const hydrateFlow = useManualInspectionFlowStore((state) => state.hydrateFlow);
  const draftsQuery = useManualInspectionDrafts();
  const data = useMobileInspectionManagement(mode, filters);
  const table = data.table.data;
  const rows = table?.rows ?? [];
  const drafts = draftsQuery.data ?? [];
  const activeLabels = activeFilterLabels(filters);
  const filterCount = countMobileInspectionFilters(filters);
  const loading = data.table.isLoading || (mode === 'management' ? data.managementKpis.isLoading : data.historyKpis.isLoading);
  const refreshing = data.table.isRefetching || data.managementKpis.isRefetching || data.historyKpis.isRefetching;
  const badge = profileBadge(user?.roles ?? [], user?.companyName, user?.areaName);

  useEffect(() => {
    if (deepInspectionId) setSelectedInspectionId(deepInspectionId);
  }, [deepInspectionId]);

  const metrics = useMemo(() => {
    if (mode === 'history') {
      const kpis = data.historyKpis.data;
      return [
        { value: String(kpis?.closedInspections ?? '—'), label: `Cerradas ${kpis?.year ?? new Date().getFullYear()}`, color: colors.primary },
        { value: String(kpis?.averageClosureDays ?? '—'), label: 'Prom. cierre', color: '#463100' },
        { value: kpis ? `${Math.round(kpis.closedFindingsRate)}%` : '—', label: 'Obs. cerradas', color: '#2a5c16' },
        { value: String(kpis?.contractorCompanies ?? '—'), label: 'Empresas', color: '#24588b' },
      ];
    }
    const kpis = data.managementKpis.data;
    return [
      { value: String(kpis?.totalInspections ?? '—'), label: `Total ${kpis?.year ?? new Date().getFullYear()}`, color: colors.primary },
      { value: String(kpis?.openInspections ?? '—'), label: 'Abiertas', color: '#463100' },
      { value: String(kpis?.pendingApprovalInspections ?? '—'), label: 'Pend. aprobación', color: '#bd3b5b' },
      { value: kpis ? `${Math.round(kpis.closedFindingsRate)}%` : '—', label: 'Obs. cerradas', color: '#2a5c16' },
    ];
  }, [data.historyKpis.data, data.managementKpis.data, mode]);

  async function refresh() {
    await Promise.all([data.table.refetch(), mode === 'management' ? data.managementKpis.refetch() : data.historyKpis.refetch(), draftsQuery.refetch()]);
  }

  function changeMode(nextMode: MobileInspectionManagementMode) {
    setMode(nextMode);
    setFilters(emptyFilters);
  }

  async function resumeDraft(id: string) {
    if (!capabilities.create) {
      Alert.alert('Sin permiso', 'Tu perfil no tiene permiso para continuar inspecciones.');
      return;
    }
    const persisted = await getManualInspectionDraftById(id);
    if (!persisted) return;
    hydrateDraft(persisted.draft);
    if ((persisted.draftMode ?? 'manual') === 'chat') {
      router.push('/inspection/chat');
      return;
    }
    hydrateFlow(persisted.currentStep);
    if (persisted.currentStep >= 4) router.push('/inspection/manual/summary');
    else if (persisted.currentStep === 3) router.push('/inspection/manual/observations');
    else if (persisted.currentStep === 2) router.push('/inspection/manual/type');
    else router.push('/inspection/manual/identification');
  }

  function newInspection() {
    if (!capabilities.create) {
      Alert.alert('Sin permiso', 'Tu perfil no tiene permiso para crear inspecciones.');
      return;
    }
    router.push('/inspection/start');
  }

  function closeDetail() {
    setSelectedInspectionId(null);
    if (deepInspectionId || deepFindingId || deepGroup) router.replace('/inspection/dashboard');
  }

  if (!capabilities.read) {
    return <SafeAreaView style={styles.safe}><View style={styles.denied}><FontAwesome5 name="lock" size={28} color={colors.gold} /><Text style={styles.deniedTitle}>Acceso restringido</Text><Text style={styles.deniedText}>Tu perfil no cuenta con inspections:read para consultar Gestión de Inspecciones.</Text></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <HeaderGradient />
          <View style={styles.brandRow}><LogoMobile width={137} height={45} /><TouchableOpacity style={styles.bell}><BellIcon width={20} height={16} /></TouchableOpacity></View>
          <Text style={styles.hello}>Hola,</Text><Text style={styles.name}>{user?.fullName ?? 'Usuario AurelIA'}</Text>
          <View style={styles.role}><ShieldIcon width={13} height={10} /><Text style={styles.roleText}>{badge}</Text></View>
        </View>

        <View style={styles.metrics}>{metrics.map((metric, index) => <React.Fragment key={metric.label}><Metric {...metric} />{index < metrics.length - 1 ? <View style={styles.divider} /> : null}</React.Fragment>)}</View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.filter} onPress={() => setFiltersVisible(true)}><FilterIcon width={15} height={12} /><Text style={styles.filterText}>Filtrar</Text>{filterCount > 0 ? <View style={styles.filterCount}><Text style={styles.filterCountText}>{filterCount}</Text></View> : null}</TouchableOpacity>
          {mode === 'management' && capabilities.create ? <TouchableOpacity style={styles.newButton} onPress={newInspection}><PlusIcon width={19} height={15} /><Text style={styles.newText}> Nueva inspección</Text></TouchableOpacity> : null}
          {activeLabels.length > 0 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFilters}>{activeLabels.map((label) => <View key={label} style={styles.activeFilter}><Text style={styles.activeFilterText}>{label}</Text></View>)}</ScrollView> : null}
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void refresh(); }} tintColor={colors.gold} />} showsVerticalScrollIndicator={false}>
          {mode === 'management' ? drafts.map((draft) => <DraftBox key={draft.draftId} title={draftTitle(draft)} detail={draftDetail(draft)} progress={draft.progressPercentage} currentStep={draft.currentStep} onPress={() => { void resumeDraft(draft.draftId); }} />) : null}
          {loading ? <View style={styles.stateCard}><ActivityIndicator color={colors.gold} /><Text style={styles.stateTitle}>Cargando {mode === 'history' ? 'historial' : 'gestión'}</Text></View> : null}
          {!loading && data.table.isError ? <View style={styles.stateCard}><Text style={styles.stateTitle}>No fue posible cargar las inspecciones</Text><Text style={styles.stateText}>Revisa tu conexión o permisos.</Text><TouchableOpacity style={styles.retry} onPress={() => { void refresh(); }}><Text style={styles.retryText}>Reintentar</Text></TouchableOpacity></View> : null}
          {!loading && !data.table.isError && rows.length === 0 ? <View style={styles.stateCard}><Text style={styles.stateTitle}>Sin inspecciones para mostrar</Text><Text style={styles.stateText}>Ajusta los filtros o sincroniza los datos.</Text></View> : null}
          {!loading ? rows.map((row) => <InspectionCard key={row.inspectionId} row={row} onPress={() => setSelectedInspectionId(row.inspectionId)} />) : null}
          {table && table.totalPages > 1 ? <View style={styles.pagination}><TouchableOpacity style={[styles.pageButton, filters.page <= 1 && styles.pageButtonDisabled]} disabled={filters.page <= 1} onPress={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}><Text style={styles.pageButtonText}>‹</Text></TouchableOpacity><Text style={styles.pageLabel}>Página {table.page} de {table.totalPages}</Text><TouchableOpacity style={[styles.pageButton, filters.page >= table.totalPages && styles.pageButtonDisabled]} disabled={filters.page >= table.totalPages} onPress={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}><Text style={styles.pageButtonText}>›</Text></TouchableOpacity></View> : null}
        </ScrollView>

        <View style={styles.tabs}>
          <FooterGradient />
          <TouchableOpacity style={[styles.tab, mode === 'management' && styles.tabSelected]} onPress={() => changeMode('management')}><View style={mode === 'management' ? styles.tabCount : styles.tabDot}>{mode === 'management' ? <Text style={styles.tabCountText}>{data.managementKpis.data?.openInspections ?? 0}</Text> : null}</View><Text style={[styles.tabText, mode === 'management' && styles.tabTextSelected]}>Gestión de inspecciones</Text>{mode === 'management' ? <View style={styles.tabLine} /> : null}</TouchableOpacity>
          <TouchableOpacity style={[styles.tab, mode === 'history' && styles.tabSelected]} onPress={() => changeMode('history')}><View style={mode === 'history' ? styles.tabCount : styles.tabDot}>{mode === 'history' ? <Text style={styles.tabCountText}>{data.historyKpis.data?.closedInspections ?? 0}</Text> : null}</View><Text style={[styles.tabText, mode === 'history' && styles.tabTextSelected]}>Historial</Text>{mode === 'history' ? <View style={styles.tabLine} /> : null}</TouchableOpacity>
        </View>
      </View>

      <MobileInspectionFiltersSheet visible={filtersVisible} mode={mode} value={filters} options={table?.filterOptions ?? { inspectors: [], areas: [], companies: [], types: [], urgencies: [] }} onClose={() => setFiltersVisible(false)} onApply={(next) => { setFilters(next); setFiltersVisible(false); }} />
      <MobileInspectionDetailModal visible={Boolean(selectedInspectionId)} inspectionId={selectedInspectionId} requestedFindingId={deepFindingId} requestedGroup={deepGroup} forceReadOnly={mode === 'history'} onClose={closeDetail} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navyDark },
  screen: { flex: 1, backgroundColor: '#f7f7f7' },
  header: { position: 'relative', overflow: 'hidden', backgroundColor: colors.navyDark, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 20 },
  brandRow: { height: 51, flexDirection: 'row', alignItems: 'center' },
  bell: { marginLeft: 'auto', width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  hello: { marginTop: 16, color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  name: { marginTop: 2, color: colors.white, fontSize: 22, lineHeight: 26, fontWeight: fontWeight.bold },
  role: { marginTop: 10, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(200,160,100,0.4)', backgroundColor: 'rgba(200,160,100,0.2)', paddingHorizontal: 11, paddingVertical: 4 },
  roleText: { color: colors.gold, fontSize: 11, fontWeight: fontWeight.semibold },
  metrics: { height: 70, flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  metric: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  metricValue: { fontSize: 18, fontWeight: fontWeight.bold },
  metricLabel: { marginTop: 2, color: colors.muted, fontSize: 8.5, textAlign: 'center' },
  divider: { width: 1, marginVertical: 14, backgroundColor: colors.border },
  actions: { backgroundColor: colors.white, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 11, gap: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  filter: { height: 36, borderRadius: 8, borderWidth: 1.5, borderColor: colors.borderMid, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  filterText: { color: colors.body, fontSize: 12, fontWeight: fontWeight.semibold },
  filterCount: { minWidth: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#c4365a', paddingHorizontal: 4 },
  filterCountText: { color: colors.white, fontSize: 9, fontWeight: fontWeight.bold },
  newButton: { height: 52, borderRadius: 14, backgroundColor: colors.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: colors.gold, shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  newText: { color: colors.white, fontSize: 15, fontWeight: fontWeight.bold },
  activeFilters: { gap: 6, paddingRight: 12 },
  activeFilter: { borderRadius: 5, borderWidth: 1, borderColor: '#b4d1ed', backgroundColor: '#e6f3ff', paddingHorizontal: 8, paddingVertical: 4 },
  activeFilterText: { color: '#0d3862', fontSize: 9, fontWeight: fontWeight.semibold },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  card: { borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  cardLine: { height: 3 },
  cardBody: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 13 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardId: { color: '#24588b', fontSize: 12, fontWeight: fontWeight.bold },
  cardChips: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
  typeChip: { minHeight: 18, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2 },
  typeChipChecklist: { backgroundColor: '#c5fff6' },
  typeChipFinding: { backgroundColor: '#e6f3ff' },
  typeChipText: { fontSize: 10, fontWeight: fontWeight.bold },
  statusChip: { minHeight: 18, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 1 },
  statusChipText: { fontSize: 9, fontWeight: fontWeight.bold, flexShrink: 1 },
  cardTitle: { marginTop: 7, color: colors.primary, fontSize: 13, lineHeight: 17, fontWeight: fontWeight.bold },
  cardMeta: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMetaText: { color: colors.muted, fontSize: 10.5 },
  cardCounters: { marginTop: 10, gap: 5 },
  counterRow: { minHeight: 25, borderRadius: 7, backgroundColor: '#f7f7f7', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 5 },
  counterLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  counterLabel: { fontSize: 11, fontWeight: fontWeight.bold },
  counterEmpty: { color: colors.muted, fontSize: 10.5 },
  cardProgress: { marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 7 },
  cardProgressRail: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  cardProgressFill: { height: 4, borderRadius: 2, backgroundColor: colors.gold },
  cardProgressText: { minWidth: 28, color: colors.muted, fontSize: 9, fontWeight: fontWeight.bold, textAlign: 'right' },
  drafts: { backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  draftHeader: { padding: 14, flexDirection: 'row', justifyContent: 'space-between' },
  draftTitle: { color: colors.primary, fontSize: 15, fontWeight: fontWeight.bold },
  draftSub: { marginTop: 2, color: colors.muted, fontSize: 11 },
  redDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#c4365a' },
  draftBody: { borderTopWidth: 1.5, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', minHeight: 88, paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  draftIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#ffeab8', alignItems: 'center', justifyContent: 'center' },
  draftCopy: { flex: 1 },
  draftName: { color: colors.primary, fontSize: 13, fontWeight: fontWeight.bold },
  draftMeta: { marginTop: 2, color: colors.muted, fontSize: 11 },
  progressWrap: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressRail: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.gold },
  progressText: { color: colors.muted, fontSize: 10, fontWeight: fontWeight.bold },
  chevron: { color: colors.muted, fontSize: 24 },
  step: { position: 'absolute', top: 10, right: 14, borderRadius: 6, borderWidth: 1, borderColor: '#e8c86a', backgroundColor: '#ffeab8', paddingHorizontal: 7, paddingVertical: 2 },
  stepText: { color: '#463100', fontSize: 10, fontWeight: fontWeight.bold },
  stateCard: { minHeight: 150, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: 18 },
  stateTitle: { marginTop: 8, color: colors.primary, fontSize: 15, fontWeight: fontWeight.bold, textAlign: 'center' },
  stateText: { marginTop: 5, color: colors.muted, fontSize: 11, textAlign: 'center' },
  retry: { marginTop: 14, height: 38, borderRadius: 10, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  retryText: { color: colors.white, fontSize: 12, fontWeight: fontWeight.bold },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 8 },
  pageButton: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: colors.borderMid, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  pageButtonDisabled: { opacity: 0.35 },
  pageButtonText: { color: colors.primary, fontSize: 20, lineHeight: 22 },
  pageLabel: { color: colors.muted, fontSize: 11, fontWeight: fontWeight.semibold },
  tabs: { height: 84, position: 'relative', backgroundColor: colors.navyDark, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8, paddingTop: 4, paddingBottom: 2 },
  tabSelected: { backgroundColor: 'rgba(0,179,152,0.1)' },
  tabCount: { minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#c4365a', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabCountText: { color: colors.white, fontSize: 9, fontWeight: fontWeight.bold },
  tabDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.45)' },
  tabText: { marginTop: 7, color: 'rgba(255,255,255,0.58)', fontSize: 13, fontWeight: fontWeight.semibold },
  tabTextSelected: { color: colors.teal },
  tabLine: { marginTop: 5, width: '88%', height: 2, borderRadius: 2, backgroundColor: colors.teal },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, backgroundColor: colors.surface },
  deniedTitle: { marginTop: 16, color: colors.primary, fontSize: 20, fontWeight: fontWeight.bold },
  deniedText: { marginTop: 8, color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
