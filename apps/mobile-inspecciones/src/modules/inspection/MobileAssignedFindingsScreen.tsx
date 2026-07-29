import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useQueries, useQuery } from '@tanstack/react-query';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import {
  InspectionFindingStatus,
  Role,
  type InspectionDetailFindingGroupKey,
  type InspectionDetailResponse,
  type InspectionManagementTableRowResponse,
} from '@aurelia/contracts';
import { colors, fontWeight } from '../../shared/theme/tokens';
import {
  fetchInspectionDashboardSummary,
  fetchInspectionDetail,
  fetchInspectionManagementKpis,
  type MobileInspectionManagementFilters,
  type MobileInspectionManagementMode,
} from '../../shared/services/inspections.api';
import type { AuthUser } from '../../shared/services/api/auth.api';
import { useMobileSession } from '../auth/mobileSession.store';
import { useMobileNotifications } from '../notifications/useMobileNotifications';
import { useMobileInspectionManagement } from './hooks/useMobileInspectionManagement';
import { MobileClosedInspectionDetailModal } from './MobileClosedInspectionDetailModal';
import { MobileInspectionDetailModal } from './MobileInspectionDetailModal';
import BellIcon from '../../../assets/icons/home-bell.svg';
import FindingIcon from '../../../assets/icons/home-finding.svg';
import LogoMobile from '../../../assets/icons/logo_mobile.svg';

const initialFilters: MobileInspectionManagementFilters = { page: 1, pageSize: 10 };
const findingGroups: InspectionDetailFindingGroupKey[] = ['executed', 'open', 'closed', 'rejected'];

type FindingGroup = InspectionDetailFindingGroupKey;
type Tone = 'danger' | 'warning' | 'success' | 'muted' | 'orange';

const groupConfig: Record<FindingGroup, { singular: string; plural: string; icon: string; tone: Tone }> = {
  executed: { singular: 'Ejecutada', plural: 'Ejecutadas', icon: 'check-circle', tone: 'danger' },
  open: { singular: 'Abierta', plural: 'Abiertas', icon: 'clock', tone: 'warning' },
  closed: { singular: 'Cerrada', plural: 'Cerradas', icon: 'check-circle', tone: 'success' },
  rejected: { singular: 'Rechazada', plural: 'Rechazadas', icon: 'times-circle', tone: 'muted' },
};

const toneConfig: Record<Tone, { background: string; foreground: string; line: string }> = {
  danger: { background: colors.dangerSurf, foreground: colors.dangerTxt, line: '#c4365a' },
  warning: { background: colors.warnSurf, foreground: colors.warnTxt, line: '#e8a820' },
  success: { background: colors.successSurf, foreground: colors.successTxt, line: colors.successTxt },
  muted: { background: '#f1f1f1', foreground: colors.muted, line: '#8a8a8a' },
  orange: { background: colors.ocreSurf, foreground: colors.ocreTxt, line: '#c8a064' },
};

export function isEeccInspectionResponsible(user: Pick<AuthUser, 'email' | 'roles'> | null): boolean {
  if (!user || user.roles.includes(Role.ADMIN)) return false;
  return user.roles.includes(Role.INSPECTION_RESPONSIBLE)
    && !user.email.trim().toLowerCase().endsWith('@goldfields.com');
}

function HeaderGradient() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="assignedHeader" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#012659" />
          <Stop offset="100%" stopColor="#002659" />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#assignedHeader)" />
    </Svg>
  );
}

function FooterGradient() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="assignedFooter" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="2%" stopColor="#002659" />
          <Stop offset="100%" stopColor="#004a3a" />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#assignedFooter)" />
    </Svg>
  );
}

function Metric({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function splitAreaSector(value: string): { area: string; sector: string } {
  const parts = value.split(' · ').map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 1) return { area: value, sector: 'Sin sector' };
  return { area: parts.slice(0, -1).join(' · '), sector: parts.at(-1) ?? 'Sin sector' };
}

function normalizeSeverity(value: string): 'Grave' | 'Moderado' | 'Menor' {
  const normalized = value.toLowerCase();
  if (normalized.includes('crít') || normalized.includes('crit') || normalized.includes('alto') || normalized.includes('grave')) return 'Grave';
  if (normalized.includes('moder') || normalized.includes('medio')) return 'Moderado';
  return 'Menor';
}

function severityTone(value: string): Tone {
  const label = normalizeSeverity(value);
  if (label === 'Grave') return 'danger';
  if (label === 'Moderado') return 'warning';
  return 'success';
}

function statusTone(row: InspectionManagementTableRowResponse): Tone {
  const label = row.urgencyLabel.toLowerCase();
  if (label.includes('cerrada')) return 'success';
  if (label.includes('ejecutada') && row.urgencySeverity === 'medium') return 'orange';
  if (row.urgencySeverity === 'critical' || row.urgencySeverity === 'high') return 'danger';
  if (row.urgencySeverity === 'medium') return 'warning';
  if (row.urgencySeverity === 'low') return 'success';
  return 'muted';
}

function TypeChip({ type }: { type: string }) {
  const checklist = type.toLowerCase().includes('check');
  return (
    <View style={[styles.typeChip, checklist ? styles.checklistChip : styles.findingChip]}>
      {checklist
        ? <FontAwesome5 name="clipboard-check" size={9} color={colors.tealTxt} />
        : <FindingIcon width={11} height={9} />}
      <Text style={[styles.typeChipText, { color: checklist ? colors.tealTxt : colors.blueTxt }]}>
        {checklist ? 'Checklist' : 'Hallazgo'}
      </Text>
    </View>
  );
}

function SeverityPill({ label }: { label: string }) {
  const normalized = normalizeSeverity(label);
  const palette = toneConfig[severityTone(label)];
  return (
    <View style={[styles.severityPill, { backgroundColor: palette.line }]}>
      <Text style={[styles.severityPillText, normalized === 'Menor' && { color: colors.successTxt }]}>{normalized}</Text>
    </View>
  );
}

function fallbackSeverity(row: InspectionManagementTableRowResponse, group: FindingGroup): string[] {
  const urgency = row.urgencyLabel.toLowerCase();
  if (group === 'rejected' && row.rejectedUrgencyLabel) return [row.rejectedUrgencyLabel];
  if (group === 'executed' && urgency.includes('ejecutada')) return [row.urgencyLabel];
  if (group === 'open' && urgency.includes('abierta')) return [row.urgencyLabel];
  return [];
}

function FindingCounterRow({
  group,
  count,
  severities,
}: {
  group: FindingGroup;
  count: number;
  severities: string[];
}) {
  const config = groupConfig[group];
  const palette = toneConfig[config.tone];
  return (
    <View style={styles.counterRow}>
      <View style={styles.counterLeft}>
        <FontAwesome5 name={config.icon} size={10} color={palette.foreground} solid />
        <Text style={[styles.counterText, { color: palette.foreground }]}>
          {count} {count === 1 ? config.singular : config.plural}
        </Text>
      </View>
      {severities.length > 0 ? (
        <View style={styles.severityList}>
          {severities.slice(0, 3).map((severity, index) => (
            <SeverityPill key={`${severity}-${index}`} label={severity} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function AssignedFindingCard({
  row,
  detail,
  onPress,
}: {
  row: InspectionManagementTableRowResponse;
  detail: InspectionDetailResponse | undefined;
  onPress: () => void;
}) {
  const palette = toneConfig[statusTone(row)];
  const { area, sector } = splitAreaSector(row.areaSector);
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.82} onPress={onPress}>
      <View style={[styles.cardLine, { backgroundColor: palette.line }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardId}>{row.inspectionNumber.startsWith('#') ? row.inspectionNumber : `#${row.inspectionNumber}`}</Text>
          <View style={styles.cardChips}>
            <TypeChip type={row.type} />
            <View style={[styles.statusChip, { backgroundColor: palette.background }]}>
              <FontAwesome5
                name={row.urgencyLabel.toLowerCase().includes('ejecutada') ? 'check-circle' : 'clock'}
                size={9}
                color={palette.foreground}
                solid
              />
              <Text style={[styles.statusChipText, { color: palette.foreground }]}>{row.urgencyLabel}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.cardTitle}>{area} · {row.company}</Text>
        <View style={styles.cardMeta}>
          <FontAwesome5 name="map-marker-alt" size={10} color={colors.placeholder} />
          <Text style={styles.cardMetaText}>{sector} · {row.daysOpen} días</Text>
        </View>
        <View style={styles.cardCounters}>
          {findingGroups.map((group) => {
            const count = row.observations[group];
            if (count === 0) return null;
            const severities = detail?.findings[group].map((finding) => finding.severityLabel)
              ?? fallbackSeverity(row, group);
            return <FindingCounterRow key={group} group={group} count={count} severities={severities} />;
          })}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function AssignedHistoryCard({ row, onPress }: { row: InspectionManagementTableRowResponse; onPress: () => void }) {
  const { area, sector } = splitAreaSector(row.areaSector);
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.82} onPress={onPress}>
      <View style={[styles.cardLine, { backgroundColor: colors.successTxt }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardId}>{row.inspectionNumber.startsWith('#') ? row.inspectionNumber : `#${row.inspectionNumber}`}</Text>
          <TypeChip type={row.type} />
        </View>
        <Text style={styles.cardTitle}>{area} · {row.company}</Text>
        <View style={styles.cardMeta}>
          <FontAwesome5 name="map-marker-alt" size={10} color={colors.placeholder} />
          <Text style={styles.cardMetaText}>{sector} · {row.daysOpen} días</Text>
        </View>
        <View style={styles.historyClosedRow}>
          <FontAwesome5 name="check-circle" size={10} color={colors.successTxt} solid />
          <Text style={styles.historyClosedText}>
            {row.observations.closed} {row.observations.closed === 1 ? 'observación cerrada' : 'observaciones cerradas'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyAssignedState() {
  return (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIcon}>
        <FontAwesome5 name="clipboard" size={42} color={colors.placeholder} />
      </View>
      <Text style={styles.emptyTitle}>Sin formularios pendientes</Text>
      <Text style={styles.emptyText}>Cuando se te asigne un hallazgo por ejecutar, será mostrado acá</Text>
    </View>
  );
}

export function MobileAssignedFindingsScreen() {
  const params = useLocalSearchParams<{ inspectionId?: string | string[]; findingId?: string | string[]; group?: string | string[]; mode?: string | string[] }>();
  const deepInspectionId = Array.isArray(params.inspectionId) ? params.inspectionId[0] : params.inspectionId;
  const deepFindingId = Array.isArray(params.findingId) ? params.findingId[0] : params.findingId;
  const deepGroup = Array.isArray(params.group) ? params.group[0] : params.group;
  const deepMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const user = useMobileSession((state) => state.user);
  const [mode, setMode] = useState<MobileInspectionManagementMode>(deepMode === 'history' ? 'history' : 'management');
  const [filters, setFilters] = useState<MobileInspectionManagementFilters>(initialFilters);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(deepInspectionId ?? null);
  const data = useMobileInspectionManagement(mode, filters);
  const assignedKpis = useQuery({
    queryKey: ['mobile-inspecciones', 'management-kpis'],
    queryFn: fetchInspectionManagementKpis,
    staleTime: 30_000,
  });
  const summary = useQuery({
    queryKey: ['mobile-inspecciones', 'assigned-dashboard-summary'],
    queryFn: fetchInspectionDashboardSummary,
    staleTime: 30_000,
  });
  const notifications = useMobileNotifications();
  const unreadNotifications = notifications.data?.filter((notification) => !notification.readAt).length ?? 0;
  const table = data.table.data;
  const rows = table?.rows ?? [];
  const detailQueries = useQueries({
    queries: rows.map((row) => ({
      queryKey: ['mobile-inspecciones', 'inspection-detail', row.inspectionId],
      queryFn: () => fetchInspectionDetail(row.inspectionId),
      enabled: mode === 'management',
      staleTime: 15_000,
    })),
  });
  const detailByInspectionId = useMemo(() => new Map(
    rows.map((row, index) => [row.inspectionId, detailQueries[index]?.data]),
  ), [detailQueries, rows]);
  const loading = data.table.isLoading || assignedKpis.isLoading || summary.isLoading;
  const refreshing = data.table.isRefetching || assignedKpis.isRefetching || summary.isRefetching;
  const closedFindings = summary.data?.findings.byStatus[InspectionFindingStatus.CLOSED] ?? 0;

  async function refresh() {
    await Promise.all([data.table.refetch(), assignedKpis.refetch(), summary.refetch()]);
  }

  function changeMode(nextMode: MobileInspectionManagementMode) {
    setMode(nextMode);
    setFilters(initialFilters);
  }

  function closeDetail() {
    setSelectedInspectionId(null);
    if (deepInspectionId || deepFindingId || deepGroup || deepMode) router.replace('/inspection/dashboard');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <HeaderGradient />
          <View style={styles.brandRow}>
            <LogoMobile width={137} height={45} />
            <TouchableOpacity style={styles.bell} onPress={() => router.push('/inspection/notifications')}>
              <BellIcon width={20} height={16} />
              {unreadNotifications > 0 ? <View style={styles.bellUnreadDot} /> : null}
            </TouchableOpacity>
          </View>
          <Text style={styles.hello}>Hola,</Text>
          <Text style={styles.name}>{user?.fullName ?? 'Usuario AurelIA'}</Text>
          <View style={styles.eeccBadge}>
            <FontAwesome5 name="hard-hat" size={11} color={colors.teal} />
            <Text style={styles.eeccText}>EECC</Text>
          </View>
        </View>

        <View style={styles.metrics}>
          <Metric value={String(assignedKpis.data?.totalInspections ?? '—')} label="Inspecciones asignadas" color={colors.dangerTxt} />
          <View style={styles.divider} />
          <Metric value={String(assignedKpis.data?.openInspections ?? '—')} label="Abiertas" color="#e8a820" />
          <View style={styles.divider} />
          <Metric value={String(closedFindings)} label="Obs. cerradas" color={colors.successTxt} />
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void refresh(); }} tintColor={colors.teal} />}
          showsVerticalScrollIndicator={false}
        >
          <View>
            <Text style={styles.sectionTitle}>{mode === 'management' ? 'Nuevos hallazgos asignados' : 'Historial de hallazgos'}</Text>
            <Text style={styles.sectionSubtitle}>
              {mode === 'management'
                ? 'Revisa y ejecuta los hallazgos que te han sido asignados'
                : 'Consulta las inspecciones y observaciones cerradas'}
            </Text>
          </View>

          {loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={colors.teal} />
              <Text style={styles.stateTitle}>Cargando hallazgos asignados</Text>
            </View>
          ) : null}
          {!loading && data.table.isError ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>No fue posible cargar los hallazgos</Text>
              <Text style={styles.stateText}>Revisa tu conexión e intenta nuevamente.</Text>
              <TouchableOpacity style={styles.retry} onPress={() => { void refresh(); }}>
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {!loading && !data.table.isError && rows.length === 0 ? <EmptyAssignedState /> : null}
          {!loading ? rows.map((row) => mode === 'management'
            ? (
                <AssignedFindingCard
                  key={row.inspectionId}
                  row={row}
                  detail={detailByInspectionId.get(row.inspectionId)}
                  onPress={() => setSelectedInspectionId(row.inspectionId)}
                />
              )
            : <AssignedHistoryCard key={row.inspectionId} row={row} onPress={() => setSelectedInspectionId(row.inspectionId)} />) : null}

          {table && table.totalPages > 1 ? (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageButton, filters.page <= 1 && styles.pageButtonDisabled]}
                disabled={filters.page <= 1}
                onPress={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
              >
                <Text style={styles.pageButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.pageLabel}>Página {table.page} de {table.totalPages}</Text>
              <TouchableOpacity
                style={[styles.pageButton, filters.page >= table.totalPages && styles.pageButtonDisabled]}
                disabled={filters.page >= table.totalPages}
                onPress={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
              >
                <Text style={styles.pageButtonText}>›</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.tabs}>
          <FooterGradient />
          <TouchableOpacity style={[styles.tab, mode === 'management' && styles.tabSelected]} onPress={() => changeMode('management')}>
            {table?.total ? (
              <View style={styles.tabCount}><Text style={styles.tabCountText}>{table.total}</Text></View>
            ) : <View style={styles.tabDot}><View style={styles.tabDotInner} /></View>}
            <Text style={[styles.tabText, mode === 'management' && styles.tabTextSelected]}>Mis hallazgos</Text>
            {mode === 'management' ? <View style={styles.tabLine} /> : null}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, mode === 'history' && styles.tabSelected]} onPress={() => changeMode('history')}>
            <View style={styles.tabDot}><View style={styles.tabDotInner} /></View>
            <Text style={[styles.tabText, mode === 'history' && styles.tabTextSelected]}>Historial</Text>
            {mode === 'history' ? <View style={styles.tabLine} /> : null}
          </TouchableOpacity>
        </View>
      </View>

      {mode === 'history' ? (
        <MobileClosedInspectionDetailModal visible={Boolean(selectedInspectionId)} inspectionId={selectedInspectionId} onClose={closeDetail} />
      ) : (
        <MobileInspectionDetailModal
          visible={Boolean(selectedInspectionId)}
          inspectionId={selectedInspectionId}
          requestedFindingId={deepFindingId}
          requestedGroup={deepGroup}
          onClose={closeDetail}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navyDark },
  screen: { flex: 1, backgroundColor: '#f7f7f7' },
  header: { position: 'relative', overflow: 'hidden', paddingHorizontal: 20, paddingTop: 6, paddingBottom: 20, backgroundColor: colors.navyDark },
  brandRow: { height: 51, flexDirection: 'row', alignItems: 'center' },
  bell: { position: 'relative', marginLeft: 'auto', width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  bellUnreadDot: { position: 'absolute', left: 22, top: 8, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: '#002659', backgroundColor: '#c4365a' },
  hello: { marginTop: 16, color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  name: { marginTop: 2, color: colors.white, fontSize: 22, lineHeight: 26, fontWeight: fontWeight.bold },
  eeccBadge: { marginTop: 10, minWidth: 69, height: 20, alignSelf: 'flex-start', borderRadius: 99, borderWidth: 1, borderColor: colors.teal, backgroundColor: 'rgba(0,179,152,0.2)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 9 },
  eeccText: { color: colors.teal, fontSize: 9, fontWeight: fontWeight.bold, letterSpacing: 2 },
  metrics: { height: 71, flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 14 },
  metric: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  metricValue: { fontSize: 18, lineHeight: 22, fontWeight: fontWeight.bold },
  metricLabel: { marginTop: 2, maxWidth: 75, color: colors.muted, fontSize: 9, lineHeight: 11, textAlign: 'center' },
  divider: { width: 1, marginVertical: 12, backgroundColor: colors.border },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 20, gap: 10 },
  sectionTitle: { color: colors.primary, fontSize: 15, fontWeight: fontWeight.bold },
  sectionSubtitle: { marginTop: 2, color: colors.muted, fontSize: 12, lineHeight: 17 },
  emptyBox: { marginTop: 4, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.borderMid, borderRadius: 16, backgroundColor: colors.white, alignItems: 'center', paddingHorizontal: 22, paddingVertical: 34, gap: 10 },
  emptyIcon: { width: 50, height: 49, opacity: 0.45, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.primary, fontSize: 14, fontWeight: fontWeight.bold, textAlign: 'center' },
  emptyText: { width: 220, color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  card: { borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  cardLine: { height: 3 },
  cardBody: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardId: { color: colors.blueLink, fontSize: 12, fontWeight: fontWeight.bold },
  cardChips: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  typeChip: { minHeight: 18, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2 },
  checklistChip: { backgroundColor: colors.tealSurf },
  findingChip: { backgroundColor: colors.blueSurf },
  typeChipText: { fontSize: 10, fontWeight: fontWeight.bold },
  statusChip: { minHeight: 18, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 1 },
  statusChipText: { fontSize: 9, fontWeight: fontWeight.bold, flexShrink: 1 },
  cardTitle: { marginTop: 7, color: colors.primary, fontSize: 13, lineHeight: 17, fontWeight: fontWeight.bold },
  cardMeta: { marginTop: 3, flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMetaText: { color: colors.muted, fontSize: 11 },
  cardCounters: { marginTop: 10, gap: 5 },
  counterRow: { minHeight: 25, borderRadius: 7, backgroundColor: '#f7f7f7', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingHorizontal: 8, paddingVertical: 5 },
  counterLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  counterText: { fontSize: 11, fontWeight: fontWeight.semibold },
  severityList: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 4 },
  severityPill: { minHeight: 13, borderRadius: 4, justifyContent: 'center', paddingHorizontal: 6 },
  severityPillText: { color: colors.white, fontSize: 9, lineHeight: 11, fontWeight: fontWeight.bold },
  historyClosedRow: { marginTop: 10, minHeight: 25, borderRadius: 7, backgroundColor: colors.successSurf, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 5 },
  historyClosedText: { color: colors.successTxt, fontSize: 11, fontWeight: fontWeight.semibold },
  stateCard: { minHeight: 155, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: 18 },
  stateTitle: { marginTop: 8, color: colors.primary, fontSize: 14, fontWeight: fontWeight.bold, textAlign: 'center' },
  stateText: { marginTop: 5, color: colors.muted, fontSize: 11, textAlign: 'center' },
  retry: { marginTop: 14, height: 38, borderRadius: 10, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  retryText: { color: colors.white, fontSize: 12, fontWeight: fontWeight.bold },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 8 },
  pageButton: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: colors.borderMid, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  pageButtonDisabled: { opacity: 0.35 },
  pageButtonText: { color: colors.primary, fontSize: 20, lineHeight: 22 },
  pageLabel: { color: colors.muted, fontSize: 11, fontWeight: fontWeight.semibold },
  tabs: { height: 84, position: 'relative', backgroundColor: colors.navyDark, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 6, paddingHorizontal: 10, paddingTop: 4, paddingBottom: 2 },
  tabSelected: { backgroundColor: 'rgba(0,179,152,0.09)' },
  tabCount: { minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#c4365a', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabCountText: { color: colors.white, fontSize: 9, fontWeight: fontWeight.bold },
  tabDot: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tabDotInner: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  tabText: { marginTop: 7, color: 'rgba(255,255,255,0.44)', fontSize: 13, fontWeight: fontWeight.regular },
  tabTextSelected: { color: colors.teal, fontWeight: fontWeight.semibold },
  tabLine: { marginTop: 5, width: '88%', height: 2, borderRadius: 2, backgroundColor: colors.teal },
});
