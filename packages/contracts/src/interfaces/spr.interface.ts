import type { RecordStatus, SprApprovalStatus, SprConsolidationMethod, SprRecordStatus } from '../enums';
import type { ID, ISODateString } from '../types/common';
import type { BaseEntity } from './entity.interface';

export interface SprMeasureGroup extends BaseEntity {
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  status: RecordStatus;
}

export interface SprUnit extends BaseEntity {
  code: string;
  name: string;
  symbol: string | null;
  status: RecordStatus;
}

export interface SprParameter extends BaseEntity {
  measureGroupId: ID;
  unitId: ID | null;
  code: string;
  name: string;
  description: string | null;
  isSox: boolean;
  requiresEvidence: boolean;
  valueType: string;
  sortOrder: number;
  status: RecordStatus;
}

export interface SprParameterAreaAssignment extends BaseEntity {
  parameterId: ID;
  areaId: ID | null;
  responsibleUserId: ID | null;
  approverUserId: ID | null;
  status: RecordStatus;
}

export interface SprMonthlyRecord extends BaseEntity {
  parameterId: ID;
  areaId: ID | null;
  assignmentId: ID | null;
  periodYear: number;
  periodMonth: number;
  numericValue: number | null;
  textValue: string | null;
  booleanValue: boolean | null;
  status: SprRecordStatus;
  submittedByUserId: ID | null;
  /** Nombre completo del usuario que envió (enriquecido en respuesta API; no es columna). */
  submittedByFullName?: string | null;
  submittedAt: ISODateString | null;
  approvedByUserId: ID | null;
  /** Nombre completo del usuario que aprobó (enriquecido en respuesta API; no es columna). */
  approvedByFullName?: string | null;
  approvedAt: ISODateString | null;
  notes: string | null;
}

export interface SprRecordApproval extends BaseEntity {
  recordId: ID;
  approverUserId: ID | null;
  status: SprApprovalStatus;
  comments: string | null;
  decidedAt: ISODateString | null;
}

export interface SprConsolidationRule extends BaseEntity {
  parameterId: ID;
  code: string;
  name: string;
  method: SprConsolidationMethod;
  config: Record<string, unknown> | null;
  status: RecordStatus;
}
