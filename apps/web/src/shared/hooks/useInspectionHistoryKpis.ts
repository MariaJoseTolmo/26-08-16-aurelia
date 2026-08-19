import { useQuery } from '@tanstack/react-query';
import { getInspectionHistoryKpis } from '../services/inspections.service';

export function useInspectionHistoryKpis() {
  return useQuery({
    queryKey: ['inspections', 'history', 'kpis'],
    queryFn: getInspectionHistoryKpis,
  });
}
