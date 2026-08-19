import type { MobileSyncBatchRequest, MobileSyncOperationRequest, MobileSyncStatus } from '@aurelia/contracts';
import { getOrCreateOfflineDeviceSession } from '../offline/offline-device-session';
import { uploadFile } from '../services/api/files.api';
import { submitMobileSyncBatch } from '../services/api/mobile-sync.api';
import { syncQueue } from './sync-queue';
import type { SyncQueueItem } from './sync-status';

const SYNCED = 'SYNCED' as MobileSyncStatus;
const PROCESSING = 'PROCESSING' as MobileSyncStatus;
const PENDING = 'PENDING' as MobileSyncStatus;
const CONFLICT = 'CONFLICT' as MobileSyncStatus;
const UPLOAD_ATTACHMENT = 'UPLOAD_ATTACHMENT';

interface UploadAttachmentPayload {
  sourceUri?: string | null;
  remoteFileId?: string | null;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function toOperation(item: SyncQueueItem): MobileSyncOperationRequest {
  return {
    localId: item.localId,
    operationType: item.operationType,
    entityType: item.entityType,
    payload: item.payload,
    evidences: item.evidences,
    createdBy: item.createdBy,
    deviceId: item.deviceId,
    deviceSessionId: item.deviceSessionId,
    schemaVersion: item.schemaVersion,
    clientCreatedAt: item.clientCreatedAt,
    idempotencyKey: item.idempotencyKey,
    dependsOnLocalIds: item.dependsOnLocalIds,
  };
}

function isUploadAttachment(item: SyncQueueItem): boolean {
  return String(item.operationType) === UPLOAD_ATTACHMENT;
}

function toUploadAttachmentPayload(payload: unknown): UploadAttachmentPayload {
  if (!payload || typeof payload !== 'object') return {};
  return payload as UploadAttachmentPayload;
}

async function prepareOperations(ready: SyncQueueItem[]): Promise<SyncQueueItem[]> {
  const prepared: SyncQueueItem[] = [];
  for (const item of ready) {
    if (!isUploadAttachment(item)) {
      prepared.push(item);
      continue;
    }
    const payload = toUploadAttachmentPayload(item.payload);
    if (payload.remoteFileId) {
      prepared.push(item);
      continue;
    }
    if (!payload.sourceUri) {
      await syncQueue.markError(item.localId, 'No existe URI local para adjuntar evidencia.');
      continue;
    }
    try {
      const uploaded = await uploadFile(payload.sourceUri, payload.fileName ?? 'evidencia-local.jpg', payload.mimeType ?? 'image/jpeg');
      const nextPayload = {
        ...payload,
        remoteFileId: uploaded.id,
        fileName: payload.fileName ?? uploaded.originalFilename,
        mimeType: payload.mimeType ?? uploaded.mimeType ?? 'application/octet-stream',
        sizeBytes: payload.sizeBytes && payload.sizeBytes > 0 ? payload.sizeBytes : uploaded.sizeBytes ?? 0,
      };
      await syncQueue.updatePayload(item.localId, nextPayload);
      prepared.push({ ...item, payload: nextPayload });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo subir evidencia local';
      await syncQueue.markError(item.localId, message);
    }
  }
  return prepared;
}

export interface SyncNowResult {
  attempted: number;
  accepted: number;
  synced: number;
  error: number;
  conflict: number;
}

export interface SyncPendingOperationsOptions {
  ignoreRetryDelay?: boolean;
}

export async function syncPendingOperations(options: SyncPendingOperationsOptions = {}): Promise<SyncNowResult> {
  const ready = await syncQueue.getReadyToSync({ ignoreRetryDelay: options.ignoreRetryDelay });
  if (ready.length === 0) return { attempted: 0, accepted: 0, synced: 0, error: 0, conflict: 0 };
  const prepared = await prepareOperations(ready);
  if (prepared.length === 0) return { attempted: 0, accepted: 0, synced: 0, error: 0, conflict: 0 };

  const session = await getOrCreateOfflineDeviceSession();
  const batch: MobileSyncBatchRequest = {
    batchId: createId('batch'),
    appId: 'mobile-inspecciones',
    deviceId: session.deviceId,
    deviceSessionId: session.deviceSessionId,
    bootstrapVersion: session.bootstrapVersion,
    createdAt: new Date().toISOString(),
    operations: prepared.map(toOperation),
  };

  await syncQueue.markProcessing(prepared.map((item) => item.localId));

  try {
    const response = await submitMobileSyncBatch(batch);
    let accepted = 0;
    let synced = 0;
    let error = 0;
    let conflict = 0;
    for (const result of response.results) {
      if (result.status === SYNCED) {
        await syncQueue.markSynced(result.localId, result.remoteId);
        synced += 1;
      } else if (result.status === PROCESSING || result.status === PENDING) {
        accepted += 1;
      } else if (result.status === CONFLICT) {
        await syncQueue.markConflict(result.localId, result.conflictReason ?? 'Conflicto de sincronización');
        conflict += 1;
      } else {
        await syncQueue.markError(result.localId, result.errorMessage ?? 'Error de sincronización');
        error += 1;
      }
    }
    return { attempted: prepared.length, accepted, synced, error, conflict };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error de sincronización';
    await Promise.all(prepared.map((item) => syncQueue.markError(item.localId, message)));
    return { attempted: prepared.length, accepted: 0, synced: 0, error: prepared.length, conflict: 0 };
  }
}
