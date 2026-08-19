import type { RecordStatus } from '../../enums';
import type { ID } from '../../types/common';

export interface CreateLocationRequest {
  sectorId?: ID;
  code?: string;
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  altitudeM?: number;
  macrozone?: string;
  status?: RecordStatus;
}
