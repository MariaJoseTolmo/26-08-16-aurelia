import { useQuery } from '@tanstack/react-query';
import { getSprAssignments } from '../services/spr.service';

export function useSprAssignments(areaId?: string | null) {
  return useQuery({
    queryKey: ['spr', 'assignments', areaId ?? 'all'],
    queryFn: () => getSprAssignments(areaId ? { areaId } : undefined),
  });
}
