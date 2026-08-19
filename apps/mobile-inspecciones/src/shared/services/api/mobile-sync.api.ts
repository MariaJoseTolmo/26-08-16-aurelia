import type { MobileSyncBatchRequest, MobileSyncBatchResponse } from '@aurelia/contracts';
import { httpGet, httpPost } from '../http-client';

export function submitMobileSyncBatch(payload: MobileSyncBatchRequest): Promise<MobileSyncBatchResponse> {
  return httpPost<MobileSyncBatchRequest, MobileSyncBatchResponse>('/mobile/sync', payload);
}

export function fetchMobileSyncBatch(batchId: string): Promise<MobileSyncBatchResponse> {
  return httpGet<MobileSyncBatchResponse>(`/mobile/sync/${batchId}`);
}
