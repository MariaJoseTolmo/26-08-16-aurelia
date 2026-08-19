import type { InspectionDashboardSummaryResponse } from '@aurelia/contracts';
import { httpGet } from '../http-client';

export function fetchInspectionHomeSummary(): Promise<InspectionDashboardSummaryResponse> {
  return httpGet<InspectionDashboardSummaryResponse>('/inspections/dashboard/summary');
}
