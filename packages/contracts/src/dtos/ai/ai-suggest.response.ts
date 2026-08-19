import { AiSuggestType } from '../../enums';

export interface AiSuggestResponse {
  suggestion: string;
  type: AiSuggestType;
  fallback: boolean;
}