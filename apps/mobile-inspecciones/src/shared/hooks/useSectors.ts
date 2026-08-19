import { useQuery } from '@tanstack/react-query';
import { fetchSectors } from '../services/api/organization.api';

export const sectorsQueryKey = (areaId: string) => ['sectors', areaId] as const;

export function useSectors(areaId: string | undefined) {
  return useQuery({
    queryKey: sectorsQueryKey(areaId ?? ''),
    queryFn: () => fetchSectors(areaId!),
    enabled: !!areaId,
  });
}
