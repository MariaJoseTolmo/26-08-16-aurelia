import { MobileSyncOperationType, MobileSyncStatus } from '@aurelia/contracts';

export { MobileSyncOperationType, MobileSyncStatus };

export interface SyncQueueItem<TPayload> {
  id: string;
  payload: TPayload;
  status: MobileSyncStatus;
  operationType: MobileSyncOperationType;
  entityType: 'incident';
  createdAt: string;
  lastError?: string;
}
