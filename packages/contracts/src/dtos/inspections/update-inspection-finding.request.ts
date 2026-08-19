import type { InspectionFindingSeverity, InspectionFindingStatus } from '../../enums';
import type { ID, ISODateString } from '../../types/common';

export interface UpdateInspectionFindingRequest {
  title?: string;
  description?: string | null;
  detectedCondition?: string | null;
  proposedCorrectiveAction?: string | null;
  executedActionDescription?: string | null;
  rejectionReason?: string | null;
  severity?: InspectionFindingSeverity;
  status?: InspectionFindingStatus;
  ownerUserId?: ID | null;
  responsibleUserIds?: ID[];
  dueAt?: ISODateString | null;
  executedAt?: ISODateString | null;
  closedAt?: ISODateString | null;
  rejectedAt?: ISODateString | null;
  reason?: string | null;
}
