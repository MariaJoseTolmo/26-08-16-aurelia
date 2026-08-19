import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  AreaResponse,
  BusinessUnitResponse,
  CompanyResponse,
  GerenciaResponse,
  LocationResponse,
  SectorResponse,
} from '@aurelia/contracts';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateAreaDto } from './dto/create-area.dto';
import { CreateBusinessUnitDto } from './dto/create-business-unit.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateGerenciaDto } from './dto/create-gerencia.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateSectorDto } from './dto/create-sector.dto';
import { OrganizationService } from './organization.service';

@RequirePermissions('organization:read')
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('business-units')
  findBusinessUnits(): Promise<BusinessUnitResponse[]> {
    return this.organizationService.findBusinessUnits();
  }

  @RequirePermissions('organization:write')
  @Post('business-units')
  createBusinessUnit(@Body() dto: CreateBusinessUnitDto): Promise<BusinessUnitResponse> {
    return this.organizationService.createBusinessUnit(dto);
  }

  @Get('gerencias')
  findGerencias(): Promise<GerenciaResponse[]> {
    return this.organizationService.findGerencias();
  }

  @RequirePermissions('organization:write')
  @Post('gerencias')
  createGerencia(@Body() dto: CreateGerenciaDto): Promise<GerenciaResponse> {
    return this.organizationService.createGerencia(dto);
  }

  @Get('areas')
  findAreas(): Promise<AreaResponse[]> {
    return this.organizationService.findAreas();
  }

  @RequirePermissions('organization:write')
  @Post('areas')
  createArea(@Body() dto: CreateAreaDto): Promise<AreaResponse> {
    return this.organizationService.createArea(dto);
  }

  @Get('sectors')
  findSectors(@Query('areaId') areaId?: string): Promise<SectorResponse[]> {
    return this.organizationService.findSectors(areaId);
  }

  @RequirePermissions('organization:write')
  @Post('sectors')
  createSector(@Body() dto: CreateSectorDto): Promise<SectorResponse> {
    return this.organizationService.createSector(dto);
  }

  @Get('locations')
  findLocations(): Promise<LocationResponse[]> {
    return this.organizationService.findLocations();
  }

  @RequirePermissions('organization:write')
  @Post('locations')
  createLocation(@Body() dto: CreateLocationDto): Promise<LocationResponse> {
    return this.organizationService.createLocation(dto);
  }

  @Get('companies')
  findCompanies(@Query('isContractor') isContractor?: string): Promise<CompanyResponse[]> {
    return this.organizationService.findCompanies(
      isContractor !== undefined ? isContractor === 'true' : undefined,
    );
  }

  @RequirePermissions('organization:write')
  @Post('companies')
  createCompany(@Body() dto: CreateCompanyDto): Promise<CompanyResponse> {
    return this.organizationService.createCompany(dto);
  }
}
