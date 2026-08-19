import { Type } from 'class-transformer';
import {
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CreateIncidentRequest, IncidentConstraints } from '@aurelia/contracts';

export class CreateIncidentDto implements CreateIncidentRequest {
  @IsUUID()
  incidentTypeId: string;

  @IsUUID()
  incidentLevelId: string;

  @IsOptional()
  @IsUUID()
  companyId?: string | null;

  @IsOptional()
  @IsUUID()
  areaId?: string | null;

  @IsOptional()
  @IsUUID()
  sectorId?: string | null;

  @IsOptional()
  @IsUUID()
  locationId?: string | null;

  @IsOptional()
  @IsUUID()
  reportedByUserId?: string | null;

  @IsString()
  @MinLength(IncidentConstraints.title.minLength)
  @MaxLength(IncidentConstraints.title.maxLength)
  title: string;

  @IsString()
  @MinLength(IncidentConstraints.description.minLength)
  @MaxLength(IncidentConstraints.description.maxLength)
  description: string;

  @IsISO8601()
  occurredAt: string;

  @IsOptional()
  @IsISO8601()
  reportedAt?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number | null;

  @IsOptional()
  @IsString()
  immediateResponseSummary?: string | null;

  @IsOptional()
  @IsString()
  environmentalImpactSummary?: string | null;
}
