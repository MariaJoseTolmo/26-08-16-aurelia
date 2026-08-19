import { useQuery } from '@tanstack/react-query';
import { getInspectionDashboardCompanyAnalysis } from '../services/inspections.service';
import type { InspectionDashboardQueryParams } from '../services/inspections.service';

export function useInspectionDashboardCompanyAnalysis(input?: InspectionDashboardQueryParams) {
  return useQuery({
    queryKey: ['inspections', 'dashboard', 'company', input],
    queryFn: () => getInspectionDashboardCompanyAnalysis(input),
  });
}
