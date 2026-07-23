import type { ISODateString } from '../../types/common';
import type { InspectionFindingSeverity } from '../../enums/inspection-finding-severity.enum';

export const INSPECTION_CAPABILITIES = {
  read: 'inspections:read',
  create: 'inspections:create',
  execute: 'inspections:execute',
  review: 'inspections:review',
  reassign: 'inspections:reassign',
  admin: 'inspections:admin',
} as const;

export type InspectionCapability = (typeof INSPECTION_CAPABILITIES)[keyof typeof INSPECTION_CAPABILITIES];

export enum InspectionProcessRequestType {
  EXTENSION = 'extension',
  DISPUTE = 'dispute',
  EVIDENCE_RESUBMISSION = 'evidence_resubmission',
}

export enum InspectionProcessRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RATIFIED = 'ratified',
  REASSIGNED = 'reassigned',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum InspectionSlaEventType {
  FIRST_REMINDER = 'first_reminder',
  SECOND_REMINDER = 'second_reminder',
  OVERDUE = 'overdue',
  ESCALATED = 'escalated',
}

export enum NotificationDeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  RETRYING = 'retrying',
}

export enum InspectionAiAssessmentKind {
  PRE_VALIDATION = 'pre_validation',
  DUPLICATE = 'duplicate',
}

export enum InspectionAiDecision {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  OVERRIDDEN = 'overridden',
  REJECTED = 'rejected',
}

export interface InspectionProcessRequestResponse {
  id: string;
  findingId: string;
  type: InspectionProcessRequestType;
  status: InspectionProcessRequestStatus;
  reason: string;
  requestedDueAt: ISODateString | null;
  resolvedDueAt: ISODateString | null;
  iteration: number | null;
  requestedByUserId: string | null;
  resolvedByUserId: string | null;
  resolutionReason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  resolvedAt: ISODateString | null;
}

export interface RequestInspectionExtensionRequest {
  reason: string;
  requestedDueAt: ISODateString;
}

export interface ResolveInspectionExtensionRequest {
  approved: boolean;
  reason: string;
  resolvedDueAt?: ISODateString | null;
}

export interface OpenInspectionDisputeRequest {
  reason: string;
}

export interface ResolveInspectionDisputeRequest {
  resolution: 'ratify' | 'reassign';
  reason: string;
  responsibleCompanyId?: string | null;
  responsibleUserIds?: string[];
}

export interface ResubmitInspectionEvidenceRequest {
  reason: string;
  evidenceIds: string[];
  executedActionDescription?: string | null;
}

export interface InspectionSlaPolicyResponse {
  id: string;
  severity: InspectionFindingSeverity;
  firstReminderHoursBefore: number;
  secondReminderHoursBefore: number;
  escalationHoursAfter: number;
  isActive: boolean;
  updatedByUserId: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface UpsertInspectionSlaPolicyRequest {
  firstReminderHoursBefore: number;
  secondReminderHoursBefore: number;
  escalationHoursAfter: number;
  isActive?: boolean;
  reason: string;
}

export interface InspectionSlaEventResponse {
  id: string;
  findingId: string;
  policyId: string | null;
  type: InspectionSlaEventType;
  eventKey: string;
  dueAt: ISODateString | null;
  occurredAt: ISODateString;
  metadata: Record<string, unknown> | null;
}

export interface InspectionSlaRunResponse {
  scanned: number;
  createdEvents: number;
  skipped: number;
}

export interface NotificationDeliveryResponse {
  id: string;
  notificationId: string;
  channel: string;
  destination: string | null;
  status: NotificationDeliveryStatus;
  attemptCount: number;
  maxAttempts: number;
  lastError: string | null;
  nextRetryAt: ISODateString | null;
  sentAt: ISODateString | null;
  failedAt: ISODateString | null;
  metadata: Record<string, unknown> | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface NotificationDeepLinkResponse {
  token: string | null;
  status: 'valid' | 'expired' | 'invalid';
  requiresLogin: boolean;
  entityType: string | null;
  entityId: string | null;
  route: string;
  expiresAt: ISODateString | null;
}

export interface InspectionAiAssessmentResponse {
  id: string;
  inspectionId: string;
  findingId: string | null;
  kind: InspectionAiAssessmentKind;
  confidence: number;
  recommendation: string;
  explanation: string[];
  duplicateFindingId: string | null;
  suggestedData: Record<string, unknown> | null;
  decision: InspectionAiDecision;
  decisionReason: string | null;
  decidedByUserId: string | null;
  decidedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface InspectionAiPreValidationRequest {
  findingId?: string | null;
  title: string;
  detectedCondition?: string | null;
  proposedCorrectiveAction?: string | null;
  severity?: InspectionFindingSeverity | null;
  companyId?: string | null;
  areaId?: string | null;
}

export interface RecordInspectionAiDecisionRequest {
  decision: Exclude<InspectionAiDecision, InspectionAiDecision.PENDING>;
  reason: string;
}

export interface InspectionAdminOverviewResponse {
  pendingExtensionRequests: number;
  openDisputes: number;
  failedNotificationDeliveries: number;
  activeSlaPolicies: number;
  unresolvedSlaEscalations: number;
}
