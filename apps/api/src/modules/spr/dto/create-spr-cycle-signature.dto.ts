import { IsEnum } from 'class-validator';
import { CreateSprCycleSignatureRequest, SprCycleSignatureLevel } from '@aurelia/contracts';

export class CreateSprCycleSignatureDto implements CreateSprCycleSignatureRequest {
  @IsEnum(SprCycleSignatureLevel)
  level!: SprCycleSignatureLevel;
}
