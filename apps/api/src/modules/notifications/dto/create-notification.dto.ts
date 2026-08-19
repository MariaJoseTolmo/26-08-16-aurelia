import { CreateNotificationRequest } from '@aurelia/contracts';
import { IsArray, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateNotificationDto implements CreateNotificationRequest {
  @IsString()
  @MaxLength(140)
  title: string;

  @IsOptional()
  @IsString()
  body?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  entityType?: string | null;

  @IsOptional()
  @IsUUID()
  entityId?: string | null;

  @IsOptional()
  @IsUUID()
  triggeredByUserId?: string | null;

  @IsArray()
  @IsUUID('4', { each: true })
  recipientUserIds: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;
}
