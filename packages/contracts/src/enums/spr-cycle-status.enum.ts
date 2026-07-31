export enum SprCycleStatus {
  EN_CURSO = 'en_curso',
  DAY9_ELAPSED = 'day9_elapsed',
  SAC_PREPARING = 'sac_preparing',
  SAC_AVAILABLE = 'sac_available',
  SIGNING = 'signing',
  VALIDATING = 'validating',
  /** Ambas áreas SOX aprobaron; cierre real espera otros hitos (estimados, etc.). */
  VALIDATION_APPROVED = 'validation_approved',
  CLOSED = 'closed',
}
