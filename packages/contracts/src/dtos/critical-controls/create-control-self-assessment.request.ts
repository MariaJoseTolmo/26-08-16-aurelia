import type { ControlAnswerValue, ControlRiskLevel } from '../../enums';
import type { ID } from '../../types/common';

export interface CreateControlSelfAssessmentRequest {
  mueId: ID;
  criticalControlId?: ID | null;
  areaId?: ID | null;
  gerenciaId?: ID | null;
  companyId?: ID | null;
  periodYear: number;
  periodMonth: number;
}

export interface UpsertControlSelfAssessmentAnswerRequest {
  verificationItemId: ID;
  answer: ControlAnswerValue;
  comment?: string | null;
  riskLevel?: ControlRiskLevel | string | null;
  actionRequired?: boolean;
}

export interface UpsertControlSelfAssessmentAnswersRequest {
  answers: UpsertControlSelfAssessmentAnswerRequest[];
}
