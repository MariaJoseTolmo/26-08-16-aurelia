import { Controller, Get, Query } from '@nestjs/common';
import {
  CountReportRowResponse,
  IncidentSummaryReportResponse,
  InspectionSummaryReportResponse,
  OpenItemsReportResponse,
  PeriodReportRowResponse,
  ReportFilterRequest,
  ReportSummaryResponse,
} from '@aurelia/contracts';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { ReportsService } from './reports.service';

@RequirePermissions('inspections:read', 'incidents:read')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  summary(@Query() filter: ReportFilterRequest): Promise<ReportSummaryResponse> {
    return this.reportsService.summary(filter);
  }

  @Get('inspections/summary')
  inspectionsSummary(@Query() filter: ReportFilterRequest): Promise<InspectionSummaryReportResponse> {
    return this.reportsService.inspectionsSummary(filter);
  }

  @Get('incidents/summary')
  incidentsSummary(@Query() filter: ReportFilterRequest): Promise<IncidentSummaryReportResponse> {
    return this.reportsService.incidentsSummary(filter);
  }

  @Get('incidents/by-level')
  incidentsByLevel(@Query() filter: ReportFilterRequest): Promise<CountReportRowResponse[]> {
    return this.reportsService.incidentsByLevel(filter);
  }

  @Get('incidents/by-type')
  incidentsByType(@Query() filter: ReportFilterRequest): Promise<CountReportRowResponse[]> {
    return this.reportsService.incidentsByType(filter);
  }

  @Get('incidents/by-company')
  incidentsByCompany(@Query() filter: ReportFilterRequest): Promise<CountReportRowResponse[]> {
    return this.reportsService.incidentsByCompany(filter);
  }

  @Get('incidents/by-period')
  incidentsByPeriod(@Query() filter: ReportFilterRequest): Promise<PeriodReportRowResponse[]> {
    return this.reportsService.incidentsByPeriod(filter);
  }

  @Get('open-items')
  openItems(@Query() filter: ReportFilterRequest): Promise<OpenItemsReportResponse> {
    return this.reportsService.openItems(filter);
  }
}
