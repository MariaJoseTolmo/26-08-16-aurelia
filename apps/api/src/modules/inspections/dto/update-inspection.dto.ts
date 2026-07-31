import { InspectionConstraints, InspectionStatus, UpdateInspectionRequest } from '@aurelia/contracts';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsISO8601, IsNumber, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateInspectionDto implements UpdateInspectionRequest {
  @IsOptional()
  @IsUUID()
  inspectionTypeId?: string;

  @IsOptional()
  @IsUUID()
  templateId?: string | null;

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
  @IsString()
  @MinLength(InspectionConstraints.title.minLength)
  @MaxLength(InspectionConstraints.title.maxLength)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(InspectionConstraints.description.maxLength)
  description?: string | null;

  @ApiPropertyOptional({ enum: InspectionStatus, enumName: 'InspectionStatus' })
  @IsOptional()
  @IsEnum(InspectionStatus)
  status?: InspectionStatus;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string | null;

  @IsOptional()
  @IsISO8601()
  startedAt?: string | null;

  @IsOptional()
  @IsISO8601()
  completedAt?: string | null;

  @IsOptional()
  @IsISO8601()
  closedAt?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  score?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(InspectionConstraints.notes.maxLength)
  notes?: string | null;

  @IsOptional()
  @IsString()
  reason?: string | null;
}
