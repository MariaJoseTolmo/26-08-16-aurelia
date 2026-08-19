export interface CountReportRowResponse {
  key: string;
  label: string | null;
  count: number;
}

export interface PeriodReportRowResponse {
  period: string;
  count: number;
}

export interface InspectionSummaryReportResponse {
  total: number;
  open: number;
  closed: number;
  cancelled: number;
  openFindings: number;
  overdueFindings: number;
  byStatus: Record<string, number>;
}

export interface IncidentActionPlansSummaryResponse {
  total: number;
  open: number;
  overdue: number;
  byStatus: Record<string, number>;
}

export interface IncidentSummaryReportResponse {
  total: number;
  open: number;
  closed: number;
  cancelled: number;
  overdueSla: number;
  dueSoonNext24Hours: number;
  byStatus: Record<string, number>;
  actionPlans: IncidentActionPlansSummaryResponse;
}

export interface OpenItemsReportResponse {
  inspectionsOpen: number;
  inspectionFindingsOpen: number;
  inspectionFindingsOverdue: number;
  incidentsOpen: number;
  incidentSlaOverdue: number;
  incidentActionPlansOpen: number;
  incidentActionPlansOverdue: number;
}

export interface ReportSummaryResponse {
  totalInspections: number;
  totalIncidents: number;
  openIncidents: number;
  byRiskLevel: Record<string, number>;
  byStatus: Record<string, number>;
}
