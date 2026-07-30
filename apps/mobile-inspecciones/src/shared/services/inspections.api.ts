import type {
  CreateEvidenceRequest,
  CreateInspectionFindingRequest,
  CreateInspectionRequest,
  EvidenceLinkResponse,
  EvidenceResponse,
  InspectionChecklistAnswerResponse,
  InspectionDetailResponse,
  InspectionFindingResponse,
  InspectionFindingSlaReassignmentResponse,
  InspectionHistoryKpisResponse,
  InspectionManagementKpisResponse,
  InspectionManagementTableResponse,
  InspectionProcessRequestResponse,
  InspectionResponse,
  LinkEvidenceRequest,
  ReassignInspectionFindingSlaRequest,
  ResubmitInspectionEvidenceRequest,
  UpdateInspectionFindingRequest,
  UpsertInspectionAnswerRequest,
  UserResponse,
} from '@aurelia/contracts';
import { httpGet, httpPatch, httpPost } from './http-client';

export { fetchInspectionHomeSummary as fetchInspectionDashboardSummary } from './api/inspection-home.api';

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

const managementFilterQueryKeys = [
  'id',
  'date',
  'inspector',
  'area',
  'company',
  'type',
  'urgency',
  'count',
  'obs',
  'daysMin',
  'daysMax',
  'closure',
] as const;

function normalizeManagementFilterValue(
  key: typeof managementFilterQueryKeys[number],
  value: string,
): string {
  if (key !== 'date') return value;
  const match = value.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  return match ? `${match[1]}-${match[2]}-${match[3].slice(-2)}` : value;
}

function buildManagementQuery(filters: MobileInspectionManagementFilters): string {
  const params = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  });
  managementFilterQueryKeys.forEach((key) => {
    const value = filters[key]?.trim();
    if (value) params.set(key, normalizeManagementFilterValue(key, value));
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

function formatScheduledDate(value: string | null | undefined): string {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : 'Sin fecha';
}

function buildFindingMetadata(response: InspectionDetailResponse): { metadataLine1: string; metadataLine2: string } {
  const currentSegments = response.header.metadataLine1
    .split(' · ')
    .map((value) => value.trim())
    .filter(Boolean);
  const existingTypeMatch = response.header.metadataLine2?.match(/^Tipo de hallazgo:\s*(.+)$/i);
  const projectedType = currentSegments[0] && currentSegments[0].toLowerCase() !== 'hallazgo'
    ? currentSegments[0]
    : null;
  const findingType = existingTypeMatch?.[1]?.trim() || projectedType || 'sin clasificación';
  const date = currentSegments.find((value) => /^\d{2}-\d{2}-\d{4}$/.test(value))
    ?? formatScheduledDate(response.general.scheduledAt);
  const locationSegments = response.general.locationLabel
    ?.split(' · ')
    .map((value) => value.trim())
    .filter(Boolean) ?? [];
  const sector = response.general.sectorName?.trim()
    || locationSegments[locationSegments.length - 1]
    || 'Sin ubicación';

  return {
    metadataLine1: `Hallazgo · ${date} · ${sector}`,
    metadataLine2: `Tipo de hallazgo: ${findingType}`,
  };
}

function normalizeInspectionDetail(response: InspectionDetailResponse): InspectionDetailResponse {
  const area = response.general.areaName?.trim();
  const company = response.general.companyName?.trim();
  const title = [area, company].filter((value): value is string => Boolean(value)).join(' · ');
  const findingMetadata = response.header.kind === 'finding' ? buildFindingMetadata(response) : null;

  return {
    ...response,
    header: {
      ...response.header,
      ...(title ? { title } : {}),
      ...(findingMetadata ?? {}),
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

export async function fetchInspectionDetail(inspectionId: string): Promise<InspectionDetailResponse> {
  const response = await httpGet<InspectionDetailResponse>(`/inspections/${encodeURIComponent(inspectionId)}/detail`);
  return normalizeInspectionDetail(response);
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
