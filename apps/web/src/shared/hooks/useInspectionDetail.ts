import { useQuery } from '@tanstack/react-query';
import { getInspectionDetail } from '../services/inspection-detail.service';

export function useInspectionDetail(inspectionId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ['inspections', 'detail', inspectionId],
    queryFn: () => getInspectionDetail(inspectionId as string),
    enabled: enabled && Boolean(inspectionId),
    staleTime: 30_000,
  });
}
