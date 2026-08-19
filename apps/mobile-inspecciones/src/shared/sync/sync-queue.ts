import type { MobileSyncStatus, MobileSyncOperationType } from '@aurelia/contracts';
import { localStorageDriver } from '../storage/local-storage';
import type { SyncQueueItem, SyncQueueSnapshot } from './sync-status';

const QUEUE_KEY = 'sync_queue:v1';
const SCHEMA_VERSION = 'mobile-inspecciones-sync-v1';
const PENDING = 'PENDING' as MobileSyncStatus;
const PROCESSING = 'PROCESSING' as MobileSyncStatus;
const SYNCED = 'SYNCED' as MobileSyncStatus;
const ERROR = 'ERROR' as MobileSyncStatus;
const CONFLICT = 'CONFLICT' as MobileSyncStatus;

function now(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
}

function buildSnapshot(items: SyncQueueItem[]): SyncQueueSnapshot {
  return {
    pending: items.filter((item) => item.status === PENDING).length,
    processing: items.filter((item) => item.status === PROCESSING).length,
    synced: items.filter((item) => item.status === SYNCED).length,
    error: items.filter((item) => item.status === ERROR).length,
    conflict: items.filter((item) => item.status === CONFLICT).length,
  };
}

export interface EnqueueSyncOperationInput<TPayload = unknown> {
  operationType: MobileSyncOperationType;
  entityType: SyncQueueItem<TPayload>['entityType'];
  payload: TPayload;
  createdBy: string;
  deviceId: string;
  deviceSessionId: string;
  evidences?: SyncQueueItem<TPayload>['evidences'];
  dependsOnLocalIds?: string[];
  localId?: string;
}

export interface ReadyToSyncOptions {
  ignoreRetryDelay?: boolean;
}

class PersistentSyncQueue {
  async enqueue<TPayload>(input: EnqueueSyncOperationInput<TPayload>): Promise<SyncQueueItem<TPayload>> {
    const items = await this.getAll();
    const localId = input.localId ?? createId(input.entityType);
    const createdAt = now();
    const item: SyncQueueItem<TPayload> = {
      localId,
      operationType: input.operationType,
      entityType: input.entityType,
      payload: input.payload,
      evidences: input.evidences,
      createdBy: input.createdBy,
      deviceId: input.deviceId,
      deviceSessionId: input.deviceSessionId,
      schemaVersion: SCHEMA_VERSION,
      clientCreatedAt: createdAt,
      idempotencyKey: `${input.deviceId}:${localId}`,
      dependsOnLocalIds: input.dependsOnLocalIds,
      status: PENDING,
      retryCount: 0,
      lastError: null,
      remoteId: null,
      createdAt,
      updatedAt: createdAt,
      nextRetryAt: null,
    };
    await this.saveAll([...items, item]);
    return item;
  }

  async getAll(): Promise<SyncQueueItem[]> {
    return (await localStorageDriver.get<SyncQueueItem[]>(QUEUE_KEY)) ?? [];
  }

  async getByStatus(statuses: MobileSyncStatus[]): Promise<SyncQueueItem[]> {
    const items = await this.getAll();
    return items.filter((item) => statuses.includes(item.status));
  }

  async getReadyToSync(options: ReadyToSyncOptions = {}): Promise<SyncQueueItem[]> {
    const items = await this.getAll();
    const current = now();
    return items.filter((item) => {
      if (![PENDING, ERROR].includes(item.status)) return false;
      if (options.ignoreRetryDelay) return true;
      return !item.nextRetryAt || item.nextRetryAt <= current;
    });
  }

  async markProcessing(localIds: string[]): Promise<void> {
    await this.patch(localIds, (item) => ({ ...item, status: PROCESSING, updatedAt: now() }));
  }

  async markSynced(localId: string, remoteId?: string | null): Promise<void> {
    await this.patch([localId], (item) => ({ ...item, status: SYNCED, remoteId: remoteId ?? item.remoteId, lastError: null, updatedAt: now() }));
  }

  async markError(localId: string, error: string): Promise<void> {
    await this.patch([localId], (item) => {
      const retryCount = item.retryCount + 1;
      const next = new Date();
      next.setSeconds(next.getSeconds() + Math.min(60 * retryCount, 300));
      return { ...item, status: ERROR, retryCount, lastError: error, nextRetryAt: next.toISOString(), updatedAt: now() };
    });
  }

  async markConflict(localId: string, reason: string): Promise<void> {
    await this.patch([localId], (item) => ({ ...item, status: CONFLICT, lastError: reason, updatedAt: now() }));
  }

  async updatePayload<TPayload>(localId: string, payload: TPayload): Promise<void> {
    await this.patch([localId], (item) => ({ ...item, payload, updatedAt: now() }));
  }

  async removeSynced(): Promise<void> {
    const items = await this.getAll();
    await this.saveAll(items.filter((item) => item.status !== SYNCED));
  }

  async snapshot(): Promise<SyncQueueSnapshot> {
    return buildSnapshot(await this.getAll());
  }

  async clear(): Promise<void> {
    await localStorageDriver.remove(QUEUE_KEY);
  }

  private async patch(localIds: string[], updater: (item: SyncQueueItem) => SyncQueueItem): Promise<void> {
    const ids = new Set(localIds);
    const items = await this.getAll();
    await this.saveAll(items.map((item) => ids.has(item.localId) ? updater(item) : item));
  }

  private async saveAll(items: SyncQueueItem[]): Promise<void> {
    await localStorageDriver.set(QUEUE_KEY, items);
  }
}

export const syncQueue = new PersistentSyncQueue();
