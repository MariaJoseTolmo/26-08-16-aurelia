import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { SprRecordStatus } from '@aurelia/contracts';

export class UpdateSprMonthlyRecordStatusDto {
  @IsEnum(SprRecordStatus)
  status: SprRecordStatus;

  @IsOptional()
  @IsUUID()
  submittedByUserId?: string | null;

  @IsOptional()
  @IsUUID()
  approvedByUserId?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
