import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { PermissionResponse, RoleResponse } from '@aurelia/contracts';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { AssignRolePermissionDto } from './dto/assign-role-permission.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { RolesService } from './roles.service';

@Controller()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @RequirePermissions('roles:read')
  @Get('roles')
  findAll(): Promise<RoleResponse[]> {
    return this.rolesService.findAll();
  }

  @RequirePermissions('roles:write')
  @Post('roles')
  create(@Body() dto: CreateRoleDto): Promise<RoleResponse> {
    return this.rolesService.create(dto);
  }

  @RequirePermissions('roles:write')
  @Post('roles/:id/permissions')
  assignPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRolePermissionDto,
  ): Promise<RoleResponse> {
    return this.rolesService.assignPermission(id, dto);
  }

  @RequirePermissions('permissions:read')
  @Get('permissions')
  findPermissions(): Promise<PermissionResponse[]> {
    return this.rolesService.findPermissions();
  }

  @RequirePermissions('permissions:write')
  @Post('permissions')
  createPermission(@Body() dto: CreatePermissionDto): Promise<PermissionResponse> {
    return this.rolesService.createPermission(dto);
  }
}
