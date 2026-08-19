import { RecordStatus, CreateAreaRequest, OrganizationConstraints } from '@aurelia/contracts';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateAreaDto implements CreateAreaRequest {
  @IsOptional()
  @IsUUID()
  gerenciaId?: string;

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
