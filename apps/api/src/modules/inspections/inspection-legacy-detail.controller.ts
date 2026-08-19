import { Controller, Get, Param, ParseUUIDPipe, Req } from '@nestjs/common';
import { INSPECTION_CAPABILITIES } from '@aurelia/contracts';
import type { InspectionDetailLegacySummaryResponse } from '@aurelia/contracts';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { InspectionAccessService } from './inspection-access.service';
import { InspectionLegacyDetailProjectionService } from './inspection-legacy-detail-projection.service';

@RequirePermissions(INSPECTION_CAPABILITIES.read)
@Controller('inspections')
export class InspectionLegacyDetailController {
  constructor(
    private readonly inspectionAccess: InspectionAccessService,
    private readonly legacyProjection: InspectionLegacyDetailProjectionService,
  ) {}

  @Get(':id/legacy-summary')
  async getLegacySummary(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionDetailLegacySummaryResponse | null> {
    await this.inspectionAccess.assertInspection(request.user, id);
    return this.legacyProjection.getSummary(id);
  }
}
