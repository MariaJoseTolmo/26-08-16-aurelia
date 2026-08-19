import { useQuery } from '@tanstack/react-query';
import { getInspectionManagementKpis } from '../services/inspections.service';

export function useInspectionManagementKpis() {
  return useQuery({
    queryKey: ['inspections', 'management', 'kpis'],
    queryFn: getInspectionManagementKpis,
  });
}
