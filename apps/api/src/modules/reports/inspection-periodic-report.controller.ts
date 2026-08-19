import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import type { InspectionPeriodicReportRequest, InspectionPeriodicReportResponse } from '@aurelia/contracts';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { InspectionPeriodicReportExportService } from './inspection-periodic-report-export.service';

@RequirePermissions('inspections:read')
@Controller('reports/inspections/periodic')
export class InspectionPeriodicReportController {
  constructor(private readonly exports: InspectionPeriodicReportExportService) {}

  @Get('data')
  getData(
    @Query() query: InspectionPeriodicReportRequest,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionPeriodicReportResponse> {
    return this.exports.buildData(query, request.user);
  }

  @Get('pdf')
  async getPdf(
    @Query() query: InspectionPeriodicReportRequest,
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ): Promise<void> {
    const file = await this.exports.renderPdf(query, request.user);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    response.send(file.buffer);
  }

  @Get('xlsx')
  async getXlsx(
    @Query() query: InspectionPeriodicReportRequest,
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ): Promise<void> {
    const file = await this.exports.renderXlsx(query, request.user);
    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    response.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    response.send(file.buffer);
  }
}
