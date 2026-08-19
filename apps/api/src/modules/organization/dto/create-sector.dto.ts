import { RecordStatus, CreateSectorRequest, OrganizationConstraints } from '@aurelia/contracts';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateSectorDto implements CreateSectorRequest {
  @IsOptional()
  @IsUUID()
  areaId?: string;

  @IsString()
  @MinLength(OrganizationConstraints.code.minLength)
  @MaxLength(OrganizationConstraints.code.maxLength)
  code: string;

  @IsString()
  @MinLength(OrganizationConstraints.name.minLength)
  @MaxLength(OrganizationConstraints.name.maxLength)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(OrganizationConstraints.description.maxLength)
  description?: string;

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}
