import type { SprRecordStatus } from '../../enums';

export interface UpdateSprMonthlyRecordRequest {
  numericValue?: number | null;
  textValue?: string | null;
  booleanValue?: boolean | null;
  status?: SprRecordStatus;
  notes?: string | null;
}
