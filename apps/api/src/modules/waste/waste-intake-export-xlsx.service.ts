import { Injectable } from '@nestjs/common';
import type { WarehouseIntakeExportRequest } from '@aurelia/contracts';
import {
  XlsxWorkbookService,
  type XlsxCell,
  type XlsxCellStyle,
  type XlsxPageSetup,
  type XlsxSheet,
} from '../reports/xlsx-workbook.service';
import { WAREHOUSE_EXPORT_HAZARD, WASTE_INTAKE_EXPORT_COLUMNS } from './waste-warehouse-export.theme';

/**
 * Exporta "Ingresos a bodega" a Excel.
 *
 * Reutiliza `XlsxWorkbookService` —el mismo generador de OOXML que usa
 * `WasteWarehouseExportXlsxService`— y la paleta de peligrosidad del tema del
 * módulo, así que las dos exportaciones de residuos comparten estilos.
 *
 * UNA sola hoja, a diferencia de "Control de bodega". Ahí son dos porque los
 * bloques de resumen y la tabla necesitan anchos de columna incompatibles; acá
 * el encabezado son cuatro líneas de texto que se derraman sobre celdas vacías
 * y no pelean con nada.
 *
 * El bloque de filtros no es decorativo: una planilla con 4 de 6 ingresos y sin
 * decir por qué faltan los otros dos es un dato sin contexto.
 */

/** 9 = A4 en la enumeración de papel de OOXML. Apaisado: son 9 columnas. */
const A4_LANDSCAPE: XlsxPageSetup = { paperSize: 9, orientation: 'landscape', fitToWidth: true };

const SHEET_NAME = 'Ingresos a bodega';

/** Filas del encabezado antes de la fila de títulos de columna. */
const HEADER_BLOCK_ROWS = 5;
/** 1-indexada, como las cuenta Excel. */
const TABLE_HEADER_ROW = HEADER_BLOCK_ROWS + 1;

@Injectable()
export class WasteIntakeExportXlsxService {
  constructor(private readonly workbook: XlsxWorkbookService) {}

  build(payload: WarehouseIntakeExportRequest, meta: { generatedAt: Date; author: string }): Buffer {
    return this.workbook.build([this.intakeSheet(payload, meta.generatedAt)], {
      title: `${payload.title} · Ingresos a bodega`,
      creator: meta.author,
      createdAt: meta.generatedAt.toISOString(),
    });
  }

  private intakeSheet(payload: WarehouseIntakeExportRequest, generatedAt: Date): XlsxSheet {
    const rows: XlsxCell[][] = [
      [this.cell(payload.title, 'title')],
      [this.cell(`Generado el ${this.formatTimestamp(generatedAt)}`, 'muted')],
      [this.cell(payload.description)],
      [this.cell(this.filtersLabel(payload.activeFilters), 'muted')],
      [],
      WASTE_INTAKE_EXPORT_COLUMNS.map((column) => this.cell(column.header, 'header')),
    ];

    for (const row of payload.rows) {
      const hazard = row.hazardous ? WAREHOUSE_EXPORT_HAZARD.hazardous : WAREHOUSE_EXPORT_HAZARD.nonHazardous;

      rows.push([
        this.cell(row.entryDate),
        this.cell(row.category),
        this.cell(row.wasteType),
        // Número real, no texto: es lo que permite sumar y ordenar la columna,
        // que es la razón de exportar a Excel y no a PDF.
        this.cell(row.quantity),
        this.cell(row.unit),
        this.cell(row.origin),
        this.cell(row.plate),
        this.cell(row.driver),
        this.cell(hazard.label, row.hazardous ? 'danger' : 'default'),
      ]);
    }

    const lastColumn = String.fromCharCode(64 + WASTE_INTAKE_EXPORT_COLUMNS.length);
    const lastRow = TABLE_HEADER_ROW + payload.rows.length;

    return {
      name: SHEET_NAME,
      columns: WASTE_INTAKE_EXPORT_COLUMNS.map((column) => ({ width: column.excelWidth })),
      rows,
      // Se congela hasta la fila de títulos inclusive, para que al bajar queden
      // a la vista tanto los encabezados como el contexto del reporte.
      freezeRows: TABLE_HEADER_ROW,
      autoFilter: `A${TABLE_HEADER_ROW}:${lastColumn}${Math.max(TABLE_HEADER_ROW, lastRow)}`,
      pageSetup: A4_LANDSCAPE,
      printTitleRows: `${TABLE_HEADER_ROW}:${TABLE_HEADER_ROW}`,
    };
  }

  private filtersLabel(activeFilters: string[]): string {
    if (activeFilters.length === 0) return 'Sin filtros aplicados: se exportan todos los ingresos.';
    return `Filtros aplicados: ${activeFilters.join(' · ')}`;
  }

  private cell(value: XlsxCell['value'], style: XlsxCellStyle = 'default'): XlsxCell {
    return this.workbook.cell(value, style);
  }

  private formatTimestamp(value: Date): string {
    const pad = (input: number) => String(input).padStart(2, '0');
    return `${pad(value.getDate())}-${pad(value.getMonth() + 1)}-${value.getFullYear()} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }
}
