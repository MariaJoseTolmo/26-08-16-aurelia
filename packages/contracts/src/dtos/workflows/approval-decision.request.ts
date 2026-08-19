import type { ApprovalDecision } from '../../enums';
import type { ID } from '../../types/common';

export interface ApprovalDecisionRequest {
  entityType: 'INSPECTION' | 'INCIDENT';
  entityId: ID;
  decision: ApprovalDecision;
  comment?: string;
}
