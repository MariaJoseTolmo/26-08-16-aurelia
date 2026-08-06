import { Injectable } from '@nestjs/common';
import type { WarehouseControlExportLot, WarehouseControlExportRequest } from '@aurelia/contracts';
import { ReportPdfService, type ReportPdfDocument } from '../reports/report-pdf.service';
import {
  WAREHOUSE_EXPORT_COLORS,
  WAREHOUSE_EXPORT_COLUMNS,
  WAREHOUSE_EXPORT_HAZARD,
  WAREHOUSE_EXPORT_LOT_STATUS,
  WAREHOUSE_EXPORT_SECTIONS,
  WAREHOUSE_EXPORT_SUBJECT,
  WAREHOUSE_EXPORT_TONES,
  resolveAccumulationTone,
} from './waste-warehouse-export.theme';

/**
 * Renderiza la vista "Control de bodega" a PDF A4 vertical.
 *
 * Requisito central: EN CADA SALTO DE PÁGINA se repiten el header de la página
 * (título de la bodega + fecha de generación) y, si el corte cae dentro de la
 * tabla, también su encabezado de columnas. Eso es lo que hace
 * `startPage()` + `drawLotsTableHeader()` en el bucle de filas.
 *
 * Se usa pdfkit vía `ReportPdfService` —el mismo camino que los informes de
 * inspecciones— y no una rasterización del DOM: el texto queda seleccionable,
 * el peso es una fracción y el corte de página es determinístico.
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
const TABLE_ROW_HEIGHT = 19;
const CELL_PADDING_X = 6;
const HEADER_PADDING_X = 4;

interface PdfContext {
  doc: ReportPdfDocument;
  payload: WarehouseControlExportRequest;
  generatedAt: Date;
  columnWidths: number[];
  /** Cursor vertical. Lo mutan los renderers a medida que bajan. */
  y: number;
  /** Y donde arranca el tramo de tabla de la página actual, para cerrar su marco. */
  tableSegmentTop: number | null;
}

@Injectable()
export class WasteWarehouseExportPdfService {
  constructor(private readonly reportPdf: ReportPdfService) {}

  async render(
    payload: WarehouseControlExportRequest,
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
        this.drawBars(context);
        this.drawExpirations(context);
        this.drawLotsTable(context);
        this.drawFooters(context);
      },
      {
        title: `${payload.title} · Control de bodega`,
        author: meta.author,
        subject: WAREHOUSE_EXPORT_SUBJECT,
      },
    );
  }

  /**
   * Reparte el ancho útil según los pesos del nodo Figma. El último se calcula
   * por resta para que la suma cierre exactamente y no quede una hendidura de
   * medio punto en el borde derecho por acumulación de redondeos.
   */
  private resolveColumnWidths(): number[] {
    const totalWeight = WAREHOUSE_EXPORT_COLUMNS.reduce((sum, column) => sum + column.weight, 0);
    const widths = WAREHOUSE_EXPORT_COLUMNS.map((column) => (column.weight / totalWeight) * CONTENT_WIDTH);
    const allButLast = widths.slice(0, -1);
    const used = allButLast.reduce((sum, width) => sum + width, 0);
    return [...allButLast, CONTENT_WIDTH - used];
  }

  // ---------------------------------------------------------------- estructura

  /** Abre una hoja A4 y pinta el header repetido. */
  private startPage(context: PdfContext): void {
    const { doc } = context;
    this.closeTableSegment(context);

    doc.addPage({
      size: 'A4',
      margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_X, right: MARGIN_X },
    });

    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor(WAREHOUSE_EXPORT_COLORS.ink)
      .text(context.payload.title, MARGIN_X, MARGIN_TOP, { width: CONTENT_WIDTH - 170, lineBreak: false });

    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
      .text('Residuos · Control de bodega', MARGIN_X, MARGIN_TOP + 1, {
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
    const { doc } = context;
    doc.font('Helvetica').fontSize(8.5).fillColor(WAREHOUSE_EXPORT_COLORS.muted);
    const height = doc.heightOfString(context.payload.description, { width: CONTENT_WIDTH });
    this.ensureSpace(context, height + 10);
    doc.text(context.payload.description, MARGIN_X, context.y, { width: CONTENT_WIDTH });
    context.y += height + 12;
  }

  private drawKpis(context: PdfContext): void {
    const { doc, payload } = context;
    if (payload.kpis.length === 0) return;

    this.drawSectionTitle(context, WAREHOUSE_EXPORT_SECTIONS.kpis);

    const gap = 8;
    const perRow = Math.min(4, payload.kpis.length);
    const cardWidth = (CONTENT_WIDTH - gap * (perRow - 1)) / perRow;
    const cardHeight = 48;

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

      const valueText = kpi.secondaryValue ? `${kpi.value} / ${kpi.secondaryValue}` : kpi.value;
      doc
        .font('Helvetica-Bold')
        .fontSize(15)
        .fillColor(WAREHOUSE_EXPORT_COLORS.ink)
        .text(valueText, x + 8, y + 20, { width: cardWidth - 16, lineBreak: false });

      if (kpi.note) {
        const valueWidth = doc.widthOfString(valueText);
        doc
          .font('Helvetica')
          .fontSize(6.5)
          .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
          .text(kpi.note, x + 8, y + 34, { width: Math.max(10, cardWidth - 16), lineBreak: false, ellipsis: true });
        void valueWidth;
      }

      if (column === perRow - 1 || index === payload.kpis.length - 1) {
        context.y += cardHeight + 14;
      }
    });
  }

  private drawBars(context: PdfContext): void {
    const { doc, payload } = context;
    if (payload.bars.length === 0) return;

    this.drawSectionTitle(context, WAREHOUSE_EXPORT_SECTIONS.bars);

    // Recuadro de avance del mes.
    doc.font('Helvetica').fontSize(8);
    const noteHeight = doc.heightOfString(payload.monthProgressLabel, { width: CONTENT_WIDTH - 20 });
    const boxHeight = noteHeight + 14;
    this.ensureSpace(context, boxHeight + 10);
    doc
      .roundedRect(MARGIN_X, context.y, CONTENT_WIDTH, boxHeight, 5)
      .lineWidth(0.75)
      .strokeColor(WAREHOUSE_EXPORT_COLORS.border)
      .stroke();
    doc
      .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
      .text(payload.monthProgressLabel, MARGIN_X + 10, context.y + 7, { width: CONTENT_WIDTH - 20 });
    context.y += boxHeight + 10;

    for (const bar of payload.bars) {
      this.ensureSpace(context, 30);
      const tone = WAREHOUSE_EXPORT_TONES[resolveAccumulationTone(bar.percentage)];
      const rowY = context.y;

      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(WAREHOUSE_EXPORT_COLORS.ink)
        .text(bar.label, MARGIN_X, rowY, { lineBreak: false });
      const labelWidth = doc.widthOfString(bar.label);

      this.drawBadge(doc, MARGIN_X + labelWidth + 6, rowY - 1.5, bar.deviationLabel, tone.badgeBackground, tone.badgeText);

      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
        .text(bar.valueLabel, MARGIN_X, rowY + 1, { width: CONTENT_WIDTH, align: 'right', lineBreak: false });

      const trackY = rowY + 15;
      const trackHeight = 6;
      doc.roundedRect(MARGIN_X, trackY, CONTENT_WIDTH, trackHeight, 3).fill(WAREHOUSE_EXPORT_COLORS.track);
      const filled = (Math.min(100, Math.max(0, bar.percentage)) / 100) * CONTENT_WIDTH;
      if (filled > 0) {
        doc.roundedRect(MARGIN_X, trackY, Math.max(filled, trackHeight), trackHeight, 3).fill(tone.fill);
      }

      context.y = trackY + trackHeight + 10;
    }

    context.y += 4;
  }

  private drawExpirations(context: PdfContext): void {
    const { doc, payload } = context;
    if (payload.expirations.length === 0) return;

    this.drawSectionTitle(context, WAREHOUSE_EXPORT_SECTIONS.expirations);

    for (const item of payload.expirations) {
      this.ensureSpace(context, 30);
      const rowY = context.y;
      const tone = item.overdue ? WAREHOUSE_EXPORT_TONES.critical : WAREHOUSE_EXPORT_TONES.warning;

      const badgeSize = 16;
      doc.roundedRect(MARGIN_X, rowY, badgeSize, badgeSize, 4).fill(tone.badgeBackground);
      this.drawExpirationGlyph(doc, MARGIN_X + 3, rowY + 3, 10, item.overdue, tone.fill);

      const textX = MARGIN_X + badgeSize + 8;
      const textWidth = CONTENT_WIDTH - badgeSize - 8;

      doc.font('Helvetica').fontSize(8.5).fillColor(WAREHOUSE_EXPORT_COLORS.ink);
      const prefix = `${item.wasteName} — ingresó `;
      doc.text(prefix, textX, rowY + 1, { lineBreak: false, width: textWidth, continued: false });
      doc
        .font('Helvetica-Bold')
        .text(item.intakeDate, textX + doc.widthOfString(prefix), rowY + 1, { lineBreak: false });

      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
        .text(item.detail, textX, rowY + 13, { width: textWidth, lineBreak: false, ellipsis: true });

      const bottom = rowY + 26;
      doc
        .moveTo(MARGIN_X, bottom)
        .lineTo(MARGIN_X + CONTENT_WIDTH, bottom)
        .lineWidth(0.5)
        .strokeColor(WAREHOUSE_EXPORT_COLORS.border)
        .stroke();

      context.y = bottom + 6;
    }

    context.y += 6;
  }

  // -------------------------------------------------------------------- tabla

  private drawLotsTable(context: PdfContext): void {
    this.drawSectionTitle(context, WAREHOUSE_EXPORT_SECTIONS.lots);
    this.ensureSpace(context, TABLE_HEADER_HEIGHT + TABLE_ROW_HEIGHT);
    this.drawLotsTableHeader(context);

    for (const lot of context.payload.lots) {
      if (context.y + TABLE_ROW_HEIGHT > CONTENT_BOTTOM) {
        // Salto de página: se repiten el header de la página Y el de la tabla.
        this.startPage(context);
        this.drawLotsTableHeader(context);
      }
      this.drawLotRow(context, lot);
    }

    this.closeTableSegment(context);
    context.y += 8;
  }

  private drawLotsTableHeader(context: PdfContext): void {
    const { doc } = context;
    const y = context.y;
    context.tableSegmentTop = y;

    doc.rect(MARGIN_X, y, CONTENT_WIDTH, TABLE_HEADER_HEIGHT).fill(WAREHOUSE_EXPORT_COLORS.navy);

    let x = MARGIN_X;
    WAREHOUSE_EXPORT_COLUMNS.forEach((column, index) => {
      const width = context.columnWidths[index] ?? 0;

      /*
       * 6pt y padding de 4, no 6.5pt y 6: "PELIGROSIDAD" es una palabra sola de
       * 12 caracteres y con los valores anteriores no entraba en su columna de
       * 61pt, así que pdfkit la cortaba al medio ("PELIGROSIDA / D"). Los
       * encabezados de dos palabras sí pueden ocupar dos líneas.
       */
      doc
        .font('Helvetica-Bold')
        .fontSize(6)
        .fillColor(WAREHOUSE_EXPORT_COLORS.white)
        .text(column.header.toUpperCase(), x + HEADER_PADDING_X, y + 5.5, {
          width: width - HEADER_PADDING_X * 2,
          align: column.align === 'center' ? 'center' : 'left',
          characterSpacing: 0.2,
        });

      if (index < WAREHOUSE_EXPORT_COLUMNS.length - 1) {
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

  private drawLotRow(context: PdfContext, lot: WarehouseControlExportLot): void {
    const { doc } = context;
    const y = context.y;
    const status = WAREHOUSE_EXPORT_LOT_STATUS[lot.status];
    const hazard = lot.hazardous ? WAREHOUSE_EXPORT_HAZARD.hazardous : WAREHOUSE_EXPORT_HAZARD.nonHazardous;

    const widths = context.columnWidths;
    const x = (index: number) => MARGIN_X + widths.slice(0, index).reduce((sum, width) => sum + width, 0);

    // 0 · Peligrosidad (pastilla centrada)
    this.drawCenteredBadge(doc, x(0), y, widths[0] ?? 0, hazard.label, hazard.background, hazard.text);

    // 1-4 · texto plano
    const plainCells: Array<{ index: number; value: string }> = [
      { index: 1, value: lot.category },
      { index: 2, value: lot.wasteType },
      { index: 3, value: lot.quantity },
      { index: 4, value: lot.unit },
    ];
    doc.font('Helvetica').fontSize(7.5).fillColor(WAREHOUSE_EXPORT_COLORS.ink);
    for (const cell of plainCells) {
      const width = widths[cell.index] ?? 0;
      doc.text(cell.value, x(cell.index) + CELL_PADDING_X, y + 6, {
        width: width - CELL_PADDING_X * 2,
        lineBreak: false,
        ellipsis: true,
      });
    }

    // 5 · Tiempo en bodega: negrita y coloreado cuando el lote está en riesgo.
    const elapsedIsAlert = lot.status !== 'normal';
    doc
      .font(elapsedIsAlert ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(7.5)
      .fillColor(elapsedIsAlert ? status.text : WAREHOUSE_EXPORT_COLORS.muted)
      .text(lot.elapsedLabel, x(5) + CELL_PADDING_X, y + 6, {
        width: (widths[5] ?? 0) - CELL_PADDING_X * 2,
        lineBreak: false,
        ellipsis: true,
      });

    // 6 · Estado: "Normal" va sin pastilla, igual que en pantalla.
    if (status.background) {
      this.drawCenteredBadge(doc, x(6), y, widths[6] ?? 0, status.label, status.background, status.text);
    } else {
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(status.text)
        .text(status.label, x(6) + CELL_PADDING_X, y + 6.5, {
          width: (widths[6] ?? 0) - CELL_PADDING_X * 2,
          align: 'center',
          lineBreak: false,
        });
    }

    const bottom = y + TABLE_ROW_HEIGHT;
    doc
      .moveTo(MARGIN_X, bottom)
      .lineTo(MARGIN_X + CONTENT_WIDTH, bottom)
      .lineWidth(0.5)
      .strokeColor(WAREHOUSE_EXPORT_COLORS.border)
      .stroke();

    let separatorX = MARGIN_X;
    for (let index = 0; index < widths.length - 1; index += 1) {
      separatorX += widths[index] ?? 0;
      doc
        .moveTo(separatorX, y)
        .lineTo(separatorX, bottom)
        .lineWidth(0.5)
        .strokeColor(WAREHOUSE_EXPORT_COLORS.border)
        .stroke();
    }

    context.y = bottom;
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

  // ------------------------------------------------------------------ helpers

  /**
   * Los iconos de "Próximos vencimientos" se dibujan como vectores en vez de
   * incrustar los SVG del diseño: pdfkit no traza SVG sin una dependencia extra,
   * y son dos glifos geométricos simples. Alerta triangular si el lote está
   * vencido, reloj si todavía no lo está — la misma regla que en pantalla.
   */
  private drawExpirationGlyph(
    doc: ReportPdfDocument,
    x: number,
    y: number,
    size: number,
    overdue: boolean,
    color: string,
  ): void {
    if (overdue) {
      doc
        .moveTo(x + size / 2, y + 0.8)
        .lineTo(x + size - 0.5, y + size - 1)
        .lineTo(x + 0.5, y + size - 1)
        .closePath()
        .fill(color);
      doc
        .font('Helvetica-Bold')
        .fontSize(size * 0.52)
        .fillColor(WAREHOUSE_EXPORT_COLORS.white)
        .text('!', x, y + size * 0.4, { width: size, align: 'center', lineBreak: false });
      return;
    }

    const radius = size / 2 - 0.9;
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    doc.circle(centerX, centerY, radius).lineWidth(1).strokeColor(color).stroke();
    doc
      .moveTo(centerX, centerY)
      .lineTo(centerX, centerY - radius * 0.58)
      .moveTo(centerX, centerY)
      .lineTo(centerX + radius * 0.48, centerY)
      .lineWidth(0.9)
      .strokeColor(color)
      .stroke();
  }

  private drawBadge(
    doc: ReportPdfDocument,
    x: number,
    y: number,
    label: string,
    background: string,
    color: string,
    fontSize = 6.5,
  ): number {
    doc.font('Helvetica-Bold').fontSize(fontSize);
    const width = doc.widthOfString(label) + 10;
    const height = fontSize + 6;
    doc.roundedRect(x, y, width, height, height / 2).fill(background);
    doc.fillColor(color).text(label, x + 5, y + (height - fontSize) / 2 - 0.5, { lineBreak: false });
    return width;
  }

  private drawCenteredBadge(
    doc: ReportPdfDocument,
    cellX: number,
    cellY: number,
    cellWidth: number,
    label: string,
    background: string,
    color: string,
  ): void {
    doc.font('Helvetica-Bold').fontSize(6.5);
    const badgeWidth = Math.min(doc.widthOfString(label) + 10, cellWidth - 4);
    const x = cellX + (cellWidth - badgeWidth) / 2;
    const height = 12.5;
    const y = cellY + (TABLE_ROW_HEIGHT - height) / 2;
    doc.roundedRect(x, y, badgeWidth, height, height / 2).fill(background);
    doc
      .fillColor(color)
      .text(label, x, y + 3.2, { width: badgeWidth, align: 'center', lineBreak: false, ellipsis: true });
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
