import { RecordStatus, CreateCompanyRequest, OrganizationConstraints } from '@aurelia/contracts';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCompanyDto implements CreateCompanyRequest {
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
  @MaxLength(OrganizationConstraints.taxId.maxLength)
  taxId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(OrganizationConstraints.companyType.maxLength)
  companyType?: string;

  @IsOptional()
  @IsBoolean()
  isContractor?: boolean;

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}
