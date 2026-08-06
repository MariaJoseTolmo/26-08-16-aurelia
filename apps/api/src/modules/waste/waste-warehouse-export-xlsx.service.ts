import { Injectable } from '@nestjs/common';
import type { WarehouseControlExportRequest } from '@aurelia/contracts';
import {
  XlsxWorkbookService,
  type XlsxCell,
  type XlsxCellStyle,
  type XlsxPageSetup,
  type XlsxSheet,
} from '../reports/xlsx-workbook.service';
import {
  WAREHOUSE_EXPORT_COLUMNS,
  WAREHOUSE_EXPORT_HAZARD,
  WAREHOUSE_EXPORT_LOT_STATUS,
  WAREHOUSE_EXPORT_SECTIONS,
  resolveAccumulationTone,
} from './waste-warehouse-export.theme';

/**
 * Exporta "Control de bodega" a Excel con la MISMA información que el PDF.
 *
 * Dos hojas en vez de una: los bloques de resumen (KPIs, barras, vencimientos)
 * y la tabla de lotes necesitan anchos de columna incompatibles, y meterlos en
 * la misma hoja obliga a elegir cuál de los dos se ve mal. La suma de ambas
 * hojas es exactamente el contenido del PDF.
 *
 * Igual que el PDF: papel A4 y encabezado de tabla repetido en cada página
 * impresa (`printTitleRows`, que Excel resuelve como `Print_Titles`).
 */

/** 9 = A4 en la enumeración de papel de OOXML. */
const A4_PAGE_SETUP: XlsxPageSetup = { paperSize: 9, orientation: 'portrait', fitToWidth: true };

const SUMMARY_SHEET = 'Resumen';
const LOTS_SHEET = 'Lotes en bodega';

@Injectable()
export class WasteWarehouseExportXlsxService {
  constructor(private readonly workbook: XlsxWorkbookService) {}

  build(payload: WarehouseControlExportRequest, meta: { generatedAt: Date; author: string }): Buffer {
    return this.workbook.build([this.summarySheet(payload, meta.generatedAt), this.lotsSheet(payload)], {
      title: `${payload.title} · Control de bodega`,
      creator: meta.author,
      createdAt: meta.generatedAt.toISOString(),
    });
  }

  private summarySheet(payload: WarehouseControlExportRequest, generatedAt: Date): XlsxSheet {
    const rows: XlsxCell[][] = [
      [this.cell(payload.title, 'title')],
      [this.cell(`Generado el ${this.formatTimestamp(generatedAt)}`, 'muted')],
      [this.cell(payload.description)],
      [this.cell(payload.monthProgressLabel, 'muted')],
      [],
    ];

    if (payload.kpis.length > 0) {
      rows.push([this.cell(WAREHOUSE_EXPORT_SECTIONS.kpis, 'section')]);
      rows.push([this.cell('Indicador', 'header'), this.cell('Valor', 'header'), this.cell('Nota', 'header')]);
      for (const kpi of payload.kpis) {
        const value = kpi.secondaryValue ? `${kpi.value} / ${kpi.secondaryValue}` : kpi.value;
        rows.push([this.cell(kpi.label), this.cell(value), this.cell(kpi.note ?? '')]);
      }
      rows.push([]);
    }

    if (payload.bars.length > 0) {
      rows.push([this.cell(WAREHOUSE_EXPORT_SECTIONS.bars, 'section')]);
      rows.push([
        this.cell('Categoría', 'header'),
        this.cell('% del umbral', 'header'),
        this.cell('Desvío', 'header'),
        this.cell('Detalle', 'header'),
      ]);
      for (const bar of payload.bars) {
        // Número real con formato de porcentaje, no texto: así el Excel es
        // ordenable y graficable, que es la razón de exportar a Excel.
        rows.push([
          this.cell(bar.label),
          this.cell(bar.percentage / 100, 'percent'),
          this.cell(bar.deviationLabel, this.toneStyle(bar.percentage)),
          this.cell(bar.valueLabel, 'muted'),
        ]);
      }
      rows.push([]);
    }

    if (payload.expirations.length > 0) {
      rows.push([this.cell(WAREHOUSE_EXPORT_SECTIONS.expirations, 'section')]);
      rows.push([
        this.cell('Residuo', 'header'),
        this.cell('Fecha de ingreso', 'header'),
        this.cell('Situación', 'header'),
        this.cell('Detalle', 'header'),
      ]);
      for (const item of payload.expirations) {
        rows.push([
          this.cell(item.wasteName),
          this.cell(item.intakeDate),
          this.cell(item.overdue ? 'Vencido' : 'Por vencer', item.overdue ? 'danger' : 'warning'),
          this.cell(item.detail, 'muted'),
        ]);
      }
    }

    return {
      name: SUMMARY_SHEET,
      columns: [{ width: 38 }, { width: 16 }, { width: 22 }, { width: 46 }],
      rows,
      pageSetup: A4_PAGE_SETUP,
    };
  }

  private lotsSheet(payload: WarehouseControlExportRequest): XlsxSheet {
    const header = WAREHOUSE_EXPORT_COLUMNS.map((column) => this.cell(column.header, 'header'));
    const rows: XlsxCell[][] = [header];

    for (const lot of payload.lots) {
      const status = WAREHOUSE_EXPORT_LOT_STATUS[lot.status];
      const hazard = lot.hazardous ? WAREHOUSE_EXPORT_HAZARD.hazardous : WAREHOUSE_EXPORT_HAZARD.nonHazardous;
      const statusStyle = this.lotStatusStyle(lot.status);

      rows.push([
        this.cell(hazard.label, lot.hazardous ? 'danger' : 'default'),
        this.cell(lot.category),
        this.cell(lot.wasteType),
        this.cell(lot.quantity),
        this.cell(lot.unit),
        this.cell(lot.elapsedLabel, statusStyle),
        this.cell(status.label, statusStyle),
      ]);
    }

    const lastColumn = String.fromCharCode(64 + WAREHOUSE_EXPORT_COLUMNS.length);

    return {
      name: LOTS_SHEET,
      columns: WAREHOUSE_EXPORT_COLUMNS.map((column) => ({ width: column.excelWidth })),
      rows,
      freezeRows: 1,
      autoFilter: `A1:${lastColumn}${Math.max(1, payload.lots.length + 1)}`,
      pageSetup: A4_PAGE_SETUP,
      // Equivalente al `<thead>` repetido del PDF: la fila 1 se reimprime arriba
      // de cada página.
      printTitleRows: '1:1',
    };
  }

  private toneStyle(percentage: number): XlsxCellStyle {
    const tone = resolveAccumulationTone(percentage);
    if (tone === 'critical') return 'danger';
    if (tone === 'warning') return 'warning';
    return 'teal';
  }

  private lotStatusStyle(status: keyof typeof WAREHOUSE_EXPORT_LOT_STATUS): XlsxCellStyle {
    if (status === 'overdue') return 'danger';
    if (status === 'near_limit') return 'warning';
    return 'muted';
  }

  private cell(value: XlsxCell['value'], style: XlsxCellStyle = 'default'): XlsxCell {
    return this.workbook.cell(value, style);
  }

  private formatTimestamp(value: Date): string {
    const pad = (input: number) => String(input).padStart(2, '0');
    return `${pad(value.getDate())}-${pad(value.getMonth() + 1)}-${value.getFullYear()} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }
}
