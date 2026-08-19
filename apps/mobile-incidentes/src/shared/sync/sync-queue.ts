import type { CreateIncidentRequest } from '@aurelia/contracts';
import { MobileSyncOperationType, MobileSyncStatus, type SyncQueueItem } from './sync-status';

// Placeholder: la cola de sincronización offline-first se implementará más adelante.
export const incidentSyncQueue: SyncQueueItem<CreateIncidentRequest>[] = [];

export function enqueueIncident(payload: CreateIncidentRequest): void {
  incidentSyncQueue.push({
    id: `${Date.now()}`,
    payload,
    status: MobileSyncStatus.PENDING,
    operationType: MobileSyncOperationType.CREATE_INCIDENT,
    entityType: 'incident',
    createdAt: new Date().toISOString(),
  });
}
