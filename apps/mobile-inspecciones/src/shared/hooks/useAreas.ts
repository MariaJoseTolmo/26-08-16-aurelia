import { useQuery } from '@tanstack/react-query';
import { fetchAreas } from '../services/api/organization.api';

export const AREAS_QUERY_KEY = ['areas'] as const;

export function useAreas() {
  return useQuery({
    queryKey: AREAS_QUERY_KEY,
    queryFn: fetchAreas,
  });
}
