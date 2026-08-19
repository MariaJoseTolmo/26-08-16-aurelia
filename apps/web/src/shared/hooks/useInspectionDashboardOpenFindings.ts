import { useQuery } from '@tanstack/react-query';
import { getInspectionDashboardOpenFindings } from '../services/inspections.service';
import type { InspectionDashboardQueryParams } from '../services/inspections.service';

export function useInspectionDashboardOpenFindings(input?: InspectionDashboardQueryParams) {
  return useQuery({
    queryKey: ['inspections', 'dashboard', 'details', input],
    queryFn: () => getInspectionDashboardOpenFindings(input),
  });
}
