import { useQuery } from '@tanstack/react-query';
import { getInspectionDashboardSummary } from '../services/inspections.service';
import type { InspectionDashboardQueryParams } from '../services/inspections.service';

export function useInspectionDashboardSummary(input?: InspectionDashboardQueryParams) {
  return useQuery({
    queryKey: ['inspections', 'dashboard', 'summary', input],
    queryFn: () => getInspectionDashboardSummary(input),
  });
}
