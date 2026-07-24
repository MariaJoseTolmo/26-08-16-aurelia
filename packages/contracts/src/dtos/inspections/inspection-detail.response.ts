import type {
  InspectionAnswerValue,
  InspectionEvidenceRelationType,
  InspectionFindingSeverity,
  InspectionFindingStatus,
  InspectionItemResponseType,
  InspectionType,
} from '../../enums';
import type { ID, ISODateString } from '../../types/common';

export type InspectionDetailKind = 'finding' | 'checklist';
export type InspectionDetailFindingGroupKey = 'executed' | 'open' | 'closed' | 'rejected';

export interface InspectionDetailHeaderResponse {
  inspectionId: ID;
  inspectionNumber: string;
  title: string;
  kind: InspectionDetailKind;
  inspectionType: InspectionType | string;
  metadataLine1: string;
  metadataLine2: string | null;
  progressPercent: number;
  counts: Record<InspectionDetailFindingGroupKey, number>;
}

export interface InspectionDetailEvidenceResponse {
  evidenceId: ID;
  fileId: ID | null;
  title: string | null;
  description: string | null;
  relationType: InspectionEvidenceRelationType | string | null;
  capturedAt: ISODateString | null;
  url: string | null;
}

export interface InspectionDetailResponsibleResponse {
  userId: ID;
  fullName: string;
  position: string | null;
  companyId: ID | null;
  companyName: string | null;
  currentUser: boolean;
}

export interface InspectionDetailFindingItemResponse {
  findingId: ID;
  checklistItemId: ID | null;
  title: string;
  condition: string | null;
  proposedCorrectiveAction: string | null;
  executedActionDescription: string | null;
  rejectionReason: string | null;
  severity: InspectionFindingSeverity;
  severityLabel: string;
  status: InspectionFindingStatus;
  statusGroup: InspectionDetailFindingGroupKey;
  responsibleCompanyId: ID | null;
  responsibleCompanyName: string | null;
  responsibleUsers: InspectionDetailResponsibleResponse[];
  dueAt: ISODateString | null;
  executedAt: ISODateString | null;
  closedAt: ISODateString | null;
  rejectedAt: ISODateString | null;
  beforeEvidence: InspectionDetailEvidenceResponse[];
  afterEvidence: InspectionDetailEvidenceResponse[];
}

export interface InspectionDetailFollowupResponse {
  followupId: ID;
  findingId: ID;
  sequenceNumber: number;
  title: string;
  description: string;
  performedAt: ISODateString | null;
  performedByUserId: ID | null;
  performedByName: string | null;
  completed: boolean;
}

export interface InspectionDetailGeneralResponse {
  inspectorName: string | null;
  inspectorCompanyName: string | null;
  areaName: string | null;
  sectorName: string | null;
  companyName: string | null;
  templateName: string | null;
  templateCode: string | null;
  scheduledAt: ISODateString | null;
  locationLabel: string | null;
  latitude: string | null;
  longitude: string | null;
  generalEvidence: InspectionDetailEvidenceResponse[];
  responsibles: InspectionDetailResponsibleResponse[];
}

export interface InspectionDetailChecklistAnswerResponse {
  value: InspectionAnswerValue | string | null;
  text: string | null;
  numericValue: string | null;
  notes: string | null;
  answeredAt: ISODateString | null;
  answeredByUserId: ID | null;
  answeredByName: string | null;
}

export interface InspectionDetailChecklistItemResponse {
  checklistItemId: ID;
  code: string;
  question: string;
  guidance: string | null;
  responseType: InspectionItemResponseType;
  isRequired: boolean;
  sortOrder: number;
  weight: string | null;
  answer: InspectionDetailChecklistAnswerResponse | null;
}

export interface InspectionDetailChecklistSectionResponse {
  sectionId: ID;
  code: string;
  title: string;
  description: string | null;
  sortOrder: number;
  items: InspectionDetailChecklistItemResponse[];
}

export interface InspectionDetailChecklistSummaryResponse {
  total: number;
  answered: number;
  compliant: number;
  notCompliant: number;
  notApplicable: number;
  partial: number;
  notObserved: number;
  unanswered: number;
}

export interface InspectionDetailChecklistResultResponse {
  summary: InspectionDetailChecklistSummaryResponse;
  sections: InspectionDetailChecklistSectionResponse[];
}

export interface InspectionDetailResponse {
  header: InspectionDetailHeaderResponse;
  findings: Record<InspectionDetailFindingGroupKey, InspectionDetailFindingItemResponse[]>;
  followups: InspectionDetailFollowupResponse[];
  general: InspectionDetailGeneralResponse;
  checklistResult: InspectionDetailChecklistResultResponse | null;
}
