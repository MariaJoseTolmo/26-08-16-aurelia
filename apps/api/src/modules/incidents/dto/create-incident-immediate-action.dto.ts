import { Type } from 'class-transformer';
import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import {
  CreateIncidentImmediateActionRequest,
  IncidentActionPlanStatus,
  UpdateIncidentImmediateActionRequest,
} from '@aurelia/contracts';

export class CreateIncidentImmediateActionDto implements CreateIncidentImmediateActionRequest {
  @IsString()
  @MinLength(3)
  description: string;

  @IsOptional()
  @IsEnum(IncidentActionPlanStatus)
  status?: IncidentActionPlanStatus;

  @IsOptional()
  @IsUUID()
  performedByUserId?: string | null;

  @IsOptional()
  @Type(() => String)
  @IsISO8601()
  performedAt?: string | null;
}

export class UpdateIncidentImmediateActionDto implements UpdateIncidentImmediateActionRequest {
  @IsOptional()
  @IsString()
  @MinLength(3)
  description?: string;

  @IsOptional()
  @IsEnum(IncidentActionPlanStatus)
  status?: IncidentActionPlanStatus;

  @IsOptional()
  @IsUUID()
  performedByUserId?: string | null;

  @IsOptional()
  @Type(() => String)
  @IsISO8601()
  performedAt?: string | null;
}
