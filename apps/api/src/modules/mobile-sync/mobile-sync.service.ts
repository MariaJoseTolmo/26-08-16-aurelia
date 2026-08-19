import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  CreateInspectionFindingRequest,
  CreateInspectionRequest,
  MobileSyncBatchRequest,
  MobileSyncBatchResponse,
  MobileSyncOperationRequest,
  MobileSyncOperationResult,
  MobileSyncStatus,
  UpsertInspectionAnswerRequest,
} from '@aurelia/contracts';
import { InspectionStatus } from '@aurelia/contracts';
import { Repository } from 'typeorm';
import { InMemoryMobileSyncBroker } from '../../shared/messaging/in-memory-mobile-sync-broker';
import { EvidencesService } from '../evidences/evidences.service';
import { InspectionAssignmentEmailService } from '../inspections/inspection-assignment-email.service';
import { InspectionsService } from '../inspections/inspections.service';
import { MobileSyncOperationEntity } from './entities/mobile-sync-operation.entity';

const PROCESSING = 'PROCESSING' as MobileSyncStatus;
const SYNCED = 'SYNCED' as MobileSyncStatus;
const ERROR = 'ERROR' as MobileSyncStatus;
const SUPPORTED = new Set(['CREATE_INSPECTION', 'UPSERT_INSPECTION_ANSWER', 'CREATE_INSPECTION_FINDING', 'CLOSE_INSPECTION', 'CREATE_INCIDENT', 'UPLOAD_ATTACHMENT']);

type LocalPayload = { inspectionLocalId?: string; localEvidenceId?: string };
type UploadAttachmentPayload = {
  inspectionLocalId?: string;
  findingLocalId?: string;
  remoteFileId?: string | null;
  title?: string | null;
  evidenceType?: string | null;
  capturedAt?: string | null;
};

type SyncedInspectionCandidate = {
  deviceId: string;
  localInspectionId: string;
  actorId: string | null;
  hasSyncedFinding: boolean;
  hasFailedFinding: boolean;
};

function getPayloadId(payload: unknown, key: keyof LocalPayload): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const value = (payload as LocalPayload)[key];
  return typeof value === 'string' ? value : null;
}

function toActor(value: string): string | null {
  return value.includes('-') ? value : null;
}

function toUploadAttachmentPayload(payload: unknown): UploadAttachmentPayload {
  if (!payload || typeof payload !== 'object') return {};
  return payload as UploadAttachmentPayload;
}

function getBatchStatus(results: MobileSyncOperationResult[]): MobileSyncStatus {
  if (results.some((result) => result.status === ERROR)) return ERROR;
  if (results.some((result) => result.status === PROCESSING)) return PROCESSING;
  return SYNCED;
}

@Injectable()
export class MobileSyncService {
  private readonly logger = new Logger(MobileSyncService.name);
  private readonly broker = new InMemoryMobileSyncBroker();
  private readonly batches = new Map<string, MobileSyncBatchResponse>();
  private readonly localToRemote = new Map<string, string>();
  private readonly materializedOperationCounts: Record<string, number> = {};

  constructor(
    private readonly inspectionsService: InspectionsService,
    private readonly evidencesService: EvidencesService,
    private readonly assignmentEmails: InspectionAssignmentEmailService,
    @InjectRepository(MobileSyncOperationEntity) private readonly operations: Repository<MobileSyncOperationEntity>,
  ) {}

  async acceptBatch(batch: MobileSyncBatchRequest): Promise<MobileSyncBatchResponse> {
    const existing = this.batches.get(batch.batchId);
    if (existing) return existing;
    const acceptedAt = new Date().toISOString();
    await this.broker.publish({ messageId: batch.batchId, sessionId: batch.deviceSessionId, batch, enqueuedAt: acceptedAt });
    const results: MobileSyncOperationResult[] = [];
    for (const operation of batch.operations) results.push(await this.runOperation(batch.batchId, operation));
    await this.activateAndNotifySyncedInspections(batch.operations, results);
    const response = { batchId: batch.batchId, acceptedAt, status: getBatchStatus(results), results, nextRecommendedSyncAt: null };
    this.batches.set(batch.batchId, response);
    this.broker.drain();
    return response;
  }

  getBatch(batchId: string): MobileSyncBatchResponse | null {
    return this.batches.get(batchId) ?? null;
  }

  getStatus() {
    return { broker: this.broker.constructor.name, pendingMessages: this.broker.peek().length, acceptedBatches: this.batches.size, operationCounts: {}, materializedOperationCounts: { ...this.materializedOperationCounts }, timestamp: new Date().toISOString() };
  }

  getPendingMessagesCount(): number {
    return this.broker.peek().length;
  }

  private async runOperation(batchId: string, operation: MobileSyncOperationRequest): Promise<MobileSyncOperationResult> {
    const stored = await this.operations.findOne({ where: { idempotencyKey: operation.idempotencyKey } });
    if (stored) return this.resultFromStored(stored);
    if (!SUPPORTED.has(String(operation.operationType))) return this.saveResult(batchId, operation, this.fail(operation.localId, 'UNSUPPORTED_OPERATION', 'Unsupported operation'));
    try {
      const result = await this.execute(operation);
      return this.saveResult(batchId, operation, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      return this.saveResult(batchId, operation, this.fail(operation.localId, 'MATERIALIZATION_ERROR', message));
    }
  }

  private async execute(operation: MobileSyncOperationRequest): Promise<MobileSyncOperationResult> {
    const type = String(operation.operationType);
    if (type === 'CREATE_INSPECTION') {
      const created = await this.inspectionsService.create(operation.payload as CreateInspectionRequest, toActor(operation.createdBy));
      return this.done(operation, created.id);
    }
    if (type === 'UPSERT_INSPECTION_ANSWER') {
      const inspectionId = await this.resolveInspection(operation);
      if (!inspectionId) return this.fail(operation.localId, 'MISSING_INSPECTION_REMOTE_ID', 'Inspection dependency was not materialized');
      const answer = await this.inspectionsService.upsertAnswer(inspectionId, operation.payload as UpsertInspectionAnswerRequest, toActor(operation.createdBy));
      return this.done(operation, answer.id);
    }
    if (type === 'CREATE_INSPECTION_FINDING') {
      const inspectionId = await this.resolveInspection(operation);
      if (!inspectionId) return this.fail(operation.localId, 'MISSING_INSPECTION_REMOTE_ID', 'Inspection dependency was not materialized');
      const finding = await this.inspectionsService.createFinding(inspectionId, operation.payload as CreateInspectionFindingRequest, toActor(operation.createdBy));
      return this.done(operation, finding.id);
    }
    if (type === 'CLOSE_INSPECTION') {
      const inspectionId = await this.resolveInspection(operation);
      if (!inspectionId) return this.fail(operation.localId, 'MISSING_INSPECTION_REMOTE_ID', 'Inspection dependency was not materialized');
      const closed = await this.inspectionsService.updateStatus(inspectionId, { status: InspectionStatus.CLOSED, comment: 'Closed from mobile sync' }, toActor(operation.createdBy));
      return this.done(operation, closed.id);
    }
    if (type === 'UPLOAD_ATTACHMENT') return this.materializeAttachment(operation);
    return { localId: operation.localId, remoteId: null, status: PROCESSING, syncedAt: null };
  }

  private async activateAndNotifySyncedInspections(
    operations: MobileSyncOperationRequest[],
    results: MobileSyncOperationResult[],
  ): Promise<void> {
    const candidates = new Map<string, SyncedInspectionCandidate>();

    operations.forEach((operation, index) => {
      if (String(operation.operationType) !== 'CREATE_INSPECTION_FINDING') return;
      const localInspectionId = getPayloadId(operation.payload, 'inspectionLocalId');
      if (!localInspectionId) return;
      const key = this.key(operation.deviceId, localInspectionId);
      const candidate = candidates.get(key) ?? {
        deviceId: operation.deviceId,
        localInspectionId,
        actorId: toActor(operation.createdBy),
        hasSyncedFinding: false,
        hasFailedFinding: false,
      };
      if (results[index]?.status === SYNCED) candidate.hasSyncedFinding = true;
      else candidate.hasFailedFinding = true;
      candidates.set(key, candidate);
    });

    for (const candidate of candidates.values()) {
      if (!candidate.hasSyncedFinding || candidate.hasFailedFinding) continue;
      const inspectionId = await this.resolveLocalReference(candidate.deviceId, candidate.localInspectionId);
      if (!inspectionId) continue;

      const inspection = await this.inspectionsService.findOne(inspectionId);
      if (inspection.status === InspectionStatus.CLOSED || inspection.status === InspectionStatus.CANCELLED) continue;
      if (inspection.status === InspectionStatus.DRAFT) {
        await this.inspectionsService.updateStatus(
          inspectionId,
          { status: InspectionStatus.IN_PROGRESS, comment: 'Activated after mobile inspection sync' },
          candidate.actorId,
        );
      }

      await this.assignmentEmails.notifyInspectionAssigned(inspectionId).catch((error) => {
        const detail = error instanceof Error ? error.message : String(error);
        this.logger.error(`Unable to dispatch mobile inspection assignment email inspection=${inspectionId}: ${detail}`);
      });
    }
  }

  private async materializeAttachment(operation: MobileSyncOperationRequest): Promise<MobileSyncOperationResult> {
    const payload = toUploadAttachmentPayload(operation.payload);
    const findingLocalId = payload.findingLocalId;
    const inspectionLocalId = payload.inspectionLocalId ?? getPayloadId(operation.payload, 'inspectionLocalId');

    const fileId = payload.remoteFileId ?? null;
    if (!fileId) return this.fail(operation.localId, 'MISSING_REMOTE_FILE_ID', 'Attachment upload is pending and did not produce a remote file id');

    const evidence = await this.evidencesService.create({
      fileId,
      title: payload.title ?? undefined,
      evidenceType: payload.evidenceType ?? 'photo',
      capturedAt: payload.capturedAt ?? undefined,
      createdByUserId: toActor(operation.createdBy) ?? undefined,
    });

    if (findingLocalId) {
      const findingId = await this.resolveLocalReference(operation.deviceId, findingLocalId);
      if (!findingId) return this.fail(operation.localId, 'MISSING_FINDING_REMOTE_ID', 'Finding dependency was not materialized');

      await this.evidencesService.link(evidence.id, {
        entityType: 'inspection_finding',
        entityId: findingId,
        relationType: 'supporting_evidence',
      });
    } else {
      if (!inspectionLocalId) return this.fail(operation.localId, 'MISSING_INSPECTION_LOCAL_ID', 'Inspection dependency is missing for attachment materialization');
      const inspectionId = await this.resolveLocalReference(operation.deviceId, inspectionLocalId);
      if (!inspectionId) return this.fail(operation.localId, 'MISSING_INSPECTION_REMOTE_ID', 'Inspection dependency was not materialized');

      await this.evidencesService.link(evidence.id, {
        entityType: 'inspection',
        entityId: inspectionId,
        relationType: 'supporting_evidence',
      });
    }

    return this.done(operation, evidence.id);
  }

  private async resolveInspection(operation: MobileSyncOperationRequest): Promise<string | null> {
    const localId = getPayloadId(operation.payload, 'inspectionLocalId');
    if (!localId) return null;
    return this.resolveLocalReference(operation.deviceId, localId);
  }

  private async resolveLocalReference(deviceId: string, localId: string): Promise<string | null> {
    const cached = this.localToRemote.get(this.key(deviceId, localId));
    if (cached) return cached;
    const stored = await this.operations.findOne({ where: { deviceId, localId } });
    if (!stored?.remoteId) return null;
    this.localToRemote.set(this.key(deviceId, localId), stored.remoteId);
    return stored.remoteId;
  }

  private async saveResult(batchId: string, operation: MobileSyncOperationRequest, result: MobileSyncOperationResult): Promise<MobileSyncOperationResult> {
    const saved = await this.operations.save(this.operations.create({ batchId, localId: operation.localId, idempotencyKey: operation.idempotencyKey, deviceId: operation.deviceId, deviceSessionId: operation.deviceSessionId, operationType: String(operation.operationType), entityType: operation.entityType, status: String(result.status), remoteId: result.remoteId ?? null, errorCode: result.errorCode ?? null, errorMessage: result.errorMessage ?? null, payload: operation.payload ?? null, syncedAt: result.syncedAt ? new Date(result.syncedAt) : null }));
    return this.resultFromStored(saved);
  }

  private resultFromStored(row: MobileSyncOperationEntity): MobileSyncOperationResult {
    if (row.remoteId) this.localToRemote.set(this.key(row.deviceId, row.localId), row.remoteId);
    return { localId: row.localId, remoteId: row.remoteId, status: row.status as MobileSyncStatus, syncedAt: row.syncedAt ? row.syncedAt.toISOString() : null, errorCode: row.errorCode, errorMessage: row.errorMessage };
  }

  private done(operation: MobileSyncOperationRequest, remoteId: string): MobileSyncOperationResult {
    this.localToRemote.set(this.key(operation.deviceId, operation.localId), remoteId);
    this.materializedOperationCounts[String(operation.operationType)] = (this.materializedOperationCounts[String(operation.operationType)] ?? 0) + 1;
    return { localId: operation.localId, remoteId, status: SYNCED, syncedAt: new Date().toISOString() };
  }

  private fail(localId: string, errorCode: string, errorMessage: string): MobileSyncOperationResult {
    return { localId, remoteId: null, status: ERROR, syncedAt: null, errorCode, errorMessage };
  }

  private key(deviceId: string, localId: string): string {
    return `${deviceId}:${localId}`;
  }
}
