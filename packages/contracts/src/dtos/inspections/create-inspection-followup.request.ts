import type { InspectionFollowupStatus } from '../../enums';
import type { ID, ISODateString } from '../../types/common';

export interface CreateInspectionFollowupRequest {
  status?: InspectionFollowupStatus;
  description: string;
  performedByUserId?: ID | null;
  performedAt?: ISODateString | null;
  nextDueAt?: ISODateString | null;
}
