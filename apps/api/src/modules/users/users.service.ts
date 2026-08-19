import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AreaResponse,
  CompanyResponse,
  PermissionResponse,
  RoleResponse,
  UserResponse,
} from '@aurelia/contracts';
import { QueryFailedError, Repository } from 'typeorm';
import { AreaEntity } from '../organization/entities/area.entity';
import { CompanyEntity } from '../organization/entities/company.entity';
import { RoleEntity } from '../roles/entities/role.entity';
import { PermissionEntity } from '../roles/entities/permission.entity';
import { CredentialHashService } from '../auth/credential-hash.service';
import { AssignUserAreaDto } from './dto/assign-user-area.dto';
import { AssignUserCompanyDto } from './dto/assign-user-company.dto';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserAreaEntity } from './entities/user-area.entity';
import { UserCompanyEntity } from './entities/user-company.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roles: Repository<RoleEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
    @InjectRepository(AreaEntity)
    private readonly areas: Repository<AreaEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoles: Repository<UserRoleEntity>,
    @InjectRepository(UserCompanyEntity)
    private readonly userCompanies: Repository<UserCompanyEntity>,
    @InjectRepository(UserAreaEntity)
    private readonly userAreas: Repository<UserAreaEntity>,
    private readonly credentialHashService: CredentialHashService,
  ) {}

  async findAll(filters?: { companyId?: string; role?: string }): Promise<UserResponse[]> {
    const rows = await this.users.find({
      order: { email: 'ASC' },
      relations: {
        userRoles: { role: { rolePermissions: { permission: true } } },
        userCompanies: { company: true },
        userAreas: { area: true },
      },
    });

    let result = rows;

    if (filters?.companyId) {
      result = result.filter(
        (u) =>
          u.companyId === filters.companyId ||
          u.userCompanies?.some((uc) => uc.company?.id === filters.companyId),
      );
    }

    if (filters?.role) {
      result = result.filter((u) =>
        u.userRoles?.some((ur) => ur.role?.isActive && ur.role.code === filters.role),
      );
    }

    return result.map((row) => this.toUserResponse(row));
  }

  async findOne(id: string): Promise<UserResponse> {
    const user = await this.findEntity(id);
    return this.toUserResponse(user);
  }

  async create(dto: CreateUserDto): Promise<UserResponse> {
    if (dto.companyId) {
      const company = await this.companies.findOneBy({ id: dto.companyId });
      if (!company) {
        throw new NotFoundException(`Company ${dto.companyId} not found`);
      }
    }

    if (dto.areaId) {
      const area = await this.areas.findOneBy({ id: dto.areaId });
      if (!area) {
        throw new NotFoundException(`Area ${dto.areaId} not found`);
      }
    }

    const passwordHash = dto.password
      ? await this.credentialHashService.create(dto.password)
      : null;

    const entity = this.users.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      position: dto.position ?? null,
      phone: dto.phone ?? null,
      companyId: dto.companyId ?? null,
      areaId: dto.areaId ?? null,
      isActive: dto.isActive ?? true,
      passwordHash,
      passwordChangedAt: passwordHash ? new Date() : null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    try {
      const saved = await this.users.save(entity);
      return this.toUserResponse(await this.findEntity(saved.id));
    } catch (err) {
      if (err instanceof QueryFailedError && (err as QueryFailedError & { code?: string }).code === '23505') {
        throw new ConflictException(`Email '${dto.email}' already exists`);
      }
      throw err;
    }
  }

  async assignRole(userId: string, dto: AssignUserRoleDto): Promise<UserResponse> {
    const user = await this.findEntity(userId);
    const role = await this.roles.findOneBy({ id: dto.roleId, isActive: true });
    if (!role) {
      throw new NotFoundException(`Active role ${dto.roleId} not found`);
    }

    const existing = await this.userRoles.findOne({
      where: { user: { id: userId }, role: { id: dto.roleId } },
    });
    if (!existing) {
      await this.userRoles.save(this.userRoles.create({ user, role }));
    }

    return this.toUserResponse(await this.findEntity(userId));
  }

  async assignCompany(userId: string, dto: AssignUserCompanyDto): Promise<UserResponse> {
    const user = await this.findEntity(userId);
    const company = await this.companies.findOneBy({ id: dto.companyId });
    if (!company) {
      throw new NotFoundException(`Company ${dto.companyId} not found`);
    }

    const existing = await this.userCompanies.findOne({
      where: { user: { id: userId }, company: { id: dto.companyId } },
    });
    if (!existing) {
      await this.userCompanies.save(this.userCompanies.create({ user, company }));
    }

    return this.toUserResponse(await this.findEntity(userId));
  }

  async assignArea(userId: string, dto: AssignUserAreaDto): Promise<UserResponse> {
    const user = await this.findEntity(userId);
    const area = await this.areas.findOneBy({ id: dto.areaId });
    if (!area) {
      throw new NotFoundException(`Area ${dto.areaId} not found`);
    }

    const existing = await this.userAreas.findOne({
      where: { user: { id: userId }, area: { id: dto.areaId } },
    });
    if (!existing) {
      await this.userAreas.save(this.userAreas.create({ user, area }));
    }

    return this.toUserResponse(await this.findEntity(userId));
  }

  private async findEntity(id: string): Promise<UserEntity> {
    const user = await this.users.findOne({
      where: { id },
      relations: {
        userRoles: { role: { rolePermissions: { permission: true } } },
        userCompanies: { company: true },
        userAreas: { area: true },
      },
    });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  private toUserResponse(entity: UserEntity): UserResponse {
    return {
      id: entity.id,
      email: entity.email,
      firstName: entity.firstName,
      lastName: entity.lastName,
      fullName: `${entity.firstName} ${entity.lastName}`,
      position: entity.position,
      phone: entity.phone,
      companyId: entity.companyId,
      areaId: entity.areaId,
      isActive: entity.isActive,
      lastLoginAt: entity.lastLoginAt ? entity.lastLoginAt.toISOString() : null,
      roles: entity.userRoles?.filter((row) => row.role.isActive).map((row) => this.toRoleResponse(row.role)) ?? [],
      companies: entity.userCompanies?.map((row) => this.toCompanyResponse(row.company)) ?? [],
      areas: entity.userAreas?.map((row) => this.toAreaResponse(row.area)) ?? [],
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
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

  private toCompanyResponse(entity: CompanyEntity): CompanyResponse {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      taxId: entity.taxId,
      companyType: entity.companyType,
      isContractor: entity.isContractor,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toAreaResponse(entity: AreaEntity): AreaResponse {
    return {
      id: entity.id,
      gerenciaId: entity.gerenciaId,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
