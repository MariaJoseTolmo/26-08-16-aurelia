import type {
  InspectionAnswerValue,
  InspectionFindingSeverity,
  InspectionFindingStatus,
  InspectionFollowupStatus,
  InspectionItemResponseType,
  InspectionStatus,
  InspectionType,
} from '../enums';
import type { ID, ISODateString } from '../types/common';
import type { BaseEntity } from './entity.interface';

export interface InspectionTypeRecord extends BaseEntity {
  code: InspectionType;
  name: string;
  description: string | null;
  status: string;
}

export interface InspectionChecklistTemplate extends BaseEntity {
  inspectionTypeId: ID;
  code: string;
  name: string;
  description: string | null;
  version: number;
  isActive: boolean;
}

export interface InspectionChecklistSection extends BaseEntity {
  templateId: ID;
  code: string;
  title: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface InspectionChecklistItem extends BaseEntity {
  sectionId: ID;
  code: string;
  question: string;
  guidance: string | null;
  responseType: InspectionItemResponseType;
  isRequired: boolean;
  requiresEvidenceOnNotCompliant: boolean;
  sortOrder: number;
  weight: string | null;
  isActive: boolean;
}

export interface Inspection extends BaseEntity {
  inspectionTypeId: ID;
  templateId: ID | null;
  companyId: ID | null;
  areaId: ID | null;
  sectorId: ID | null;
  locationId: ID | null;
  inspectorId: ID | null;
  title: string;
  description: string | null;
  status: InspectionStatus;
  scheduledAt: ISODateString | null;
  startedAt: ISODateString | null;
  completedAt: ISODateString | null;
  closedAt: ISODateString | null;
  latitude: string | null;
  longitude: string | null;
  score: string | null;
  findingsCount: number;
  openFindingsCount: number;
  notes: string | null;
}

export interface InspectionChecklistAnswer extends BaseEntity {
  inspectionId: ID;
  checklistItemId: ID;
  answerValue: InspectionAnswerValue | null;
  answerText: string | null;
  numericValue: string | null;
  answeredByUserId: ID | null;
  answeredAt: ISODateString | null;
  notes: string | null;
}

export interface InspectionFinding extends BaseEntity {
  inspectionId: ID;
  checklistItemId: ID | null;
  findingTypeId: ID | null;
  severityId: ID | null;
  responsibleCompanyId: ID | null;
  responsibleUserIds: ID[];
  title: string;
  description: string | null;
  detectedCondition: string | null;
  proposedCorrectiveAction: string | null;
  executedActionDescription: string | null;
  rejectionReason: string | null;
  severity: InspectionFindingSeverity;
  status: InspectionFindingStatus;
  ownerUserId: ID | null;
  createdByUserId: ID | null;
  dueAt: ISODateString | null;
  executedAt: ISODateString | null;
  executedByUserId: ID | null;
  closedAt: ISODateString | null;
  closedByUserId: ID | null;
  rejectedAt: ISODateString | null;
  rejectedByUserId: ID | null;
}

export interface InspectionFollowup extends BaseEntity {
  findingId: ID;
  sequenceNumber: number;
  status: InspectionFollowupStatus;
  description: string;
  performedByUserId: ID | null;
  performedAt: ISODateString | null;
  nextDueAt: ISODateString | null;
}

export interface InspectionStatusHistory {
  id: ID;
  inspectionId: ID;
  fromStatus: InspectionStatus | null;
  toStatus: InspectionStatus;
  changedByUserId: ID | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: ISODateString;
}
