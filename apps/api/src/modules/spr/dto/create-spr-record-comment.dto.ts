import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateSprRecordCommentRequest } from '@aurelia/contracts';

export class CreateSprRecordCommentDto implements CreateSprRecordCommentRequest {
  @IsString()
  body: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;

  @IsOptional()
  @IsUUID()
  authorUserId?: string | null;
}
