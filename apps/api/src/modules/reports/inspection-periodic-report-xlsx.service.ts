import { Injectable } from '@nestjs/common';
import {
  InspectionFindingSeverity,
  type InspectionPeriodicReportInspectionRowResponse,
  type InspectionPeriodicReportResponse,
} from '@aurelia/contracts';
import { XlsxWorkbookService, type XlsxCell, type XlsxCellStyle, type XlsxSheet } from './xlsx-workbook.service';

@Injectable()
export class InspectionPeriodicReportXlsxService {
  constructor(private readonly workbook: XlsxWorkbookService) {}

  render(report: InspectionPeriodicReportResponse): { filename: string; buffer: Buffer } {
    const sheets: XlsxSheet[] = [
      this.buildSummarySheet(report),
      this.buildInspectionsSheet(report),
      this.buildAttentionSheet(report),
      this.buildCompaniesSheet(report),
    ];
    const buffer = this.workbook.build(sheets, {
      title: `Informe de inspecciones ${report.metadata.periodLabel}`,
      creator: report.metadata.generatedBy || 'AurelIA',
      createdAt: report.metadata.generatedAt,
    });
    const stateSuffix = report.metadata.inspectionState === 'all'
      ? ''
      : `-${report.metadata.inspectionState}`;
    return {
      filename: `inspecciones-${report.metadata.year}-${report.metadata.period}${stateSuffix}.xlsx`,
      buffer,
    };
  }

  private buildSummarySheet(report: InspectionPeriodicReportResponse): XlsxSheet {
    const cell = this.workbook.cell.bind(this.workbook);
    const rows: XlsxCell[][] = [
      [cell(`Informe de inspecciones · ${report.metadata.periodLabel}`, 'title')],
      [cell('Período', 'section'), cell(this.formatPeriodRange(report))],
      [cell('Generado por', 'section'), cell(report.metadata.generatedBy)],
      [cell('Fecha de emisión', 'section'), cell(new Date(report.metadata.generatedAt), 'date')],
      [cell('Estado de inspecciones', 'section'), cell(this.stateLabel(report.metadata.inspectionState))],
      [],
      [cell('Resumen ejecutivo', 'section')],
      [cell('Indicador', 'header'), cell('Valor', 'header'), cell('Detalle', 'header')],
      [cell('Total inspecciones'), cell(report.summary.totalInspections, 'integer'), cell('Universo del período y alcance autorizado')],
      [cell('Inspecciones abiertas'), cell(report.summary.openInspections, 'integer'), cell(this.ratio(report.summary.openInspections, report.summary.totalInspections), 'percent')],
      [cell('Inspecciones cerradas'), cell(report.summary.closedInspections, 'integer'), cell(this.ratio(report.summary.closedInspections, report.summary.totalInspections), 'percent')],
      [cell('Total observaciones'), cell(report.summary.totalFindings, 'integer')],
      [cell('Observaciones cerradas'), cell(report.summary.closedFindings, 'integer'), cell(this.ratio(report.summary.closedFindings, report.summary.totalFindings), 'percent')],
      [cell('Ejecutadas pendientes de aprobación'), cell(report.summary.executedFindings, 'integer'), cell(this.ratio(report.summary.executedFindings, report.summary.totalFindings), 'percent')],
      [cell('Abiertas dentro de plazo'), cell(report.summary.openFindings, 'integer'), cell(this.ratio(report.summary.openFindings, report.summary.totalFindings), 'percent')],
      [cell('SLA vencido'), cell(report.summary.overdueFindings, 'integer'), cell(this.ratio(report.summary.overdueFindings, report.summary.totalFindings), 'percent')],
      [cell('Cumplimiento global'), cell(report.summary.complianceRate / 100, 'percent')],
      [],
      [cell('Inspecciones por mes', 'section')],
      [cell('Mes', 'header'), cell('Inspecciones', 'header'), cell('% del período', 'header')],
      ...report.inspectionsByMonth.map((row) => [
        cell(row.label),
        cell(row.count, 'integer'),
        cell(row.percentage / 100, 'percent'),
      ]),
      [],
      [cell('Inspecciones por tipo', 'section')],
      [cell('Tipo', 'header'), cell('Inspecciones', 'header'), cell('% del período', 'header')],
      ...report.inspectionsByType.map((row) => [
        cell(row.label),
        cell(row.count, 'integer'),
        cell(row.percentage / 100, 'percent'),
      ]),
      [],
      [cell('Inspecciones por área', 'section')],
      [cell('Área', 'header'), cell('Inspecciones', 'header'), cell('% del período', 'header')],
      ...report.inspectionsByArea.map((row) => [
        cell(row.label),
        cell(row.count, 'integer'),
        cell(row.percentage / 100, 'percent'),
      ]),
    ];

    return {
      name: 'Resumen',
      columns: [{ width: 38 }, { width: 20 }, { width: 42 }],
      rows,
      freezeRows: 1,
    };
  }

  private buildInspectionsSheet(report: InspectionPeriodicReportResponse): XlsxSheet {
    const cell = this.workbook.cell.bind(this.workbook);
    const headers = [
      'N°',
      'Fecha',
      'Inspector',
      'Área · Sector',
      'Empresa',
      'Tipo',
      'Urgencia máxima',
      'Estado',
      'Total observaciones',
      'Cerradas',
      'Ejecutadas',
      'Abiertas dentro de plazo',
      'SLA vencido',
      'Días abierta',
      '% cierre',
      'ID inspección',
    ];
    const rows: XlsxCell[][] = [
      headers.map((header) => cell(header, 'header')),
      ...report.inspections.rows.map((row) => [
        cell(row.inspectionNumber),
        cell(row.date ? new Date(row.date) : null, 'date'),
        cell(row.inspector),
        cell(row.areaSector),
        cell(row.company),
        cell(row.type),
        cell(row.urgencyLabel, this.rowStyle(row)),
        cell(row.effectiveStatus === 'closed' ? 'Cerrada' : 'Abierta', row.effectiveStatus === 'closed' ? 'success' : 'warning'),
        cell(row.observationsCount, 'integer'),
        cell(row.closedObservations, 'integer'),
        cell(row.executedObservations, 'integer'),
        cell(row.openObservations, 'integer'),
        cell(row.overdueObservations, row.overdueObservations > 0 ? 'danger' : 'integer'),
        cell(row.daysOpen, 'integer'),
        cell(row.closureRate / 100, 'percent'),
        cell(row.inspectionId, 'muted'),
      ]),
    ];

    return {
      name: 'Inspecciones',
      columns: [
        { width: 10 },
        { width: 13 },
        { width: 24 },
        { width: 34 },
        { width: 24 },
        { width: 18 },
        { width: 24 },
        { width: 14 },
        { width: 16 },
        { width: 12 },
        { width: 12 },
        { width: 20 },
        { width: 12 },
        { width: 13 },
        { width: 12 },
        { width: 38 },
      ],
      rows,
      freezeRows: 1,
      autoFilter: `A1:P${Math.max(1, rows.length)}`,
    };
  }

  private buildAttentionSheet(report: InspectionPeriodicReportResponse): XlsxSheet {
    const cell = this.workbook.cell.bind(this.workbook);
    const headers = [
      'N°',
      'Fecha',
      'Área · Sector',
      'Empresa',
      'Inspector',
      'Urgencia',
      'Observaciones pendientes',
      'SLA vencidas',
      'Días abierta',
      '% cierre',
      'ID inspección',
    ];
    const rows: XlsxCell[][] = [
      headers.map((header) => cell(header, 'header')),
      ...report.attention.rows.map((row) => [
        cell(row.inspectionNumber),
        cell(row.date ? new Date(row.date) : null, 'date'),
        cell(row.areaSector),
        cell(row.company),
        cell(row.inspector),
        cell(row.urgencyLabel, this.rowStyle(row)),
        cell(row.openObservations + row.executedObservations + row.overdueObservations, 'integer'),
        cell(row.overdueObservations, row.overdueObservations > 0 ? 'danger' : 'integer'),
        cell(row.daysOpen, row.overdueObservations > 0 ? 'warning' : 'integer'),
        cell(row.closureRate / 100, 'percent'),
        cell(row.inspectionId, 'muted'),
      ]),
    ];

    return {
      name: 'Atención inmediata',
      columns: [
        { width: 10 },
        { width: 13 },
        { width: 34 },
        { width: 24 },
        { width: 24 },
        { width: 24 },
        { width: 20 },
        { width: 14 },
        { width: 13 },
        { width: 12 },
        { width: 38 },
      ],
      rows,
      freezeRows: 1,
      autoFilter: `A1:K${Math.max(1, rows.length)}`,
    };
  }

  private buildCompaniesSheet(report: InspectionPeriodicReportResponse): XlsxSheet {
    const cell = this.workbook.cell.bind(this.workbook);
    const headers = [
      'Empresa',
      'N° inspecciones período',
      'Inspecciones abiertas',
      'Observaciones pendientes',
      'SLA vencidos',
      '% cumplimiento',
      'ID empresa',
    ];
    const rows: XlsxCell[][] = [
      headers.map((header) => cell(header, 'header')),
      ...report.companiesWithMostPending.map((row) => [
        cell(row.company),
        cell(row.inspectionsInPeriod, 'integer'),
        cell(row.openInspections, 'integer'),
        cell(row.pendingFindings, 'integer'),
        cell(row.overdueFindings, row.overdueFindings > 0 ? 'danger' : 'integer'),
        cell(row.complianceRate / 100, 'percent'),
        cell(row.companyId, 'muted'),
      ]),
    ];

    return {
      name: 'Empresas',
      columns: [
        { width: 30 },
        { width: 22 },
        { width: 20 },
        { width: 22 },
        { width: 15 },
        { width: 18 },
        { width: 38 },
      ],
      rows,
      freezeRows: 1,
      autoFilter: `A1:G${Math.max(1, rows.length)}`,
    };
  }

  private rowStyle(row: InspectionPeriodicReportInspectionRowResponse): XlsxCellStyle {
    if (row.effectiveStatus === 'closed') return 'success';
    if (row.maxSeverity === InspectionFindingSeverity.CRITICAL || row.maxSeverity === InspectionFindingSeverity.HIGH) return 'danger';
    if (row.executedObservations > 0) return 'teal';
    return 'warning';
  }

  private formatPeriodRange(report: InspectionPeriodicReportResponse): string {
    const start = new Date(report.metadata.start);
    const end = new Date(new Date(report.metadata.end).getTime() - 86400000);
    const formatter = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    return `${formatter.format(start)} — ${formatter.format(end)}`;
  }

  private stateLabel(value: string): string {
    if (value === 'open') return 'Abiertas';
    if (value === 'closed') return 'Cerradas';
    return 'Todas';
  }

  private ratio(value: number, total: number): number {
    return total > 0 ? value / total : 0;
  }
}
