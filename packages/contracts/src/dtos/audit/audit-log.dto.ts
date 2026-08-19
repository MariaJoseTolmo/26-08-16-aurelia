import type { AuditLogRecord } from '../../interfaces/audit-log.interface';
import type { ID } from '../../types/common';

export type AuditLogResponse = AuditLogRecord;

export interface CreateAuditLogRequest {
  entityType?: string;
  entityId?: ID;
  actorUserId?: ID;
  action: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}
