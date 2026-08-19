import { Injectable } from '@nestjs/common';
import { GOLD_FIELDS_LOGO } from './inspection-report-assets';
import type { ReportPdfDocument } from './report-pdf.service';

export interface PeriodicReportHeaderContext {
  periodTitle: string;
  periodSubtitle: string;
  compactTitle?: string;
  generatedBy: string;
  generatedAt: string;
}

export interface ReportSectionBadge {
  text: string;
  background?: string;
  color?: string;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 42;
const MARGIN_TOP = 36;
const MARGIN_BOTTOM = 36;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const FOOTER_LINE_Y = 780;
const FOOTER_TEXT_Y = 793.5;
const NAVY = '#001E39';
const GOLD = '#C8A064';
const BORDER = '#D1D1D1';
const MUTED = '#646464';

@Injectable()
export class ReportPdfBrandingService {
  readonly pageWidth = PAGE_WIDTH;
  readonly pageHeight = PAGE_HEIGHT;
  readonly marginX = MARGIN_X;
  readonly marginTop = MARGIN_TOP;
  readonly marginBottom = MARGIN_BOTTOM;
  readonly contentWidth = CONTENT_WIDTH;
  readonly footerLineY = FOOTER_LINE_Y;

  addPage(document: ReportPdfDocument): void {
    document.addPage({
      size: 'A4',
      margins: {
        top: MARGIN_TOP,
        right: MARGIN_X,
        bottom: MARGIN_BOTTOM,
        left: MARGIN_X,
      },
    });
  }

  drawCoverHeader(document: ReportPdfDocument, context: PeriodicReportHeaderContext): number {
    const top = MARGIN_TOP;
    const logoWidth = 103.5;
    const logoHeight = 33;

    try {
      document.image(GOLD_FIELDS_LOGO, MARGIN_X, top, {
        fit: [logoWidth, logoHeight],
        valign: 'center',
      });
    } catch {
      document
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(NAVY)
        .text('GOLD FIELDS', MARGIN_X, top + 12, { width: logoWidth });
    }

    const dividerX = MARGIN_X + 116;
    document
      .moveTo(dividerX, top + 3)
      .lineTo(dividerX, top + 30)
      .strokeColor(BORDER)
      .lineWidth(0.75)
      .stroke();

    this.drawAureliaWordmark(document, dividerX + 14, top + 10.5, 12);

    document
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .fillColor(MUTED)
      .text('INFORME DE INSPECCIONES · PERÍODO', MARGIN_X + 255, top + 1, {
        width: CONTENT_WIDTH - 255,
        align: 'right',
        characterSpacing: 0.66,
      });
    document
      .font('Helvetica-Bold')
      .fontSize(15)
      .fillColor(NAVY)
      .text(context.periodTitle, MARGIN_X + 220, top + 14, {
        width: CONTENT_WIDTH - 220,
        align: 'right',
      });
    document
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(MUTED)
      .text(context.periodSubtitle, MARGIN_X + 180, top + 35, {
        width: CONTENT_WIDTH - 180,
        align: 'right',
      });

    const lineY = top + 61;
    document
      .moveTo(MARGIN_X, lineY)
      .lineTo(MARGIN_X + CONTENT_WIDTH, lineY)
      .strokeColor(NAVY)
      .lineWidth(1.5)
      .stroke();
    document.y = lineY + 18;
    return document.y;
  }

  drawCompactHeader(document: ReportPdfDocument, context: PeriodicReportHeaderContext): number {
    const top = MARGIN_TOP;
    const wordmarkX = MARGIN_X;
    const wordmarkWidth = this.drawAureliaWordmark(document, wordmarkX, top + 2, 9.75);
    const dividerX = wordmarkX + wordmarkWidth + 9;
    const compactTitleX = dividerX + 9;

    document
      .moveTo(dividerX, top)
      .lineTo(dividerX, top + 15)
      .strokeColor(BORDER)
      .lineWidth(0.75)
      .stroke();
    document
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(MUTED)
      .text(context.compactTitle ?? `Informe ${context.periodTitle} · ${context.periodSubtitle}`, compactTitleX, top + 2, {
        width: 235,
        height: 11,
        ellipsis: true,
      });
    document
      .font('Helvetica')
      .fontSize(7)
      .fillColor(MUTED)
      .text(`Gold Fields Salares Norte · ${context.generatedBy}`, MARGIN_X + 330, top + 2.5, {
        width: CONTENT_WIDTH - 330,
        align: 'right',
      });

    const lineY = top + 25;
    document
      .moveTo(MARGIN_X, lineY)
      .lineTo(MARGIN_X + CONTENT_WIDTH, lineY)
      .strokeColor(NAVY)
      .lineWidth(1.1)
      .stroke();
    document.y = lineY + 15;
    return document.y;
  }

  drawSectionTitle(
    document: ReportPdfDocument,
    title: string,
    badge?: ReportSectionBadge,
    y = document.y,
  ): number {
    document
      .rect(MARGIN_X, y, 2.25, 10.5)
      .fill(GOLD);
    document
      .font('Helvetica-Bold')
      .fontSize(8.25)
      .fillColor(NAVY)
      .text(title.toUpperCase(), MARGIN_X + 10, y + 0.5, {
        width: badge ? CONTENT_WIDTH - 190 : CONTENT_WIDTH - 10,
        characterSpacing: 0.66,
      });

    if (badge) {
      document.font('Helvetica-Bold').fontSize(6.75);
      const badgeWidth = Math.min(190, Math.max(60, document.widthOfString(badge.text) + 12));
      const badgeX = MARGIN_X + CONTENT_WIDTH - badgeWidth;
      document
        .roundedRect(badgeX, y - 0.5, badgeWidth, 12, 3)
        .fill(badge.background ?? '#F7F7F7');
      document
        .fillColor(badge.color ?? MUTED)
        .text(badge.text, badgeX + 6, y + 2, {
          width: badgeWidth - 12,
          align: 'center',
        });
    }

    document.y = y + 22;
    return document.y;
  }

  drawFooters(document: ReportPdfDocument, generatedAt: string): void {
    const range = document.bufferedPageRange();
    const issued = this.formatDate(generatedAt);

    for (let index = range.start; index < range.start + range.count; index += 1) {
      document.switchToPage(index);
      document
        .moveTo(MARGIN_X, FOOTER_LINE_Y)
        .lineTo(MARGIN_X + CONTENT_WIDTH, FOOTER_LINE_Y)
        .strokeColor(BORDER)
        .lineWidth(0.5)
        .stroke();
      document
        .font('Helvetica')
        .fontSize(5.6)
        .fillColor(MUTED)
        .text(
          'Generado por AurelIA SGA · Gold Fields Salares Norte · aurelia.goldfields.cl',
          MARGIN_X,
          FOOTER_TEXT_Y,
          { width: 270 },
        );
      document
        .font('Helvetica')
        .fontSize(5.6)
        .fillColor(MUTED)
        .text(
          `Emitido: ${issued} · Confidencial · Uso Interno`,
          MARGIN_X + 270,
          FOOTER_TEXT_Y,
          { width: CONTENT_WIDTH - 270, align: 'right' },
        );
      document
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(MUTED)
        .text(`${index - range.start + 1} / ${range.count}`, MARGIN_X + CONTENT_WIDTH - 35, FOOTER_TEXT_Y + 11, {
          width: 35,
          align: 'right',
          height: PAGE_HEIGHT - FOOTER_TEXT_Y,
        });
    }
  }

  formatDate(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date).replace(/\//g, '-');
  }

  private drawAureliaWordmark(
    document: ReportPdfDocument,
    x: number,
    y: number,
    fontSize: number,
  ): number {
    document.font('Helvetica-Bold').fontSize(fontSize);
    const width = document.widthOfString('AURELIA');
    document
      .fillColor(NAVY)
      .text('AUREL', x, y, { continued: true });
    document
      .fillColor(GOLD)
      .text('IA');
    return width;
  }
}
