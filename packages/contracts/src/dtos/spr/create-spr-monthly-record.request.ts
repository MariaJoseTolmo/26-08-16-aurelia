import type { ID } from '../../types/common';

export interface CreateSprMonthlyRecordRequest {
  parameterId: ID;
  areaId?: ID | null;
  assignmentId?: ID | null;
  periodYear: number;
  periodMonth: number;
  numericValue?: number | null;
  textValue?: string | null;
  booleanValue?: boolean | null;
  notes?: string | null;
}
