import { Controller, Get, Query, Req } from '@nestjs/common';
import { INSPECTION_CAPABILITIES } from '@aurelia/contracts';
import type {
  InspectionHistoryKpisResponse,
  InspectionManagementTableResponse,
} from '@aurelia/contracts';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { InspectionAccessService } from './inspection-access.service';
import type { InspectionDataScope, ManagementTableQuery } from './inspection-dashboard.service';
import { InspectionHistoryService } from './inspection-history.service';

@RequirePermissions(INSPECTION_CAPABILITIES.read)
@Controller('inspections/history')
export class InspectionHistoryController {
  constructor(
    private readonly inspectionHistoryService: InspectionHistoryService,
    private readonly inspectionAccess: InspectionAccessService,
  ) {}

  @Get('kpis')
  async getHistoryKpis(
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionHistoryKpisResponse> {
    return this.inspectionHistoryService.getHistoryKpis(await this.resolveScope(request));
  }

  @Get('table')
  async getHistoryTable(
    @Req() request: AuthenticatedRequest,
    @Query() query: ManagementTableQuery,
  ): Promise<InspectionManagementTableResponse> {
    return this.inspectionHistoryService.getHistoryTable(query, await this.resolveScope(request));
  }

  private resolveScope(request: AuthenticatedRequest): Promise<InspectionDataScope> {
    return this.inspectionAccess.getScopedInspectionIds(request.user)
      .then((inspectionIds) => ({ inspectionIds }));
  }
}
