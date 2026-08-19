import type {
  Incident,
  IncidentActionPlan,
  IncidentDashboardSummary,
  IncidentFiveWhyAnalysis,
  IncidentFlashReport,
  IncidentImmediateAction,
  IncidentInvestigation,
  IncidentLevel,
  IncidentPeepoAnalysis,
  IncidentTypeCatalog,
} from '../../interfaces/incident.interface';

export type IncidentResponse = Incident;
export type IncidentTypeResponse = IncidentTypeCatalog;
export type IncidentLevelResponse = IncidentLevel;
export type IncidentFlashReportResponse = IncidentFlashReport;
export type IncidentImmediateActionResponse = IncidentImmediateAction;
export type IncidentInvestigationResponse = IncidentInvestigation;
export type IncidentFiveWhyAnalysisResponse = IncidentFiveWhyAnalysis;
export type IncidentPeepoAnalysisResponse = IncidentPeepoAnalysis;
export type IncidentActionPlanResponse = IncidentActionPlan;
export type IncidentDashboardSummaryResponse = IncidentDashboardSummary;
