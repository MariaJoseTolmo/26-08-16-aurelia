import { MobileSyncOperationType, MobileSyncStatus, type MobileSyncOperationRequest } from '@aurelia/contracts';

export { MobileSyncOperationType, MobileSyncStatus };

export interface SyncQueueItem<TPayload = unknown> extends MobileSyncOperationRequest<TPayload> {
  status: MobileSyncStatus;
  retryCount: number;
  lastError?: string | null;
  remoteId?: string | null;
  createdAt: string;
  updatedAt: string;
  nextRetryAt?: string | null;
}

export interface SyncQueueSnapshot {
  pending: number;
  processing: number;
  synced: number;
  error: number;
  conflict: number;
}
