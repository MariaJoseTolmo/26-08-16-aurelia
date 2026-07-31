import type {
  SprConsolidationRule,
  SprCycle,
  SprCycleSacSubmission,
  SprCycleSignature,
  SprCycleValidation,
  SprMeasureGroup,
  SprMonthlyRecord,
  SprParameter,
  SprParameterAreaAssignment,
  SprRecordApproval,
  SprUnit,
} from '../../interfaces';

export type SprMeasureGroupResponse = SprMeasureGroup;
export type SprUnitResponse = SprUnit;
export type SprParameterResponse = SprParameter;
export type SprParameterAreaAssignmentResponse = SprParameterAreaAssignment;
export type SprMonthlyRecordResponse = SprMonthlyRecord;
export type SprRecordApprovalResponse = SprRecordApproval;
export type SprConsolidationRuleResponse = SprConsolidationRule;
export type SprCycleResponse = SprCycle;
export type SprCycleSacSubmissionResponse = SprCycleSacSubmission;
export type SprCycleSignatureResponse = SprCycleSignature;
export type SprCycleValidationResponse = SprCycleValidation;

export interface SprDashboardSummaryResponse {
  parameters: {
    total: number;
    sox: number;
    requiringEvidence: number;
  };
  records: {
    total: number;
    byStatus: Record<string, number>;
    missingEvidence: number;
  };
}

/** Persona activa elegible para firmar el reporte SPR (roster por rol). */
export interface SprSignerPersonResponse {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string | null;
}

/**
 * Roster de firmantes del reporte oficial.
 * specialists → SPR_SUSTAINABILITY_SPECIALIST
 * managers → SPR_ENVIRONMENT_MANAGER
 */
export interface SprSignersResponse {
  specialists: SprSignerPersonResponse[];
  managers: SprSignerPersonResponse[];
}
