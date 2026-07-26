import React, { useMemo, type ReactNode } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type {
  InspectionNotificationEvent,
  InspectionNotificationMetadata,
  InspectionNotificationTone,
  NotificationResponse,
} from '@aurelia/contracts';
import { colors, fontWeight } from '../../shared/theme/tokens';
import {
  dismissMobileInspectionNotificationThread,
  dismissMobileNotification,
  markMobileNotificationRead,
} from '../../shared/services/notifications.api';
import {
  MobileNotificationApprovedIcon,
  MobileNotificationAssignedIcon,
  MobileNotificationChecklistIcon,
  MobileNotificationClockIcon,
  MobileNotificationCloseIcon,
  MobileNotificationExecutedIcon,
  MobileNotificationEyeIcon,
  MobileNotificationInspectionClosedIcon,
  MobileNotificationListIcon,
  MobileNotificationRejectedIcon,
  MobileNotificationResentIcon,
  MobileNotificationSearchIcon,
} from './MobileNotificationIcons';
import { mobileNotificationsQueryKey, useMobileNotifications } from './useMobileNotifications';

type NotificationToneConfig = {
  border: string;
  iconBackground: string;
  tag: string;
};

const toneConfig: Record<InspectionNotificationTone, NotificationToneConfig> = {
  blue: { border: '#4A90C4', iconBackground: '#E6F3FF', tag: '#24588B' },
  teal: { border: '#00B398', iconBackground: '#C5FFF6', tag: '#006153' },
  green: { border: '#6CC24A', iconBackground: '#E0FFD3', tag: '#2A5C16' },
  red: { border: '#C4365A', iconBackground: '#FFD0DB', tag: '#570B1D' },
  yellow: { border: '#E8A820', iconBackground: '#FFEAB8', tag: '#463100' },
};

function metadataOf(notification: NotificationResponse): InspectionNotificationMetadata {
  return (notification.metadata ?? {}) as InspectionNotificationMetadata;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function readSeverityLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
}

function resolveEvent(notification: NotificationResponse): InspectionNotificationEvent {
  const event = metadataOf(notification).event;
  if (
    event === 'inspection.assigned'
    || event === 'inspection.finding.executed'
    || event === 'inspection.finding.closed'
    || event === 'inspection.finding.rejected'
    || event === 'inspection.finding.resubmitted'
    || event === 'inspection.closed'
  ) return event;
  if (notification.category === 'inspection.finding.executed') return 'inspection.finding.executed';
  if (notification.category === 'inspection.finding.closed') return 'inspection.finding.closed';
  if (notification.category === 'inspection.finding.rejected') return 'inspection.finding.rejected';
  if (notification.category === 'inspection.finding.resubmitted') return 'inspection.finding.resubmitted';
  if (notification.category === 'inspection.closed') return 'inspection.closed';
  return 'inspection.assigned';
}

function resolveTone(notification: NotificationResponse): InspectionNotificationTone {
  const tone = metadataOf(notification).tone;
  if (tone === 'blue' || tone === 'teal' || tone === 'green' || tone === 'red' || tone === 'yellow') return tone;
  const event = resolveEvent(notification);
  if (event === 'inspection.finding.executed') return 'teal';
  if (event === 'inspection.finding.rejected') return 'red';
  if (event === 'inspection.finding.resubmitted') return 'yellow';
  if (event === 'inspection.finding.closed' || event === 'inspection.closed') return 'green';
  return 'blue';
}

function defaultTag(event: InspectionNotificationEvent): string {
  if (event === 'inspection.finding.executed') return 'Observación ejecutada';
  if (event === 'inspection.finding.closed') return 'Cierre aprobado';
  if (event === 'inspection.finding.rejected') return 'Evidencia rechazada';
  if (event === 'inspection.finding.resubmitted') return 'Evidencia reenviada';
  if (event === 'inspection.closed') return 'Inspección cerrada';
  return 'Inspección asignada';
}

function groupForEvent(event: InspectionNotificationEvent): string {
  if (event === 'inspection.finding.executed' || event === 'inspection.finding.resubmitted') return 'executed';
  if (event === 'inspection.finding.closed' || event === 'inspection.closed') return 'closed';
  if (event === 'inspection.finding.rejected') return 'rejected';
  return 'open';
}

function notificationTimestamp(notification: NotificationResponse): number {
  const value = readString(metadataOf(notification).occurredAt, notification.createdAt);
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function buildNotificationTarget(notification: NotificationResponse): string | null {
  const metadata = metadataOf(notification);
  const inspectionId = readString(metadata.inspectionId);
  if (!inspectionId) return null;
  const event = resolveEvent(notification);
  const params = new URLSearchParams({
    inspectionId,
    group: groupForEvent(event),
    notificationId: notification.id,
  });
  const findingId = readString(metadata.findingId);
  if (findingId) params.set('findingId', findingId);
  if (event === 'inspection.closed') params.set('mode', 'history');
  return `/inspection/dashboard?${params.toString()}`;
}

function updateNotificationsCache(
  queryClient: QueryClient,
  unreadOnly: boolean,
  update: (notifications: NotificationResponse[]) => NotificationResponse[],
): void {
  queryClient.setQueryData<NotificationResponse[]>(mobileNotificationsQueryKey(unreadOnly), (current) => (
    current ? update(current) : current
  ));
}

function markReadInCache(queryClient: QueryClient, notificationId: string, readAt = new Date().toISOString()): void {
  updateNotificationsCache(queryClient, false, (notifications) => notifications.map((notification) => (
    notification.id === notificationId ? { ...notification, readAt: notification.readAt ?? readAt } : notification
  )));
  updateNotificationsCache(queryClient, true, (notifications) => notifications.filter((notification) => notification.id !== notificationId));
}

function dismissInCache(queryClient: QueryClient, notificationId: string): void {
  const filter = (notifications: NotificationResponse[]) => notifications.filter((notification) => notification.id !== notificationId);
  updateNotificationsCache(queryClient, false, filter);
  updateNotificationsCache(queryClient, true, filter);
}

function dismissInspectionThreadInCache(queryClient: QueryClient, notification: NotificationResponse): void {
  const inspectionId = readString(metadataOf(notification).inspectionId);
  if (!inspectionId) return;
  const cutoff = notificationTimestamp(notification);
  const readAt = new Date().toISOString();
  const updateThread = (notifications: NotificationResponse[]) => notifications.flatMap((item) => {
    if (item.id === notification.id) return [{ ...item, readAt: item.readAt ?? readAt }];
    if (readString(metadataOf(item).inspectionId) !== inspectionId) return [item];
    return notificationTimestamp(item) > cutoff ? [item] : [];
  });
  updateNotificationsCache(queryClient, false, updateThread);
  updateNotificationsCache(queryClient, true, (notifications) => updateThread(notifications).filter((item) => !item.readAt));
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function relativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 60) return `Hace ${Math.max(1, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} horas`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  return `${days} días`;
}

function severityColors(value: string): { background: string; color: string } {
  const normalized = value.toLowerCase();
  if (normalized.includes('grave') || normalized.includes('crítico') || normalized.includes('critico')) {
    return { background: '#FFD0DB', color: '#570B1D' };
  }
  if (normalized.includes('menor') || normalized.includes('bajo') || normalized.includes('100')) {
    return { background: '#E0FFD3', color: '#2A5C16' };
  }
  return { background: '#FFE1CD', color: '#532A0E' };
}

function eventIcon(event: InspectionNotificationEvent): ReactNode {
  if (event === 'inspection.finding.executed') return <MobileNotificationExecutedIcon />;
  if (event === 'inspection.finding.closed') return <MobileNotificationApprovedIcon />;
  if (event === 'inspection.finding.rejected') return <MobileNotificationRejectedIcon />;
  if (event === 'inspection.finding.resubmitted') return <MobileNotificationResentIcon />;
  if (event === 'inspection.closed') return <MobileNotificationInspectionClosedIcon />;
  return <MobileNotificationAssignedIcon />;
}

function DetailBox({ notification }: { notification: NotificationResponse }) {
  const metadata = metadataOf(notification);
  const event = resolveEvent(notification);
  const label = readString(
    metadata.inspectionLabel,
    readString(metadata.inspectionNumber, notification.entityId ? `Insp. ${notification.entityId.slice(0, 8)}` : 'Inspección'),
  );
  const detailLine = readString(metadata.detailLine, notification.body ?? '');
  const severityLabels = readSeverityLabels(metadata.severityLabels);
  const progressLabel = readString(metadata.progressLabel);
  const isChecklist = label.toLowerCase().includes('checklist') || event === 'inspection.closed';
  return (
    <View style={styles.detailBox}>
      <View style={styles.detailTitleRow}>
        {isChecklist ? <MobileNotificationChecklistIcon /> : <MobileNotificationSearchIcon />}
        <Text style={styles.detailTitle}>{label}</Text>
      </View>
      {detailLine ? (
        <View style={styles.detailLineRow}>
          {event === 'inspection.assigned' || event === 'inspection.closed' ? <MobileNotificationListIcon /> : <MobileNotificationEyeIcon />}
          <View style={styles.detailLineCopy}>
            <Text style={styles.detailLine}>{detailLine}</Text>
            {severityLabels.length > 0 || progressLabel ? (
              <View style={styles.pillRow}>
                {severityLabels.map((labelItem) => {
                  const palette = severityColors(labelItem);
                  return <View key={labelItem} style={[styles.pill, { backgroundColor: palette.background }]}><Text style={[styles.pillText, { color: palette.color }]}>{labelItem}</Text></View>;
                })}
                {progressLabel ? <View style={[styles.pill, styles.progressPill]}><Text style={[styles.pillText, styles.progressPillText]}>{progressLabel}</Text></View> : null}
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function NotificationTime({ value }: { value: string }) {
  const relative = relativeTime(value);
  const formatted = formatDateTime(value);
  return (
    <View style={styles.timeRow}>
      <MobileNotificationClockIcon />
      <Text style={styles.timeText}>{relative ? `${relative} · ${formatted}` : formatted}</Text>
    </View>
  );
}

function NotificationCard({
  notification,
  pending,
  onOpen,
  onDismiss,
}: {
  notification: NotificationResponse;
  pending: boolean;
  onOpen: (notification: NotificationResponse) => void;
  onDismiss: (notification: NotificationResponse) => void;
}) {
  const metadata = metadataOf(notification);
  const event = resolveEvent(notification);
  const tone = toneConfig[resolveTone(notification)];
  const unread = !notification.readAt;
  const tag = readString(metadata.tag, defaultTag(event));
  const headline = readString(metadata.headline, notification.title);
  const footerLine = readString(metadata.footerLine, notification.body ?? '');
  const reason = readString(metadata.reason);
  const occurredAt = readString(metadata.occurredAt, notification.createdAt);

  function dismiss(eventValue: GestureResponderEvent) {
    eventValue.stopPropagation();
    if (!pending) onDismiss(notification);
  }

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={pending}
      onPress={() => onOpen(notification)}
      style={[
        styles.card,
        { borderColor: tone.border, backgroundColor: unread ? '#FEFCF7' : '#FFFFFF' },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Abrir detalle de inspección de esta notificación"
    >
      <View style={[styles.eventIcon, { backgroundColor: tone.iconBackground }]}>{eventIcon(event)}</View>
      <View style={styles.cardCopy}>
        <Text style={[styles.tag, { color: tone.tag }]}>{tag.toUpperCase()}</Text>
        <Text style={styles.headline}>{headline}</Text>
        <DetailBox notification={notification} />
        {footerLine ? <Text style={styles.footerLine}>{footerLine}</Text> : null}
        {reason ? <View style={styles.reasonBox}><Text style={styles.reasonText}>{reason}</Text></View> : null}
        <NotificationTime value={occurredAt} />
      </View>
      {unread ? (
        <View style={styles.unreadDot} />
      ) : (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={dismiss}
          disabled={pending}
          accessibilityRole="button"
          accessibilityLabel="Eliminar notificación"
        >
          <MobileNotificationCloseIcon />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <View style={styles.emptyState}><Text style={styles.emptyText}>{children}</Text></View>;
}

function FooterGradient() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="notificationsFooter" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="2.24%" stopColor="#002659" />
          <Stop offset="100%" stopColor="#004A3A" />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#notificationsFooter)" />
    </Svg>
  );
}

export function MobileNotificationsScreen() {
  const notificationsQuery = useMobileNotifications();
  const queryClient = useQueryClient();
  const markReadMutation = useMutation({ mutationFn: markMobileNotificationRead });
  const dismissMutation = useMutation({ mutationFn: dismissMobileNotification });
  const dismissThreadMutation = useMutation({ mutationFn: dismissMobileInspectionNotificationThread });
  const notifications = notificationsQuery.data ?? [];
  const sortedNotifications = useMemo(
    () => [...notifications].sort((left, right) => notificationTimestamp(right) - notificationTimestamp(left)),
    [notifications],
  );
  const unreadCount = useMemo(
    () => sortedNotifications.filter((notification) => !notification.readAt).length,
    [sortedNotifications],
  );
  const pending = markReadMutation.isPending || dismissMutation.isPending || dismissThreadMutation.isPending;

  async function openNotification(notification: NotificationResponse) {
    const target = buildNotificationTarget(notification);
    if (!target || pending) return;
    const event = resolveEvent(notification);
    if (event === 'inspection.closed') dismissInspectionThreadInCache(queryClient, notification);
    else if (!notification.readAt) markReadInCache(queryClient, notification.id);
    try {
      if (event === 'inspection.closed') await dismissThreadMutation.mutateAsync(notification.id);
      else if (!notification.readAt) await markReadMutation.mutateAsync(notification.id);
    } finally {
      void queryClient.invalidateQueries({ queryKey: ['mobile-inspecciones', 'notifications'] });
      router.replace(target as never);
    }
  }

  async function deleteNotification(notification: NotificationResponse) {
    if (!notification.readAt || pending) return;
    dismissInCache(queryClient, notification.id);
    try {
      await dismissMutation.mutateAsync(notification.id);
    } finally {
      void queryClient.invalidateQueries({ queryKey: ['mobile-inspecciones', 'notifications'] });
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Volver">
            <Feather name="arrow-left" size={23} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Notificaciones</Text>
            <Text style={styles.headerSubtitle}>{unreadCount} sin leer</Text>
          </View>
        </View>

        <View style={styles.singleTab}>
          <View style={styles.singleTabActive}>
            <Text style={styles.singleTabLabel}>{unreadCount > 0 ? 'Sin leer' : 'Todas'}</Text>
            {unreadCount > 0 ? <View style={styles.singleTabBadge}><Text style={styles.singleTabBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View> : null}
          </View>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={notificationsQuery.isRefetching} onRefresh={() => { void notificationsQuery.refetch(); }} tintColor={colors.gold} />}
        >
          {notificationsQuery.isLoading ? <View style={styles.loading}><ActivityIndicator color={colors.gold} /><Text style={styles.loadingText}>Cargando notificaciones...</Text></View> : null}
          {notificationsQuery.isError ? <EmptyState>No fue posible cargar las notificaciones.</EmptyState> : null}
          {!notificationsQuery.isLoading && !notificationsQuery.isError && sortedNotifications.length === 0 ? <EmptyState>No tienes notificaciones.</EmptyState> : null}
          {!notificationsQuery.isLoading && !notificationsQuery.isError ? sortedNotifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} pending={pending} onOpen={(item) => { void openNotification(item); }} onDismiss={(item) => { void deleteNotification(item); }} />
          )) : null}
        </ScrollView>

        <View style={styles.bottomTabs}>
          <FooterGradient />
          <TouchableOpacity style={styles.bottomTab} onPress={() => router.replace('/inspection/dashboard')}>
            <View style={styles.bottomBadge}><Text style={styles.bottomBadgeText}>{unreadCount}</Text></View>
            <Text style={styles.bottomTabText}>Gestión de inspecciones</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomTab} onPress={() => router.replace('/inspection/dashboard?mode=history' as never)}>
            <View style={styles.bottomDot} />
            <Text style={styles.bottomTabText}>Historial</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#002659' },
  screen: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { height: 56, backgroundColor: '#002659', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  backButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, paddingLeft: 4 },
  headerTitle: { color: colors.white, fontSize: 14, lineHeight: 17, fontWeight: fontWeight.semibold },
  headerSubtitle: { marginTop: 1, color: 'rgba(255,255,255,0.55)', fontSize: 11, lineHeight: 14 },
  singleTab: { height: 35, backgroundColor: colors.white, borderBottomWidth: 2, borderBottomColor: colors.border },
  singleTabActive: { flex: 1, borderBottomWidth: 2, borderBottomColor: colors.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  singleTabLabel: { color: '#8E6E3E', fontSize: 12, fontWeight: fontWeight.semibold },
  singleTabBadge: { minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#BD3B5B', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  singleTabBadgeText: { color: colors.white, fontSize: 9, lineHeight: 11, fontWeight: fontWeight.bold },
  list: { flex: 1, backgroundColor: '#F7F7F7' },
  listContent: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 18, gap: 8 },
  loading: { minHeight: 180, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', gap: 9 },
  loadingText: { color: colors.muted, fontSize: 12, fontWeight: fontWeight.semibold },
  emptyState: { minHeight: 180, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18, fontWeight: fontWeight.semibold, textAlign: 'center' },
  card: { width: '100%', borderWidth: 1, borderLeftWidth: 3, borderRadius: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingLeft: 15, paddingRight: 13, paddingVertical: 13 },
  eventIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardCopy: { flex: 1, minWidth: 0 },
  tag: { fontSize: 9, lineHeight: 11, letterSpacing: 0.54, fontWeight: fontWeight.bold },
  headline: { marginTop: 3, color: colors.primary, fontSize: 12, lineHeight: 15.6, fontWeight: fontWeight.bold },
  detailBox: { marginTop: 4, width: '100%', borderRadius: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: '#F7F7F7', paddingHorizontal: 9, paddingVertical: 6, gap: 2 },
  detailTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailTitle: { flex: 1, color: '#24588B', fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  detailLineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  detailLineCopy: { flex: 1, minWidth: 0 },
  detailLine: { color: colors.muted, fontSize: 10, lineHeight: 12 },
  pillRow: { marginTop: 4, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  pill: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 },
  pillText: { fontSize: 9, lineHeight: 11, fontWeight: fontWeight.bold },
  progressPill: { backgroundColor: '#E0FFD3' },
  progressPillText: { color: '#2A5C16' },
  footerLine: { marginTop: 5, color: colors.muted, fontSize: 11, lineHeight: 15.4 },
  reasonBox: { marginTop: 5, borderRadius: 5, backgroundColor: '#FFD0DB', paddingHorizontal: 7, paddingVertical: 5 },
  reasonText: { color: '#570B1D', fontSize: 11, lineHeight: 15.4, fontStyle: 'italic' },
  timeRow: { height: 16, paddingTop: 4, flexDirection: 'row', alignItems: 'center', gap: 3 },
  timeText: { flex: 1, color: '#ACACAC', fontSize: 10, lineHeight: 12 },
  unreadDot: { marginTop: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#BD3B5B', flexShrink: 0 },
  dismissButton: { marginTop: -3, width: 24, height: 24, borderRadius: 5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bottomTabs: { position: 'relative', height: 96, flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, overflow: 'hidden' },
  bottomTab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 6 },
  bottomBadge: { minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#C4365A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  bottomBadgeText: { color: colors.white, fontSize: 9, fontWeight: fontWeight.bold },
  bottomDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 6 },
  bottomTabText: { color: 'rgba(255,255,255,0.44)', fontSize: 13, textAlign: 'center' },
});
