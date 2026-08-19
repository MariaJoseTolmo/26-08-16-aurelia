import type { ID, ISODateString } from '../../types/common';

export interface CreateIncidentRequest {
  incidentTypeId: ID;
  incidentLevelId: ID;
  companyId?: ID | null;
  areaId?: ID | null;
  sectorId?: ID | null;
  locationId?: ID | null;
  reportedByUserId?: ID | null;
  title: string;
  description: string;
  occurredAt: ISODateString;
  reportedAt?: ISODateString | null;
  latitude?: number | null;
  longitude?: number | null;
  immediateResponseSummary?: string | null;
  environmentalImpactSummary?: string | null;
}
