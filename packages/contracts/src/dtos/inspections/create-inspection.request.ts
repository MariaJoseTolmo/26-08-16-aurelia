import type { ID, ISODateString } from '../../types/common';

export interface CreateInspectionRequest {
  inspectionTypeId: ID;
  templateId?: ID | null;
  companyId?: ID | null;
  areaId?: ID | null;
  sectorId?: ID | null;
  locationId?: ID | null;
  title: string;
  description?: string | null;
  scheduledAt?: ISODateString | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
}
