import type { IncidentRiskLevel, InspectionStatus } from '../../enums';
import type { ID, ISODateString } from '../../types/common';

export interface ReportFilterRequest {
  mueId?: ID;
  areaId?: ID;
  companyId?: ID;
  responsibleId?: ID;
  status?: InspectionStatus | string;
  riskLevel?: IncidentRiskLevel;
  from?: ISODateString;
  to?: ISODateString;
}
