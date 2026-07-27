import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import {
  InspectionFindingSeverity,
  type InspectionDashboardChartsResponse,
  type InspectionDashboardCompanyAnalysisResponse,
  type InspectionDashboardOpenFindingsResponse,
  type InspectionDashboardSummaryResponse,
  type InspectionManagementKpisResponse,
  type InspectionManagementTableResponse,
  type InspectionManagementTableRowResponse,
} from '@aurelia/contracts';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { XlsxWorkbookService, type XlsxCellStyle } from '../reports/xlsx-workbook.service';
import { InspectionAccessService } from './inspection-access.service';
import {
  InspectionDashboardService,
  type InspectionDataScope,
  type ManagementTableQuery,
} from './inspection-dashboard.service';
import type { DashboardQuery } from './inspection-dashboard-period';

@RequirePermissions('inspections:read')
@Controller('inspections/dashboard')
export class InspectionDashboardController {
  constructor(
    private readonly inspectionDashboardService: InspectionDashboardService,
    private readonly inspectionAccess: InspectionAccessService,
    private readonly workbook: XlsxWorkbookService,
  ) {}

  @Get('management-kpis')
  async getManagementKpis(
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionManagementKpisResponse> {
    return this.inspectionDashboardService.getManagementKpis(await this.resolveScope(request));
  }

  @Get('management-table')
  async getManagementTable(
    @Query() query: ManagementTableQuery,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionManagementTableResponse> {
    return this.inspectionDashboardService.getManagementTable(query, await this.resolveScope(request));
  }

  @Get('management-table/xlsx')
  async exportManagementTableXlsx(
    @Query() query: ManagementTableQuery,
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ): Promise<void> {
    const scope = await this.resolveScope(request);
    const firstPage = await this.inspectionDashboardService.getManagementTable({
      ...query,
      page: '1',
      pageSize: '50',
    }, scope);
    const rows = [...firstPage.rows];

    for (let page = 2; page <= firstPage.totalPages; page += 1) {
      const result = await this.inspectionDashboardService.getManagementTable({
        ...query,
        page: String(page),
        pageSize: '50',
      }, scope);
      rows.push(...result.rows);
    }

    const generatedAt = new Date();
    const buffer = this.workbook.build([
      {
        name: 'Inspecciones',
        columns: [
          { width: 11 },
          { width: 13 },
          { width: 25 },
          { width: 36 },
          { width: 24 },
          { width: 16 },
          { width: 25 },
          { width: 12 },
          { width: 34 },
          { width: 12 },
          { width: 12 },
        ],
        rows: this.buildManagementTableRows(rows),
        freezeRows: 1,
        autoFilter: `A1:K${Math.max(1, rows.length + 1)}`,
      },
    ], {
      title: 'Gestión de inspecciones · tabla filtrada',
      creator: request.user.email || 'AurelIA',
      createdAt: generatedAt.toISOString(),
    });

    const dateSuffix = generatedAt.toISOString().slice(0, 10);
    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    response.setHeader('Content-Disposition', `attachment; filename="inspecciones-filtradas-${dateSuffix}.xlsx"`);
    response.send(buffer);
  }

  @Get('filtered-summary')
  async getSummary(
    @Query() query: DashboardQuery,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionDashboardSummaryResponse> {
    return this.inspectionDashboardService.getSummary(query, await this.resolveScope(request));
  }

  @Get('charts')
  async getCharts(
    @Query() query: DashboardQuery,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionDashboardChartsResponse> {
    return this.inspectionDashboardService.getCharts(query, await this.resolveScope(request));
  }

  @Get('company-analysis')
  async getCompanyAnalysis(
    @Query() query: DashboardQuery,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionDashboardCompanyAnalysisResponse> {
    return this.inspectionDashboardService.getCompanyAnalysis(query, await this.resolveScope(request));
  }

  @Get('open-findings')
  async getOpenFindings(
    @Query() query: DashboardQuery,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionDashboardOpenFindingsResponse> {
    return this.inspectionDashboardService.getOpenFindings(query, await this.resolveScope(request));
  }

  private resolveScope(request: AuthenticatedRequest): Promise<InspectionDataScope> {
    return this.inspectionAccess.getScopedInspectionIds(request.user)
      .then((inspectionIds) => ({ inspectionIds }));
  }

  private buildManagementTableRows(rows: InspectionManagementTableRowResponse[]) {
    const cell = this.workbook.cell.bind(this.workbook);
    const headers = [
      'N°',
      'Fecha',
      'Inspector',
      'Área · Sector',
      'Empresa',
      'Tipo',
      'Urgencia máxima',
      'N° obs.',
      'Observaciones',
      'Días',
      '% cierre',
    ];

    return [
      headers.map((header) => cell(header, 'header')),
      ...rows.map((row) => {
        const inspectionNumber = row.inspectionNumber.startsWith('#') ? row.inspectionNumber : `#${row.inspectionNumber}`;
        const typeLabel = row.type.toLowerCase().includes('check') ? 'Checklist' : row.type;
        return [
          cell(inspectionNumber),
          cell(row.date ? new Date(row.date) : null, 'date'),
          cell(row.inspector),
          cell(row.areaSector),
          cell(row.company),
          cell(typeLabel, typeLabel === 'Checklist' ? 'teal' : 'default'),
          cell(row.urgencyLabel, this.urgencyStyle(row)),
          cell(row.observationsCount, 'integer'),
          cell(this.observationSummary(row)),
          cell(row.daysOpen, row.daysOpen > 0 ? 'integer' : 'default'),
          cell(row.closureRate / 100, 'percent'),
        ];
      }),
    ];
  }

  private observationSummary(row: InspectionManagementTableRowResponse): string {
    const parts: string[] = [];
    if (row.observations.executed > 0) parts.push(`${row.observations.executed} ejecutada${row.observations.executed === 1 ? '' : 's'}`);
    if (row.observations.open > 0) parts.push(`${row.observations.open} abierta${row.observations.open === 1 ? '' : 's'}`);
    if (row.observations.closed > 0) parts.push(`${row.observations.closed} cerrada${row.observations.closed === 1 ? '' : 's'}`);
    return parts.length > 0 ? parts.join(' · ') : 'Sin observaciones';
  }

  private urgencyStyle(row: InspectionManagementTableRowResponse): XlsxCellStyle {
    if (row.urgencySeverity === InspectionFindingSeverity.CRITICAL || row.urgencySeverity === InspectionFindingSeverity.HIGH) return 'danger';
    if (row.urgencyLabel.toLowerCase().startsWith('ejecutada')) return 'teal';
    if (row.urgencyLabel.toLowerCase().startsWith('cerrada')) return 'success';
    return 'warning';
  }
}
