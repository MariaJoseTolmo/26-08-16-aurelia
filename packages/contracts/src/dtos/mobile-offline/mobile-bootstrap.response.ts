import type { AreaResponse } from '../areas';
import type { CompanyResponse, SectorResponse } from '../organization';
import type { UserResponse } from '../users';
import type { InspectionChecklistTemplateResponse, InspectionFindingSeverityResponse, InspectionFindingTypeResponse, InspectionTypeResponse } from '../inspections';
import type { ISODateString } from '../../types/common';

export interface MobileBootstrapResponse {
  bootstrapVersion: string;
  generatedAt: ISODateString;
  expiresAt: ISODateString;
  catalogs: {
    areas: AreaResponse[];
    sectors: SectorResponse[];
    companies: CompanyResponse[];
    users: UserResponse[];
    inspectionTypes: InspectionTypeResponse[];
    inspectionTemplates: InspectionChecklistTemplateResponse[];
    findingTypes: InspectionFindingTypeResponse[];
    findingSeverities: InspectionFindingSeverityResponse[];
  };
  offlinePolicy: {
    maxOfflineDays: number;
    requiresBiometricOrPin: boolean;
    maxPendingQueueItems: number;
    maxAttachmentSizeMb: number;
  };
}
