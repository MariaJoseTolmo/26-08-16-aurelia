import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { readApiEnv } from '../config/env';
import { UserSessionEntity } from '../modules/auth/entities/user-session.entity';
import { AuditLogEntity } from '../modules/audit/entities/audit-log.entity';
import { CommentEntity } from '../modules/comments/entities/comment.entity';
import { EntityReferenceTypeEntity } from '../modules/evidences/entities/entity-reference-type.entity';
import { EvidenceLinkEntity } from '../modules/evidences/entities/evidence-link.entity';
import { EvidenceEntity } from '../modules/evidences/entities/evidence.entity';
import { FileEntity } from '../modules/files/entities/file.entity';
import { IncidentActionEvidenceEntity } from '../modules/incidents/entities/incident-action-evidence.entity';
import { IncidentActionPlanEntity } from '../modules/incidents/entities/incident-action-plan.entity';
import { IncidentDisseminationEntity } from '../modules/incidents/entities/incident-dissemination.entity';
import { IncidentFiveWhyAnalysisEntity } from '../modules/incidents/entities/incident-five-why-analysis.entity';
import { IncidentFlashReportEntity } from '../modules/incidents/entities/incident-flash-report.entity';
import { IncidentImmediateActionEntity } from '../modules/incidents/entities/incident-immediate-action.entity';
import { IncidentInvestigationTeamEntity } from '../modules/incidents/entities/incident-investigation-team.entity';
import { IncidentInvestigationEntity } from '../modules/incidents/entities/incident-investigation.entity';
import { IncidentInvolvedPersonEntity } from '../modules/incidents/entities/incident-involved-person.entity';
import { IncidentLevelEntity } from '../modules/incidents/entities/incident-level.entity';
import { IncidentPeepoAnalysisEntity } from '../modules/incidents/entities/incident-peepo-analysis.entity';
import { IncidentStatusHistoryEntity } from '../modules/incidents/entities/incident-status-history.entity';
import { IncidentTimelineEventEntity } from '../modules/incidents/entities/incident-timeline-event.entity';
import { IncidentTypeEntity } from '../modules/incidents/entities/incident-type.entity';
import { IncidentValidationEntity } from '../modules/incidents/entities/incident-validation.entity';
import { IncidentEntity } from '../modules/incidents/entities/incident.entity';
import { InspectionAiAssessmentEntity } from '../modules/inspections/entities/inspection-ai-assessment.entity';
import { InspectionFindingEntity } from '../modules/inspections/entities/inspection-finding.entity';
import { InspectionFindingResponsibleEntity } from '../modules/inspections/entities/inspection-finding-responsible.entity';
import { InspectionFindingSeverityEntity } from '../modules/inspections/entities/inspection-finding-severity.entity';
import { InspectionFindingTypeEntity } from '../modules/inspections/entities/inspection-finding-type.entity';
import { InspectionFollowupEntity } from '../modules/inspections/entities/inspection-followup.entity';
import { InspectionFormItemEntity } from '../modules/inspections/entities/inspection-form-item.entity';
import { InspectionFormSectionEntity } from '../modules/inspections/entities/inspection-form-section.entity';
import { InspectionFormTemplateEntity } from '../modules/inspections/entities/inspection-form-template.entity';
import { InspectionItemResponseEntity } from '../modules/inspections/entities/inspection-item-response.entity';
import { InspectionProcessRequestEntity } from '../modules/inspections/entities/inspection-process-request.entity';
import { InspectionRiskConsequenceEntity } from '../modules/inspections/entities/inspection-risk-consequence.entity';
import { InspectionRiskProbabilityEntity } from '../modules/inspections/entities/inspection-risk-probability.entity';
import { InspectionSlaEventEntity } from '../modules/inspections/entities/inspection-sla-event.entity';
import { InspectionSlaPolicyEntity } from '../modules/inspections/entities/inspection-sla-policy.entity';
import { InspectionStateEntity } from '../modules/inspections/entities/inspection-state.entity';
import { InspectionTypeEntity } from '../modules/inspections/entities/inspection-type.entity';
import { InspectionEntity } from '../modules/inspections/entities/inspection.entity';
import { InspectionLegacyImportEntity } from '../modules/inspection-legacy-import/entities/inspection-legacy-import.entity';
import { InspectionLegacyMilestoneEntity } from '../modules/inspection-legacy-import/entities/inspection-legacy-milestone.entity';
import { InspectionLegacyParticipantEntity } from '../modules/inspection-legacy-import/entities/inspection-legacy-participant.entity';
import { InspectionLegacySectorLinkEntity } from '../modules/inspection-legacy-import/entities/inspection-legacy-sector-link.entity';
import { ControlAreaAssignmentEntity } from '../modules/mue/entities/control-area-assignment.entity';
import { ControlEvidenceEntity } from '../modules/mue/entities/control-evidence.entity';
import { ControlSelfAssessmentAnswerEntity } from '../modules/mue/entities/control-self-assessment-answer.entity';
import { ControlSelfAssessmentEntity } from '../modules/mue/entities/control-self-assessment.entity';
import { ControlVerificationItemEntity } from '../modules/mue/entities/control-verification-item.entity';
import { CriticalControlEntity } from '../modules/mue/entities/critical-control.entity';
import { MueEntity } from '../modules/mue/entities/mue.entity';
import { NotificationDeliveryEntity } from '../modules/notifications/entities/notification-delivery.entity';
import { NotificationRecipientEntity } from '../modules/notifications/entities/notification-recipient.entity';
import { NotificationEntity } from '../modules/notifications/entities/notification.entity';
import { AreaEntity } from '../modules/organization/entities/area.entity';
import { BusinessUnitEntity } from '../modules/organization/entities/business-unit.entity';
import { CompanyEntity } from '../modules/organization/entities/company.entity';
import { GerenciaEntity } from '../modules/organization/entities/gerencia.entity';
import { LocationEntity } from '../modules/organization/entities/location.entity';
import { SectorEntity } from '../modules/organization/entities/sector.entity';
import { PermissionEntity } from '../modules/roles/entities/permission.entity';
import { RolePermissionEntity } from '../modules/roles/entities/role-permission.entity';
import { RoleEntity } from '../modules/roles/entities/role.entity';
import { SprConsolidationRuleEntity } from '../modules/spr/entities/spr-consolidation-rule.entity';
import { SprCycleSacSubmissionEntity } from '../modules/spr/entities/spr-cycle-sac-submission.entity';
import { SprCycleSignatureEntity } from '../modules/spr/entities/spr-cycle-signature.entity';
import { SprCycleValidationEntity } from '../modules/spr/entities/spr-cycle-validation.entity';
import { SprCycleEntity } from '../modules/spr/entities/spr-cycle.entity';
import { SprMeasureGroupEntity } from '../modules/spr/entities/spr-measure-group.entity';
import { SprMonthlyRecordEntity } from '../modules/spr/entities/spr-monthly-record.entity';
import { SprParameterAreaAssignmentEntity } from '../modules/spr/entities/spr-parameter-area-assignment.entity';
import { SprParameterEntity } from '../modules/spr/entities/spr-parameter.entity';
import { SprRecordApprovalEntity } from '../modules/spr/entities/spr-record-approval.entity';
import { SprUnitEntity } from '../modules/spr/entities/spr-unit.entity';
import { UserAreaEntity } from '../modules/users/entities/user-area.entity';
import { UserCompanyEntity } from '../modules/users/entities/user-company.entity';
import { UserRoleEntity } from '../modules/users/entities/user-role.entity';
import { UserEntity } from '../modules/users/entities/user.entity';
import { WasteInventoryMovementEntity } from '../modules/waste/entities/waste-inventory-movement.entity';
import { WasteLotEntity } from '../modules/waste/entities/waste-lot.entity';
import { WasteOperationalCategoryEntity } from '../modules/waste/entities/waste-operational-category.entity';
import { WasteReceiptEntity } from '../modules/waste/entities/waste-receipt.entity';
import { WasteSidrepRecordEntity } from '../modules/waste/entities/waste-sidrep-record.entity';
import { WasteSinaderPeriodLineEntity } from '../modules/waste/entities/waste-sinader-period-line.entity';
import { WasteSinaderPeriodEntity } from '../modules/waste/entities/waste-sinader-period.entity';
import { WasteTypeEntity } from '../modules/waste/entities/waste-type.entity';
import { WasteUnitEntity } from '../modules/waste/entities/waste-unit.entity';
import { WasteWarehouseEntity } from '../modules/waste/entities/waste-warehouse.entity';
import { WasteWithdrawalItemEntity } from '../modules/waste/entities/waste-withdrawal-item.entity';
import { WasteWithdrawalRequestEntity } from '../modules/waste/entities/waste-withdrawal-request.entity';
import { WorkflowDefinitionStepEntity } from '../modules/workflows/entities/workflow-definition-step.entity';
import { WorkflowDefinitionEntity } from '../modules/workflows/entities/workflow-definition.entity';
import { WorkflowInstanceStepEntity } from '../modules/workflows/entities/workflow-instance-step.entity';
import { WorkflowInstanceEntity } from '../modules/workflows/entities/workflow-instance.entity';

config();

const env = readApiEnv();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.database.host,
  port: env.database.port,
  username: env.database.username,
  password: env.database.password,
  database: env.database.name,
  ssl: env.database.ssl ? { rejectUnauthorized: false } : false,
  entities: [
    BusinessUnitEntity,
    GerenciaEntity,
    AreaEntity,
    SectorEntity,
    LocationEntity,
    CompanyEntity,
    UserEntity,
    UserSessionEntity,
    RoleEntity,
    PermissionEntity,
    UserRoleEntity,
    RolePermissionEntity,
    UserCompanyEntity,
    UserAreaEntity,
    FileEntity,
    EntityReferenceTypeEntity,
    EvidenceEntity,
    EvidenceLinkEntity,
    CommentEntity,
    AuditLogEntity,
    NotificationEntity,
    NotificationRecipientEntity,
    NotificationDeliveryEntity,
    MueEntity,
    CriticalControlEntity,
    ControlVerificationItemEntity,
    ControlAreaAssignmentEntity,
    ControlSelfAssessmentEntity,
    ControlSelfAssessmentAnswerEntity,
    ControlEvidenceEntity,
    WorkflowDefinitionEntity,
    WorkflowDefinitionStepEntity,
    WorkflowInstanceEntity,
    WorkflowInstanceStepEntity,
    InspectionTypeEntity,
    InspectionFormTemplateEntity,
    InspectionFormSectionEntity,
    InspectionFormItemEntity,
    InspectionEntity,
    InspectionItemResponseEntity,
    InspectionFindingEntity,
    InspectionFindingTypeEntity,
    InspectionFindingSeverityEntity,
    InspectionFindingResponsibleEntity,
    InspectionFollowupEntity,
    InspectionRiskProbabilityEntity,
    InspectionRiskConsequenceEntity,
    InspectionStateEntity,
    InspectionProcessRequestEntity,
    InspectionSlaPolicyEntity,
    InspectionSlaEventEntity,
    InspectionAiAssessmentEntity,
    InspectionLegacyImportEntity,
    InspectionLegacyMilestoneEntity,
    InspectionLegacyParticipantEntity,
    InspectionLegacySectorLinkEntity,
    IncidentTypeEntity,
    IncidentLevelEntity,
    IncidentEntity,
    IncidentInvolvedPersonEntity,
    IncidentImmediateActionEntity,
    IncidentFlashReportEntity,
    IncidentValidationEntity,
    IncidentInvestigationEntity,
    IncidentInvestigationTeamEntity,
    IncidentPeepoAnalysisEntity,
    IncidentTimelineEventEntity,
    IncidentFiveWhyAnalysisEntity,
    IncidentActionPlanEntity,
    IncidentActionEvidenceEntity,
    IncidentStatusHistoryEntity,
    IncidentDisseminationEntity,
    SprMeasureGroupEntity,
    SprUnitEntity,
    SprParameterEntity,
    SprParameterAreaAssignmentEntity,
    SprMonthlyRecordEntity,
    SprRecordApprovalEntity,
    SprConsolidationRuleEntity,
    SprCycleEntity,
    SprCycleSacSubmissionEntity,
    SprCycleSignatureEntity,
    SprCycleValidationEntity,
    WasteUnitEntity,
    WasteOperationalCategoryEntity,
    WasteTypeEntity,
    WasteWarehouseEntity,
    WasteReceiptEntity,
    WasteLotEntity,
    WasteInventoryMovementEntity,
    WasteWithdrawalRequestEntity,
    WasteWithdrawalItemEntity,
    WasteSidrepRecordEntity,
    WasteSinaderPeriodEntity,
    WasteSinaderPeriodLineEntity,
  ],
  // Only timestamp-prefixed, versioned migrations are executable. This deliberately
  // ignores stale generated-auto-schema-sync artifacts that may survive an overlay deployment.
  migrations: [__dirname + '/migrations/[0-9]*-*{.ts,.js}'],
  synchronize: env.database.synchronize,
});
