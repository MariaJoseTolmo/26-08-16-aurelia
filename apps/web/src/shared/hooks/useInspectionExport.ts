import { useQuery } from '@tanstack/react-query';
import { getInspectionExportPayload } from '../services/inspections.service';

export function useInspectionExport(inspectionId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ['inspections', 'export', inspectionId],
    queryFn: () => getInspectionExportPayload(inspectionId as string),
    enabled: enabled && Boolean(inspectionId),
    staleTime: 30_000,
  });
}
