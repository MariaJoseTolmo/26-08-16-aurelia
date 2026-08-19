import type { IncidentActionPlanStatus } from '../../enums';
import type { ID, ISODateString } from '../../types/common';

export interface CreateIncidentImmediateActionRequest {
  description: string;
  status?: IncidentActionPlanStatus;
  performedByUserId?: ID | null;
  performedAt?: ISODateString | null;
}

export interface UpdateIncidentImmediateActionRequest {
  description?: string;
  status?: IncidentActionPlanStatus;
  performedByUserId?: ID | null;
  performedAt?: ISODateString | null;
}
