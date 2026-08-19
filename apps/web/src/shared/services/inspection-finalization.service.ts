import {
  InspectionStatus,
  type InspectionResponse,
  type UpdateInspectionRequest,
} from '@aurelia/contracts';
import { httpPatch } from './http-client';

export function finalizeInspectionForm(
  inspectionId: string,
  startedAt: string,
): Promise<InspectionResponse> {
  const completedAt = new Date().toISOString();
  const payload: UpdateInspectionRequest = {
    status: InspectionStatus.IN_PROGRESS,
    startedAt,
    completedAt,
    reason: 'inspection form submitted',
  };

  return httpPatch<UpdateInspectionRequest, InspectionResponse>(
    `/inspections/${encodeURIComponent(inspectionId)}`,
    payload,
  );
}
