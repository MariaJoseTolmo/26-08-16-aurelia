import type { InspectionStatus } from '../../enums';

export interface UpdateInspectionStatusRequest {
  status: InspectionStatus;
  comment?: string;
}
