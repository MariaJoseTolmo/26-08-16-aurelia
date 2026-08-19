import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AreaResponse,
  BusinessUnitResponse,
  CompanyResponse,
  GerenciaResponse,
  LocationResponse,
  RecordStatus,
  SectorResponse,
} from '@aurelia/contracts';
import { QueryFailedError, Repository } from 'typeorm';
import { AreaEntity } from './entities/area.entity';
import { BusinessUnitEntity } from './entities/business-unit.entity';
import { CompanyEntity } from './entities/company.entity';
import { GerenciaEntity } from './entities/gerencia.entity';
import { LocationEntity } from './entities/location.entity';
import { SectorEntity } from './entities/sector.entity';
import { CreateAreaDto } from './dto/create-area.dto';
import { CreateBusinessUnitDto } from './dto/create-business-unit.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateGerenciaDto } from './dto/create-gerencia.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateSectorDto } from './dto/create-sector.dto';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(BusinessUnitEntity)
    private readonly businessUnits: Repository<BusinessUnitEntity>,
    @InjectRepository(GerenciaEntity)
    private readonly gerencias: Repository<GerenciaEntity>,
    @InjectRepository(AreaEntity)
    private readonly areas: Repository<AreaEntity>,
    @InjectRepository(SectorEntity)
    private readonly sectors: Repository<SectorEntity>,
    @InjectRepository(LocationEntity)
    private readonly locations: Repository<LocationEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
  ) {}

  async findBusinessUnits(): Promise<BusinessUnitResponse[]> {
    const rows = await this.businessUnits.find({ order: { name: 'ASC' } });
    return rows.map((row) => this.toBusinessUnitResponse(row));
  }

  async createBusinessUnit(dto: CreateBusinessUnitDto): Promise<BusinessUnitResponse> {
    const entity = this.businessUnits.create({
      ...dto,
      description: dto.description ?? null,
      status: dto.status ?? RecordStatus.ACTIVE,
    });
    try {
      return this.toBusinessUnitResponse(await this.businessUnits.save(entity));
    } catch (err) {
      this.rethrowIfDuplicate(err, `Business unit code '${dto.code}' already exists`);
    }
  }

  async findGerencias(): Promise<GerenciaResponse[]> {
    const rows = await this.gerencias.find({ order: { name: 'ASC' } });
    return rows.map((row) => this.toGerenciaResponse(row));
  }

  async createGerencia(dto: CreateGerenciaDto): Promise<GerenciaResponse> {
    if (dto.businessUnitId) {
      const businessUnit = await this.businessUnits.findOneBy({ id: dto.businessUnitId });
      if (!businessUnit) {
        throw new NotFoundException(`Business unit ${dto.businessUnitId} not found`);
      }
    }

    const entity = this.gerencias.create({
      businessUnitId: dto.businessUnitId ?? null,
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      status: dto.status ?? RecordStatus.ACTIVE,
    });
    try {
      return this.toGerenciaResponse(await this.gerencias.save(entity));
    } catch (err) {
      this.rethrowIfDuplicate(err, `Gerencia code '${dto.code}' already exists`);
    }
  }

  async findAreas(): Promise<AreaResponse[]> {
    const rows = await this.areas.find({ order: { name: 'ASC' } });
    return rows.map((row) => this.toAreaResponse(row));
  }

  async createArea(dto: CreateAreaDto): Promise<AreaResponse> {
    if (dto.gerenciaId) {
      const gerencia = await this.gerencias.findOneBy({ id: dto.gerenciaId });
      if (!gerencia) {
        throw new NotFoundException(`Gerencia ${dto.gerenciaId} not found`);
      }
    }

    const entity = this.areas.create({
      gerenciaId: dto.gerenciaId ?? null,
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      status: dto.status ?? RecordStatus.ACTIVE,
    });
    try {
      return this.toAreaResponse(await this.areas.save(entity));
    } catch (err) {
      this.rethrowIfDuplicate(err, `Area code '${dto.code}' already exists`);
    }
  }

  async findSectors(areaId?: string): Promise<SectorResponse[]> {
    const rows = await this.sectors.find({
      where: areaId ? { areaId } : undefined,
      order: { name: 'ASC' },
    });
    return rows.map((row) => this.toSectorResponse(row));
  }

  async createSector(dto: CreateSectorDto): Promise<SectorResponse> {
    if (dto.areaId) {
      const area = await this.areas.findOneBy({ id: dto.areaId });
      if (!area) {
        throw new NotFoundException(`Area ${dto.areaId} not found`);
      }
    }

    const entity = this.sectors.create({
      areaId: dto.areaId ?? null,
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      status: dto.status ?? RecordStatus.ACTIVE,
    });
    try {
      return this.toSectorResponse(await this.sectors.save(entity));
    } catch (err) {
      this.rethrowIfDuplicate(err, `Sector code '${dto.code}' already exists`);
    }
  }

  async findLocations(): Promise<LocationResponse[]> {
    const rows = await this.locations.find({ order: { name: 'ASC' } });
    return rows.map((row) => this.toLocationResponse(row));
  }

  async createLocation(dto: CreateLocationDto): Promise<LocationResponse> {
    if (dto.sectorId) {
      const sector = await this.sectors.findOneBy({ id: dto.sectorId });
      if (!sector) {
        throw new NotFoundException(`Sector ${dto.sectorId} not found`);
      }
    }

    const entity = this.locations.create({
      sectorId: dto.sectorId ?? null,
      code: dto.code ?? null,
      name: dto.name,
      description: dto.description ?? null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      altitudeM: dto.altitudeM ?? null,
      macrozone: dto.macrozone ?? null,
      status: dto.status ?? RecordStatus.ACTIVE,
    });
    try {
      return this.toLocationResponse(await this.locations.save(entity));
    } catch (err) {
      this.rethrowIfDuplicate(err, `Location '${dto.name}' already exists in this sector`);
    }
  }

  async findCompanies(isContractor?: boolean): Promise<CompanyResponse[]> {
    const rows = await this.companies.find({
      where: isContractor !== undefined ? { isContractor } : undefined,
      order: { name: 'ASC' },
    });
    return rows.map((row) => this.toCompanyResponse(row));
  }

  async createCompany(dto: CreateCompanyDto): Promise<CompanyResponse> {
    const entity = this.companies.create({
      code: dto.code ?? null,
      name: dto.name,
      taxId: dto.taxId ?? null,
      companyType: dto.companyType ?? null,
      isContractor: dto.isContractor ?? true,
      status: dto.status ?? RecordStatus.ACTIVE,
    });
    try {
      return this.toCompanyResponse(await this.companies.save(entity));
    } catch (err) {
      this.rethrowIfDuplicate(err, `Company '${dto.name}' already exists`);
    }
  }

  private toBusinessUnitResponse(entity: BusinessUnitEntity): BusinessUnitResponse {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toGerenciaResponse(entity: GerenciaEntity): GerenciaResponse {
    return {
      id: entity.id,
      businessUnitId: entity.businessUnitId,
      code: entity.code,
      name: entity.name,
      description: entity.description,
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

  private toSectorResponse(entity: SectorEntity): SectorResponse {
    return {
      id: entity.id,
      areaId: entity.areaId,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toLocationResponse(entity: LocationEntity): LocationResponse {
    return {
      id: entity.id,
      sectorId: entity.sectorId,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      latitude: this.toNullableNumber(entity.latitude),
      longitude: this.toNullableNumber(entity.longitude),
      altitudeM: this.toNullableNumber(entity.altitudeM),
      macrozone: entity.macrozone,
      status: entity.status,
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

  private toNullableNumber(value: number | null): number | null {
    return value === null ? null : Number(value);
  }

  private rethrowIfDuplicate(err: unknown, message: string): never {
    if (err instanceof QueryFailedError && (err as QueryFailedError & { code?: string }).code === '23505') {
      throw new ConflictException(message);
    }
    throw err as Error;
  }
}
