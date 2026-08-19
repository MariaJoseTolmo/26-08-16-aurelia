import { CreateRoleRequest, Role, RoleConstraints } from '@aurelia/contracts';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRoleDto implements CreateRoleRequest {
  @IsEnum(Role)
  code: Role;

  @IsString()
  @MinLength(RoleConstraints.name.minLength)
  @MaxLength(RoleConstraints.name.maxLength)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(RoleConstraints.description.maxLength)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
