import type { ID, ISODateString } from '../types/common';

export interface NotificationRecipient {
  id: ID;
  userId: ID;
  readAt: ISODateString | null;
  dismissedAt: ISODateString | null;
}

export interface NotificationMessage {
  id: ID;
  title: string;
  body: string | null;
  category: string;
  entityType: string | null;
  entityId: ID | null;
  triggeredByUserId: ID | null;
  metadata: Record<string, unknown> | null;
  createdAt: ISODateString;
  readAt: ISODateString | null;
  recipients?: NotificationRecipient[];
}

export interface MarkAllNotificationsReadResult {
  updated: number;
}
