import type { ControlAnswerValue, ControlAssessmentStatus, ControlRiskLevel } from '../enums';
import type { ID, ISODateString } from '../types/common';

export interface ControlSelfAssessment {
  id: ID;
  mueId: ID;
  criticalControlId: ID | null;
  areaId: ID | null;
  gerenciaId: ID | null;
  companyId: ID | null;
  periodYear: number;
  periodMonth: number;
  status: ControlAssessmentStatus;
  complianceScore: number | null;
  createdByUserId: ID | null;
  submittedByUserId: ID | null;
  validatedByUserId: ID | null;
  submittedAt: ISODateString | null;
  validatedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  answers: ControlSelfAssessmentAnswer[];
}

export interface ControlSelfAssessmentAnswer {
  id: ID;
  assessmentId: ID;
  verificationItemId: ID;
  answer: ControlAnswerValue;
  comment: string | null;
  riskLevel: ControlRiskLevel | string | null;
  actionRequired: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ControlEvidence {
  id: ID;
  answerId: ID;
  evidenceId: ID;
  relationType: string;
  createdAt: ISODateString;
}
