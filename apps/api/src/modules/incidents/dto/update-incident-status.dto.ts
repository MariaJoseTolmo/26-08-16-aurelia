import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { IncidentStatus, UpdateIncidentStatusRequest } from '@aurelia/contracts';

export class UpdateIncidentStatusDto implements UpdateIncidentStatusRequest {
  @IsEnum(IncidentStatus)
  status: IncidentStatus;

  @IsOptional()
  @IsString()
  comment?: string | null;

  @IsOptional()
  @IsUUID()
  changedByUserId?: string | null;
}
