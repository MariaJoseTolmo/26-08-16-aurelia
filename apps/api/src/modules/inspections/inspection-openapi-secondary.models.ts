import {
  EvidenceStatus,
  InspectionAiAssessmentKind,
  InspectionAiDecision,
  InspectionAnswerValue,
  InspectionFindingSeverity,
  InspectionFollowupStatus,
  InspectionItemResponseType,
  InspectionProcessRequestStatus,
  InspectionProcessRequestType,
  InspectionType,
  type CommentResponse,
  type EvidenceLinkResponse,
  type EvidenceResponse,
  type InspectionAiAssessmentResponse,
  type InspectionChecklistAnswerResponse,
  type InspectionChecklistItem,
  type InspectionChecklistSectionResponse,
  type InspectionChecklistTemplateResponse,
  type InspectionDashboardAnnualInspectionRowResponse,
  type InspectionDashboardAreaObservationRowResponse,
  type InspectionDashboardChartsResponse,
  type InspectionDashboardClosureResponse,
  type InspectionDashboardCompanyAnalysisResponse,
  type InspectionDashboardCompanyChartRowResponse,
  type InspectionDashboardMonthlyFindingRowResponse,
  type InspectionDashboardOpenFindingRowResponse,
  type InspectionDashboardOpenFindingSeverityCountsResponse,
  type InspectionDashboardOpenFindingsResponse,
  type InspectionFindingSeverityResponse,
  type InspectionFindingTypeResponse,
  type InspectionFollowupResponse,
  type InspectionHistoryKpisResponse,
  type InspectionManagementKpisResponse,
  type InspectionProcessRequestResponse,
  type InspectionRiskConsequenceResponse,
  type InspectionRiskProbabilityResponse,
  type InspectionTypeResponse,
  type UserResponse,
} from '@aurelia/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const uuid = { type: String, format: 'uuid' } as const;
const nullableUuid = { type: String, format: 'uuid', nullable: true } as const;
const nullableDateTime = { type: String, format: 'date-time', nullable: true } as const;

export class InspectionTypeCatalogOpenApiModel implements InspectionTypeResponse {
  @ApiProperty(uuid)
  id: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;

  @ApiProperty({ enum: InspectionType, enumName: 'InspectionType' })
  code: InspectionType;

  @ApiProperty({ example: 'Inspección ambiental' })
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ example: 'active' })
  status: string;
}

export class InspectionChecklistItemCatalogOpenApiModel implements InspectionChecklistItem {
  @ApiProperty(uuid)
  id: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;

  @ApiProperty(uuid)
  sectionId: string;

  @ApiProperty({ example: 'ITEM-001' })
  code: string;

  @ApiProperty({ example: '¿El área mantiene sus residuos correctamente segregados?' })
  question: string;

  @ApiProperty({ nullable: true })
  guidance: string | null;

  @ApiProperty({ enum: InspectionItemResponseType, enumName: 'InspectionItemResponseType' })
  responseType: InspectionItemResponseType;

  @ApiProperty({ example: true })
  isRequired: boolean;

  @ApiProperty({ example: true })
  requiresEvidenceOnNotCompliant: boolean;

  @ApiProperty({ example: 1 })
  sortOrder: number;

  @ApiProperty({ nullable: true, example: '1.00' })
  weight: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;
}

export class InspectionChecklistSectionCatalogOpenApiModel implements InspectionChecklistSectionResponse {
  @ApiProperty(uuid)
  id: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;

  @ApiProperty(uuid)
  templateId: string;

  @ApiProperty({ example: 'SEC-01' })
  code: string;

  @ApiProperty({ example: 'Condiciones generales' })
  title: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ example: 1 })
  sortOrder: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: () => [InspectionChecklistItemCatalogOpenApiModel] })
  items: InspectionChecklistItemCatalogOpenApiModel[];
}

export class InspectionChecklistTemplateCatalogOpenApiModel implements InspectionChecklistTemplateResponse {
  @ApiProperty(uuid)
  id: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;

  @ApiProperty(uuid)
  inspectionTypeId: string;

  @ApiProperty({ example: 'TPL-ENV-GENERAL-001' })
  code: string;

  @ApiProperty({ example: 'Checklist ambiental general' })
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ example: 1 })
  version: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: () => [InspectionChecklistSectionCatalogOpenApiModel] })
  sections: InspectionChecklistSectionCatalogOpenApiModel[];
}

export class InspectionResponsibleUserOpenApiModel implements UserResponse {
  @ApiProperty(uuid)
  id: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ nullable: true })
  position: string | null;

  @ApiProperty({ nullable: true })
  phone: string | null;

  @ApiProperty(nullableUuid)
  companyId: string | null;

  @ApiProperty(nullableUuid)
  areaId: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty(nullableDateTime)
  lastLoginAt: string | null;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object', additionalProperties: true } })
  roles?: UserResponse['roles'];

  @ApiPropertyOptional({ type: 'array', items: { type: 'object', additionalProperties: true } })
  companies?: UserResponse['companies'];

  @ApiPropertyOptional({ type: 'array', items: { type: 'object', additionalProperties: true } })
  areas?: UserResponse['areas'];
}

export class InspectionChecklistAnswerOpenApiModel implements InspectionChecklistAnswerResponse {
  @ApiProperty(uuid)
  id: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;

  @ApiProperty(uuid)
  inspectionId: string;

  @ApiProperty(uuid)
  checklistItemId: string;

  @ApiProperty({ enum: InspectionAnswerValue, enumName: 'InspectionAnswerValue', nullable: true })
  answerValue: InspectionAnswerValue | null;

  @ApiProperty({ nullable: true })
  answerText: string | null;

  @ApiProperty({ nullable: true })
  numericValue: string | null;

  @ApiProperty(nullableUuid)
  answeredByUserId: string | null;

  @ApiProperty(nullableDateTime)
  answeredAt: string | null;

  @ApiProperty({ nullable: true })
  notes: string | null;
}

export class InspectionFollowupOpenApiModel implements InspectionFollowupResponse {
  @ApiProperty(uuid)
  id: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;

  @ApiProperty(uuid)
  findingId: string;

  @ApiProperty({ example: 1 })
  sequenceNumber: number;

  @ApiProperty({ enum: InspectionFollowupStatus, enumName: 'InspectionFollowupStatus' })
  status: InspectionFollowupStatus;

  @ApiProperty()
  description: string;

  @ApiProperty(nullableUuid)
  performedByUserId: string | null;

  @ApiProperty(nullableDateTime)
  performedAt: string | null;

  @ApiProperty(nullableDateTime)
  nextDueAt: string | null;
}

export class InspectionManagementKpisOpenApiModel implements InspectionManagementKpisResponse {
  @ApiProperty({ example: 2026 })
  year: number;

  @ApiProperty({ example: 2025 })
  previousYear: number;

  @ApiProperty({ example: 133 })
  totalInspections: number;

  @ApiProperty({ example: 718 })
  previousYearInspections: number;

  @ApiProperty({ example: -81.48 })
  inspectionsDeltaPercent: number;

  @ApiProperty({ example: 42 })
  openInspections: number;

  @ApiProperty({ example: 4 })
  openFindings: number;

  @ApiProperty({ example: 0 })
  pendingApprovalInspections: number;

  @ApiProperty({ example: 55.56 })
  closedFindingsRate: number;
}

export class InspectionHistoryKpisOpenApiModel implements InspectionHistoryKpisResponse {
  @ApiProperty({ example: 2026 })
  year: number;

  @ApiProperty({ example: 115 })
  closedInspections: number;

  @ApiProperty({ example: 17.8 })
  averageClosureDays: number;

  @ApiProperty({ example: 100 })
  closedFindingsRate: number;

  @ApiProperty({ example: 38 })
  contractorCompanies: number;
}

export class InspectionDashboardAnnualRowOpenApiModel implements InspectionDashboardAnnualInspectionRowResponse {
  @ApiProperty({ example: 2026 })
  year: number;

  @ApiProperty({ example: 115 })
  closed: number;

  @ApiProperty({ example: 42 })
  open: number;
}

export class InspectionDashboardMonthlyFindingRowOpenApiModel implements InspectionDashboardMonthlyFindingRowResponse {
  @ApiProperty({ example: 7 })
  month: number;

  @ApiProperty({ example: 'Jul' })
  label: string;

  @ApiProperty({ example: 8 })
  closed: number;

  @ApiProperty({ example: 3 })
  open: number;
}

export class InspectionDashboardAreaObservationRowOpenApiModel implements InspectionDashboardAreaObservationRowResponse {
  @ApiProperty(nullableUuid)
  areaId: string | null;

  @ApiProperty({ example: 'Medio Ambiente' })
  area: string;

  @ApiProperty({ example: 18 })
  closed: number;

  @ApiProperty({ example: 2 })
  open: number;
}

export class InspectionDashboardClosureOpenApiModel implements InspectionDashboardClosureResponse {
  @ApiProperty({ example: 97.2 })
  historicalRate: number;

  @ApiProperty({ example: 23.1 })
  periodRate: number;

  @ApiProperty({ example: 'T3 · Jul-Sep 2026' })
  periodLabel: string;
}

export class InspectionDashboardChartsOpenApiModel implements InspectionDashboardChartsResponse {
  @ApiProperty({ type: () => [InspectionDashboardAnnualRowOpenApiModel] })
  annualInspections: InspectionDashboardAnnualRowOpenApiModel[];

  @ApiProperty({ type: () => [InspectionDashboardMonthlyFindingRowOpenApiModel] })
  monthlyFindings: InspectionDashboardMonthlyFindingRowOpenApiModel[];

  @ApiProperty({ type: () => [InspectionDashboardAreaObservationRowOpenApiModel] })
  areaObservations: InspectionDashboardAreaObservationRowOpenApiModel[];

  @ApiProperty({ type: () => InspectionDashboardClosureOpenApiModel })
  closure: InspectionDashboardClosureOpenApiModel;
}

export class InspectionDashboardCompanyChartRowOpenApiModel implements InspectionDashboardCompanyChartRowResponse {
  @ApiProperty(nullableUuid)
  companyId: string | null;

  @ApiProperty({ example: 'SOMACOR' })
  company: string;

  @ApiProperty({ example: 12 })
  closed: number;

  @ApiProperty({ example: 3 })
  open: number;
}

export class InspectionDashboardOpenDaysOpenApiModel {
  @ApiProperty({ example: 42 })
  max: number;

  @ApiProperty({ example: 12.4 })
  average: number;
}

export class InspectionDashboardCompanyAnalysisOpenApiModel implements InspectionDashboardCompanyAnalysisResponse {
  @ApiProperty({ example: 7 })
  companiesWithOpenFindings: number;

  @ApiProperty({ example: 18 })
  openFindings: number;

  @ApiProperty({ example: 12 })
  openInspections: number;

  @ApiProperty({ type: () => InspectionDashboardOpenDaysOpenApiModel })
  openDays: InspectionDashboardOpenDaysOpenApiModel;

  @ApiProperty({ type: () => [InspectionDashboardCompanyChartRowOpenApiModel] })
  chartRows: InspectionDashboardCompanyChartRowOpenApiModel[];
}

export class InspectionDashboardOpenFindingSeverityCountsOpenApiModel
implements InspectionDashboardOpenFindingSeverityCountsResponse {
  @ApiProperty({ example: 2 })
  severe: number;

  @ApiProperty({ example: 4 })
  moderate: number;

  @ApiProperty({ example: 1 })
  minor: number;
}

export class InspectionDashboardOpenFindingRowOpenApiModel implements InspectionDashboardOpenFindingRowResponse {
  @ApiProperty(uuid)
  inspectionId: string;

  @ApiProperty({ example: '#369' })
  inspectionNumber: string;

  @ApiProperty(nullableUuid)
  companyId: string | null;

  @ApiProperty({ example: 'GARDE CORPS' })
  company: string;

  @ApiProperty(nullableUuid)
  areaId: string | null;

  @ApiProperty({ example: 'Servicios Generales' })
  area: string;

  @ApiProperty({ example: 23 })
  ageDays: number;

  @ApiProperty({ example: 3 })
  openFindings: number;

  @ApiProperty({ example: 1 })
  severeOpenFindings: number;

  @ApiProperty({ example: true })
  hasSevereOpenFindings: boolean;

  @ApiProperty({ enum: InspectionFindingSeverity, enumName: 'InspectionFindingSeverity', nullable: true })
  maxSeverity: InspectionFindingSeverity | null;

  @ApiProperty({ type: () => InspectionDashboardOpenFindingSeverityCountsOpenApiModel })
  severityCounts: InspectionDashboardOpenFindingSeverityCountsOpenApiModel;
}

export class InspectionDashboardOpenFindingsOpenApiModel implements InspectionDashboardOpenFindingsResponse {
  @ApiProperty({ example: 3 })
  severeOpenFindings: number;

  @ApiProperty({ example: 12 })
  openInspections: number;

  @ApiProperty({ type: () => [InspectionDashboardOpenFindingRowOpenApiModel] })
  rows: InspectionDashboardOpenFindingRowOpenApiModel[];
}

export class EvidenceLinkOpenApiModel implements EvidenceLinkResponse {
  @ApiProperty(uuid)
  id: string;

  @ApiProperty(uuid)
  evidenceId: string;

  @ApiProperty({ example: 'inspection' })
  entityType: string;

  @ApiProperty(uuid)
  entityId: string;

  @ApiProperty({ example: 'inspection_evidence' })
  relationType: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;
}

export class EvidenceOpenApiModel implements EvidenceResponse {
  @ApiProperty(uuid)
  id: string;

  @ApiProperty(nullableUuid)
  fileId: string | null;

  @ApiProperty({ nullable: true })
  title: string | null;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ nullable: true })
  evidenceType: string | null;

  @ApiProperty({ enum: EvidenceStatus, enumName: 'EvidenceStatus' })
  status: EvidenceStatus;

  @ApiProperty(nullableDateTime)
  capturedAt: string | null;

  @ApiProperty({ nullable: true, type: Number })
  latitude: number | null;

  @ApiProperty({ nullable: true, type: Number })
  longitude: number | null;

  @ApiProperty(nullableUuid)
  createdByUserId: string | null;

  @ApiProperty(nullableUuid)
  validatedByUserId: string | null;

  @ApiProperty(nullableDateTime)
  validatedAt: string | null;

  @ApiProperty({ nullable: true })
  validationNotes: string | null;

  @ApiProperty({ type: () => [EvidenceLinkOpenApiModel] })
  links: EvidenceLinkOpenApiModel[];

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class InspectionCommentOpenApiModel implements CommentResponse {
  @ApiProperty(uuid)
  id: string;

  @ApiProperty({ example: 'inspection' })
  entityType: string;

  @ApiProperty(uuid)
  entityId: string;

  @ApiProperty(nullableUuid)
  authorUserId: string | null;

  @ApiProperty({ example: 'Se adjunta evidencia complementaria.' })
  body: string;

  @ApiProperty({ example: false })
  isInternal: boolean;

  @ApiProperty({ example: false })
  isDeleted: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class InspectionFindingTypeCatalogOpenApiModel implements InspectionFindingTypeResponse {
  @ApiProperty(uuid)
  id: string;

  @ApiProperty({ example: 'ENVIRONMENTAL' })
  code: string;

  @ApiProperty({ example: 'Inspección ambiental' })
  name: string;

  @ApiProperty({ example: 1 })
  sortOrder: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class InspectionFindingSeverityCatalogOpenApiModel implements InspectionFindingSeverityResponse {
  @ApiProperty(uuid)
  id: string;

  @ApiProperty({ example: 'high' })
  code: string;

  @ApiProperty({ example: 'Grave' })
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ example: '5 días hábiles' })
  closureTimeLabel: string;

  @ApiProperty({ example: 3 })
  sortOrder: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class InspectionRiskProbabilityCatalogOpenApiModel implements InspectionRiskProbabilityResponse {
  @ApiProperty(uuid)
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ example: 3 })
  score: number;

  @ApiProperty({ example: 3 })
  sortOrder: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class InspectionRiskConsequenceCatalogOpenApiModel implements InspectionRiskConsequenceResponse {
  @ApiProperty(uuid)
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ example: 4 })
  score: number;

  @ApiProperty({ example: 4 })
  sortOrder: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class InspectionFindingCatalogsOpenApiModel {
  @ApiProperty({ type: () => [InspectionFindingTypeCatalogOpenApiModel] })
  types: InspectionFindingTypeCatalogOpenApiModel[];

  @ApiProperty({ type: () => [InspectionFindingSeverityCatalogOpenApiModel] })
  severities: InspectionFindingSeverityCatalogOpenApiModel[];
}

export class InspectionProcessRequestOpenApiModel implements InspectionProcessRequestResponse {
  @ApiProperty(uuid)
  id: string;

  @ApiProperty(uuid)
  findingId: string;

  @ApiProperty({ enum: InspectionProcessRequestType, enumName: 'InspectionProcessRequestType' })
  type: InspectionProcessRequestType;

  @ApiProperty({ enum: InspectionProcessRequestStatus, enumName: 'InspectionProcessRequestStatus' })
  status: InspectionProcessRequestStatus;

  @ApiProperty()
  reason: string;

  @ApiProperty(nullableDateTime)
  requestedDueAt: string | null;

  @ApiProperty(nullableDateTime)
  resolvedDueAt: string | null;

  @ApiProperty({ nullable: true, type: Number })
  iteration: number | null;

  @ApiProperty(nullableUuid)
  requestedByUserId: string | null;

  @ApiProperty(nullableUuid)
  resolvedByUserId: string | null;

  @ApiProperty({ nullable: true })
  resolutionReason: string | null;

  @ApiProperty({ type: 'object', additionalProperties: true, nullable: true })
  metadata: Record<string, unknown> | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;

  @ApiProperty(nullableDateTime)
  resolvedAt: string | null;
}

export class InspectionAiAssessmentOpenApiModel implements InspectionAiAssessmentResponse {
  @ApiProperty(uuid)
  id: string;

  @ApiProperty(uuid)
  inspectionId: string;

  @ApiProperty(nullableUuid)
  findingId: string | null;

  @ApiProperty({ enum: InspectionAiAssessmentKind, enumName: 'InspectionAiAssessmentKind' })
  kind: InspectionAiAssessmentKind;

  @ApiProperty({ example: 0.87, minimum: 0, maximum: 1 })
  confidence: number;

  @ApiProperty()
  recommendation: string;

  @ApiProperty({ type: [String] })
  explanation: string[];

  @ApiProperty(nullableUuid)
  duplicateFindingId: string | null;

  @ApiProperty({ type: 'object', additionalProperties: true, nullable: true })
  suggestedData: Record<string, unknown> | null;

  @ApiProperty({ enum: InspectionAiDecision, enumName: 'InspectionAiDecision' })
  decision: InspectionAiDecision;

  @ApiProperty({ nullable: true })
  decisionReason: string | null;

  @ApiProperty(nullableUuid)
  decidedByUserId: string | null;

  @ApiProperty(nullableDateTime)
  decidedAt: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class InspectionExportSummaryOpenApiModel {
  @ApiProperty()
  answersCount: number;

  @ApiProperty()
  findingsCount: number;

  @ApiProperty()
  openFindingsCount: number;

  @ApiProperty()
  executedFindingsCount: number;

  @ApiProperty()
  closedFindingsCount: number;

  @ApiProperty()
  rejectedFindingsCount: number;

  @ApiProperty({ example: 75 })
  closureRate: number;

  @ApiProperty()
  evidencesCount: number;

  @ApiProperty()
  commentsCount: number;
}

export class InspectionExportPayloadOpenApiModel {
  @ApiProperty({ format: 'date-time' })
  generatedAt: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  inspection: Record<string, unknown>;

  @ApiProperty({ type: 'object', additionalProperties: true })
  checklist: Record<string, unknown>;

  @ApiProperty({ type: 'array', items: { type: 'object', additionalProperties: true } })
  answers: Record<string, unknown>[];

  @ApiProperty({ type: 'array', items: { type: 'object', additionalProperties: true } })
  findings: Record<string, unknown>[];

  @ApiProperty({ type: () => [EvidenceOpenApiModel] })
  evidences: EvidenceOpenApiModel[];

  @ApiProperty({ type: 'object', additionalProperties: true })
  evidenceGroups: Record<string, unknown>;

  @ApiProperty({ type: () => [InspectionCommentOpenApiModel] })
  comments: InspectionCommentOpenApiModel[];

  @ApiProperty({ type: () => InspectionExportSummaryOpenApiModel })
  summary: InspectionExportSummaryOpenApiModel;
}
