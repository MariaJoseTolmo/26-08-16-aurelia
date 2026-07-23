import type { NotificationDeepLinkResponse } from '@aurelia/contracts';
import { localStorageDriver } from '../storage/local-storage';
import { httpGet } from './http-client';

const PENDING_NOTIFICATION_ROUTE_KEY = 'mobile-inspecciones:pending-notification-route:v1';

export function resolveMobileNotificationDeepLink(token: string): Promise<NotificationDeepLinkResponse> {
  return httpGet<NotificationDeepLinkResponse>(`/notifications/deep-link/${encodeURIComponent(token)}`);
}

export async function savePendingMobileNotificationRoute(route: string): Promise<void> {
  await localStorageDriver.set(PENDING_NOTIFICATION_ROUTE_KEY, route);
}

export async function consumePendingMobileNotificationRoute(): Promise<string | null> {
  const route = await localStorageDriver.get<string>(PENDING_NOTIFICATION_ROUTE_KEY);
  if (route) await localStorageDriver.remove(PENDING_NOTIFICATION_ROUTE_KEY);
  return route ?? null;
}

export function toMobileNotificationRoute(result: NotificationDeepLinkResponse): string {
  const params: string[] = [];
  if (result.entityType === 'inspection' && result.entityId) {
    params.push(`inspectionId=${encodeURIComponent(result.entityId)}`);
  }
  if (result.entityType === 'inspection_finding' && result.entityId) {
    params.push(`findingId=${encodeURIComponent(result.entityId)}`);
  }
  return params.length > 0
    ? `/inspection/dashboard?${params.join('&')}`
    : '/inspection/dashboard';
}
