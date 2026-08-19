import { IsEnum, IsObject } from 'class-validator';
import { AiSuggestRequest, AiSuggestType } from '@aurelia/contracts';

export class AiSuggestDto implements AiSuggestRequest {
  @IsEnum(AiSuggestType)
  type: AiSuggestType;

  @IsObject()
  context: Record<string, unknown>;
}
