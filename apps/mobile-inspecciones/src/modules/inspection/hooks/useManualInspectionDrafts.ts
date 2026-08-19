import { useQuery } from '@tanstack/react-query';
import { listIncompleteManualInspectionDrafts } from '../manualInspectionDrafts.storage';

export function useManualInspectionDrafts() {
  return useQuery({
    queryKey: ['mobile-inspecciones', 'manual-inspection-drafts'],
    queryFn: listIncompleteManualInspectionDrafts,
    staleTime: 0,
  });
}
