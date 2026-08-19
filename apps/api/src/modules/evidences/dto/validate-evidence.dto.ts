import { EvidenceStatus } from '@aurelia/contracts';
import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class ValidateEvidenceDto {
  @IsEnum(EvidenceStatus)
  @IsIn([EvidenceStatus.VALIDATED, EvidenceStatus.REJECTED])
  status: EvidenceStatus.VALIDATED | EvidenceStatus.REJECTED;

  @IsOptional()
  @IsString()
  validationNotes?: string;

  @IsOptional()
  @IsUUID()
  validatedByUserId?: string;
}
