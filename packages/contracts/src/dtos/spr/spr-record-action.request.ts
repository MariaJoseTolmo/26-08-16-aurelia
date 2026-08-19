import type { ID } from '../../types/common';

export interface SprRecordActionRequest {
  submittedByUserId?: ID | null;
  approverUserId?: ID | null;
  notes?: string | null;
  comments?: string | null;
}
