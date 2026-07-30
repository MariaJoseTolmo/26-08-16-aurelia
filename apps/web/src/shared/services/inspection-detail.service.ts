import type {
  InspectionDetailResponse,
  InspectionFindingResponse,
  InspectionFindingSlaReassignmentResponse,
  InspectionProcessRequestResponse,
  ReassignInspectionFindingSlaRequest,
  ResubmitInspectionEvidenceRequest,
  UpdateInspectionFindingRequest,
} from '@aurelia/contracts';
import { httpGet, httpPatch, httpPost } from './http-client';

export function getInspectionDetail(inspectionId: string): Promise<InspectionDetailResponse> {
  return httpGet<InspectionDetailResponse>(`/inspections/${encodeURIComponent(inspectionId)}/detail`);
}

export function updateInspectionFinding(
  findingId: string,
  payload: UpdateInspectionFindingRequest,
): Promise<InspectionFindingResponse> {
  return httpPatch<UpdateInspectionFindingRequest, InspectionFindingResponse>(
    `/inspections/findings/${encodeURIComponent(findingId)}`,
    payload,
  );
}

export function reassignInspectionFindingSla(
  findingId: string,
  payload: ReassignInspectionFindingSlaRequest,
): Promise<InspectionFindingSlaReassignmentResponse> {
  return httpPost<ReassignInspectionFindingSlaRequest, InspectionFindingSlaReassignmentResponse>(
    `/inspections/findings/${encodeURIComponent(findingId)}/reassign-sla`,
    payload,
  );
}

export function resubmitInspectionFindingEvidence(
  findingId: string,
  payload: ResubmitInspectionEvidenceRequest,
): Promise<InspectionProcessRequestResponse> {
  return httpPost<ResubmitInspectionEvidenceRequest, InspectionProcessRequestResponse>(
    `/inspections/findings/${encodeURIComponent(findingId)}/evidence-resubmissions`,
    payload,
  );
}
