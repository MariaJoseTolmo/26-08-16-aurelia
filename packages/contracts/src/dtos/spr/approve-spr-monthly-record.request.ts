import type { SprApprovalStatus } from '../../enums';
import type { ID } from '../../types/common';

export interface ApproveSprMonthlyRecordRequest {
  approverUserId?: ID | null;
  status: SprApprovalStatus;
  comments?: string | null;
}
