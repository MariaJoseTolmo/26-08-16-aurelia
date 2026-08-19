import type { RecordStatus } from '../../enums';
import type { ID } from '../../types/common';

export interface CreateAreaRequest {
  gerenciaId?: ID;
  code: string;
  name: string;
  description?: string;
  status?: RecordStatus;
}
