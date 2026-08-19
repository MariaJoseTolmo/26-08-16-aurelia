import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateAuditLogDto {
  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @IsString()
  @MinLength(1)
  action: string;

  @IsOptional()
  oldValue?: unknown;

  @IsOptional()
  newValue?: unknown;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}
