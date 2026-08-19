import type { InspectionAnswerValue } from '../../enums';
import type { ID, ISODateString } from '../../types/common';

export interface UpsertInspectionAnswerRequest {
  checklistItemId: ID;
  answerValue?: InspectionAnswerValue | null;
  answerText?: string | null;
  numericValue?: number | null;
  answeredAt?: ISODateString | null;
  notes?: string | null;
}
