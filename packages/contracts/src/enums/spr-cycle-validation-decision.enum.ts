/**
 * Decisión del Responsable SOX al validar el reporte (POST).
 * Mapea 1:1 a status approved | discrepancy_reported (no crea pending).
 */
export enum SprCycleValidationDecision {
  APPROVED = 'approved',
  DISCREPANCY_REPORTED = 'discrepancy_reported',
}
