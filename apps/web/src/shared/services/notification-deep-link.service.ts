import type { NotificationDeepLinkResponse } from '@aurelia/contracts';
import { httpGet } from './http-client';

const PENDING_NOTIFICATION_ROUTE_KEY = 'aurelia:pending-notification-route';

export function resolveNotificationDeepLink(token: string): Promise<NotificationDeepLinkResponse> {
  return httpGet<NotificationDeepLinkResponse>(`/notifications/deep-link/${encodeURIComponent(token)}`);
}

export function savePendingNotificationRoute(route: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(PENDING_NOTIFICATION_ROUTE_KEY, route);
}

export function consumePendingNotificationRoute(): string | null {
  if (typeof window === 'undefined') return null;
  const route = window.sessionStorage.getItem(PENDING_NOTIFICATION_ROUTE_KEY);
  if (route) window.sessionStorage.removeItem(PENDING_NOTIFICATION_ROUTE_KEY);
  return route;
}

export function safeApplicationRoute(route: string | null | undefined): string | null {
  if (!route?.startsWith('/') || route.startsWith('//')) return null;
  return route;
}
