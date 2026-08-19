import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PermissionResponse, RoleResponse } from '@aurelia/contracts';
import { QueryFailedError, Repository } from 'typeorm';
import { AssignRolePermissionDto } from './dto/assign-role-permission.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { PermissionEntity } from './entities/permission.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { RoleEntity } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roles: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissions: Repository<PermissionEntity>,
    @InjectRepository(RolePermissionEntity)
    private readonly rolePermissions: Repository<RolePermissionEntity>,
  ) {}

  async findAll(): Promise<RoleResponse[]> {
    const rows = await this.roles.find({
      where: { isActive: true },
      order: { code: 'ASC' },
      relations: { rolePermissions: { permission: true } },
    });
    return rows.map((row) => this.toRoleResponse(row));
  }

  async create(dto: CreateRoleDto): Promise<RoleResponse> {
    const entity = this.roles.create({
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      isSystem: dto.isSystem ?? false,
      isActive: dto.isActive ?? true,
    });
    try {
      return this.toRoleResponse(await this.roles.save(entity));
    } catch (err) {
      this.rethrowIfDuplicate(err, `Role code '${dto.code}' already exists`);
    }
  }

  async findPermissions(): Promise<PermissionResponse[]> {
    const rows = await this.permissions.find({ order: { code: 'ASC' } });
    return rows.map((row) => this.toPermissionResponse(row));
  }

  async createPermission(dto: CreatePermissionDto): Promise<PermissionResponse> {
    const entity = this.permissions.create({
      code: dto.code,
      name: dto.name,
      module: dto.module,
      action: dto.action,
      description: dto.description ?? null,
    });
    try {
      return this.toPermissionResponse(await this.permissions.save(entity));
    } catch (err) {
      this.rethrowIfDuplicate(err, `Permission code '${dto.code}' already exists`);
    }
  }

  async assignPermission(roleId: string, dto: AssignRolePermissionDto): Promise<RoleResponse> {
    const role = await this.roles.findOne({
      where: { id: roleId },
      relations: { rolePermissions: { permission: true } },
    });
    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    const permission = await this.permissions.findOneBy({ id: dto.permissionId });
    if (!permission) {
      throw new NotFoundException(`Permission ${dto.permissionId} not found`);
    }

    const existing = await this.rolePermissions.findOne({
      where: { role: { id: roleId }, permission: { id: dto.permissionId } },
    });
    if (!existing) {
      await this.rolePermissions.save(this.rolePermissions.create({ role, permission }));
    }

    const updated = await this.roles.findOne({
      where: { id: roleId },
      relations: { rolePermissions: { permission: true } },
    });
    if (!updated) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }
    return this.toRoleResponse(updated);
  }

  private toRoleResponse(entity: RoleEntity): RoleResponse {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      isSystem: entity.isSystem,
      isActive: entity.isActive,
      permissions: entity.rolePermissions?.map((row) => this.toPermissionResponse(row.permission)) ?? [],
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toPermissionResponse(entity: PermissionEntity): PermissionResponse {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      module: entity.module,
      action: entity.action,
      description: entity.description,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private rethrowIfDuplicate(err: unknown, message: string): never {
    if (err instanceof QueryFailedError && (err as QueryFailedError & { code?: string }).code === '23505') {
      throw new ConflictException(message);
    }
    throw err as Error;
  }
}
