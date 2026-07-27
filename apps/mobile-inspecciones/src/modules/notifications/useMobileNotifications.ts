import { useQuery } from '@tanstack/react-query';
import { fetchMobileNotifications } from '../../shared/services/notifications.api';

export function mobileNotificationsQueryKey(unreadOnly = false) {
  return ['mobile-inspecciones', 'notifications', unreadOnly] as const;
}

export function useMobileNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: mobileNotificationsQueryKey(unreadOnly),
    queryFn: () => fetchMobileNotifications(unreadOnly),
    staleTime: 30_000,
  });
}
