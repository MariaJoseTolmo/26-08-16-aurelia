import type { ID, ISODateString } from '../types/common';

export interface Mue {
  id: ID;
  code: string;
  name: string;
  description: string | null;
  predominantControlType: string | null;
  expectedMainEvidence: string | null;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface MueDetail extends Mue {
  controls: CriticalControl[];
}

export interface CriticalControl {
  id: ID;
  mueId: ID;
  code: string;
  name: string;
  description: string | null;
  controlType: string;
  objective: string | null;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ControlVerificationItem {
  id: ID;
  criticalControlId: ID;
  code: string;
  question: string | null;
  requirementText: string | null;
  evidenceType: string | null;
  expectedEvidence: string | null;
  sortOrder: number;
  isRequired: boolean;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ControlAreaAssignment {
  id: ID;
  mueId: ID;
  criticalControlId: ID | null;
  areaId: ID | null;
  gerenciaId: ID | null;
  companyId: ID | null;
  responsibleUserId: ID | null;
  areaNameSnapshot: string | null;
  responsibleNameSnapshot: string | null;
  responsibleRole: string | null;
  isPrimary: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
