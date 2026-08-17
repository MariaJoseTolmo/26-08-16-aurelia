import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  WasteFolioSupportExportDocument,
  WasteFolioSupportExportField,
  WasteFolioSupportExportRequest,
} from '@aurelia/contracts';
import { ReportPdfService, type ReportPdfDocument } from '../reports/report-pdf.service';
import { FOLIO_SUPPORT_ICONS, type FolioSupportIcon } from './waste-folio-support-export.icons';
import {
  WAREHOUSE_EXPORT_COLORS,
  WAREHOUSE_EXPORT_TONES,
  WASTE_FOLIO_SUPPORT_EXPORT_DISCLAIMER,
  WASTE_FOLIO_SUPPORT_EXPORT_SECTIONS,
  WASTE_FOLIO_SUPPORT_EXPORT_SUBJECT,
  pdfPt,
} from './waste-warehouse-export.theme';

/**
 * Documento PDF "Respaldo de Traslado de Residuo Peligroso" — nodo Figma
 * `3084:11044`. Lo pide "Descargar PDF" del modal `3085:13254`.
 *
 * Es el respaldo consolidado de UN traslado, el que se lleva a una fiscalización
 * ambiental: membrete, título, folio, estado, los ocho datos del traslado, la
 * conciliación de pesos y el listado de los respaldos que componen el paquete.
 *
 * UNIDADES. Igual que el PDF del Reporte SINADER: el nodo está en CSS px a 96dpi y
 * pdfkit trabaja en puntos a 72dpi, así que toda medida leída del diseño pasa por
 * `pdfPt()` —factor exacto 0.75— y las constantes de abajo se declaran en PX DEL NODO
 * para poder compararlas contra Figma sin hacer cuentas.
 *
 * QUÉ COMPARTE Y QUÉ NO CON EL PDF DEL REPORTE SINADER. Comparte el armazón —membrete
 * con logo, divisor y "AURELIA", regla de 2px en #001e39, rótulos de sección en
 * versalitas azul marino, texto legal sobre una regla— y por eso reusa
 * `ReportPdfService`, la paleta y `pdfPt`. Difiere en medidas y en dos cosas de fondo:
 *
 *   1. EL MARGEN. Este nodo va `px-[60px] py-[56px]` con 674px de ancho útil; el de
 *      SINADER, `56/48` con 682. No se unifican: cada uno reproduce el suyo.
 *   2. LA SEGUNDA LÍNEA DEL MEMBRETE. Allá es el asunto fijo del módulo ("Módulo
 *      Residuos · Reporte SINADER"); acá es el AUTOR — " Por: Catalina Cortés (Medio
 *      Ambiente) " en el nodo `3084:11058`—. Es el dato que identifica quién generó el
 *      respaldo, que en un documento de fiscalización importa.
 *
 * NO LLEVA PIE DE PÁGINA. El nodo no lo dibuja: cierra con el texto legal y nada más,
 * al revés del PDF de SINADER, que numera las hojas y repite la línea de
 * confidencialidad. Se respeta como está dibujado en vez de agregarle el pie de la otra
 * exportación "porque combina". Vale confirmarlo con diseño: si el respaldo tiene que
 * numerarse cuando el paquete crezca a dos hojas, el pie de `WasteSinaderExportPdfService`
 * ya resuelve el problema del margen inferior y se puede traer tal cual.
 *
 * CABE EN UNA HOJA CON EL PAQUETE DEL NODO —cinco documentos— y el contenido termina a
 * 987px de los 1123 de la A4. Con más respaldos pdfkit agrega hoja solo; el documento no
 * fuerza el corte porque el nodo no declara dónde debería caer.
 */

/** Medidas del nodo, en px a 96dpi. Se convierten con `pdfPt()` al dibujar. */
const PAGE = {
  paddingX: 60,
  paddingTop: 56,
  contentWidth: 674,
} as const;

const HEADER = {
  logoWidth: 138,
  logoHeight: 44,
  dividerHeight: 36,
  /** Separación entre el logo y "AURELIA", y entre el logo y el divisor. */
  gap: 20,
  /** Y de la regla de 2px que cierra el membrete, medida desde el borde del contenido. */
  ruleOffset: 64,
} as const;

const FIELDS = {
  /** Dos columnas de 323 con 28 de separación: 323 + 28 + 323 = 674. */
  columnGap: 28,
  rowHeight: 30.5,
  rowGap: 14,
  /** Separación entre el rótulo y su valor dentro del par. */
  pairGap: 3,
} as const;

const DOCS = {
  rowPaddingTop: 10,
  rowPaddingBottom: 11,
  iconGap: 12,
} as const;

interface PdfContext {
  doc: ReportPdfDocument;
  payload: WasteFolioSupportExportRequest;
  generatedAt: Date;
  author: string;
  y: number;
}

@Injectable()
export class WasteFolioSupportExportPdfService {
  private readonly logo = this.loadLogo();

  constructor(private readonly reportPdf: ReportPdfService) {}

  async render(
    payload: WasteFolioSupportExportRequest,
    meta: { generatedAt: Date; author: string },
  ): Promise<Buffer> {
    return this.reportPdf.render(
      (doc) => {
        const context: PdfContext = {
          doc,
          payload,
          generatedAt: meta.generatedAt,
          author: meta.author,
          y: 0,
        };

        this.startPage(context);
        this.drawTitle(context);
        this.drawStatusBadge(context);
        this.drawSectionTitle(context, WASTE_FOLIO_SUPPORT_EXPORT_SECTIONS.transfer, pdfPt(26));
        this.drawFields(context);
        this.drawWeights(context);
        this.drawSectionTitle(context, WASTE_FOLIO_SUPPORT_EXPORT_SECTIONS.documents, pdfPt(26));
        this.drawDocuments(context);
        this.drawDisclaimer(context);
      },
      {
        title: payload.title,
        author: meta.author,
        subject: WASTE_FOLIO_SUPPORT_EXPORT_SUBJECT,
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

  /**
   * Membrete `3084:11045`: logo, divisor, "AURELIA" y a la derecha las dos líneas de
   * generación, cerrado por una regla de 2px en #001e39.
   */
  private startPage(context: PdfContext): void {
    const { doc } = context;

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
      .fill('#d1d1d1');

    /*
     * "AURELIA" con las dos últimas letras en dorado, medido en dos tramos, que es lo
     * que hace el nodo `3085:12900` con dos `<span>`.
     */
    const brandX = dividerX + pdfPt(21);
    const brandY = top + pdfPt(12.25);
    doc.font('Helvetica-Bold').fontSize(pdfPt(16)).fillColor(WAREHOUSE_EXPORT_COLORS.navy);
    doc.text('AUREL', brandX, brandY, { lineBreak: false, characterSpacing: -0.3 });
    doc
      .fillColor(WAREHOUSE_EXPORT_COLORS.gold)
      .text('IA', brandX + doc.widthOfString('AUREL'), brandY, {
        lineBreak: false,
        characterSpacing: -0.3,
      });

    /*
     * Las dos líneas de la derecha del nodo `3084:11058`. La segunda es el AUTOR y no
     * el asunto del módulo: ver la nota del encabezado.
     */
    doc
      .font('Helvetica')
      .fontSize(pdfPt(11))
      .fillColor(WAREHOUSE_EXPORT_COLORS.separator)
      .text(`Generado: ${this.formatTimestamp(context.generatedAt)}`, this.left, top + pdfPt(9), {
        width: this.width,
        align: 'right',
        lineBreak: false,
      })
      .text(`Por: ${context.author}`, this.left, top + pdfPt(22), {
        width: this.width,
        align: 'right',
        lineBreak: false,
      });

    const ruleY = top + pdfPt(HEADER.ruleOffset);
    doc.rect(this.left, ruleY, this.width, pdfPt(2)).fill(WAREHOUSE_EXPORT_COLORS.navy);

    context.y = ruleY + pdfPt(2);
  }

  // ------------------------------------------------------------------ bloques

  /** Título `3084:11061` y subtítulo `3084:11064`. */
  private drawTitle(context: PdfContext): void {
    const { doc, payload } = context;

    doc
      .font('Helvetica-Bold')
      .fontSize(pdfPt(22))
      .fillColor(WAREHOUSE_EXPORT_COLORS.ink)
      .text(payload.title, this.left, context.y + pdfPt(28), { width: this.width, lineBreak: false });

    doc
      .font('Helvetica')
      .fontSize(pdfPt(12.5))
      .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
      .text(payload.subtitle, this.left, context.y + pdfPt(59), { width: this.width });

    context.y += pdfPt(102);
  }

  /**
   * Pastilla "Estado: Cerrado" `3084:11066`: cápsula teal con el tilde en círculo.
   *
   * El ancho lo da el contenido —`px-[12px]` más el glifo y su `gap-[6px]`— en vez de
   * fijar los 130.75px del nodo, que son la caja de texto de Figma.
   */
  private drawStatusBadge(context: PdfContext): void {
    const { doc, payload } = context;
    const tone = WAREHOUSE_EXPORT_TONES.safe;
    const label = `Estado: ${payload.statusLabel}`;

    doc.font('Helvetica-Bold').fontSize(pdfPt(11));
    const iconWidth = pdfPt(13.75);
    const height = pdfPt(21);
    const padX = pdfPt(12);
    const gap = pdfPt(6);
    const width = padX * 2 + iconWidth + gap + doc.widthOfString(label);

    doc.roundedRect(this.left, context.y, width, height, height / 2).fill(tone.badgeBackground);

    this.drawIcon(doc, FOLIO_SUPPORT_ICONS.check, {
      x: this.left + padX,
      y: context.y + pdfPt(5),
      width: iconWidth,
      color: tone.badgeText,
    });

    doc
      .fillColor(tone.badgeText)
      .text(label, this.left + padX + iconWidth + gap, context.y + pdfPt(5.5), {
        lineBreak: false,
      });

    context.y += height;
  }

  /**
   * Rótulo de sección — nodos `3084:11071` y `3084:11160`: versalitas azul marino sobre
   * una regla inferior. Los dos comparten geometría, así que comparten método.
   */
  private drawSectionTitle(context: PdfContext, label: string, topGap: number): void {
    const { doc } = context;
    const y = context.y + topGap;

    doc
      .font('Helvetica-Bold')
      .fontSize(pdfPt(12))
      .fillColor(WAREHOUSE_EXPORT_COLORS.navy)
      .text(label.toUpperCase(), this.left, y, {
        width: this.width,
        characterSpacing: pdfPt(0.36),
        lineBreak: false,
      });

    const ruleY = y + pdfPt(24);
    doc
      .moveTo(this.left, ruleY)
      .lineTo(this.left + this.width, ruleY)
      .lineWidth(0.75)
      .strokeColor(WAREHOUSE_EXPORT_COLORS.border)
      .stroke();

    context.y = ruleY;
  }

  /**
   * "Datos del traslado" `3084:11074`: dos columnas de pares rótulo/valor.
   *
   * El alto de fila del nodo (30.5px) se respeta como PASO de la grilla, no como recorte:
   * un valor que no entre en una línea se envuelve y empuja la fila siguiente, porque en
   * un respaldo de fiscalización un nombre de empresa cortado deja de identificarla.
   */
  private drawFields(context: PdfContext): void {
    const { doc, payload } = context;
    const columnWidth = pdfPt((PAGE.contentWidth - FIELDS.columnGap) / 2);
    let y = context.y + pdfPt(14);

    for (let index = 0; index < payload.fields.length; index += 2) {
      const row = [payload.fields[index], payload.fields[index + 1]];
      let rowHeight = pdfPt(FIELDS.rowHeight);

      row.forEach((field, column) => {
        if (!field) return;
        const x = this.left + column * (columnWidth + pdfPt(FIELDS.columnGap));
        const height = this.drawField(doc, field, x, y, columnWidth);
        rowHeight = Math.max(rowHeight, height);
      });

      y += rowHeight + pdfPt(FIELDS.rowGap);
    }

    // La última fila no aporta separación: el `gap` va ENTRE filas.
    context.y = y - pdfPt(FIELDS.rowGap);
  }

  /** Un par rótulo/valor. Devuelve el alto que ocupó. */
  private drawField(
    doc: ReportPdfDocument,
    field: WasteFolioSupportExportField,
    x: number,
    y: number,
    width: number,
  ): number {
    doc
      .font('Helvetica-Bold')
      .fontSize(pdfPt(10))
      .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
      .text(field.label.toUpperCase(), x, y, {
        width,
        characterSpacing: pdfPt(0.2),
        lineBreak: false,
      });

    const valueY = y + pdfPt(12 + FIELDS.pairGap);
    doc.font('Helvetica-Bold').fontSize(pdfPt(13)).fillColor(WAREHOUSE_EXPORT_COLORS.ink);
    const valueHeight = doc.heightOfString(field.value, { width });
    doc.text(field.value, x, valueY, { width });

    return pdfPt(12 + FIELDS.pairGap) + valueHeight;
  }

  /**
   * Banda de conciliación `3084:11131`: despachado → recibido = diferencia, sobre una
   * caja gris con borde.
   *
   * Las tres cifras se reparten con `justify-between`, que acá se resuelve midiendo: la
   * primera pegada al padding izquierdo, la última al derecho, y los dos separadores en
   * los centros de los huecos que quedan. Es lo mismo que hace el flex del nodo, sin
   * fijar las x de Figma.
   */
  private drawWeights(context: PdfContext): void {
    const { doc, payload } = context;
    const { weights } = payload;

    const boxY = context.y + pdfPt(16);
    const boxHeight = pdfPt(62);
    const padX = pdfPt(19);
    const iconWidth = pdfPt(17.5);

    doc
      .roundedRect(this.left, boxY, this.width, boxHeight, pdfPt(8))
      .fillAndStroke(WAREHOUSE_EXPORT_COLORS.track, WAREHOUSE_EXPORT_COLORS.border);

    const figures = [
      { value: weights.dispatched, label: 'Despachado' },
      { value: weights.received, label: 'Recibido' },
      { value: weights.difference, label: weights.differenceLabel },
    ];

    doc.font('Helvetica-Bold').fontSize(pdfPt(16));
    const figureWidths = figures.map((figure) => {
      const valueWidth = doc.widthOfString(figure.value);
      doc.font('Helvetica').fontSize(pdfPt(9.5));
      const labelWidth = doc.widthOfString(figure.label.toUpperCase());
      doc.font('Helvetica-Bold').fontSize(pdfPt(16));
      return Math.max(valueWidth, labelWidth);
    });

    const inner = this.width - padX * 2;
    const spare = inner - figureWidths.reduce((total, value) => total + value, 0) - iconWidth * 2;
    const slack = spare / 4;

    let x = this.left + padX;
    figures.forEach((figure, index) => {
      this.drawWeightFigure(doc, figure, x, boxY + pdfPt(15), figureWidths[index] ?? 0);
      x += (figureWidths[index] ?? 0) + slack;

      if (index < 2) {
        this.drawIcon(doc, index === 0 ? FOLIO_SUPPORT_ICONS.arrow : FOLIO_SUPPORT_ICONS.equals, {
          x,
          y: boxY + pdfPt(24),
          width: iconWidth,
          color: WAREHOUSE_EXPORT_COLORS.separator,
        });
        x += iconWidth + slack;
      }
    });

    context.y = boxY + boxHeight;
  }

  private drawWeightFigure(
    doc: ReportPdfDocument,
    figure: { value: string; label: string },
    x: number,
    y: number,
    width: number,
  ): void {
    doc
      .font('Helvetica-Bold')
      .fontSize(pdfPt(16))
      .fillColor(WAREHOUSE_EXPORT_COLORS.ink)
      .text(figure.value, x, y, { width, align: 'center', lineBreak: false });

    doc
      .font('Helvetica')
      .fontSize(pdfPt(9.5))
      .fillColor(WAREHOUSE_EXPORT_COLORS.muted)
      .text(figure.label.toUpperCase(), x, y + pdfPt(21), {
        width,
        align: 'center',
        lineBreak: false,
      });
  }

  /**
   * "Documentos incluidos en este paquete" `3084:11163`: una fila por respaldo, con el
   * tilde, qué es a la izquierda y el nombre del archivo alineado a la derecha, separadas
   * por una regla inferior.
   */
  private drawDocuments(context: PdfContext): void {
    const { doc, payload } = context;
    let y = context.y + pdfPt(14);

    payload.documents.forEach((document) => {
      y = this.drawDocumentRow(doc, document, y);
    });

    context.y = y;
  }

  /** Una fila del paquete. Devuelve la y de la siguiente. */
  private drawDocumentRow(
    doc: ReportPdfDocument,
    document: WasteFolioSupportExportDocument,
    y: number,
  ): number {
    const iconWidth = pdfPt(15.625);
    const textY = y + pdfPt(DOCS.rowPaddingTop);

    this.drawIcon(doc, FOLIO_SUPPORT_ICONS.tick, {
      x: this.left,
      y: y + pdfPt(DOCS.rowPaddingTop + 1.25),
      width: iconWidth,
      color: WAREHOUSE_EXPORT_COLORS.muted,
    });

    const labelX = this.left + iconWidth + pdfPt(DOCS.iconGap);
    doc
      .font('Helvetica')
      .fontSize(pdfPt(12.5))
      .fillColor('#333333')
      .text(document.label, labelX, textY, { width: this.width - (labelX - this.left), lineBreak: false });

    /*
     * El nombre del archivo va a la derecha, en un cuerpo más chico y en gris: el nodo
     * lo mete en un `Text:align` con `justify-end` (`3084:11181`).
     */
    doc
      .font('Helvetica')
      .fontSize(pdfPt(11))
      .fillColor(WAREHOUSE_EXPORT_COLORS.separator)
      .text(document.filename, this.left, textY + pdfPt(1), {
        width: this.width,
        align: 'right',
        lineBreak: false,
      });

    const bottom = y + pdfPt(DOCS.rowPaddingTop + 15 + DOCS.rowPaddingBottom);
    doc
      .moveTo(this.left, bottom)
      .lineTo(this.left + this.width, bottom)
      .lineWidth(0.75)
      .strokeColor(WAREHOUSE_EXPORT_COLORS.border)
      .stroke();

    return bottom;
  }

  /** Texto legal `3084:11228`, sobre una regla superior. */
  private drawDisclaimer(context: PdfContext): void {
    const { doc } = context;
    const ruleY = context.y + pdfPt(36);

    doc
      .moveTo(this.left, ruleY)
      .lineTo(this.left + this.width, ruleY)
      .lineWidth(0.75)
      .strokeColor(WAREHOUSE_EXPORT_COLORS.border)
      .stroke();

    doc
      .font('Helvetica')
      .fontSize(pdfPt(9.5))
      .fillColor(WAREHOUSE_EXPORT_COLORS.separator)
      .text(WASTE_FOLIO_SUPPORT_EXPORT_DISCLAIMER, this.left, ruleY + pdfPt(17), {
        width: this.width,
        /* `leading-[15.2px]` sobre 9.5px de cuerpo: el sobrante va como `lineGap`. */
        lineGap: pdfPt(15.2 - 9.5 * 1.15),
      });
  }

  // ------------------------------------------------------------------ helpers

  /**
   * Dibuja un glifo del nodo escalando su path a la caja pedida.
   *
   * Mismo patrón que los iconos de las tarjetas del informe periódico: `save()`,
   * `translate()` al punto, `scale()` por la razón entre la caja de destino y la de
   * origen del path, y `restore()` para no dejar la transformación puesta.
   */
  private drawIcon(
    doc: ReportPdfDocument,
    icon: FolioSupportIcon,
    target: { x: number; y: number; width: number; color: string },
  ): void {
    /*
     * `target.width` ya viene en PUNTOS y `icon.box.width` está en PX del nodo, así que
     * la razón entre los dos ES el factor de escala y no hay que pasarla por `pdfPt()`
     * otra vez: con un glifo pedido a `pdfPt(13.75)` sobre una caja de 13.75 el factor
     * sale 0.75, que es exactamente la conversión de 96 a 72dpi.
     */
    const scale = target.width / icon.box.width;

    doc.save();
    doc.translate(target.x, target.y);
    doc.scale(scale);
    doc.path(icon.path).fill(target.color);
    doc.restore();
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
