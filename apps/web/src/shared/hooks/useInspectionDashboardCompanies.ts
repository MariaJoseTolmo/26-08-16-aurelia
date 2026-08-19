import { useQuery } from '@tanstack/react-query';
import { getDashboardFilterCompanies } from '../services/inspections.service';

export function useInspectionDashboardCompanies() {
  return useQuery({
    queryKey: ['inspections', 'dashboard', 'companies'],
    queryFn: getDashboardFilterCompanies,
  });
}
