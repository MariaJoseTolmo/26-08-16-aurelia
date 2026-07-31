import type {
  RecordStatus,
  SprApprovalStatus,
  SprConsolidationMethod,
  SprCycleSacSubmissionStatus,
  SprCycleSignatureLevel,
  SprCycleSignatureStatus,
  SprCycleStatus,
  SprCycleValidationStatus,
  SprRecordStatus,
} from '../enums';
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

/**
 * Ciclo corporativo SPR (Fase 1).
 * day9At = día 9 del mes siguiente al periodo de datos (date, ISO YYYY-MM-DD).
 * Estados sac_* / signing / validating reservados para fases posteriores — no afirmar envío/firmas sin tablas.
 */
export interface SprCycle extends BaseEntity {
  periodYear: number;
  periodMonth: number;
  label: string;
  status: SprCycleStatus;
  /** Día 9 del ciclo (date). */
  day9At: ISODateString;
  closedAt: ISODateString | null;
}

/**
 * Envío / artefacto SAC por ciclo (Fase 2).
 * Sin fila o status pending/preparing ≠ SAC disponible en UI.
 * Firmas / validación SOX = fases posteriores.
 */
export interface SprCycleSacSubmission extends BaseEntity {
  cycleId: ID;
  status: SprCycleSacSubmissionStatus;
  sentAt: ISODateString | null;
  reportReadyAt: ISODateString | null;
  externalRef: string | null;
  /** Snapshot opcional del consolidado enviado; null en Response v1 si no se usa. */
  payloadSnapshot: Record<string, unknown> | null;
}

/**
 * Firma del reporte SPR por ciclo (Fase 3).
 * Sin fila para un level = ese nivel no ha firmado.
 * Orden: specialist → environment_manager.
 */
export interface SprCycleSignature extends BaseEntity {
  cycleId: ID;
  level: SprCycleSignatureLevel;
  status: SprCycleSignatureStatus;
  signerUserId: ID | null;
  /** Nombre completo del firmante (join users); null si no hay signer. */
  signerFullName: string | null;
  signedAt: ISODateString | null;
}

/**
 * Validación SOX del reporte por ciclo + área (Fase 5).
 * Solo AREA-STECNICOS y AREA-OPTACTIVOS.
 * Sin fila = esa área aún no decidió (GET [] si nadie actuó).
 */
export interface SprCycleValidation extends BaseEntity {
  cycleId: ID;
  areaId: ID;
  areaCode: string;
  areaName: string;
  status: SprCycleValidationStatus;
  actorUserId: ID | null;
  actorFullName: string | null;
  comments: string | null;
  decidedAt: ISODateString | null;
  /** Momento de reopen (status reopened); null si no está reabierta. */
  reopenedAt: ISODateString | null;
}
