import { useMemo, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { InspectionNotificationEvent, InspectionNotificationMetadata, InspectionNotificationTone, NotificationResponse } from '@aurelia/contracts';
import { useNotifications } from '../hooks/useNotifications';
import { dismissInspectionNotificationThread, dismissNotification, markNotificationRead } from '../services/notifications.service';
import {
  NotificationApprovedIcon,
  NotificationAssignedIcon,
  NotificationChecklistIcon,
  NotificationClockIcon,
  NotificationCloseIcon,
  NotificationExecutedIcon,
  NotificationEyeIcon,
  NotificationInspectionClosedIcon,
  NotificationListIcon,
  NotificationRejectedIcon,
  NotificationResentIcon,
  NotificationSearchIcon,
} from './AppNotificationIcons';

type NotificationToneConfig = {
  border: string;
  iconBg: string;
  tag: string;
  cardBg: string;
  severityBg: string;
  severityText: string;
};

const toneConfig: Record<InspectionNotificationTone, NotificationToneConfig> = {
  blue: { border: '#4a90c4', iconBg: '#e6f3ff', tag: '#24588b', cardBg: '#fefcf7', severityBg: '#e0ffd3', severityText: '#2a5c16' },
  teal: { border: '#00b398', iconBg: '#c5fff6', tag: '#006153', cardBg: '#fefcf7', severityBg: '#ffe1cd', severityText: '#532a0e' },
  green: { border: '#6cc24a', iconBg: '#e0ffd3', tag: '#2a5c16', cardBg: '#ffffff', severityBg: '#ffe1cd', severityText: '#532a0e' },
  red: { border: '#c4365a', iconBg: '#ffd0db', tag: '#570b1d', cardBg: '#ffffff', severityBg: '#ffe1cd', severityText: '#532a0e' },
  yellow: { border: '#e8a820', iconBg: '#ffeab8', tag: '#463100', cardBg: '#ffffff', severityBg: '#ffe1cd', severityText: '#532a0e' },
};

function metadataOf(notification: NotificationResponse): InspectionNotificationMetadata {
  return (notification.metadata ?? {}) as InspectionNotificationMetadata;
}

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function readSeverityLabels(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim());
}

function resolveEvent(notification: NotificationResponse): InspectionNotificationEvent {
  const metadata = metadataOf(notification);
  const event = metadata.event;
  if (event === 'inspection.assigned' || event === 'inspection.finding.executed' || event === 'inspection.finding.closed' || event === 'inspection.finding.rejected' || event === 'inspection.finding.resubmitted' || event === 'inspection.closed') return event;
  if (notification.category === 'inspection.finding.executed') return 'inspection.finding.executed';
  if (notification.category === 'inspection.finding.closed') return 'inspection.finding.closed';
  if (notification.category === 'inspection.finding.rejected') return 'inspection.finding.rejected';
  if (notification.category === 'inspection.finding.resubmitted') return 'inspection.finding.resubmitted';
  if (notification.category === 'inspection.closed') return 'inspection.closed';
  return 'inspection.assigned';
}

function resolveTone(notification: NotificationResponse): InspectionNotificationTone {
  const metadata = metadataOf(notification);
  const tone = metadata.tone;
  if (tone === 'blue' || tone === 'teal' || tone === 'green' || tone === 'red' || tone === 'yellow') return tone;
  const event = resolveEvent(notification);
  if (event === 'inspection.finding.executed') return 'teal';
  if (event === 'inspection.finding.rejected') return 'red';
  if (event === 'inspection.finding.resubmitted') return 'yellow';
  if (event === 'inspection.finding.closed' || event === 'inspection.closed') return 'green';
  return 'blue';
}

function eventIcon(event: InspectionNotificationEvent) {
  if (event === 'inspection.finding.executed') return <NotificationExecutedIcon />;
  if (event === 'inspection.finding.closed') return <NotificationApprovedIcon />;
  if (event === 'inspection.finding.rejected') return <NotificationRejectedIcon />;
  if (event === 'inspection.finding.resubmitted') return <NotificationResentIcon />;
  if (event === 'inspection.closed') return <NotificationInspectionClosedIcon />;
  return <NotificationAssignedIcon />;
}

function defaultTag(event: InspectionNotificationEvent) {
  if (event === 'inspection.finding.executed') return 'Observación ejecutada';
  if (event === 'inspection.finding.closed') return 'Cierre aprobado';
  if (event === 'inspection.finding.rejected') return 'Evidencia rechazada';
  if (event === 'inspection.finding.resubmitted') return 'Evidencia reenviada';
  if (event === 'inspection.closed') return 'Inspección cerrada';
  return 'Inspección asignada';
}

function groupForEvent(event: InspectionNotificationEvent) {
  if (event === 'inspection.finding.executed' || event === 'inspection.finding.resubmitted') return 'executed';
  if (event === 'inspection.finding.closed' || event === 'inspection.closed') return 'closed';
  if (event === 'inspection.finding.rejected') return 'rejected';
  return 'open';
}

function notificationTimestamp(notification: NotificationResponse) {
  const metadata = metadataOf(notification);
  const value = readString(metadata.occurredAt, notification.createdAt);
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function buildNotificationTarget(notification: NotificationResponse) {
  const metadata = metadataOf(notification);
  const inspectionId = readString(metadata.inspectionId);
  if (!inspectionId) return null;
  const event = resolveEvent(notification);
  const params = new URLSearchParams({ notification: '1', inspectionId, group: groupForEvent(event), notificationId: notification.id });
  const findingId = readString(metadata.findingId);
  const inspectionNumber = readString(metadata.inspectionNumber);
  if (findingId) params.set('findingId', findingId);
  if (inspectionNumber) params.set('inspectionNumber', inspectionNumber);
  return `${event === 'inspection.closed' ? '/inspections/history' : '/inspections'}?${params.toString()}`;
}

function updateNotificationsCache(queryClient: QueryClient, key: readonly unknown[], update: (notifications: NotificationResponse[]) => NotificationResponse[]) {
  queryClient.setQueryData<NotificationResponse[]>(key, (current) => current ? update(current) : current);
}

function markNotificationAsReadInCache(queryClient: QueryClient, notificationId: string, readAt = new Date().toISOString()) {
  updateNotificationsCache(queryClient, ['notifications', false], (notifications) => notifications.map((notification) => notification.id === notificationId ? { ...notification, readAt: notification.readAt ?? readAt } : notification));
  updateNotificationsCache(queryClient, ['notifications', true], (notifications) => notifications.filter((notification) => notification.id !== notificationId));
}

function dismissNotificationInCache(queryClient: QueryClient, notificationId: string) {
  const filterNotification = (notifications: NotificationResponse[]) => notifications.filter((notification) => notification.id !== notificationId);
  updateNotificationsCache(queryClient, ['notifications', false], filterNotification);
  updateNotificationsCache(queryClient, ['notifications', true], filterNotification);
}

function dismissInspectionThreadInCache(queryClient: QueryClient, notification: NotificationResponse) {
  const metadata = metadataOf(notification);
  const inspectionId = readString(metadata.inspectionId);
  const cutoff = notificationTimestamp(notification);
  const readAt = new Date().toISOString();
  if (!inspectionId) return;
  const updateThread = (notifications: NotificationResponse[]) => notifications.flatMap((item) => {
    if (item.id === notification.id) return [{ ...item, readAt: item.readAt ?? readAt }];
    const itemMetadata = metadataOf(item);
    if (readString(itemMetadata.inspectionId) !== inspectionId) return [item];
    return notificationTimestamp(item) > cutoff ? [item] : [];
  });
  updateNotificationsCache(queryClient, ['notifications', false], updateThread);
  updateNotificationsCache(queryClient, ['notifications', true], (notifications) => updateThread(notifications).filter((item) => !item.readAt));
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function relativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 60) return `Hace ${Math.max(1, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} horas`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  return `${days} días`;
}

function NotificationTime({ value }: { value: string }) {
  const relative = relativeTime(value);
  const formatted = formatDateTime(value);
  return <div className="flex h-[16px] w-full items-center gap-[3px] pt-[4px]"><NotificationClockIcon /><p className="whitespace-nowrap font-['Inter:Regular',sans-serif] text-[10px] font-normal leading-none text-[#acacac]">{relative ? `${relative} · ${formatted}` : formatted}</p></div>;
}

function SeverityPill({ children, bg, color }: { children: string; bg: string; color: string }) {
  return <span className="inline-flex items-center rounded-[5px] px-[6px] py-px font-['Inter:Bold',sans-serif] text-[9px] font-bold leading-none" style={{ backgroundColor: bg, color }}>{children}</span>;
}

function DetailBox({ notification, tone }: { notification: NotificationResponse; tone: NotificationToneConfig }) {
  const metadata = metadataOf(notification);
  const event = resolveEvent(notification);
  const label = readString(metadata.inspectionLabel, readString(metadata.inspectionNumber, notification.entityId ? `Insp. ${notification.entityId.slice(0, 8)}` : 'Inspección'));
  const detailLine = readString(metadata.detailLine, notification.body ?? '');
  const severityLabels = readSeverityLabels(metadata.severityLabels);
  const progressLabel = readString(metadata.progressLabel);
  const isChecklist = label.toLowerCase().includes('checklist') || event === 'inspection.closed';
  return (
    <div className="mt-[4px] flex w-full flex-col items-start gap-[2px] rounded-[6px] border border-[#e3e3e3] bg-[#f7f7f7] px-[9px] py-[6px]">
      <div className="flex w-full items-center gap-[4px]">
        {isChecklist ? <NotificationChecklistIcon /> : <NotificationSearchIcon />}
        <p className="min-w-0 flex-1 font-['Inter:Bold',sans-serif] text-[10px] font-bold leading-[12px] text-[#24588b]">{label}</p>
      </div>
      {detailLine ? (
        <div className="flex w-full items-start gap-[4px]">
          {event === 'inspection.assigned' || event === 'inspection.closed' ? <NotificationListIcon /> : <NotificationEyeIcon />}
          <div className="min-w-0 flex-1">
            <p className="font-['Inter:Regular',sans-serif] text-[10px] font-normal leading-[12px] text-[#646464]">{detailLine}</p>
            <div className="flex flex-wrap gap-[4px] pt-[4px]">
              {severityLabels.map((item) => <SeverityPill key={item} bg={severityColor(item).bg} color={severityColor(item).color}>{item}</SeverityPill>)}
              {progressLabel ? <SeverityPill bg="#e0ffd3" color="#2a5c16">{progressLabel}</SeverityPill> : null}
            </div>
          </div>
        </div>
      ) : null}
      {!detailLine && severityLabels.length > 0 ? <div className="flex flex-wrap gap-[4px] pt-[2px]">{severityLabels.map((item) => <SeverityPill key={item} bg={tone.severityBg} color={tone.severityText}>{item}</SeverityPill>)}</div> : null}
    </div>
  );
}

function severityColor(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes('grave') || normalized.includes('crítico') || normalized.includes('critico')) return { bg: '#ffd0db', color: '#570b1d' };
  if (normalized.includes('menor') || normalized.includes('bajo') || normalized.includes('100')) return { bg: '#e0ffd3', color: '#2a5c16' };
  return { bg: '#ffe1cd', color: '#532a0e' };
}

function NotificationCard({ notification, pending, onNotificationClick, onDismiss }: { notification: NotificationResponse; pending: boolean; onNotificationClick: (notification: NotificationResponse) => void; onDismiss: (notification: NotificationResponse) => void }) {
  const metadata = metadataOf(notification);
  const event = resolveEvent(notification);
  const tone = toneConfig[resolveTone(notification)];
  const tag = readString(metadata.tag, defaultTag(event));
  const headline = readString(metadata.headline, notification.title);
  const footerLine = readString(metadata.footerLine, notification.body ?? '');
  const reason = readString(metadata.reason);
  const occurredAt = readString(metadata.occurredAt, notification.createdAt);
  const unread = !notification.readAt;

  function handleClick() {
    if (!pending) onNotificationClick(notification);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (pending) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onNotificationClick(notification);
  }

  function handleDismiss(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (!pending) onDismiss(notification);
  }

  return (
    <article
      aria-label="Abrir detalle de inspección de esta notificación"
      className="relative w-full cursor-pointer rounded-[10px] border border-l-[3px]"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      style={{ borderColor: tone.border, backgroundColor: tone.cardBg }}
      tabIndex={0}
    >
      <div className="flex w-full items-start gap-[10px] py-[13px] pl-[15px] pr-[13px]">
        <div className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px]" style={{ backgroundColor: tone.iconBg }}>{eventIcon(event)}</div>
        <div className="min-w-0 flex-1">
          <p className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase leading-none tracking-[0.54px]" style={{ color: tone.tag }}>{tag}</p>
          <p className="w-full pt-[3px] font-['Inter:Bold',sans-serif] text-[12px] font-bold leading-[15.6px] text-[#131313]">{headline}</p>
          <DetailBox notification={notification} tone={tone} />
          {footerLine ? <p className="w-full pt-[5px] font-['Inter:Regular',sans-serif] text-[11px] font-normal leading-[15.4px] text-[#646464]">{footerLine}</p> : null}
          {reason ? <div className="mt-[5px] rounded-[5px] bg-[#ffd0db] px-[7px] py-[5px]"><p className="font-['Inter:Italic',sans-serif] text-[11px] italic leading-[15.4px] text-[#570b1d]">{reason}</p></div> : null}
          <NotificationTime value={occurredAt} />
        </div>
        {unread ? <div className="mt-[4px] size-[8px] shrink-0 rounded-[4px] bg-[#BD3B5B]" /> : <button type="button" className="mt-[-2px] flex size-[20px] shrink-0 items-center justify-center rounded-[4px]" onClick={handleDismiss} aria-label="Eliminar notificación" disabled={pending}><NotificationCloseIcon className="size-[14px]" tone="#646464" /></button>}
      </div>
    </article>
  );
}

function EmptyPanel({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[180px] w-full items-center justify-center rounded-[10px] border border-[#e3e3e3] bg-white px-[20px] text-center font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold leading-[18px] text-[#646464]">{children}</div>;
}

export function AppNotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const notificationsQuery = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const dismissThreadMutation = useMutation({
    mutationFn: dismissInspectionNotificationThread,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
  const dismissNotificationMutation = useMutation({
    mutationFn: dismissNotification,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (notification) => {
      markNotificationAsReadInCache(queryClient, notification.id, notification.readAt ?? undefined);
    },
  });
  const notifications = notificationsQuery.data ?? [];
  const sortedNotifications = useMemo(() => [...notifications].sort((left, right) => notificationTimestamp(right) - notificationTimestamp(left)), [notifications]);
  const unreadNotifications = useMemo(() => sortedNotifications.filter((notification) => !notification.readAt), [sortedNotifications]);
  const notificationActionPending = dismissThreadMutation.isPending || dismissNotificationMutation.isPending || markReadMutation.isPending;

  async function handleNotificationClick(notification: NotificationResponse) {
    const target = buildNotificationTarget(notification);
    if (!target) return;
    const event = resolveEvent(notification);
    if (event === 'inspection.closed') dismissInspectionThreadInCache(queryClient, notification);
    else if (!notification.readAt) markNotificationAsReadInCache(queryClient, notification.id);
    try {
      if (event === 'inspection.closed') await dismissThreadMutation.mutateAsync(notification.id);
      else if (!notification.readAt) await markReadMutation.mutateAsync(notification.id);
    } finally {
      onClose();
      navigate(target);
    }
  }

  async function handleDismissNotification(notification: NotificationResponse) {
    dismissNotificationInCache(queryClient, notification.id);
    await dismissNotificationMutation.mutateAsync(notification.id);
  }

  if (!open) return null;

  return (
    <>
      <button className="fixed bottom-0 left-[220px] right-0 top-0 z-[90] bg-[rgba(19,19,19,0.32)]" type="button" aria-label="Cerrar notificaciones" onClick={onClose} />
      <aside className="fixed bottom-[16px] left-[236px] top-[16px] z-[100] flex w-[360px] flex-col overflow-hidden rounded-[16px] bg-[#f7f7f7] shadow-[0px_8px_24px_rgba(19,19,19,0.32)]" aria-label="Notificaciones">
        <header className="flex h-[76px] shrink-0 items-center justify-between bg-[#002659] px-[18px] py-[12px] shadow-[0px_2px_4px_rgba(0,0,0,0.3)]">
          <div className="min-w-0">
            <h2 className="font-['Inter:Semi_Bold',sans-serif] text-[14px] font-semibold leading-none text-white">Notificaciones</h2>
            <p className="pt-[5px] font-['Inter:Regular',sans-serif] text-[11px] font-normal leading-none text-[rgba(255,255,255,0.55)]">{unreadNotifications.length} sin leer</p>
          </div>
          <button type="button" className="flex size-[32px] items-center justify-center" onClick={onClose} aria-label="Cerrar notificaciones"><NotificationCloseIcon /></button>
        </header>
        <div className="flex h-[35px] w-full shrink-0 items-stretch border-b-2 border-[#e3e3e3] bg-white">
          {unreadNotifications.length > 0 ? (
            <div className="flex w-full items-center justify-center gap-[8px] border-b-2 border-[#c8a064] font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold leading-none text-[#8e6e3e]">
              <span>Sin leer</span>
              <span className="flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#BD3B5B] px-[5px] font-['Inter:Bold',sans-serif] text-[9px] font-bold leading-none text-white">{unreadNotifications.length}</span>
            </div>
          ) : (
            <div className="flex w-full items-center justify-center border-b-2 border-[#c8a064] font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold leading-none text-[#8e6e3e]">Todas</div>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f7f7f7] px-[14px] py-[10px]">
          <div className="flex w-full flex-col gap-[8px]">
            {notificationsQuery.isLoading ? <EmptyPanel>Cargando notificaciones...</EmptyPanel> : null}
            {notificationsQuery.isError ? <EmptyPanel>No fue posible cargar las notificaciones.</EmptyPanel> : null}
            {!notificationsQuery.isLoading && !notificationsQuery.isError && sortedNotifications.length === 0 ? <EmptyPanel>No tienes notificaciones.</EmptyPanel> : null}
            {!notificationsQuery.isLoading && !notificationsQuery.isError ? sortedNotifications.map((notification) => <NotificationCard key={notification.id} notification={notification} pending={notificationActionPending} onNotificationClick={handleNotificationClick} onDismiss={handleDismissNotification} />) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
