import {
  InspectionAnswerValue,
  InspectionEvidenceRelationType,
  InspectionFindingSeverity,
  InspectionFindingStatus,
  InspectionItemResponseType,
  InspectionStatus,
  InspectionType,
  type InspectionAssignmentScopeResponse,
  type InspectionDetailChecklistAnswerResponse,
  type InspectionDetailChecklistItemResponse,
  type InspectionDetailChecklistResultResponse,
  type InspectionDetailChecklistSectionResponse,
  type InspectionDetailChecklistSummaryResponse,
  type InspectionDetailEvidenceResponse,
  type InspectionDetailFindingItemResponse,
  type InspectionDetailFollowupResponse,
  type InspectionDetailGeneralResponse,
  type InspectionDetailHeaderResponse,
  type InspectionDetailLegacyDataAvailabilityResponse,
  type InspectionDetailLegacyMilestoneResponse,
  type InspectionDetailLegacyParticipantResponse,
  type InspectionDetailLegacySectorResponse,
  type InspectionDetailLegacySummaryResponse,
  type InspectionDetailResponsibleResponse,
  type InspectionDetailResponse,
  type InspectionFindingResponse,
  type InspectionFindingSlaReassignmentResponse,
  type InspectionManagementTableFilterOptionsResponse,
  type InspectionManagementTableObservationSummaryResponse,
  type InspectionManagementTableResponse,
  type InspectionManagementTableRowResponse,
  type InspectionResponse,
} from '@aurelia/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const uuid = { type: String, format: 'uuid' } as const;
const nullableUuid = { type: String, format: 'uuid', nullable: true } as const;
const nullableDateTime = { type: String, format: 'date-time', nullable: true } as const;

export class InspectionOpenApiModel implements InspectionResponse {
  @ApiProperty(uuid)
  id: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;

  @ApiProperty(uuid)
  inspectionTypeId: string;

  @ApiProperty(nullableUuid)
  templateId: string | null;

  @ApiProperty(nullableUuid)
  companyId: string | null;

  @ApiProperty(nullableUuid)
  areaId: string | null;

  @ApiProperty(nullableUuid)
  sectorId: string | null;

  @ApiProperty(nullableUuid)
  locationId: string | null;

  @ApiProperty(nullableUuid)
  inspectorId: string | null;

  @ApiProperty({ example: 'Inspección ambiental - Depósito de relaves' })
  title: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ enum: InspectionStatus, enumName: 'InspectionStatus' })
  status: InspectionStatus;

  @ApiProperty(nullableDateTime)
  scheduledAt: string | null;

  @ApiProperty(nullableDateTime)
  startedAt: string | null;

  @ApiProperty(nullableDateTime)
  completedAt: string | null;

  @ApiProperty(nullableDateTime)
  closedAt: string | null;

  @ApiProperty({ nullable: true, example: '-23.096000' })
  latitude: string | null;

  @ApiProperty({ nullable: true, example: '-68.214000' })
  longitude: string | null;

  @ApiProperty({ nullable: true, example: '95.50' })
  score: string | null;

  @ApiProperty({ example: 4 })
  findingsCount: number;

  @ApiProperty({ example: 1 })
  openFindingsCount: number;

  @ApiProperty({ nullable: true })
  notes: string | null;
}

export class InspectionFindingOpenApiModel implements InspectionFindingResponse {
  @ApiProperty(uuid)
  id: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;

  @ApiProperty(uuid)
  inspectionId: string;

  @ApiProperty(nullableUuid)
  checklistItemId: string | null;

  @ApiProperty(nullableUuid)
  findingTypeId: string | null;

  @ApiProperty(nullableUuid)
  severityId: string | null;

  @ApiProperty(nullableUuid)
  responsibleCompanyId: string | null;

  @ApiProperty({ type: [String], format: 'uuid' })
  responsibleUserIds: string[];

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ nullable: true })
  detectedCondition: string | null;

  @ApiProperty({ nullable: true })
  proposedCorrectiveAction: string | null;

  @ApiProperty({ nullable: true })
  executedActionDescription: string | null;

  @ApiProperty({ nullable: true })
  rejectionReason: string | null;

  @ApiProperty({ enum: InspectionFindingSeverity, enumName: 'InspectionFindingSeverity' })
  severity: InspectionFindingSeverity;

  @ApiProperty({ enum: InspectionFindingStatus, enumName: 'InspectionFindingStatus' })
  status: InspectionFindingStatus;

  @ApiProperty(nullableUuid)
  ownerUserId: string | null;

  @ApiProperty(nullableUuid)
  createdByUserId: string | null;

  @ApiProperty(nullableDateTime)
  dueAt: string | null;

  @ApiProperty(nullableDateTime)
  executedAt: string | null;

  @ApiProperty(nullableUuid)
  executedByUserId: string | null;

  @ApiProperty(nullableDateTime)
  closedAt: string | null;

  @ApiProperty(nullableUuid)
  closedByUserId: string | null;

  @ApiProperty(nullableDateTime)
  rejectedAt: string | null;

  @ApiProperty(nullableUuid)
  rejectedByUserId: string | null;
}

export class InspectionAssignmentScopeOpenApiModel implements InspectionAssignmentScopeResponse {
  @ApiProperty({ example: true })
  canSelectCompany: boolean;

  @ApiProperty(nullableUuid)
  companyId: string | null;

  @ApiProperty({ nullable: true, example: 'Gold Fields' })
  companyName: string | null;
}

export class InspectionDashboardStatusCountsOpenApiModel {
  @ApiProperty({ additionalProperties: { type: 'number' }, example: { draft: 1, in_progress: 4, closed: 20 } })
  values: Record<InspectionStatus, number>;
}

export class InspectionDashboardFindingStatusCountsOpenApiModel {
  @ApiProperty({ additionalProperties: { type: 'number' }, example: { open: 3, in_progress: 1, closed: 18 } })
  values: Record<InspectionFindingStatus, number>;
}

export class InspectionDashboardSeverityCountsOpenApiModel {
  @ApiProperty({ additionalProperties: { type: 'number' }, example: { low: 4, medium: 8, high: 2, critical: 0 } })
  values: Record<InspectionFindingSeverity, number>;
}

export class InspectionDashboardInspectionsOpenApiModel {
  @ApiProperty({ example: 133 })
  total: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    example: { draft: 1, scheduled: 2, in_progress: 42, closed: 88 },
  })
  byStatus: Record<InspectionStatus, number>;

  @ApiProperty({ example: 35 })
  withOpenFindings: number;

  @ApiProperty({ example: 55.56 })
  closedRate: number;
}

export class InspectionDashboardFindingsOpenApiModel {
  @ApiProperty({ example: 147 })
  total: number;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  byStatus: Record<InspectionFindingStatus, number>;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  bySeverity: Record<InspectionFindingSeverity, number>;

  @ApiProperty({ example: 42 })
  open: number;

  @ApiProperty({ example: 3 })
  overdue: number;

  @ApiProperty({ example: 5 })
  dueSoonNext7Days: number;
}

export class InspectionDashboardSummaryOpenApiModel {
  @ApiProperty({ type: () => InspectionDashboardInspectionsOpenApiModel })
  inspections: InspectionDashboardInspectionsOpenApiModel;

  @ApiProperty({ type: () => InspectionDashboardFindingsOpenApiModel })
  findings: InspectionDashboardFindingsOpenApiModel;
}

export class InspectionManagementObservationSummaryOpenApiModel
implements InspectionManagementTableObservationSummaryResponse {
  @ApiProperty({ example: 1 })
  executed: number;

  @ApiProperty({ example: 2 })
  open: number;

  @ApiProperty({ example: 4 })
  closed: number;

  @ApiProperty({ example: 0 })
  rejected: number;
}

export class InspectionManagementTableRowOpenApiModel implements InspectionManagementTableRowResponse {
  @ApiProperty(uuid)
  inspectionId: string;

  @ApiProperty({ example: '#2026-103' })
  inspectionNumber: string;

  @ApiProperty({ nullable: true, example: '18-02-26' })
  date: string | null;

  @ApiProperty({ example: 'Karen O.' })
  inspector: string;

  @ApiProperty({ example: 'Exploraciones · Horizonte' })
  areaSector: string;

  @ApiProperty({ example: 'Eco Minera' })
  company: string;

  @ApiProperty({ example: 'Hallazgo' })
  type: string;

  @ApiProperty({ example: 'Abierta · Grave' })
  urgencyLabel: string;

  @ApiProperty({ enum: InspectionFindingSeverity, enumName: 'InspectionFindingSeverity', nullable: true })
  urgencySeverity: InspectionFindingSeverity | null;

  @ApiPropertyOptional({ example: 'Rechazada · Crítico' })
  rejectedUrgencyLabel?: string;

  @ApiPropertyOptional({ example: false })
  hasOverdueFindings?: boolean;

  @ApiProperty({ example: 16 })
  observationsCount: number;

  @ApiProperty({ type: () => InspectionManagementObservationSummaryOpenApiModel })
  observations: InspectionManagementObservationSummaryOpenApiModel;

  @ApiProperty({ example: 12 })
  daysOpen: number;

  @ApiProperty({ example: 75 })
  closureRate: number;

  @ApiPropertyOptional({ example: true })
  isLegacy?: boolean;

  @ApiPropertyOptional({ example: true })
  readOnly?: boolean;
}

export class InspectionManagementFilterOptionsOpenApiModel
implements InspectionManagementTableFilterOptionsResponse {
  @ApiProperty({ type: [String] })
  inspectors: string[];

  @ApiProperty({ type: [String] })
  areas: string[];

  @ApiProperty({ type: [String] })
  companies: string[];

  @ApiProperty({ type: [String], example: ['Checklist', 'Hallazgo'] })
  types: string[];

  @ApiProperty({ type: [String] })
  urgencies: string[];
}

export class InspectionManagementTableOpenApiModel implements InspectionManagementTableResponse {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  pageSize: number;

  @ApiProperty({ example: 2256 })
  total: number;

  @ApiProperty({ example: 226 })
  totalPages: number;

  @ApiProperty({ type: () => [InspectionManagementTableRowOpenApiModel] })
  rows: InspectionManagementTableRowOpenApiModel[];

  @ApiProperty({ type: () => InspectionManagementFilterOptionsOpenApiModel })
  filterOptions: InspectionManagementFilterOptionsOpenApiModel;
}

export class InspectionDetailCountsOpenApiModel {
  @ApiProperty({ example: 1 })
  executed: number;

  @ApiProperty({ example: 2 })
  open: number;

  @ApiProperty({ example: 1 })
  closed: number;

  @ApiProperty({ example: 0 })
  rejected: number;
}

export class InspectionDetailHeaderOpenApiModel implements InspectionDetailHeaderResponse {
  @ApiProperty(uuid)
  inspectionId: string;

  @ApiProperty({ example: '#369' })
  inspectionNumber: string;

  @ApiProperty({ example: 'Servicios Generales · GARDE CORPS' })
  title: string;

  @ApiProperty({ enum: ['finding', 'checklist'] })
  kind: 'finding' | 'checklist';

  @ApiProperty({ enum: InspectionType, enumName: 'InspectionType' })
  inspectionType: InspectionType | string;

  @ApiProperty({ example: 'Hallazgo · 03-06-2026 · Campamento Antiguo' })
  metadataLine1: string;

  @ApiProperty({ nullable: true, example: 'Tipo de hallazgo: Seguridad ambiental' })
  metadataLine2: string | null;

  @ApiProperty({ example: 20 })
  progressPercent: number;

  @ApiProperty({ type: () => InspectionDetailCountsOpenApiModel })
  counts: Record<'executed' | 'open' | 'closed' | 'rejected', number>;
}

export class InspectionDetailEvidenceOpenApiModel implements InspectionDetailEvidenceResponse {
  @ApiProperty(uuid)
  evidenceId: string;

  @ApiProperty(nullableUuid)
  fileId: string | null;

  @ApiProperty({ nullable: true })
  title: string | null;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ enum: InspectionEvidenceRelationType, enumName: 'InspectionEvidenceRelationType', nullable: true })
  relationType: InspectionEvidenceRelationType | string | null;

  @ApiProperty(nullableDateTime)
  capturedAt: string | null;

  @ApiProperty({ nullable: true, format: 'uri' })
  url: string | null;
}

export class InspectionDetailResponsibleOpenApiModel implements InspectionDetailResponsibleResponse {
  @ApiProperty(uuid)
  userId: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ nullable: true })
  position: string | null;

  @ApiProperty(nullableUuid)
  companyId: string | null;

  @ApiProperty({ nullable: true })
  companyName: string | null;

  @ApiProperty()
  currentUser: boolean;
}

export class InspectionDetailFindingItemOpenApiModel implements InspectionDetailFindingItemResponse {
  @ApiProperty(uuid)
  findingId: string;

  @ApiProperty(nullableUuid)
  checklistItemId: string | null;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  condition: string | null;

  @ApiProperty({ nullable: true })
  proposedCorrectiveAction: string | null;

  @ApiProperty({ nullable: true })
  executedActionDescription: string | null;

  @ApiProperty({ nullable: true })
  rejectionReason: string | null;

  @ApiProperty({ enum: InspectionFindingSeverity, enumName: 'InspectionFindingSeverity' })
  severity: InspectionFindingSeverity;

  @ApiProperty()
  severityLabel: string;

  @ApiProperty({ enum: InspectionFindingStatus, enumName: 'InspectionFindingStatus' })
  status: InspectionFindingStatus;

  @ApiProperty({ enum: ['executed', 'open', 'closed', 'rejected'] })
  statusGroup: 'executed' | 'open' | 'closed' | 'rejected';

  @ApiProperty(nullableUuid)
  responsibleCompanyId: string | null;

  @ApiProperty({ nullable: true })
  responsibleCompanyName: string | null;

  @ApiProperty({ type: () => [InspectionDetailResponsibleOpenApiModel] })
  responsibleUsers: InspectionDetailResponsibleOpenApiModel[];

  @ApiProperty(nullableDateTime)
  dueAt: string | null;

  @ApiProperty(nullableDateTime)
  executedAt: string | null;

  @ApiProperty(nullableDateTime)
  closedAt: string | null;

  @ApiProperty(nullableDateTime)
  rejectedAt: string | null;

  @ApiProperty({ type: () => [InspectionDetailEvidenceOpenApiModel] })
  beforeEvidence: InspectionDetailEvidenceOpenApiModel[];

  @ApiProperty({ type: () => [InspectionDetailEvidenceOpenApiModel] })
  afterEvidence: InspectionDetailEvidenceOpenApiModel[];
}

export class InspectionDetailFindingGroupsOpenApiModel {
  @ApiProperty({ type: () => [InspectionDetailFindingItemOpenApiModel] })
  executed: InspectionDetailFindingItemOpenApiModel[];

  @ApiProperty({ type: () => [InspectionDetailFindingItemOpenApiModel] })
  open: InspectionDetailFindingItemOpenApiModel[];

  @ApiProperty({ type: () => [InspectionDetailFindingItemOpenApiModel] })
  closed: InspectionDetailFindingItemOpenApiModel[];

  @ApiProperty({ type: () => [InspectionDetailFindingItemOpenApiModel] })
  rejected: InspectionDetailFindingItemOpenApiModel[];
}

export class InspectionDetailFollowupOpenApiModel implements InspectionDetailFollowupResponse {
  @ApiProperty(uuid)
  followupId: string;

  @ApiProperty(uuid)
  findingId: string;

  @ApiProperty({ example: 1 })
  sequenceNumber: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty(nullableDateTime)
  performedAt: string | null;

  @ApiProperty(nullableUuid)
  performedByUserId: string | null;

  @ApiProperty({ nullable: true })
  performedByName: string | null;

  @ApiProperty()
  completed: boolean;
}

export class InspectionFindingSlaReassignmentOpenApiModel
implements InspectionFindingSlaReassignmentResponse {
  @ApiProperty(uuid)
  id: string;

  @ApiProperty(uuid)
  findingId: string;

  @ApiProperty(uuid)
  inspectionId: string;

  @ApiProperty({ example: 1 })
  findingNumber: number;

  @ApiProperty()
  findingTitle: string;

  @ApiProperty({ example: 2 })
  previousSlaBusinessDays: number;

  @ApiProperty({ example: 5 })
  newSlaBusinessDays: number;

  @ApiProperty(nullableDateTime)
  previousDueAt: string | null;

  @ApiProperty({ format: 'date-time' })
  newDueAt: string;

  @ApiProperty()
  reason: string;

  @ApiProperty({ format: 'date-time' })
  reassignedAt: string;

  @ApiProperty(nullableUuid)
  reassignedByUserId: string | null;

  @ApiProperty({ nullable: true })
  reassignedByName: string | null;
}

export class InspectionDetailGeneralOpenApiModel implements InspectionDetailGeneralResponse {
  @ApiProperty({ nullable: true })
  inspectorName: string | null;

  @ApiProperty({ nullable: true })
  inspectorCompanyName: string | null;

  @ApiProperty({ nullable: true })
  areaName: string | null;

  @ApiProperty({ nullable: true })
  sectorName: string | null;

  @ApiProperty({ nullable: true })
  companyName: string | null;

  @ApiProperty({ nullable: true })
  templateName: string | null;

  @ApiProperty({ nullable: true })
  templateCode: string | null;

  @ApiProperty(nullableDateTime)
  scheduledAt: string | null;

  @ApiProperty({ nullable: true })
  locationLabel: string | null;

  @ApiProperty({ nullable: true })
  latitude: string | null;

  @ApiProperty({ nullable: true })
  longitude: string | null;

  @ApiProperty({ type: () => [InspectionDetailEvidenceOpenApiModel] })
  generalEvidence: InspectionDetailEvidenceOpenApiModel[];

  @ApiProperty({ type: () => [InspectionDetailResponsibleOpenApiModel] })
  responsibles: InspectionDetailResponsibleOpenApiModel[];
}

export class InspectionDetailChecklistAnswerOpenApiModel implements InspectionDetailChecklistAnswerResponse {
  @ApiProperty({ enum: InspectionAnswerValue, enumName: 'InspectionAnswerValue', nullable: true })
  value: InspectionAnswerValue | string | null;

  @ApiProperty({ nullable: true })
  text: string | null;

  @ApiProperty({ nullable: true })
  numericValue: string | null;

  @ApiProperty({ nullable: true })
  notes: string | null;

  @ApiProperty(nullableDateTime)
  answeredAt: string | null;

  @ApiProperty(nullableUuid)
  answeredByUserId: string | null;

  @ApiProperty({ nullable: true })
  answeredByName: string | null;
}

export class InspectionDetailChecklistItemOpenApiModel implements InspectionDetailChecklistItemResponse {
  @ApiProperty(uuid)
  checklistItemId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  question: string;

  @ApiProperty({ nullable: true })
  guidance: string | null;

  @ApiProperty({ enum: InspectionItemResponseType, enumName: 'InspectionItemResponseType' })
  responseType: InspectionItemResponseType;

  @ApiProperty()
  isRequired: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ nullable: true })
  weight: string | null;

  @ApiProperty({ type: () => InspectionDetailChecklistAnswerOpenApiModel, nullable: true })
  answer: InspectionDetailChecklistAnswerOpenApiModel | null;
}

export class InspectionDetailChecklistSectionOpenApiModel implements InspectionDetailChecklistSectionResponse {
  @ApiProperty(uuid)
  sectionId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ type: () => [InspectionDetailChecklistItemOpenApiModel] })
  items: InspectionDetailChecklistItemOpenApiModel[];
}

export class InspectionDetailChecklistSummaryOpenApiModel implements InspectionDetailChecklistSummaryResponse {
  @ApiProperty() total: number;
  @ApiProperty() answered: number;
  @ApiProperty() compliant: number;
  @ApiProperty() notCompliant: number;
  @ApiProperty() notApplicable: number;
  @ApiProperty() partial: number;
  @ApiProperty() notObserved: number;
  @ApiProperty() unanswered: number;
}

export class InspectionDetailChecklistResultOpenApiModel implements InspectionDetailChecklistResultResponse {
  @ApiProperty({ type: () => InspectionDetailChecklistSummaryOpenApiModel })
  summary: InspectionDetailChecklistSummaryOpenApiModel;

  @ApiProperty({ type: () => [InspectionDetailChecklistSectionOpenApiModel] })
  sections: InspectionDetailChecklistSectionOpenApiModel[];
}

export class InspectionDetailLegacyMilestoneOpenApiModel implements InspectionDetailLegacyMilestoneResponse {
  @ApiProperty() sequenceNumber: number;
  @ApiProperty(nullableDateTime) occurredAt: string | null;
  @ApiProperty() closedIncrement: number;
  @ApiProperty() pendingAfter: number;
  @ApiProperty({ nullable: true }) closedPercentage: number | null;
  @ApiProperty({ nullable: true }) pendingPercentage: number | null;
}

export class InspectionDetailLegacyParticipantOpenApiModel implements InspectionDetailLegacyParticipantResponse {
  @ApiProperty(nullableUuid) userId: string | null;
  @ApiProperty({ nullable: true }) fullName: string | null;
  @ApiProperty() isPrimary: boolean;
}

export class InspectionDetailLegacySectorOpenApiModel implements InspectionDetailLegacySectorResponse {
  @ApiProperty(nullableUuid) sectorId: string | null;
  @ApiProperty({ nullable: true }) name: string | null;
  @ApiProperty() isPrimary: boolean;
}

export class InspectionDetailLegacyDataAvailabilityOpenApiModel
implements InspectionDetailLegacyDataAvailabilityResponse {
  @ApiProperty() findingDetails: boolean;
  @ApiProperty() checklistAnswers: boolean;
  @ApiProperty() comments: boolean;
  @ApiProperty() images: boolean;
}

export class InspectionDetailLegacySummaryOpenApiModel implements InspectionDetailLegacySummaryResponse {
  @ApiProperty() sourceSystem: string;
  @ApiProperty() legacyYear: number;
  @ApiProperty() legacyNumber: number;
  @ApiProperty({ enum: ['finding', 'checklist'] }) mode: 'finding' | 'checklist';
  @ApiProperty({ nullable: true }) originalInspectorName: string | null;
  @ApiProperty({ nullable: true }) originalAreaName: string | null;
  @ApiProperty({ nullable: true }) originalCompanyName: string | null;
  @ApiProperty({ nullable: true }) originalSectorName: string | null;
  @ApiProperty({ nullable: true }) originalDetail: string | null;
  @ApiProperty() totalObservations: number;
  @ApiProperty() closedObservations: number;
  @ApiProperty() openObservations: number;
  @ApiProperty({ type: () => [InspectionDetailLegacyMilestoneOpenApiModel] })
  milestones: InspectionDetailLegacyMilestoneOpenApiModel[];
  @ApiProperty({ type: () => [InspectionDetailLegacyParticipantOpenApiModel] })
  participants: InspectionDetailLegacyParticipantOpenApiModel[];
  @ApiProperty({ type: () => [InspectionDetailLegacySectorOpenApiModel] })
  sectors: InspectionDetailLegacySectorOpenApiModel[];
  @ApiProperty({ type: () => InspectionDetailLegacyDataAvailabilityOpenApiModel })
  dataAvailability: InspectionDetailLegacyDataAvailabilityOpenApiModel;
}

export class InspectionDetailOpenApiModel implements InspectionDetailResponse {
  @ApiProperty({ type: () => InspectionDetailHeaderOpenApiModel })
  header: InspectionDetailHeaderOpenApiModel;

  @ApiProperty({ type: () => InspectionDetailFindingGroupsOpenApiModel })
  findings: Record<'executed' | 'open' | 'closed' | 'rejected', InspectionDetailFindingItemOpenApiModel[]>;

  @ApiProperty({ type: () => [InspectionDetailFollowupOpenApiModel] })
  followups: InspectionDetailFollowupOpenApiModel[];

  @ApiPropertyOptional({ type: () => [InspectionFindingSlaReassignmentOpenApiModel] })
  slaReassignments?: InspectionFindingSlaReassignmentOpenApiModel[];

  @ApiProperty({ type: () => InspectionDetailGeneralOpenApiModel })
  general: InspectionDetailGeneralOpenApiModel;

  @ApiProperty({ type: () => InspectionDetailChecklistResultOpenApiModel, nullable: true })
  checklistResult: InspectionDetailChecklistResultOpenApiModel | null;

  @ApiPropertyOptional({ type: () => InspectionDetailLegacySummaryOpenApiModel, nullable: true })
  legacy?: InspectionDetailLegacySummaryOpenApiModel | null;
}
