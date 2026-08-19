import type { IncidentActionPlanStatus, IncidentInvestigationMethod } from '../../enums';
import type { ID, ISODateString } from '../../types/common';

export interface CreateIncidentInvestigationRequest {
  method: IncidentInvestigationMethod;
  title: string;
  summary?: string | null;
  leadUserId?: ID | null;
  startedAt?: ISODateString | null;
}

export interface UpdateIncidentInvestigationRequest {
  title?: string;
  summary?: string | null;
  status?: string;
  leadUserId?: ID | null;
  startedAt?: ISODateString | null;
  completedAt?: ISODateString | null;
}

export interface UpsertIncidentFiveWhyAnalysisRequest {
  problemStatement: string;
  why1?: string | null;
  why2?: string | null;
  why3?: string | null;
  why4?: string | null;
  why5?: string | null;
  rootCause?: string | null;
}

export interface UpsertIncidentPeepoAnalysisRequest {
  people?: string | null;
  environment?: string | null;
  equipment?: string | null;
  procedures?: string | null;
  organization?: string | null;
}

export interface CreateIncidentActionPlanRequest {
  investigationId?: ID | null;
  title: string;
  description: string;
  ownerUserId?: ID | null;
  dueAt?: ISODateString | null;
  status?: IncidentActionPlanStatus;
}

export interface UpdateIncidentActionPlanRequest {
  investigationId?: ID | null;
  title?: string;
  description?: string;
  ownerUserId?: ID | null;
  dueAt?: ISODateString | null;
  status?: IncidentActionPlanStatus;
  completedAt?: ISODateString | null;
  closedByUserId?: ID | null;
}

export interface CloseIncidentRequest {
  closedByUserId?: ID | null;
  comment?: string | null;
}
