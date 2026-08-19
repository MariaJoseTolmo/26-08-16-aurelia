import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '../services/api/users.api';

export const personnelQueryKey = (companyId: string) =>
  ['personnel', companyId] as const;

export function usePersonnel(companyId: string | undefined) {
  return useQuery({
    queryKey: personnelQueryKey(companyId ?? ''),
    queryFn: () => fetchUsers({ companyId }),
    enabled: !!companyId,
  });
}
