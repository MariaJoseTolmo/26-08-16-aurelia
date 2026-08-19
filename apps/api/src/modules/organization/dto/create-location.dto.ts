import { Type } from 'class-transformer';
import { RecordStatus, CreateLocationRequest, OrganizationConstraints } from '@aurelia/contracts';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateLocationDto implements CreateLocationRequest {
  @IsOptional()
  @IsUUID()
  sectorId?: string;

  @IsOptional()
  @IsString()
  @MinLength(OrganizationConstraints.code.minLength)
  @MaxLength(OrganizationConstraints.code.maxLength)
  code?: string;

  @IsString()
  @MinLength(OrganizationConstraints.name.minLength)
  @MaxLength(OrganizationConstraints.name.maxLength)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(OrganizationConstraints.description.maxLength)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  altitudeM?: number;

  @IsOptional()
  @IsString()
  @MaxLength(OrganizationConstraints.macrozone.maxLength)
  macrozone?: string;

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}
