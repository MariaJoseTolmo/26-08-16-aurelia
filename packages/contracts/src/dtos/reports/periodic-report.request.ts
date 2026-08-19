import type { ID } from '../../types/common';

export type ReportPeriod = 'year' | 'q1' | 'q2' | 'q3' | 'q4' | 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'm7' | 'm8' | 'm9' | 'm10' | 'm11' | 'm12';

export interface PeriodicReportRequest {
  year?: number | string;
  period?: ReportPeriod | string;
  companyId?: ID | null;
}
