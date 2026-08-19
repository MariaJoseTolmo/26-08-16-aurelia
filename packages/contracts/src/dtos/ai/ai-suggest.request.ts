import { AiSuggestType } from '../../enums';

export interface AiSuggestRequest {
  type: AiSuggestType;
  context: Record<string, unknown>;
}