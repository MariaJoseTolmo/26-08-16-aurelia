import { CreateUserRequest, UserConstraints } from '@aurelia/contracts';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto implements CreateUserRequest {
  @IsEmail()
  @MaxLength(UserConstraints.email.maxLength)
  email: string;

  @IsString()
  @MinLength(UserConstraints.firstName.minLength)
  @MaxLength(UserConstraints.firstName.maxLength)
  firstName: string;

  @IsString()
  @MinLength(UserConstraints.lastName.minLength)
  @MaxLength(UserConstraints.lastName.maxLength)
  lastName: string;

  @IsOptional()
  @IsString()
  @MaxLength(UserConstraints.position.maxLength)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(UserConstraints.phone.maxLength)
  phone?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  areaId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password?: string;
}
