import { useQuery } from '@tanstack/react-query';
import { getInspectionDashboardCharts } from '../services/inspections.service';
import type { InspectionDashboardQueryParams } from '../services/inspections.service';

export function useInspectionDashboardCharts(input?: InspectionDashboardQueryParams) {
  return useQuery({
    queryKey: ['inspections', 'dashboard', 'charts', input],
    queryFn: () => getInspectionDashboardCharts(input),
  });
}
