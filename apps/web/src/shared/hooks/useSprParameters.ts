import { useQuery } from '@tanstack/react-query';
import { getSprParameters } from '../services/spr.service';

export function useSprParameters(areaId?: string | null) {
  return useQuery({
    queryKey: ['spr', 'parameters', areaId ?? 'all'],
    queryFn: () => getSprParameters(areaId ? { areaId } : undefined),
  });
}
