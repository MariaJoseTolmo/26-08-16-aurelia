import type { ID, ISODateString } from '../types/common';

export interface CommentRecord {
  id: ID;
  entityType: string;
  entityId: ID;
  authorUserId: ID | null;
  body: string;
  isInternal: boolean;
  isDeleted: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
