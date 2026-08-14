import { Injectable } from '@nestjs/common';
import type { WasteSinaderExportRequest, WasteSinaderExportRow } from '@aurelia/contracts';
import { ReportPdfService, type ReportPdfDocument } from '../reports/report-pdf.service';
import {
  WAREHOUSE_EXPORT_COLORS,
  WASTE_SINADER_EXPORT_CATEGORY_BADGE,
  WASTE_SINADER_EXPORT_COLUMNS,
  WASTE_SINADER_EXPORT_SECTIONS,
  WASTE_SINADER_EXPORT_SUBJECT,
} from './waste-warehouse-export.theme';

/**
 * Renderiza "Reporte SINADER" a PDF A4 vertical.
 *
 * Es hermano de `WasteWarehouseExportPdfService` y comparte con él la estructura
 * —header repetido en cada hoja, `ensureSpace` antes de cada bloque, encabezado de
 * tabla reimpreso en cada salto, pie con numeración al final—, la paleta y las
 * constantes de página. Lo que cambia es el contenido: acá no hay barras ni
 * vencimientos, hay un consolidado con su fila de totales.
 *
 * NO se factorizó una clase base entre los dos. Lo único realmente común es la
 * geometría de la hoja, que ya vive en constantes, y una base abstracta con
 * `drawKpis` obligaría a las dos vistas a compartir un formato de tarjeta que hoy
 * difiere —esta tiene unidad y no tiene nota—. Se comparte lo que es dato (tema) y
 * no lo que es dibujo.
 *
 * DOS COSAS QUE EL PDF HACE Y LA PANTALLA NO:
 *
 * 1. Repite el aviso de período abierto arriba del consolidado. En pantalla el
 *    banner y la tabla se ven juntos; impreso, el consolidado puede caer en la
 *    hoja 2 y quedar leyéndose como definitivo.
 * 2. Imprime el estado del período junto al título. La pastilla "En curso" es un
 *    KPI más en pantalla, pero en un documento que se archiva es la primera cosa
 *    que hay que poder ver sin leer la tabla.
 */

/** A4 vertical en puntos PostScript. */
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

const MARGIN_X = 32;
const MARGIN_TOP = 28;
/** Margen físico chico para que el pie de página no dispare una hoja extra. */
const MARGIN_BOTTOM = 20;

const CONTENT_WIDTH = A4_WIDTH - MARGIN_X * 2;
const HEADER_RULE_Y = 62;
/** Primera línea de contenido, por debajo del header repetido. */
const CONTENT_TOP = 74;
/** Última coordenada utilizable por el contenido; por debajo va el pie. */
const CONTENT_BOTTOM = A4_HEIGHT - 46;
const FOOTER_Y = A4_HEIGHT - 30;

const TABLE_HEADER_HEIGHT = 22;
/**
 * 26 y no los 19 de "Control de bodega": la primera celda apila la pastilla de
 * categoría y el nombre del residuo, igual que en pantalla.
 */
const TABLE_ROW_HEIGHT = 26;
const TOTAL_ROW_HEIGHT = 20;
const CELL_PADDING_X = 6;
const HEADER_PADDING_X = 4;

interface PdfContext {
  doc: ReportPdfDocument;
  payload: WasteSinaderExportRequest;
  generatedAt: Date;
  columnWidths: number[];
  /** Cursor vertical. Lo mutan los renderers a medida que bajan. */
  y: number;
  /** Y donde arranca el tramo de tabla de la página actual, para cerrar su marco. */
  tableSegmentTop: number | null;
}

@Injectable()
export class WasteSinaderExportPdfService {
  constructor(private readonly reportPdf: ReportPdfService) {}

  async render(
    payload: WasteSinaderExportRequest,
    meta: { generatedAt: Date; author: string },
  ): Promise<Buffer> {
    return this.reportPdf.render(
      (doc) => {
        const context: PdfContext = {
          doc,
          payload,
          generatedAt: meta.generatedAt,
          columnWidths: this.resolveColumnWidths(),
          y: CONTENT_TOP,
          tableSegmentTop: null,
        };

        this.startPage(context);
        this.drawDescription(context);
        this.drawKpis(context);
        this.drawRowsTable(context);
        this.drawUpdatedAt(context);
        this.drawFooters(context);
      },
      {
        title: payload.title,
        author: meta.author,
        subject: WASTE_SINADER_EXPORT_SUBJECT,
      },
    );
  }

  /**
   * Reparte el ancho útil según los pesos del nodo. El último se calcula por resta
   * para que la suma cierre exactamente y no quede una hendidura de medio punto en
   * el borde derecho por acumulación de redondeos.
   */
  private resolveColumnWidths(): number[] {
    const totalWeight = WASTE_SINADER_EXPORT_COLUMNS.reduce((sum, column) => sum + column.weight, 0);
    const widths = WASTE_SINADER_EXPORT_COLUMNS.map(
      (column) => (column.weight / totalWeight) * CONTENT_WIDTH,
    );
    const allButLast = widths.slice(0, -1);
    const used = allButLast.reduce((sum, width) => sum + width, 0);
    return [...allButLast, CONTENT_WIDTH - used];
  }

  // ---------------------------------------------------------------- estructura

  /** Abre una hoja A4 y pinta el header repetido. */
  private startPage(context: PdfContext): void {
    const { doc, payload } = context;
    this.closeTableSegment(context);

    doc.addPage({
      size: 'A4',
      margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_X, right: MARGIN_X },
    });

    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor(WAREHOUSE_EXPORT_COLORS.ink)
      .text(payload.title, MARGIN_X, MARGIN_TOP, { width: CONTENT_WIDTH - 170, lineBreak: false });

    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
      .text(`Residuos · Reporte SINADER · ${payload.statusLabel}`, MARGIN_X, MARGIN_TOP + 1, {
        width: CONTENT_WIDTH,
        align: 'right',
        lineBreak: false,
      });

    doc
      .fontSize(7.5)
      .text(`Generado el ${this.formatTimestamp(context.generatedAt)}`, MARGIN_X, MARGIN_TOP + 15, {
        width: CONTENT_WIDTH,
        align: 'right',
        lineBreak: false,
      });

    doc
      .moveTo(MARGIN_X, HEADER_RULE_Y)
      .lineTo(MARGIN_X + CONTENT_WIDTH, HEADER_RULE_Y)
      .lineWidth(0.75)
      .strokeColor(WAREHOUSE_EXPORT_COLORS.border)
      .stroke();

    context.y = CONTENT_TOP;
  }

  /** Salta de hoja si el bloque que viene no entra completo. */
  private ensureSpace(context: PdfContext, needed: number): void {
    if (context.y + needed <= CONTENT_BOTTOM) return;
    this.startPage(context);
  }

  private drawSectionTitle(context: PdfContext, title: string): void {
    this.ensureSpace(context, 30);
    context.doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(WAREHOUSE_EXPORT_COLORS.ink)
      .text(title, MARGIN_X, context.y, { width: CONTENT_WIDTH, lineBreak: false });
    context.y += 16;
  }

  // ------------------------------------------------------------------ bloques

  private drawDescription(context: PdfContext): void {
    const { doc, payload } = context;
    doc.font('Helvetica').fontSize(8.5).fillColor(WAREHOUSE_EXPORT_COLORS.muted);
    const height = doc.heightOfString(payload.description, { width: CONTENT_WIDTH });
    this.ensureSpace(context, height + 10);
    doc.text(payload.description, MARGIN_X, context.y, { width: CONTENT_WIDTH });
    context.y += height + 12;
  }

  /**
   * Aviso de período abierto, sobre la banda azul del diseño.
   *
   * Se dibuja dos veces: acá, en su lugar de la pantalla, y otra vez arriba del
   * consolidado si éste arrancó en otra hoja. Es deliberado: un total parcial sin
   * el aviso al lado se lee como definitivo.
   */
  private drawNotice(context: PdfContext): void {
    const { doc, payload } = context;
    if (!payload.notice) return;

    const padding = 8;
    doc.font('Helvetica').fontSize(7.5);
    const textWidth = CONTENT_WIDTH - padding * 2;
    const textHeight = doc.heightOfString(payload.notice, { width: textWidth });
    const boxHeight = textHeight + padding * 2;

    this.ensureSpace(context, boxHeight + 10);

    doc
      .roundedRect(MARGIN_X, context.y, CONTENT_WIDTH, boxHeight, 5)
      .fillAndStroke(
        WASTE_SINADER_EXPORT_CATEGORY_BADGE.background,
        WASTE_SINADER_EXPORT_CATEGORY_BADGE.text,
      );

    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(WASTE_SINADER_EXPORT_CATEGORY_BADGE.text)
      .text(payload.notice, MARGIN_X + padding, context.y + padding, { width: textWidth });

    context.y += boxHeight + 12;
  }

  private drawKpis(context: PdfContext): void {
    const { doc, payload } = context;
    this.drawNotice(context);
    if (payload.kpis.length === 0) return;

    this.drawSectionTitle(context, WASTE_SINADER_EXPORT_SECTIONS.kpis);

    const gap = 8;
    const perRow = Math.min(4, payload.kpis.length);
    const cardWidth = (CONTENT_WIDTH - gap * (perRow - 1)) / perRow;
    const cardHeight = 44;

    payload.kpis.forEach((kpi, index) => {
      const column = index % perRow;
      if (column === 0) this.ensureSpace(context, cardHeight + gap);

      const x = MARGIN_X + column * (cardWidth + gap);
      const y = context.y;

      doc
        .roundedRect(x, y, cardWidth, cardHeight, 6)
        .lineWidth(0.75)
        .strokeColor(WAREHOUSE_EXPORT_COLORS.border)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
        .text(kpi.label, x + 8, y + 8, { width: cardWidth - 16, lineBreak: false, ellipsis: true });

      doc
        .font('Helvetica-Bold')
        .fontSize(15)
        .fillColor(WAREHOUSE_EXPORT_COLORS.ink)
        .text(kpi.value, x + 8, y + 21, { width: cardWidth - 16, lineBreak: false, ellipsis: true });

      if (kpi.unit) {
        /*
         * La unidad se ancla al ancho real del valor, no a una coordenada fija:
         * "2.290" y "410" no miden lo mismo, y con un offset fijo el "kg" quedaría
         * despegado en uno y encima en el otro. Es el equivalente del
         * `items-baseline` de la tarjeta en pantalla.
         */
        doc.font('Helvetica-Bold').fontSize(15);
        const valueWidth = doc.widthOfString(kpi.value);
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
          .text(kpi.unit, x + 8 + valueWidth + 4, y + 28, {
            width: Math.max(10, cardWidth - 16 - valueWidth - 4),
            lineBreak: false,
          });
      }

      if (column === perRow - 1 || index === payload.kpis.length - 1) {
        context.y += cardHeight + 14;
      }
    });
  }

  private drawRowsTable(context: PdfContext): void {
    this.drawSectionTitle(context, WASTE_SINADER_EXPORT_SECTIONS.rows);
    this.ensureSpace(context, TABLE_HEADER_HEIGHT + TABLE_ROW_HEIGHT);
    this.drawTableHeader(context);

    for (const row of context.payload.rows) {
      if (context.y + TABLE_ROW_HEIGHT > CONTENT_BOTTOM) {
        // Salto de página: se repiten el header de la página Y el de la tabla.
        this.startPage(context);
        this.drawTableHeader(context);
      }
      this.drawRow(context, row);
    }

    if (context.payload.rows.length === 0) {
      this.drawEmptyRow(context);
    }

    /*
     * La fila de totales NO puede quedar sola en una hoja sin su tabla: sería un
     * número sin de qué. Si no entra, salta y reimprime el encabezado.
     */
    if (context.y + TOTAL_ROW_HEIGHT > CONTENT_BOTTOM) {
      this.startPage(context);
      this.drawTableHeader(context);
    }
    this.drawTotalRow(context);

    this.closeTableSegment(context);
    context.y += 10;
  }

  private drawTableHeader(context: PdfContext): void {
    const { doc } = context;
    const y = context.y;
    context.tableSegmentTop = y;

    doc.rect(MARGIN_X, y, CONTENT_WIDTH, TABLE_HEADER_HEIGHT).fill(WAREHOUSE_EXPORT_COLORS.navy);

    let x = MARGIN_X;
    WASTE_SINADER_EXPORT_COLUMNS.forEach((column, index) => {
      const width = context.columnWidths[index] ?? 0;

      doc
        .font('Helvetica-Bold')
        .fontSize(6)
        .fillColor(WAREHOUSE_EXPORT_COLORS.white)
        .text(column.header.toUpperCase(), x + HEADER_PADDING_X, y + 5.5, {
          width: width - HEADER_PADDING_X * 2,
          align: column.align === 'center' ? 'center' : 'left',
          characterSpacing: 0.2,
        });

      if (index < WASTE_SINADER_EXPORT_COLUMNS.length - 1) {
        doc
          .moveTo(x + width, y)
          .lineTo(x + width, y + TABLE_HEADER_HEIGHT)
          .lineWidth(0.5)
          .strokeColor(WAREHOUSE_EXPORT_COLORS.navyRule)
          .stroke();
      }
      x += width;
    });

    context.y = y + TABLE_HEADER_HEIGHT;
  }

  private drawRow(context: PdfContext, row: WasteSinaderExportRow): void {
    const { doc } = context;
    const y = context.y;
    const widths = context.columnWidths;
    const x = (index: number) => MARGIN_X + widths.slice(0, index).reduce((sum, width) => sum + width, 0);

    // 0 · Residuo: pastilla de categoría arriba, código y nombre abajo.
    this.drawBadge(
      doc,
      x(0) + CELL_PADDING_X,
      y + 4,
      row.category,
      WASTE_SINADER_EXPORT_CATEGORY_BADGE.background,
      WASTE_SINADER_EXPORT_CATEGORY_BADGE.text,
    );
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(WAREHOUSE_EXPORT_COLORS.ink)
      .text(row.waste, x(0) + CELL_PADDING_X, y + 16, {
        width: (widths[0] ?? 0) - CELL_PADDING_X * 2,
        lineBreak: false,
        ellipsis: true,
      });

    // 1 · Cantidad en negrita: es la cifra que se declara.
    doc
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .fillColor(WAREHOUSE_EXPORT_COLORS.ink)
      .text(row.quantity, x(1) + CELL_PADDING_X, y + 10, {
        width: (widths[1] ?? 0) - CELL_PADDING_X * 2,
        lineBreak: false,
        ellipsis: true,
      });

    // 2-4 · texto plano, centrado verticalmente en la fila.
    const plainCells: Array<{ index: number; value: string }> = [
      { index: 2, value: row.treatment },
      { index: 3, value: row.destination },
      { index: 4, value: row.transport },
    ];
    doc.font('Helvetica').fontSize(7.5).fillColor(WAREHOUSE_EXPORT_COLORS.ink);
    for (const cell of plainCells) {
      const width = widths[cell.index] ?? 0;
      doc.text(cell.value, x(cell.index) + CELL_PADDING_X, y + 10, {
        width: width - CELL_PADDING_X * 2,
        lineBreak: false,
        ellipsis: true,
      });
    }

    this.drawRowRules(context, y, y + TABLE_ROW_HEIGHT);
    context.y = y + TABLE_ROW_HEIGHT;
  }

  /**
   * Vacío de la tabla. El diseño no lo dibuja, pero un consolidado puede no tener
   * movimientos y el PDF tiene que decirlo en vez de mostrar un hueco entre el
   * encabezado y el total.
   */
  private drawEmptyRow(context: PdfContext): void {
    const { doc } = context;
    const y = context.y;

    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
      .text('Sin movimientos no peligrosos consolidados en el período.', MARGIN_X, y + 8, {
        width: CONTENT_WIDTH,
        align: 'center',
        lineBreak: false,
      });

    this.drawRowRules(context, y, y + TABLE_ROW_HEIGHT, false);
    context.y = y + TABLE_ROW_HEIGHT;
  }

  /** Fila de totales: banda gris, rótulo y total en negrita. */
  private drawTotalRow(context: PdfContext): void {
    const { doc, payload } = context;
    const y = context.y;
    const widths = context.columnWidths;
    const x = (index: number) => MARGIN_X + widths.slice(0, index).reduce((sum, width) => sum + width, 0);

    doc.rect(MARGIN_X, y, CONTENT_WIDTH, TOTAL_ROW_HEIGHT).fill(WAREHOUSE_EXPORT_COLORS.track);

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(WAREHOUSE_EXPORT_COLORS.ink)
      .text(payload.totalLabel, MARGIN_X + CELL_PADDING_X, y + 6, {
        width: (widths[0] ?? 0) - CELL_PADDING_X * 2,
        lineBreak: false,
        ellipsis: true,
      });

    doc.text(payload.totalQuantity, x(1) + CELL_PADDING_X, y + 6, {
      width: (widths[1] ?? 0) - CELL_PADDING_X * 2,
      lineBreak: false,
      ellipsis: true,
    });

    this.drawRowRules(context, y, y + TOTAL_ROW_HEIGHT);
    context.y = y + TOTAL_ROW_HEIGHT;
  }

  /** Línea inferior de la fila y separadores verticales entre columnas. */
  private drawRowRules(context: PdfContext, top: number, bottom: number, verticals = true): void {
    const { doc } = context;

    doc
      .moveTo(MARGIN_X, bottom)
      .lineTo(MARGIN_X + CONTENT_WIDTH, bottom)
      .lineWidth(0.5)
      .strokeColor(WAREHOUSE_EXPORT_COLORS.border)
      .stroke();

    if (!verticals) return;

    let separatorX = MARGIN_X;
    for (let index = 0; index < context.columnWidths.length - 1; index += 1) {
      separatorX += context.columnWidths[index] ?? 0;
      doc
        .moveTo(separatorX, top)
        .lineTo(separatorX, bottom)
        .lineWidth(0.5)
        .strokeColor(WAREHOUSE_EXPORT_COLORS.border)
        .stroke();
    }
  }

  /** Marco exterior del tramo de tabla que vive en la página actual. */
  private closeTableSegment(context: PdfContext): void {
    if (context.tableSegmentTop === null) return;
    context.doc
      .rect(MARGIN_X, context.tableSegmentTop, CONTENT_WIDTH, context.y - context.tableSegmentTop)
      .lineWidth(0.75)
      .strokeColor(WAREHOUSE_EXPORT_COLORS.border)
      .stroke();
    context.tableSegmentTop = null;
  }

  /** Pie de la vista: cuándo se recalculó el consolidado. */
  private drawUpdatedAt(context: PdfContext): void {
    const { doc, payload } = context;
    doc.font('Helvetica').fontSize(7).fillColor(WAREHOUSE_EXPORT_COLORS.muted);
    const height = doc.heightOfString(payload.updatedAtLabel, { width: CONTENT_WIDTH });
    this.ensureSpace(context, height + 6);
    doc.text(payload.updatedAtLabel, MARGIN_X, context.y, { width: CONTENT_WIDTH });
    context.y += height + 6;
  }

  // ------------------------------------------------------------------ helpers

  private drawBadge(
    doc: ReportPdfDocument,
    x: number,
    y: number,
    label: string,
    background: string,
    color: string,
    fontSize = 6,
  ): number {
    doc.font('Helvetica-Bold').fontSize(fontSize);
    const width = doc.widthOfString(label) + 10;
    const height = fontSize + 5;
    doc.roundedRect(x, y, width, height, height / 2).fill(background);
    doc.fillColor(color).text(label, x + 5, y + (height - fontSize) / 2 - 0.5, { lineBreak: false });
    return width;
  }

  /**
   * Numeración al final: necesita saber el total de páginas, así que se escribe
   * recién cuando ya están todas creadas (`bufferPages: true` en
   * `ReportPdfService`).
   */
  private drawFooters(context: PdfContext): void {
    const { doc } = context;
    const range = doc.bufferedPageRange();

    for (let index = 0; index < range.count; index += 1) {
      doc.switchToPage(range.start + index);
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
        .text(`Página ${index + 1} de ${range.count}`, MARGIN_X, FOOTER_Y, {
          width: CONTENT_WIDTH,
          align: 'right',
          lineBreak: false,
        });
    }
  }

  private formatTimestamp(value: Date): string {
    const pad = (input: number) => String(input).padStart(2, '0');
    return `${pad(value.getDate())}-${pad(value.getMonth() + 1)}-${value.getFullYear()} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }
}
