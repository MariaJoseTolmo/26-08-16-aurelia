import type { RecordStatus } from '../../enums';

export interface CreateBusinessUnitRequest {
  code: string;
  name: string;
  description?: string;
  status?: RecordStatus;
}
