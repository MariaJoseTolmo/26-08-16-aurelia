export interface CreateIncidentFlashReportRequest {
  summary: string;
  immediateCauses?: string | null;
  affectedComponents?: string | null;
  potentialImpact?: string | null;
  reporterName?: string | null;
}
