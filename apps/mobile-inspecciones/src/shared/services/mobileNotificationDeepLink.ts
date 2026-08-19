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

function routeParams(route: string): URLSearchParams {
  try {
    return new URL(route, 'https://aurelia.local').searchParams;
  } catch {
    return new URLSearchParams();
  }
}

export function toMobileNotificationRoute(result: NotificationDeepLinkResponse): string {
  const source = routeParams(result.route);
  const params = new URLSearchParams();
  const routeInspectionId = source.get('inspectionId');
  const routeFindingId = source.get('findingId');
  const routeGroup = source.get('group');

  const inspectionId = routeInspectionId
    ?? (result.entityType === 'inspection' ? result.entityId : null);
  const findingId = routeFindingId
    ?? (result.entityType === 'inspection_finding' ? result.entityId : null);

  if (inspectionId) params.set('inspectionId', inspectionId);
  if (findingId) params.set('findingId', findingId);
  if (routeGroup) params.set('group', routeGroup);

  const search = params.toString();
  return search ? `/inspection/dashboard?${search}` : '/inspection/dashboard';
}
