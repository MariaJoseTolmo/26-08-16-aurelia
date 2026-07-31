import { IsOptional, IsString, MaxLength } from 'class-validator';
import type { ReopenSprCycleValidationRequest } from '@aurelia/contracts';

export class ReopenSprCycleValidationDto implements ReopenSprCycleValidationRequest {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  comments?: string | null;
}
