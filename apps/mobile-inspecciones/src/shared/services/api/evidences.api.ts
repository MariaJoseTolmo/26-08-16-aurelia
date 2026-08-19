import { httpPost } from '../http-client';

export interface EvidenceResponse {
  id: string;
  fileId: string | null;
  title: string | null;
  evidenceType: string | null;
  status: string;
  capturedAt: string | null;
  createdAt: string;
}

export interface EvidenceLinkResponse {
  id: string;
  evidenceId: string;
  entityType: string;
  entityId: string;
  relationType: string;
  createdAt: string;
}

export interface CreateEvidenceDto {
  fileId?: string;
  title?: string;
  evidenceType?: string;
  capturedAt?: string;
  createdByUserId?: string;
}

export interface LinkEvidenceDto {
  entityType: string;
  entityId: string;
  relationType?: string;
}

export function createEvidence(dto: CreateEvidenceDto): Promise<EvidenceResponse> {
  return httpPost<CreateEvidenceDto, EvidenceResponse>('/evidences', dto);
}

export function linkEvidence(evidenceId: string, dto: LinkEvidenceDto): Promise<EvidenceLinkResponse> {
  return httpPost<LinkEvidenceDto, EvidenceLinkResponse>(
    `/evidences/${evidenceId}/link`,
    dto,
  );
}
