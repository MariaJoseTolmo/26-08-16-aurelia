import type {
  Inspection,
  InspectionChecklistAnswer,
  InspectionChecklistItem,
  InspectionChecklistSection,
  InspectionChecklistTemplate,
  InspectionFinding,
  InspectionFollowup,
  InspectionTypeRecord,
} from '../../interfaces/inspection.interface';
import type { InspectionFindingSeverity, InspectionFindingStatus, InspectionStatus } from '../../enums';

export type InspectionResponse = Inspection;
export type InspectionTypeResponse = InspectionTypeRecord;
export type InspectionChecklistAnswerResponse = InspectionChecklistAnswer;
export type InspectionFindingResponse = InspectionFinding;
export type InspectionFollowupResponse = InspectionFollowup;

export interface InspectionChecklistSectionResponse extends InspectionChecklistSection {
  items: InspectionChecklistItem[];
}

export interface InspectionChecklistTemplateResponse extends InspectionChecklistTemplate {
  sections: InspectionChecklistSectionResponse[];
}

export interface InspectionDashboardAnnualInspectionRowResponse {
  year: number;
  closed: number;
  open: number;
}

export interface InspectionDashboardMonthlyFindingRowResponse {
  month: number;
  label: string;
  closed: number;
  open: number;
}

export interface InspectionDashboardAreaObservationRowResponse {
  areaId: string | null;
  area: string;
  closed: number;
  open: number;
}

export interface InspectionDashboardClosureResponse {
  historicalRate: number;
  periodRate: number;
  periodLabel: string;
}

export interface InspectionDashboardChartsResponse {
  annualInspections: InspectionDashboardAnnualInspectionRowResponse[];
  monthlyFindings: InspectionDashboardMonthlyFindingRowResponse[];
  areaObservations: InspectionDashboardAreaObservationRowResponse[];
  closure: InspectionDashboardClosureResponse;
}

export interface InspectionDashboardCompanyChartRowResponse {
  companyId: string | null;
  company: string;
  closed: number;
  open: number;
}

export interface InspectionDashboardCompanyAnalysisResponse {
  companiesWithOpenFindings: number;
  openFindings: number;
  openInspections: number;
  openDays: {
    max: number;
    average: number;
  };
  chartRows: InspectionDashboardCompanyChartRowResponse[];
}

export interface InspectionDashboardOpenFindingSeverityCountsResponse {
  severe: number;
  moderate: number;
  minor: number;
}

export interface InspectionDashboardOpenFindingRowResponse {
  inspectionId: string;
  inspectionNumber: string;
  companyId: string | null;
  company: string;
  areaId: string | null;
  area: string;
  ageDays: number;
  openFindings: number;
  severeOpenFindings: number;
  hasSevereOpenFindings: boolean;
  maxSeverity: InspectionFindingSeverity | null;
  severityCounts: InspectionDashboardOpenFindingSeverityCountsResponse;
}

export interface InspectionDashboardOpenFindingsResponse {
  severeOpenFindings: number;
  openInspections: number;
  rows: InspectionDashboardOpenFindingRowResponse[];
}

export interface InspectionDashboardSummaryResponse {
  inspections: {
    total: number;
    byStatus: Record<InspectionStatus, number>;
    withOpenFindings: number;
    closedRate: number;
  };
  findings: {
    total: number;
    byStatus: Record<InspectionFindingStatus, number>;
    bySeverity: Record<InspectionFindingSeverity, number>;
    open: number;
    overdue: number;
    dueSoonNext7Days: number;
  };
}

export interface InspectionManagementKpisResponse {
  year: number;
  previousYear: number;
  totalInspections: number;
  previousYearInspections: number;
  inspectionsDeltaPercent: number;
  openInspections: number;
  openFindings: number;
  pendingApprovalInspections: number;
  closedFindingsRate: number;
}

export interface InspectionHistoryKpisResponse {
  year: number;
  closedInspections: number;
  averageClosureDays: number;
  closedFindingsRate: number;
  contractorCompanies: number;
}

export interface InspectionManagementTableObservationSummaryResponse {
  executed: number;
  open: number;
  closed: number;
  rejected: number;
}

export interface InspectionManagementTableRowResponse {
  inspectionId: string;
  inspectionNumber: string;
  date: string | null;
  inspector: string;
  areaSector: string;
  company: string;
  type: string;
  urgencyLabel: string;
  urgencySeverity: InspectionFindingSeverity | null;
  rejectedUrgencyLabel?: string;
  hasOverdueFindings?: boolean;
  observationsCount: number;
  observations: InspectionManagementTableObservationSummaryResponse;
  daysOpen: number;
  closureRate: number;
  isLegacy?: boolean;
  readOnly?: boolean;
}

export interface InspectionManagementTableFilterOptionsResponse {
  inspectors: string[];
  areas: string[];
  companies: string[];
  types: string[];
  urgencies: string[];
}

export interface InspectionManagementTableResponse {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  rows: InspectionManagementTableRowResponse[];
  filterOptions: InspectionManagementTableFilterOptionsResponse;
}
