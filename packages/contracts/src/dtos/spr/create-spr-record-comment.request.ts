import type { ID } from '../../types/common';

export interface CreateSprRecordCommentRequest {
  body: string;
  isInternal?: boolean;
  authorUserId?: ID | null;
}
