import type { MarkAllNotificationsReadResponse, NotificationResponse } from '@aurelia/contracts';
import { httpGet, httpPatch } from './http-client';

export function fetchMobileNotifications(unreadOnly = false): Promise<NotificationResponse[]> {
  const query = unreadOnly ? '?unreadOnly=true' : '';
  return httpGet<NotificationResponse[]>(`/notifications${query}`);
}

export function markMobileNotificationRead(notificationId: string): Promise<NotificationResponse> {
  return httpPatch<Record<string, never>, NotificationResponse>(
    `/notifications/${encodeURIComponent(notificationId)}/read`,
    {},
  );
}

export function dismissMobileNotification(notificationId: string): Promise<MarkAllNotificationsReadResponse> {
  return httpPatch<Record<string, never>, MarkAllNotificationsReadResponse>(
    `/notifications/${encodeURIComponent(notificationId)}/dismiss`,
    {},
  );
}

export function dismissMobileInspectionNotificationThread(notificationId: string): Promise<MarkAllNotificationsReadResponse> {
  return httpPatch<Record<string, never>, MarkAllNotificationsReadResponse>(
    `/notifications/${encodeURIComponent(notificationId)}/inspection-thread/dismiss`,
    {},
  );
}
