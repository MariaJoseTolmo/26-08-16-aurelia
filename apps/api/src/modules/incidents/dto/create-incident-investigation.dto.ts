import { Type } from 'class-transformer';
import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import {
  CloseIncidentRequest,
  CreateIncidentActionPlanRequest,
  CreateIncidentInvestigationRequest,
  IncidentActionPlanStatus,
  IncidentInvestigationMethod,
  UpdateIncidentActionPlanRequest,
  UpdateIncidentInvestigationRequest,
  UpsertIncidentFiveWhyAnalysisRequest,
  UpsertIncidentPeepoAnalysisRequest,
} from '@aurelia/contracts';

export class CreateIncidentInvestigationDto implements CreateIncidentInvestigationRequest {
  @IsEnum(IncidentInvestigationMethod)
  method: IncidentInvestigationMethod;

  @IsString()
  @MinLength(3)
  title: string;

  @IsOptional()
  @IsString()
  summary?: string | null;

  @IsOptional()
  @IsUUID()
  leadUserId?: string | null;

  @IsOptional()
  @Type(() => String)
  @IsISO8601()
  startedAt?: string | null;
}

export class UpdateIncidentInvestigationDto implements UpdateIncidentInvestigationRequest {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string | null;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  leadUserId?: string | null;

  @IsOptional()
  @Type(() => String)
  @IsISO8601()
  startedAt?: string | null;

  @IsOptional()
  @Type(() => String)
  @IsISO8601()
  completedAt?: string | null;
}

export class UpsertIncidentFiveWhyAnalysisDto implements UpsertIncidentFiveWhyAnalysisRequest {
  @IsString()
  @MinLength(3)
  problemStatement: string;

  @IsOptional()
  @IsString()
  why1?: string | null;

  @IsOptional()
  @IsString()
  why2?: string | null;

  @IsOptional()
  @IsString()
  why3?: string | null;

  @IsOptional()
  @IsString()
  why4?: string | null;

  @IsOptional()
  @IsString()
  why5?: string | null;

  @IsOptional()
  @IsString()
  rootCause?: string | null;
}

export class UpsertIncidentPeepoAnalysisDto implements UpsertIncidentPeepoAnalysisRequest {
  @IsOptional()
  @IsString()
  people?: string | null;

  @IsOptional()
  @IsString()
  environment?: string | null;

  @IsOptional()
  @IsString()
  equipment?: string | null;

  @IsOptional()
  @IsString()
  procedures?: string | null;

  @IsOptional()
  @IsString()
  organization?: string | null;
}

export class CreateIncidentActionPlanDto implements CreateIncidentActionPlanRequest {
  @IsOptional()
  @IsUUID()
  investigationId?: string | null;

  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(3)
  description: string;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string | null;

  @IsOptional()
  @Type(() => String)
  @IsISO8601()
  dueAt?: string | null;

  @IsOptional()
  @IsEnum(IncidentActionPlanStatus)
  status?: IncidentActionPlanStatus;
}

export class UpdateIncidentActionPlanDto implements UpdateIncidentActionPlanRequest {
  @IsOptional()
  @IsUUID()
  investigationId?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  description?: string;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string | null;

  @IsOptional()
  @Type(() => String)
  @IsISO8601()
  dueAt?: string | null;

  @IsOptional()
  @IsEnum(IncidentActionPlanStatus)
  status?: IncidentActionPlanStatus;

  @IsOptional()
  @Type(() => String)
  @IsISO8601()
  completedAt?: string | null;

  @IsOptional()
  @IsUUID()
  closedByUserId?: string | null;
}

export class CloseIncidentDto implements CloseIncidentRequest {
  @IsOptional()
  @IsUUID()
  closedByUserId?: string | null;

  @IsOptional()
  @IsString()
  comment?: string | null;
}
