import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../services/notifications.service';

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: ['notifications', unreadOnly],
    queryFn: () => getNotifications(unreadOnly),
    staleTime: 30000,
  });
}
