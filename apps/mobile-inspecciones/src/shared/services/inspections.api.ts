import type {
  CreateEvidenceRequest,
  CreateInspectionFindingRequest,
  CreateInspectionRequest,
  EvidenceLinkResponse,
  EvidenceResponse,
  InspectionChecklistAnswerResponse,
  InspectionDetailResponse,
  InspectionFindingResponse,
  InspectionHistoryKpisResponse,
  InspectionManagementKpisResponse,
  InspectionManagementTableResponse,
  InspectionProcessRequestResponse,
  InspectionResponse,
  LinkEvidenceRequest,
  ResubmitInspectionEvidenceRequest,
  UpdateInspectionFindingRequest,
  UpsertInspectionAnswerRequest,
  UserResponse,
} from '@aurelia/contracts';
import { httpGet, httpPatch, httpPost } from './http-client';

export type MobileInspectionManagementMode = 'management' | 'history';

export type MobileInspectionManagementFilters = {
  page: number;
  pageSize: 10 | 25 | 50;
  id?: string;
  date?: string;
  inspector?: string;
  area?: string;
  company?: string;
  type?: string;
  urgency?: string;
  count?: string;
  obs?: string;
  daysMin?: string;
  daysMax?: string;
  closure?: string;
};

function buildManagementQuery(filters: MobileInspectionManagementFilters): string {
  const params = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  });
  Object.entries(filters).forEach(([key, value]) => {
    if (key === 'page' || key === 'pageSize') return;
    if (typeof value === 'string' && value.trim()) params.set(key, value.trim());
  });
  return `?${params.toString()}`;
}

function normalizeInspectionType(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes('check') || normalized.includes('normativ') || normalized.includes('regulator')) return 'Checklist';
  if (normalized.includes('hallazgo') || normalized.includes('ambiental') || normalized.includes('environmental')) return 'Hallazgo';
  return value;
}

function normalizeManagementResponse(response: InspectionManagementTableResponse): InspectionManagementTableResponse {
  return {
    ...response,
    rows: response.rows.map((row) => ({ ...row, type: normalizeInspectionType(row.type) })),
    filterOptions: {
      ...response.filterOptions,
      types: response.filterOptions.types.map(normalizeInspectionType),
    },
  };
}

export function fetchInspections(): Promise<InspectionResponse[]> {
  return httpGet<InspectionResponse[]>('/inspections');
}

export function fetchInspectionManagementKpis(): Promise<InspectionManagementKpisResponse> {
  return httpGet<InspectionManagementKpisResponse>('/inspections/dashboard/management-kpis');
}

export function fetchInspectionHistoryKpis(): Promise<InspectionHistoryKpisResponse> {
  return httpGet<InspectionHistoryKpisResponse>('/inspections/history/kpis');
}

export async function fetchInspectionManagementTable(
  mode: MobileInspectionManagementMode,
  filters: MobileInspectionManagementFilters,
): Promise<InspectionManagementTableResponse> {
  const endpoint = mode === 'history'
    ? '/inspections/history/table'
    : '/inspections/dashboard/management-table';
  const response = await httpGet<InspectionManagementTableResponse>(`${endpoint}${buildManagementQuery(filters)}`);
  return normalizeManagementResponse(response);
}

export function fetchInspectionDetail(inspectionId: string): Promise<InspectionDetailResponse> {
  return httpGet<InspectionDetailResponse>(`/inspections/${encodeURIComponent(inspectionId)}/detail`);
}

export function submitInspection(payload: CreateInspectionRequest): Promise<InspectionResponse> {
  return httpPost<CreateInspectionRequest, InspectionResponse>('/inspections', payload);
}

export function submitInspectionAnswer(inspectionId: string, payload: UpsertInspectionAnswerRequest): Promise<InspectionChecklistAnswerResponse> {
  return httpPost<UpsertInspectionAnswerRequest, InspectionChecklistAnswerResponse>(`/inspections/${inspectionId}/answers`, payload);
}

export function submitInspectionFinding(inspectionId: string, payload: CreateInspectionFindingRequest): Promise<InspectionFindingResponse> {
  return httpPost<CreateInspectionFindingRequest, InspectionFindingResponse>(`/inspections/${inspectionId}/findings`, payload);
}

export function fetchInspectionFindings(inspectionId: string): Promise<InspectionFindingResponse[]> {
  return httpGet<InspectionFindingResponse[]>(`/inspections/${inspectionId}/findings`);
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

export function resubmitInspectionFindingEvidence(
  findingId: string,
  payload: ResubmitInspectionEvidenceRequest,
): Promise<InspectionProcessRequestResponse> {
  return httpPost<ResubmitInspectionEvidenceRequest, InspectionProcessRequestResponse>(
    `/inspections/findings/${encodeURIComponent(findingId)}/evidence-resubmissions`,
    payload,
  );
}

export function createInspectionEvidence(payload: CreateEvidenceRequest): Promise<EvidenceResponse> {
  return httpPost<CreateEvidenceRequest, EvidenceResponse>('/evidences', payload);
}

export function linkInspectionEvidence(evidenceId: string, payload: LinkEvidenceRequest): Promise<EvidenceLinkResponse> {
  return httpPost<LinkEvidenceRequest, EvidenceLinkResponse>(
    `/evidences/${encodeURIComponent(evidenceId)}/link`,
    payload,
  );
}

export function fetchInspectionResponsibleUsers(companyId: string): Promise<UserResponse[]> {
  return httpGet<UserResponse[]>(`/inspections/responsible-users?companyId=${encodeURIComponent(companyId)}`);
}

export function closeInspection(inspectionId: string, reason?: string): Promise<InspectionResponse> {
  return httpPost<{ reason?: string }, InspectionResponse>(`/inspections/${inspectionId}/close`, { reason });
}
