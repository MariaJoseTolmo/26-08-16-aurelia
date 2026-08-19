import type { ID, ISODateString } from '../../types/common';
import type { MobileSyncStatus } from '../../enums';

export interface MobileSyncOperationResult {
  localId: string;
  remoteId?: ID | null;
  status: MobileSyncStatus;
  syncedAt?: ISODateString | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  conflictReason?: string | null;
}

export interface MobileSyncBatchResponse {
  batchId: string;
  acceptedAt: ISODateString;
  status: MobileSyncStatus;
  results: MobileSyncOperationResult[];
  nextRecommendedSyncAt?: ISODateString | null;
}
