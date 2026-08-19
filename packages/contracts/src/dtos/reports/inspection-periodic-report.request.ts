import type { PeriodicReportRequest } from './periodic-report.request';

export type InspectionPeriodicReportState = 'all' | 'open' | 'closed';

export interface InspectionPeriodicReportRequest extends PeriodicReportRequest {
  inspectionState?: InspectionPeriodicReportState | string;
}
