import assert from 'node:assert/strict';
import {
  InspectionStatus,
  type MobileSyncBatchRequest,
  type MobileSyncOperationRequest,
  type MobileSyncOperationType,
} from '@aurelia/contracts';
import type { Repository } from 'typeorm';
import type { EvidencesService } from '../modules/evidences/evidences.service';
import type { InspectionAssignmentEmailService } from '../modules/inspections/inspection-assignment-email.service';
import type { InspectionsService } from '../modules/inspections/inspections.service';
import { MobileSyncOperationEntity } from '../modules/mobile-sync/entities/mobile-sync-operation.entity';
import { MobileSyncService } from '../modules/mobile-sync/mobile-sync.service';

async function main(): Promise<void> {
  const inspectionId = '22222222-2222-4222-8222-222222222222';
  const actorId = '11111111-1111-4111-8111-111111111111';
  const localInspectionId = 'inspection-local-1';
  const deviceId = 'device-1';
  let inspectionStatus = InspectionStatus.DRAFT;
  const transitions: InspectionStatus[] = [];
  const emailedInspectionIds: string[] = [];
  const storedRows: Array<Partial<MobileSyncOperationEntity>> = [
    {
      deviceId,
      localId: localInspectionId,
      remoteId: inspectionId,
      status: 'SYNCED',
      syncedAt: new Date(),
    },
  ];

  const inspectionsService = {
    createFinding: async () => ({ id: '33333333-3333-4333-8333-333333333333' }),
    findOne: async () => ({ id: inspectionId, status: inspectionStatus }),
    updateStatus: async (_id: string, input: { status: InspectionStatus }) => {
      inspectionStatus = input.status;
      transitions.push(input.status);
      return { id: inspectionId, status: inspectionStatus };
    },
  } as unknown as InspectionsService;

  const evidencesService = {} as EvidencesService;
  const assignmentEmails = {
    notifyInspectionAssigned: async (id: string) => {
      emailedInspectionIds.push(id);
    },
  } as unknown as InspectionAssignmentEmailService;

  const operations = {
    findOne: async (input: { where: Record<string, unknown> }) => {
      const { where } = input;
      return storedRows.find((row) => {
        if (where.idempotencyKey) return row.idempotencyKey === where.idempotencyKey;
        return row.deviceId === where.deviceId && row.localId === where.localId;
      }) ?? null;
    },
    create: (input: Partial<MobileSyncOperationEntity>) => input,
    save: async (input: Partial<MobileSyncOperationEntity>) => {
      storedRows.push(input);
      return input;
    },
  } as unknown as Repository<MobileSyncOperationEntity>;

  const service = new MobileSyncService(
    inspectionsService,
    evidencesService,
    assignmentEmails,
    operations,
  );

  const operation = {
    localId: 'finding-local-1',
    operationType: 'CREATE_INSPECTION_FINDING' as MobileSyncOperationType,
    entityType: 'inspection_finding',
    payload: {
      inspectionLocalId: localInspectionId,
      title: 'Hallazgo sincronizado desde mobile',
      severity: 'high',
      ownerUserId: actorId,
      responsibleUserIds: [actorId],
    },
    createdBy: actorId,
    deviceId,
    deviceSessionId: 'session-1',
    schemaVersion: 1,
    clientCreatedAt: new Date().toISOString(),
    idempotencyKey: 'mobile-finding-email-smoke-1',
    dependsOnLocalIds: [localInspectionId],
  } as MobileSyncOperationRequest;

  const batch = {
    batchId: 'mobile-assignment-email-smoke-batch',
    appId: 'mobile-inspecciones',
    deviceId,
    deviceSessionId: 'session-1',
    bootstrapVersion: null,
    createdAt: new Date().toISOString(),
    operations: [operation],
  } as MobileSyncBatchRequest;

  const response = await service.acceptBatch(batch);

  assert.equal(response.status, 'SYNCED');
  assert.deepEqual(transitions, [InspectionStatus.IN_PROGRESS]);
  assert.deepEqual(emailedInspectionIds, [inspectionId]);
  console.log('Mobile inspection assignment email smoke test passed.');
}

void main();
