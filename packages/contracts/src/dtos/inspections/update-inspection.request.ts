import type { InspectionStatus } from '../../enums';
import type { ID, ISODateString } from '../../types/common';

export interface UpdateInspectionRequest {
  inspectionTypeId?: ID;
  templateId?: ID | null;
  companyId?: ID | null;
  areaId?: ID | null;
  sectorId?: ID | null;
  locationId?: ID | null;
  title?: string;
  description?: string | null;
  status?: InspectionStatus;
  scheduledAt?: ISODateString | null;
  startedAt?: ISODateString | null;
  completedAt?: ISODateString | null;
  closedAt?: ISODateString | null;
  latitude?: number | null;
  longitude?: number | null;
  score?: number | null;
  notes?: string | null;
  reason?: string | null;
}
