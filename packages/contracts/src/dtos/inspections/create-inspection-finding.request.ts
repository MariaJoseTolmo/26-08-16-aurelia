import type { InspectionFindingSeverity } from '../../enums';
import type { ID, ISODateString } from '../../types/common';

export interface CreateInspectionFindingRequest {
  checklistItemId?: ID | null;
  findingTypeId?: ID | null;
  severityId?: ID | null;
  responsibleCompanyId?: ID | null;
  responsibleUserIds?: ID[];
  title: string;
  description?: string | null;
  detectedCondition?: string | null;
  proposedCorrectiveAction?: string | null;
  severity: InspectionFindingSeverity;
  ownerUserId?: ID | null;
  dueAt?: ISODateString | null;
}
