import type { CommentRecord } from '../../interfaces/comment.interface';
import type { ID } from '../../types/common';

export type CommentResponse = CommentRecord;

export interface CreateCommentRequest {
  entityType: string;
  entityId: ID;
  body: string;
  isInternal?: boolean;
  authorUserId?: ID;
}
