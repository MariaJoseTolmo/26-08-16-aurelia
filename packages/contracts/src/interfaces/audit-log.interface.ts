import type { ID, ISODateString } from '../types/common';

export interface AuditLogRecord {
  id: ID;
  entityType: string | null;
  entityId: ID | null;
  actorUserId: ID | null;
  action: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: ISODateString;
}
