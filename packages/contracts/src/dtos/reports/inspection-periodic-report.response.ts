import type { InspectionFindingSeverity } from '../../enums';
import type { ID, ISODateString } from '../../types/common';
import type { InspectionPeriodicReportState } from './inspection-periodic-report.request';
import type { ReportPeriod } from './periodic-report.request';

export type InspectionPeriodicReportEffectiveStatus = 'open' | 'closed';

export interface InspectionPeriodicReportMetadataResponse {
  year: number;
  period: ReportPeriod;
  periodLabel: string;
  start: ISODateString;
  end: ISODateString;
  inspectionState: InspectionPeriodicReportState;
  companyId: ID | null;
  generatedAt: ISODateString;
  generatedBy: string;
}

export interface InspectionPeriodicReportSummaryResponse {
  totalInspections: number;
  openInspections: number;
  closedInspections: number;
  totalFindings: number;
  /** Observaciones abiertas o rechazadas, dentro de plazo. */
  openFindings: number;
  /** Observaciones ejecutadas pendientes de aprobación, dentro de plazo. */
  executedFindings: number;
  /** Alias funcional de executedFindings usado por tarjetas del informe. */
  pendingApprovalFindings: number;
  closedFindings: number;
  /** Observaciones no cerradas cuyo SLA ya venció. Categoría excluyente. */
  overdueFindings: number;
  complianceRate: number;
}

export interface InspectionPeriodicReportDistributionRowResponse {
  key: string;
  label: string;
  count: number;
  percentage: number;
}

export interface InspectionPeriodicReportMonthRowResponse extends InspectionPeriodicReportDistributionRowResponse {
  month: number;
}

export interface InspectionPeriodicReportInspectionRowResponse {
  inspectionId: ID;
  inspectionNumber: string;
  date: ISODateString | null;
  inspector: string;
  areaSector: string;
  company: string;
  type: string;
  urgencyLabel: string;
  maxSeverity: InspectionFindingSeverity | null;
  observationsCount: number;
  closedObservations: number;
  openObservations: number;
  executedObservations: number;
  overdueObservations: number;
  closureRate: number;
  daysOpen: number;
  effectiveStatus: InspectionPeriodicReportEffectiveStatus;
}

export interface InspectionPeriodicReportAttentionRowResponse extends InspectionPeriodicReportInspectionRowResponse {
  requiresImmediateAttention: boolean;
}

export interface InspectionPeriodicReportCompanyRowResponse {
  companyId: ID | null;
  company: string;
  inspectionsInPeriod: number;
  openInspections: number;
  pendingFindings: number;
  overdueFindings: number;
  complianceRate: number;
}

export interface InspectionPeriodicReportResponse {
  metadata: InspectionPeriodicReportMetadataResponse;
  summary: InspectionPeriodicReportSummaryResponse;
  inspectionsByMonth: InspectionPeriodicReportMonthRowResponse[];
  inspectionsByType: InspectionPeriodicReportDistributionRowResponse[];
  /** Distribución por área contando cada inspección una sola vez. */
  inspectionsByArea: InspectionPeriodicReportDistributionRowResponse[];
  /** @deprecated Usar inspectionsByArea. Se conserva temporalmente por compatibilidad. */
  findingsByArea: InspectionPeriodicReportDistributionRowResponse[];
  inspections: {
    total: number;
    rows: InspectionPeriodicReportInspectionRowResponse[];
  };
  attention: {
    inspectionsCount: number;
    rows: InspectionPeriodicReportAttentionRowResponse[];
  };
  companiesWithMostPending: InspectionPeriodicReportCompanyRowResponse[];
}
