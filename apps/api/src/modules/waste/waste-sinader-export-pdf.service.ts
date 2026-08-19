import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { WasteSinaderExportRequest, WasteSinaderExportRow } from '@aurelia/contracts';
import { ReportPdfService, type ReportPdfDocument } from '../reports/report-pdf.service';
import {
  WAREHOUSE_EXPORT_COLORS,
  WASTE_SINADER_EXPORT_CATEGORY_BADGE,
  WASTE_SINADER_EXPORT_CHROME,
  WASTE_SINADER_EXPORT_COLUMNS,
  WASTE_SINADER_EXPORT_DISCLAIMER,
  WASTE_SINADER_EXPORT_SUBJECT,
  WASTE_SINADER_EXPORT_TONES,
  WASTE_SINADER_PDF_COLUMN_WIDTHS_PX,
  pdfPt,
} from './waste-warehouse-export.theme';

/**
 * Documento PDF del "Reporte SINADER" — nodos Figma `4319:33856` (en curso),
 * `4319:33574` (pendiente de declarar) y `4319:33709` (declarado).
 *
 * UN SOLO DOCUMENTO CON SEIS RANURAS. Los tres nodos comparten el esqueleto
 * completo y hasta las coordenadas exactas: membrete, título, subtítulo, píldora,
 * recuadro de contexto, cuatro KPIs y tabla caen en las MISMAS x/y en los tres. Lo
 * único que cambia:
 *
 *   1. el tono y el rótulo de la píldora            → `status` + `statusBadgeLabel`
 *   2. el tono y el texto del recuadro de contexto  → `status` + `notice`
 *   3. el DATO de la segunda tarjeta                → `kpis[1]`
 *   4. el rótulo de la fila de totales              → `totalLabel`
 *   5. una nota bajo la tabla, sólo en curso        → `tableFootnote`
 *   6. un bloque de firma, sólo declarado           → `signature`
 *
 * Más el texto legal del pie, que sale de `WASTE_SINADER_EXPORT_DISCLAIMER` según
 * el estado.
 *
 * ESTE ARCHIVO REEMPLAZÓ A UNA VERSIÓN ANTERIOR que seguía la maqueta de la
 * PANTALLA, escrita antes de que existieran estos nodos. Aquélla no tenía membrete
 * con el logo de Gold Fields, ni pie con numeración, ni el texto legal, y repartía
 * la tabla con otras proporciones. No era una variante de esto: era otro documento.
 *
 * UNIDADES. Los nodos están en CSS px a 96dpi y pdfkit trabaja en puntos a 72dpi.
 * Toda medida leída del diseño pasa por `pdfPt()` —factor exacto 0.75— en vez de
 * traducirse a ojo. Por eso las constantes de abajo se declaran en PX DEL NODO y se
 * convierten al usarlas: así se pueden comparar contra Figma sin hacer cuentas.
 */

/** Medidas del nodo, en px a 96dpi. Se convierten con `pdfPt()` al dibujar. */
const PAGE = {
  paddingX: 56,
  paddingTop: 48,
  contentWidth: 682,
  /** Alto útil del nodo: 1123 menos el padding superior. */
  height: 1123,
} as const;

const HEADER = {
  logoWidth: 138,
  logoHeight: 44,
  dividerHeight: 36,
  gap: 20,
  /** Separación entre el logo y la regla inferior del membrete. */
  ruleOffset: 62,
  blockHeight: 90,
} as const;

const TABLE = {
  headerHeight: 30,
  rowHeight: 76,
  totalHeight: 31,
  cellPaddingX: 12,
  badgeHeight: 14,
  badgePaddingX: 7,
} as const;

interface PdfContext {
  doc: ReportPdfDocument;
  payload: WasteSinaderExportRequest;
  generatedAt: Date;
  /** Anchos de columna ya en puntos. */
  columnWidths: number[];
  y: number;
}

@Injectable()
export class WasteSinaderExportPdfService {
  private readonly logo = this.loadLogo();

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
          columnWidths: WASTE_SINADER_PDF_COLUMN_WIDTHS_PX.map(pdfPt),
          y: 0,
        };

        this.startPage(context);
        this.drawTitle(context);
        this.drawStatusBadge(context);
        this.drawNotice(context);
        this.drawKpis(context);
        this.drawTable(context);
        this.drawSignature(context);
        this.drawDisclaimer(context);
        this.drawPageFooters(context);
      },
      {
        title: payload.title,
        author: meta.author,
        subject: WASTE_SINADER_EXPORT_SUBJECT,
      },
    );
  }

  // ---------------------------------------------------------------- estructura

  private get left(): number {
    return pdfPt(PAGE.paddingX);
  }

  private get width(): number {
    return pdfPt(PAGE.contentWidth);
  }

  /** Y a partir de la cual ya no entra contenido: por debajo va el pie del documento. */
  private get contentBottom(): number {
    return pdfPt(PAGE.height) - pdfPt(140);
  }

  /**
   * Abre una hoja y pinta el membrete `4319:33858`: logo, divisor, "AURELIA" y a la
   * derecha las dos líneas de generación, cerrado por una regla de 2px en #001e39.
   */
  private startPage(context: PdfContext): void {
    const { doc, payload } = context;

    doc.addPage({
      size: 'A4',
      margins: {
        top: pdfPt(PAGE.paddingTop),
        bottom: pdfPt(PAGE.paddingTop),
        left: this.left,
        right: this.left,
      },
    });

    const top = pdfPt(PAGE.paddingTop);
    doc.image(this.logo, this.left, top, {
      width: pdfPt(HEADER.logoWidth),
      height: pdfPt(HEADER.logoHeight),
    });

    const dividerX = this.left + pdfPt(HEADER.logoWidth + HEADER.gap);
    doc
      .rect(dividerX, top + pdfPt(4), 0.75, pdfPt(HEADER.dividerHeight))
      .fill(WAREHOUSE_EXPORT_COLORS.separator);

    /*
     * "AURELIA" con las dos últimas letras en dorado. Se dibuja en dos tramos
     * midiendo el primero, que es lo que hace el nodo con dos `<span>`.
     */
    const brandX = dividerX + pdfPt(21);
    const brandY = top + pdfPt(12.25);
    doc.font('Helvetica-Bold').fontSize(pdfPt(16)).fillColor('#001e39');
    doc.text('AUREL', brandX, brandY, { lineBreak: false, characterSpacing: -0.3 });
    doc
      .fillColor(WAREHOUSE_EXPORT_COLORS.gold)
      .text('IA', brandX + doc.widthOfString('AUREL'), brandY, {
        lineBreak: false,
        characterSpacing: -0.3,
      });

    doc
      .font('Helvetica')
      .fontSize(pdfPt(10))
      .fillColor(WAREHOUSE_EXPORT_COLORS.separator)
      .text(`Generado: ${this.formatTimestamp(context.generatedAt)}`, this.left, top + pdfPt(6), {
        width: this.width,
        align: 'right',
        lineBreak: false,
      })
      .text(WASTE_SINADER_EXPORT_CHROME.headerSubject, this.left, top + pdfPt(22), {
        width: this.width,
        align: 'right',
        lineBreak: false,
      });

    const ruleY = top + pdfPt(HEADER.ruleOffset);
    doc
      .rect(this.left, ruleY, this.width, pdfPt(2))
      .fill('#001e39');

    void payload;
    context.y = top + pdfPt(HEADER.blockHeight);
  }

  // ------------------------------------------------------------------ bloques

  /** Título `4319:33867` y subtítulo `4319:33869`. */
  private drawTitle(context: PdfContext): void {
    const { doc, payload } = context;

    doc
      .font('Helvetica-Bold')
      .fontSize(pdfPt(20))
      .fillColor(WAREHOUSE_EXPORT_COLORS.ink)
      .text(payload.title, this.left, context.y + pdfPt(24), { width: this.width, lineBreak: false });

    doc
      .font('Helvetica')
      .fontSize(pdfPt(11.5))
      .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
      .text(payload.description, this.left, context.y + pdfPt(52), { width: this.width });

    context.y += pdfPt(82);
  }

  /** Píldora de estado `4319:33871`. Su tono sale del estado, no del texto. */
  private drawStatusBadge(context: PdfContext): void {
    const { doc, payload } = context;
    const tone = WASTE_SINADER_EXPORT_TONES[payload.status].badge;

    doc.font('Helvetica-Bold').fontSize(pdfPt(10.5));
    const label = payload.statusBadgeLabel;
    const height = pdfPt(21);
    const width = doc.widthOfString(label) + pdfPt(24);

    doc.roundedRect(this.left, context.y, width, height, height / 2).fill(tone.background);
    doc
      .fillColor(tone.text)
      .text(label, this.left + pdfPt(12), context.y + pdfPt(5.5), { lineBreak: false });

    context.y += pdfPt(38.5);
  }

  /**
   * Recuadro de contexto `4319:33875`. Alto DERIVADO del texto, no fijo: los tres
   * nodos lo dibujan en 57px con su copy, pero un período con una frase más larga
   * no debe recortarse.
   */
  private drawNotice(context: PdfContext): void {
    const { doc, payload } = context;
    if (!payload.notice) return;

    const tone = WASTE_SINADER_EXPORT_TONES[payload.status].notice;
    const padX = pdfPt(15);
    const padY = pdfPt(12);
    const textWidth = this.width - padX * 2;

    doc.font('Helvetica').fontSize(pdfPt(10.5));
    const textHeight = doc.heightOfString(payload.notice, {
      width: textWidth,
      lineGap: pdfPt(16.275 - 10.5 * 1.15),
    });
    const boxHeight = textHeight + padY * 2;

    doc
      .roundedRect(this.left, context.y, this.width, boxHeight, pdfPt(8))
      .fillAndStroke(tone.background, tone.border);

    doc
      .fillColor(tone.text)
      .text(payload.notice, this.left + padX, context.y + padY, {
        width: textWidth,
        lineGap: pdfPt(16.275 - 10.5 * 1.15),
      });

    context.y += boxHeight + pdfPt(20);
  }

  /** Cuatro tarjetas `4319:33882`…`4319:33897`, en fila y de igual ancho. */
  private drawKpis(context: PdfContext): void {
    const { doc, payload } = context;
    if (payload.kpis.length === 0) return;

    const gap = pdfPt(12);
    const count = Math.min(4, payload.kpis.length);
    const cardWidth = (this.width - gap * (count - 1)) / count;
    const cardHeight = pdfPt(62);

    payload.kpis.slice(0, count).forEach((kpi, index) => {
      const x = this.left + index * (cardWidth + gap);

      doc
        .roundedRect(x, context.y, cardWidth, cardHeight, pdfPt(8))
        .lineWidth(0.75)
        .strokeColor(WAREHOUSE_EXPORT_COLORS.border)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(pdfPt(8))
        .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
        .text(kpi.label.toUpperCase(), x + pdfPt(13), context.y + pdfPt(13), {
          width: cardWidth - pdfPt(26),
          lineBreak: false,
          ellipsis: true,
          characterSpacing: 0.27,
        });

      const value = kpi.unit ? `${kpi.value} ${kpi.unit}` : kpi.value;
      doc
        .font('Helvetica-Bold')
        .fontSize(pdfPt(17))
        .fillColor(WAREHOUSE_EXPORT_COLORS.ink)
        .text(value, x + pdfPt(13), context.y + pdfPt(28), {
          width: cardWidth - pdfPt(26),
          lineBreak: false,
          ellipsis: true,
        });
    });

    context.y += cardHeight + pdfPt(20);
  }

  // -------------------------------------------------------------------- tabla

  private drawTable(context: PdfContext): void {
    this.drawTableHeader(context);

    for (const row of context.payload.rows) {
      if (context.y + pdfPt(TABLE.rowHeight) > this.contentBottom) {
        this.startPage(context);
        this.drawTableHeader(context);
      }
      this.drawRow(context, row);
    }

    if (context.payload.rows.length === 0) this.drawEmptyRow(context);

    if (context.y + pdfPt(TABLE.totalHeight) > this.contentBottom) {
      this.startPage(context);
      this.drawTableHeader(context);
    }
    this.drawTotalRow(context);
    this.drawTableFootnote(context);

    context.y += pdfPt(40);
  }

  private drawTableHeader(context: PdfContext): void {
    const { doc } = context;
    const height = pdfPt(TABLE.headerHeight);

    doc.rect(this.left, context.y, this.width, height).fill(WAREHOUSE_EXPORT_COLORS.track);

    let x = this.left;
    WASTE_SINADER_EXPORT_COLUMNS.forEach((column, index) => {
      const width = context.columnWidths[index] ?? 0;
      doc
        .font('Helvetica-Bold')
        .fontSize(pdfPt(9))
        .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
        .text(column.header.toUpperCase(), x + pdfPt(TABLE.cellPaddingX), context.y + pdfPt(9.5), {
          width: width - pdfPt(TABLE.cellPaddingX * 2),
          lineBreak: false,
          ellipsis: true,
          characterSpacing: 0.44,
        });
      x += width;
    });

    this.drawRule(context, context.y + height);
    context.y += height;
  }

  private drawRow(context: PdfContext, row: WasteSinaderExportRow): void {
    const { doc } = context;
    const top = context.y;
    const height = pdfPt(TABLE.rowHeight);
    const x = (index: number) =>
      this.left + context.columnWidths.slice(0, index).reduce((sum, w) => sum + w, 0);

    // 0 · Residuo: pastilla de categoría arriba, código y nombre abajo.
    this.drawCategoryBadge(doc, x(0) + pdfPt(TABLE.cellPaddingX), top + pdfPt(14), row.category);
    doc
      .font('Helvetica')
      .fontSize(pdfPt(10))
      .fillColor(WAREHOUSE_EXPORT_COLORS.ink)
      .text(row.waste, x(0) + pdfPt(TABLE.cellPaddingX), top + pdfPt(36), {
        width: (context.columnWidths[0] ?? 0) - pdfPt(TABLE.cellPaddingX * 2),
      });

    // 1 · Cantidad en negrita: es la cifra que se declara.
    doc
      .font('Helvetica-Bold')
      .fontSize(pdfPt(10))
      .text(row.quantity, x(1) + pdfPt(TABLE.cellPaddingX), top + pdfPt(32), {
        width: (context.columnWidths[1] ?? 0) - pdfPt(TABLE.cellPaddingX * 2),
        lineBreak: false,
        ellipsis: true,
      });

    // 2-4 · texto plano, con envoltura: un destino cortado deja de identificar el lugar.
    doc.font('Helvetica').fontSize(pdfPt(10)).fillColor(WAREHOUSE_EXPORT_COLORS.ink);
    [
      { index: 2, value: row.treatment },
      { index: 3, value: row.destination },
      { index: 4, value: row.transport },
    ].forEach((cell) => {
      const width = context.columnWidths[cell.index] ?? 0;
      doc.text(cell.value, x(cell.index) + pdfPt(TABLE.cellPaddingX), top + pdfPt(30), {
        width: width - pdfPt(TABLE.cellPaddingX * 2),
        height: height - pdfPt(20),
        ellipsis: true,
      });
    });

    this.drawRule(context, top + height);
    context.y = top + height;
  }

  /** El diseño no lo dibuja, pero un consolidado sin movimientos tiene que decirlo. */
  private drawEmptyRow(context: PdfContext): void {
    const { doc } = context;
    const height = pdfPt(TABLE.rowHeight);

    doc
      .font('Helvetica')
      .fontSize(pdfPt(10))
      .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
      .text('Sin movimientos no peligrosos consolidados en el período.', this.left, context.y + pdfPt(30), {
        width: this.width,
        align: 'center',
        lineBreak: false,
      });

    this.drawRule(context, context.y + height);
    context.y += height;
  }

  private drawTotalRow(context: PdfContext): void {
    const { doc, payload } = context;
    const height = pdfPt(TABLE.totalHeight);

    doc.rect(this.left, context.y, this.width, height).fill(WAREHOUSE_EXPORT_COLORS.track);

    doc
      .font('Helvetica-Bold')
      .fontSize(pdfPt(10))
      .fillColor('#000000')
      .text(payload.totalLabel, this.left + pdfPt(TABLE.cellPaddingX), context.y + pdfPt(9.5), {
        width: (context.columnWidths[0] ?? 0) - pdfPt(TABLE.cellPaddingX * 2),
        lineBreak: false,
        ellipsis: true,
      })
      .text(
        payload.totalQuantity,
        this.left + (context.columnWidths[0] ?? 0) + pdfPt(TABLE.cellPaddingX),
        context.y + pdfPt(9.5),
        { width: (context.columnWidths[1] ?? 0), lineBreak: false },
      );

    /*
     * La nota del período abierto va DENTRO de la fila de totales, a la derecha de
     * la cifra: así lo dibuja `4319:33966`, y tiene sentido — aclara ese total, no
     * la tabla entera.
     */
    if (payload.tableFootnote) {
      const noteX = this.left + (context.columnWidths[0] ?? 0) + (context.columnWidths[1] ?? 0);
      doc
        .font('Helvetica')
        .fontSize(pdfPt(9.5))
        .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
        .text(payload.tableFootnote, noteX + pdfPt(TABLE.cellPaddingX), context.y + pdfPt(10), {
          width: this.width - (noteX - this.left) - pdfPt(TABLE.cellPaddingX * 2),
          lineBreak: false,
          ellipsis: true,
        });
    }

    this.drawRule(context, context.y + height);
    context.y += height;
  }

  private drawTableFootnote(context: PdfContext): void {
    // El marco exterior de la tabla se cierra al final, sobre todo el tramo dibujado.
    void context;
  }

  /**
   * Bloque de firma `4319:33835`, sólo en el documento declarado: dos columnas con
   * su rótulo en versalitas y el valor debajo.
   */
  private drawSignature(context: PdfContext): void {
    const { doc, payload } = context;
    if (!payload.signature) return;

    const columnWidth = (this.width - pdfPt(14)) / 2;
    const entries = [
      { label: WASTE_SINADER_EXPORT_CHROME.signatureDeclaredByLabel, value: payload.signature.declaredBy },
      { label: WASTE_SINADER_EXPORT_CHROME.signatureFolioLabel, value: payload.signature.declaredAtAndFolio },
    ];

    entries.forEach((entry, index) => {
      const x = this.left + index * (columnWidth + pdfPt(14));
      doc
        .font('Helvetica-Bold')
        .fontSize(pdfPt(8))
        .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
        .text(entry.label.toUpperCase(), x, context.y, {
          width: columnWidth,
          lineBreak: false,
          characterSpacing: 0.27,
        });
      doc
        .font('Helvetica')
        .fontSize(pdfPt(11))
        .fillColor(WAREHOUSE_EXPORT_COLORS.ink)
        .text(entry.value, x, context.y + pdfPt(14), { width: columnWidth, lineBreak: false, ellipsis: true });
    });

    context.y += pdfPt(50);
  }

  /** Texto legal `4319:33971`, sobre una regla superior. */
  private drawDisclaimer(context: PdfContext): void {
    const { doc, payload } = context;
    const text = WASTE_SINADER_EXPORT_DISCLAIMER[payload.status];

    doc
      .moveTo(this.left, context.y)
      .lineTo(this.left + this.width, context.y)
      .lineWidth(0.75)
      .strokeColor(WAREHOUSE_EXPORT_COLORS.border)
      .stroke();

    doc
      .font('Helvetica')
      .fontSize(pdfPt(8.5))
      .fillColor(WAREHOUSE_EXPORT_COLORS.separator)
      .text(text, this.left, context.y + pdfPt(15), { width: this.width, lineGap: pdfPt(2) });
  }

  // ------------------------------------------------------------------ helpers

  private drawCategoryBadge(doc: ReportPdfDocument, x: number, y: number, label: string): void {
    doc.font('Helvetica-Bold').fontSize(pdfPt(8.5));
    const height = pdfPt(TABLE.badgeHeight);
    const width = doc.widthOfString(label) + pdfPt(TABLE.badgePaddingX * 2);

    doc.roundedRect(x, y, width, height, pdfPt(10)).fill(WASTE_SINADER_EXPORT_CATEGORY_BADGE.background);
    doc
      .fillColor(WASTE_SINADER_EXPORT_CATEGORY_BADGE.text)
      .text(label, x + pdfPt(TABLE.badgePaddingX), y + pdfPt(2.5), { lineBreak: false });
  }

  private drawRule(context: PdfContext, y: number): void {
    context.doc
      .moveTo(this.left, y)
      .lineTo(this.left + this.width, y)
      .lineWidth(0.5)
      .strokeColor(WAREHOUSE_EXPORT_COLORS.border)
      .stroke();
  }

  /**
   * Pie de cada hoja: la línea de origen a la izquierda, la de confidencialidad con
   * la fecha de emisión a la derecha, y el `n / total` de `4319:33979`.
   *
   * Se escribe al final porque necesita el total de páginas (`bufferPages: true` en
   * `ReportPdfService`).
   */
  private drawPageFooters(context: PdfContext): void {
    const { doc } = context;
    const range = doc.bufferedPageRange();
    const footerY = pdfPt(1057);
    const emitted = this.formatDate(context.generatedAt);

    for (let index = 0; index < range.count; index += 1) {
      doc.switchToPage(range.start + index);

      /*
       * El pie va por DEBAJO del margen inferior: el nodo lo pone a 1083 de 1123,
       * o sea a 30pt del borde, y el margen de la hoja son 36pt. Escribir ahí con
       * el margen puesto hace que pdfkit crea que el texto desbordó y agregue una
       * hoja nueva —y como el pie se dibuja en todas, cascadea—. Por eso el margen
       * se anula mientras se pinta el pie y se restaura después.
       */
      const bottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;

      doc
        .moveTo(this.left, footerY)
        .lineTo(this.left + this.width, footerY)
        .lineWidth(0.75)
        .strokeColor(WAREHOUSE_EXPORT_COLORS.separator)
        .stroke();

      doc
        .font('Helvetica')
        .fontSize(pdfPt(9))
        .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
        .text(WASTE_SINADER_EXPORT_CHROME.footerLeft, this.left, footerY + pdfPt(17), {
          width: this.width,
          lineBreak: false,
        })
        .text(
          `Emitido: ${emitted} · ${WASTE_SINADER_EXPORT_CHROME.footerRight}`,
          this.left,
          footerY + pdfPt(17),
          { width: this.width, align: 'right', lineBreak: false },
        );

      doc
        .fontSize(pdfPt(10))
        .text(`${index + 1} / ${range.count}`, this.left, pdfPt(1083), {
          width: this.width,
          align: 'right',
          lineBreak: false,
        });

      doc.page.margins.bottom = bottomMargin;
    }
  }

  private loadLogo(): Buffer {
    return readFileSync(join(__dirname, 'assets', 'gold-fields-logo.png'));
  }

  private formatTimestamp(value: Date): string {
    return `${this.formatDate(value)}, ${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }

  private formatDate(value: Date): string {
    return `${pad(value.getDate())}-${pad(value.getMonth() + 1)}-${value.getFullYear()}`;
  }
}

function pad(input: number): string {
  return String(input).padStart(2, '0');
}
