import type { ID, ISODateString } from '../../types/common';
import type { MobileSyncOperationType } from '../../enums';

export interface MobileSyncEvidenceRef {
  localEvidenceId: string;
  localEntityId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  checksum?: string | null;
}

export interface MobileSyncOperationRequest<TPayload = unknown> {
  localId: string;
  operationType: MobileSyncOperationType;
  entityType: 'inspection' | 'inspection_answer' | 'inspection_finding' | 'inspection_close' | 'incident' | 'evidence';
  payload: TPayload;
  evidences?: MobileSyncEvidenceRef[];
  createdBy: ID;
  deviceId: string;
  deviceSessionId: ID;
  schemaVersion: string;
  clientCreatedAt: ISODateString;
  idempotencyKey: string;
  dependsOnLocalIds?: string[];
}

export interface MobileSyncBatchRequest {
  batchId: string;
  appId: 'mobile-inspecciones' | 'mobile-incidentes';
  deviceId: string;
  deviceSessionId: ID;
  bootstrapVersion: string;
  createdAt: ISODateString;
  operations: MobileSyncOperationRequest[];
}
