import {
  SprCycleValidationStatus,
  SprRecordStatus,
  type SprCycleValidationResponse,
  type SprMonthlyRecordResponse,
} from '@aurelia/contracts';
import { SPR_ACTIVE_CYCLE } from './spr.constants';

export type SprAreaDisplayMode =
  | 'waiting_for_responsible'
  | 'pending_review'
  | 'pending_review_after_correction'
  | 'rejected_pending_correction'
  | 'approved';

export type SprAreaProcessStatusVariant =
  | 'manager_waiting'
  | 'manager_pending_review'
  | 'manager_rejected_waiting_correction'
  | 'manager_pending_re_review'
  | 'manager_approved'
  | 'manager_approved_sox_discrepancy';

export type SprAreaStatusViewMode = Extract<
  SprAreaDisplayMode,
  'waiting_for_responsible' | 'rejected_pending_correction' | 'pending_review_after_correction' | 'approved'
>;

function filterSprCycleRecords(records: SprMonthlyRecordResponse[] | undefined): SprMonthlyRecordResponse[] {
  return (records ?? []).filter(
    (record) => record.periodYear === SPR_ACTIVE_CYCLE.periodYear && record.periodMonth === SPR_ACTIVE_CYCLE.periodMonth,
  );
}

function isWaitingForResponsibleEmission(
  cycleRecords: SprMonthlyRecordResponse[],
  totalParameterCount: number,
): boolean {
  if (totalParameterCount <= 0) return true;
  if (cycleRecords.length < totalParameterCount) return true;
  return cycleRecords.some((record) => record.status === SprRecordStatus.DRAFT);
}

export type ResolveSprAreaDisplayModeOptions = {
  /**
   * Áreas automáticas (Figma 2606:5127): el sistema emite; no se espera al responsable.
   * El gerente debe ver el formulario listo para firmar.
   */
  isAutomaticArea?: boolean;
};

export function resolveSprAreaDisplayMode(
  records: SprMonthlyRecordResponse[] | undefined,
  totalParameterCount: number,
  options?: ResolveSprAreaDisplayModeOptions,
): SprAreaDisplayMode {
  const cycleRecords = filterSprCycleRecords(records);
  const waiting = isWaitingForResponsibleEmission(cycleRecords, totalParameterCount);

  // MOCK: sin backend de emisión automática, tratamos el área automática como ya emitida
  // para que el gerente vea "listo para firmar" en lugar de "a la espera del responsable".
  if (waiting) {
    if (options?.isAutomaticArea) return 'pending_review';
    return 'waiting_for_responsible';
  }

  if (cycleRecords.some((record) => record.status === SprRecordStatus.REJECTED)) {
    return 'rejected_pending_correction';
  }

  if (
    cycleRecords.every(
      (record) => record.status === SprRecordStatus.APPROVED || record.status === SprRecordStatus.CLOSED,
    )
  ) {
    return 'approved';
  }

  return 'pending_review';
}

export function resolveSprAreaEffectiveDisplayMode(
  displayMode: SprAreaDisplayMode,
  hasCorrectionHistory: boolean,
): SprAreaDisplayMode {
  if (displayMode === 'pending_review' && hasCorrectionHistory) {
    return 'pending_review_after_correction';
  }

  return displayMode;
}

/** True si el área del gerente tiene validation SOX discrepancy_reported. */
export function hasSoxDiscrepancyReported(
  validations: SprCycleValidationResponse[] | undefined,
  areaId: string | null | undefined,
): boolean {
  if (!areaId) return false;
  return (validations ?? []).some(
    (validation) =>
      validation.areaId === areaId &&
      validation.status === SprCycleValidationStatus.DISCREPANCY_REPORTED,
  );
}
