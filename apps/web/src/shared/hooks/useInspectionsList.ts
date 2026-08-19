import { useQuery } from '@tanstack/react-query';
import { listInspections } from '../services/inspections.service';

export function useInspectionsList() {
  return useQuery({
    queryKey: ['inspections', 'list'],
    queryFn: () => listInspections(),
  });
}
