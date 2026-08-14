import { Injectable } from '@nestjs/common';
import type { WasteSinaderExportRequest } from '@aurelia/contracts';
import {
  XlsxWorkbookService,
  type XlsxCell,
  type XlsxCellStyle,
  type XlsxPageSetup,
  type XlsxSheet,
} from '../reports/xlsx-workbook.service';
import {
  WASTE_SINADER_EXPORT_CATEGORY_COLUMN,
  WASTE_SINADER_EXPORT_COLUMNS,
  WASTE_SINADER_EXPORT_SECTIONS,
} from './waste-warehouse-export.theme';

/**
 * Exporta "Reporte SINADER" a Excel con la MISMA información que el PDF.
 *
 * Dos hojas, por el mismo motivo que "Control de bodega": el resumen y el
 * consolidado necesitan anchos de columna incompatibles, y en una sola hoja hay
 * que elegir cuál se ve mal. La suma de ambas es exactamente el contenido del PDF.
 *
 * UNA DIFERENCIA DELIBERADA CON EL PDF: la categoría del residuo va en su PROPIA
 * columna, adelante, en vez de apilada sobre el nombre como la pastilla de la
 * pantalla. Quien abre el Excel lo hace para filtrar y sumar, y una categoría
 * metida dentro de la celda del residuo no se puede filtrar. El PDF, que se lee y
 * se archiva, sí conserva la pastilla.
 *
 * Igual que el PDF: papel A4 y encabezado de tabla repetido en cada página
 * impresa (`printTitleRows`, que Excel resuelve como `Print_Titles`).
 */

/** 9 = A4 en la enumeración de papel de OOXML. */
const A4_PAGE_SETUP: XlsxPageSetup = { paperSize: 9, orientation: 'landscape', fitToWidth: true };

const SUMMARY_SHEET = 'Resumen';
const ROWS_SHEET = 'Consolidado';

@Injectable()
export class WasteSinaderExportXlsxService {
  constructor(private readonly workbook: XlsxWorkbookService) {}

  build(payload: WasteSinaderExportRequest, meta: { generatedAt: Date; author: string }): Buffer {
    return this.workbook.build(
      [this.summarySheet(payload, meta.generatedAt), this.rowsSheet(payload)],
      {
        title: payload.title,
        creator: meta.author,
        createdAt: meta.generatedAt.toISOString(),
      },
    );
  }

  private summarySheet(payload: WasteSinaderExportRequest, generatedAt: Date): XlsxSheet {
    const rows: XlsxCell[][] = [
      [this.cell(payload.title, 'title')],
      [this.cell(`Generado el ${this.formatTimestamp(generatedAt)}`, 'muted')],
      [this.cell(payload.description)],
      [this.cell(`Período: ${payload.periodLabel}`), this.cell(`Estado: ${payload.statusLabel}`)],
    ];

    /*
     * El aviso de período abierto viaja al Excel por lo mismo que al PDF: sin él,
     * un total parcial exportado se lee como definitivo. Va en `warning` para que
     * no se confunda con una línea más del resumen.
     */
    if (payload.notice) {
      rows.push([]);
      rows.push([this.cell(payload.notice, 'warning')]);
    }

    rows.push([]);

    if (payload.kpis.length > 0) {
      rows.push([this.cell(WASTE_SINADER_EXPORT_SECTIONS.kpis, 'section')]);
      rows.push([this.cell('Indicador', 'header'), this.cell('Valor', 'header'), this.cell('Unidad', 'header')]);
      for (const kpi of payload.kpis) {
        rows.push([this.cell(kpi.label), this.cell(kpi.value), this.cell(kpi.unit ?? '')]);
      }
      rows.push([]);
    }

    rows.push([this.cell(payload.totalLabel, 'section'), this.cell(payload.totalQuantity, 'section')]);
    rows.push([]);
    rows.push([this.cell(payload.updatedAtLabel, 'muted')]);

    return {
      name: SUMMARY_SHEET,
      columns: [{ width: 44 }, { width: 22 }, { width: 16 }],
      rows,
      pageSetup: A4_PAGE_SETUP,
    };
  }

  private rowsSheet(payload: WasteSinaderExportRequest): XlsxSheet {
    const columns = [WASTE_SINADER_EXPORT_CATEGORY_COLUMN, ...WASTE_SINADER_EXPORT_COLUMNS];
    const rows: XlsxCell[][] = [columns.map((column) => this.cell(column.header, 'header'))];

    for (const row of payload.rows) {
      rows.push([
        this.cell(row.category),
        this.cell(row.waste),
        this.cell(row.quantity),
        this.cell(row.treatment),
        this.cell(row.destination),
        this.cell(row.transport),
      ]);
    }

    /*
     * La fila de totales entra en la hoja del consolidado, no sólo en el resumen:
     * quien filtre esta hoja tiene que poder ver contra qué total está mirando.
     * Va separada por una fila en blanco para que el `autoFilter` de arriba no la
     * arrastre como si fuera un movimiento más.
     */
    rows.push([]);
    rows.push([this.cell(payload.totalLabel, 'section'), this.cell(''), this.cell(payload.totalQuantity, 'section')]);

    const lastColumn = String.fromCharCode(64 + columns.length);
    const dataRowCount = Math.max(1, payload.rows.length + 1);

    return {
      name: ROWS_SHEET,
      columns: columns.map((column) => ({ width: column.excelWidth })),
      rows,
      freezeRows: 1,
      autoFilter: `A1:${lastColumn}${dataRowCount}`,
      pageSetup: A4_PAGE_SETUP,
      // Equivalente al encabezado repetido del PDF: la fila 1 se reimprime arriba
      // de cada página.
      printTitleRows: '1:1',
    };
  }

  private cell(value: XlsxCell['value'], style: XlsxCellStyle = 'default'): XlsxCell {
    return this.workbook.cell(value, style);
  }

  private formatTimestamp(value: Date): string {
    const pad = (input: number) => String(input).padStart(2, '0');
    return `${pad(value.getDate())}-${pad(value.getMonth() + 1)}-${value.getFullYear()} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }
}
