import { CreatePermissionRequest, RoleConstraints } from '@aurelia/contracts';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePermissionDto implements CreatePermissionRequest {
  @IsString()
  @MinLength(RoleConstraints.permissionCode.minLength)
  @MaxLength(RoleConstraints.permissionCode.maxLength)
  code: string;

  @IsString()
  @MinLength(RoleConstraints.name.minLength)
  @MaxLength(RoleConstraints.name.maxLength)
  name: string;

  @IsString()
  @MinLength(RoleConstraints.module.minLength)
  @MaxLength(RoleConstraints.module.maxLength)
  module: string;

  @IsString()
  @MinLength(RoleConstraints.action.minLength)
  @MaxLength(RoleConstraints.action.maxLength)
  action: string;

  @IsOptional()
  @IsString()
  @MaxLength(RoleConstraints.description.maxLength)
  description?: string;
}
