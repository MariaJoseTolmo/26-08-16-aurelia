import { IsEnum, IsString, IsUUID, MaxLength, MinLength, ValidateIf } from 'class-validator';
import {
  CreateSprCycleValidationRequest,
  SprCycleValidationDecision,
} from '@aurelia/contracts';

export class CreateSprCycleValidationDto implements CreateSprCycleValidationRequest {
  @IsUUID()
  areaId!: string;

  @IsEnum(SprCycleValidationDecision)
  decision!: SprCycleValidationDecision;

  @ValidateIf((dto: CreateSprCycleValidationDto) => dto.decision === SprCycleValidationDecision.DISCREPANCY_REPORTED)
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  comments?: string | null;
}
