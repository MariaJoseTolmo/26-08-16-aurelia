import { Controller, Get } from '@nestjs/common';
import type { InspectionFindingSeverityResponse, InspectionFindingTypeResponse } from '@aurelia/contracts';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { InspectionFindingCatalogService } from './inspection-finding-catalog.service';

@RequirePermissions('inspections:read')
@Controller('inspections/finding-catalogs')
export class InspectionFindingCatalogController {
  constructor(private readonly catalogService: InspectionFindingCatalogService) {}

  @Get('types')
  findTypes(): Promise<InspectionFindingTypeResponse[]> {
    return this.catalogService.findTypes();
  }

  @Get('severities')
  findSeverities(): Promise<InspectionFindingSeverityResponse[]> {
    return this.catalogService.findSeverities();
  }

  @Get()
  async findAll(): Promise<{ types: InspectionFindingTypeResponse[]; severities: InspectionFindingSeverityResponse[] }> {
    const [types, severities] = await Promise.all([this.catalogService.findTypes(), this.catalogService.findSeverities()]);
    return { types, severities };
  }
}
