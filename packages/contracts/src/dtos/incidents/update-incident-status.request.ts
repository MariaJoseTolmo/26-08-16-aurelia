import type { IncidentStatus } from '../../enums';
import type { ID } from '../../types/common';

export interface UpdateIncidentStatusRequest {
  status: IncidentStatus;
  comment?: string | null;
  changedByUserId?: ID | null;
}
