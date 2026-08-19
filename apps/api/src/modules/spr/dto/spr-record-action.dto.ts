import { IsOptional, IsString, IsUUID } from 'class-validator';
import { SprRecordActionRequest } from '@aurelia/contracts';

export class SprRecordActionDto implements SprRecordActionRequest {
  @IsOptional()
  @IsUUID()
  submittedByUserId?: string | null;

  @IsOptional()
  @IsUUID()
  approverUserId?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsString()
  comments?: string | null;
}
