import type { SprCycleValidationDecision } from '../../enums';
import type { ID } from '../../types/common';

export interface CreateSprCycleValidationRequest {
  areaId: ID;
  decision: SprCycleValidationDecision;
  /** Obligatorio si decision = discrepancy_reported. */
  comments?: string | null;
}
