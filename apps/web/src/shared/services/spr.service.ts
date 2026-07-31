import type {
  CreateSprCycleSignatureRequest,
  CreateSprCycleValidationRequest,
  CreateSprMonthlyRecordRequest,
  EvidenceLinkResponse,
  EvidenceResponse,
  LinkSprRecordEvidenceRequest,
  ReopenSprCycleValidationRequest,
  SprCycleResponse,
  SprCycleSacSubmissionResponse,
  SprCycleSignatureResponse,
  SprCycleValidationResponse,
  SprMeasureGroupResponse,
  SprMonthlyRecordResponse,
  SprParameterAreaAssignmentResponse,
  SprParameterResponse,
  SprRecordActionRequest,
  SprRecordApprovalResponse,
  SprSignersResponse,
  SprUnitResponse,
  UpdateSprMonthlyRecordRequest,
} from '@aurelia/contracts';
import { httpGet, httpPatch, httpPost } from './http-client';

export interface SprMonthlyRecordsQuery {
  parameterId?: string;
  areaId?: string;
  status?: string;
  periodYear?: number;
  periodMonth?: number;
}

export interface SprCatalogQuery {
  areaId?: string | null;
}

function buildCatalogQuery(query?: SprCatalogQuery) {
  if (!query?.areaId) return '';
  const searchParams = new URLSearchParams({ areaId: query.areaId });
  return `?${searchParams.toString()}`;
}

function buildMonthlyRecordsQuery(query?: SprMonthlyRecordsQuery) {
  if (!query) return '';
  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.set(key, String(value));
  });
  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : '';
}

export function getSprParameters(query?: SprCatalogQuery): Promise<SprParameterResponse[]> {
  return httpGet<SprParameterResponse[]>(`/spr/parameters${buildCatalogQuery(query)}`);
}

export function getSprAssignments(query?: SprCatalogQuery): Promise<SprParameterAreaAssignmentResponse[]> {
  return httpGet<SprParameterAreaAssignmentResponse[]>(`/spr/assignments${buildCatalogQuery(query)}`);
}

export function getSprUnits(): Promise<SprUnitResponse[]> {
  return httpGet<SprUnitResponse[]>('/spr/units');
}

/** Roster de firmantes (especialistas + gerentes MA activos). */
export function getSprSigners(): Promise<SprSignersResponse> {
  return httpGet<SprSignersResponse>('/spr/signers');
}

export function getSprGroups(): Promise<SprMeasureGroupResponse[]> {
  return httpGet<SprMeasureGroupResponse[]>('/spr/groups');
}

export interface SprCyclesQuery {
  periodYear?: number;
  periodMonth?: number;
  status?: string;
}

function buildCyclesQuery(query?: SprCyclesQuery) {
  if (!query) return '';
  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.set(key, String(value));
  });
  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : '';
}

export function getSprCycles(query?: SprCyclesQuery): Promise<SprCycleResponse[]> {
  return httpGet<SprCycleResponse[]>(`/spr/cycles${buildCyclesQuery(query)}`);
}

export function getSprCycle(cycleId: string): Promise<SprCycleResponse> {
  return httpGet<SprCycleResponse>(`/spr/cycles/${cycleId}`);
}

export function getSprCycleSacSubmission(cycleId: string): Promise<SprCycleSacSubmissionResponse> {
  return httpGet<SprCycleSacSubmissionResponse>(`/spr/cycles/${cycleId}/sac`);
}

/** 404 → null (ciclo sin envío SAC registrado). Otros errores → throw. */
export async function getSprCycleSacSubmissionOrNull(
  cycleId: string,
): Promise<SprCycleSacSubmissionResponse | null> {
  try {
    return await getSprCycleSacSubmission(cycleId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes(' failed: 404')) return null;
    throw error;
  }
}

export function prepareSprCycleSacSubmission(cycleId: string): Promise<SprCycleSacSubmissionResponse> {
  return httpPost<Record<string, never>, SprCycleSacSubmissionResponse>(`/spr/cycles/${cycleId}/sac/prepare`, {});
}

export function markSprCycleSacReportReady(cycleId: string): Promise<SprCycleSacSubmissionResponse> {
  return httpPost<Record<string, never>, SprCycleSacSubmissionResponse>(`/spr/cycles/${cycleId}/sac/mark-ready`, {});
}

export function getSprCycleSignatures(cycleId: string): Promise<SprCycleSignatureResponse[]> {
  return httpGet<SprCycleSignatureResponse[]>(`/spr/cycles/${cycleId}/signatures`);
}

export function createSprCycleSignature(
  cycleId: string,
  payload: CreateSprCycleSignatureRequest,
): Promise<SprCycleSignatureResponse> {
  return httpPost<CreateSprCycleSignatureRequest, SprCycleSignatureResponse>(
    `/spr/cycles/${cycleId}/signatures`,
    payload,
  );
}

export function getSprCycleValidations(cycleId: string): Promise<SprCycleValidationResponse[]> {
  return httpGet<SprCycleValidationResponse[]>(`/spr/cycles/${cycleId}/validations`);
}

export function createSprCycleValidation(
  cycleId: string,
  payload: CreateSprCycleValidationRequest,
): Promise<SprCycleValidationResponse> {
  return httpPost<CreateSprCycleValidationRequest, SprCycleValidationResponse>(
    `/spr/cycles/${cycleId}/validations`,
    payload,
  );
}

export function reopenSprCycleValidation(
  cycleId: string,
  areaId: string,
  payload: ReopenSprCycleValidationRequest = {},
): Promise<SprCycleValidationResponse> {
  return httpPost<ReopenSprCycleValidationRequest, SprCycleValidationResponse>(
    `/spr/cycles/${cycleId}/validations/${areaId}/reopen`,
    payload,
  );
}

export function getSprMonthlyRecords(query?: SprMonthlyRecordsQuery): Promise<SprMonthlyRecordResponse[]> {
  return httpGet<SprMonthlyRecordResponse[]>(`/spr/monthly-records${buildMonthlyRecordsQuery(query)}`);
}

export function getSprMonthlyRecord(recordId: string): Promise<SprMonthlyRecordResponse> {
  return httpGet<SprMonthlyRecordResponse>(`/spr/monthly-records/${recordId}`);
}

export function createSprMonthlyRecord(payload: CreateSprMonthlyRecordRequest): Promise<SprMonthlyRecordResponse> {
  return httpPost<CreateSprMonthlyRecordRequest, SprMonthlyRecordResponse>('/spr/monthly-records', payload);
}

export function updateSprMonthlyRecord(
  recordId: string,
  payload: UpdateSprMonthlyRecordRequest,
): Promise<SprMonthlyRecordResponse> {
  return httpPatch<UpdateSprMonthlyRecordRequest, SprMonthlyRecordResponse>(`/spr/monthly-records/${recordId}`, payload);
}

export function submitSprMonthlyRecord(
  recordId: string,
  payload: SprRecordActionRequest = {},
): Promise<SprMonthlyRecordResponse> {
  return httpPost<SprRecordActionRequest, SprMonthlyRecordResponse>(`/spr/monthly-records/${recordId}/submit`, payload);
}

export function approveSprMonthlyRecord(
  recordId: string,
  payload: SprRecordActionRequest = {},
): Promise<SprMonthlyRecordResponse> {
  return httpPost<SprRecordActionRequest, SprMonthlyRecordResponse>(`/spr/monthly-records/${recordId}/approve`, payload);
}

export function rejectSprMonthlyRecord(
  recordId: string,
  payload: SprRecordActionRequest = {},
): Promise<SprMonthlyRecordResponse> {
  return httpPost<SprRecordActionRequest, SprMonthlyRecordResponse>(`/spr/monthly-records/${recordId}/reject`, payload);
}

export function getSprRecordEvidences(recordId: string): Promise<EvidenceResponse[]> {
  return httpGet<EvidenceResponse[]>(`/spr/monthly-records/${recordId}/evidences`);
}

export function getSprRecordApprovals(recordId: string): Promise<SprRecordApprovalResponse[]> {
  return httpGet<SprRecordApprovalResponse[]>(`/spr/monthly-records/${recordId}/approvals`);
}

export function linkSprRecordEvidence(
  recordId: string,
  evidenceId: string,
  payload: LinkSprRecordEvidenceRequest = {},
): Promise<EvidenceLinkResponse> {
  return httpPost<LinkSprRecordEvidenceRequest, EvidenceLinkResponse>(
    `/spr/monthly-records/${recordId}/evidences/${evidenceId}/link`,
    payload,
  );
}
