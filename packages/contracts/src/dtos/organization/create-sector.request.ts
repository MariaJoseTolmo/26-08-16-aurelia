import type { RecordStatus } from '../../enums';
import type { ID } from '../../types/common';

export interface CreateSectorRequest {
  areaId?: ID;
  code: string;
  name: string;
  description?: string;
  status?: RecordStatus;
}
