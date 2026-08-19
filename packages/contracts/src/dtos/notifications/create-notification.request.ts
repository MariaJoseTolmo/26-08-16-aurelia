import type { ID } from '../../types/common';

export interface CreateNotificationRequest {
  title: string;
  body?: string | null;
  category?: string;
  entityType?: string | null;
  entityId?: ID | null;
  triggeredByUserId?: ID | null;
  recipientUserIds: ID[];
  metadata?: Record<string, unknown> | null;
}
