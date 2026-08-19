import { Injectable } from '@nestjs/common';
import { FilesService } from '../files/files.service';
import { InspectionDetailReportPdfTranslatedService } from './inspection-detail-report-pdf-translated.service';
import { ReportPdfService, type ReportPdfDocument } from './report-pdf.service';
import { ReportTranslationService } from './report-translation.service';

type ReportContext = {
  inspectionNumber: string;
  generatedAt: string;
  inspectionDate: string;
};

type TimelineEvent = {
  date: string;
  title: string;
  detail: string;
  summary: string;
  color: string;
  ongoing?: boolean;
  last?: boolean;
};

type LayoutRuntime = {
  formatDate: (value: string) => string;
  formatDateTime: (value: string) => string;
  drawPixelTimelineEvent: (
    document: ReportPdfDocument,
    event: TimelineEvent,
    height: number,
    runtime: LayoutRuntime,
  ) => void;
  drawFooters: (
    document: ReportPdfDocument,
    context: ReportContext,
    runtime: LayoutRuntime,
  ) => void;
};

const PAGE_HEIGHT = 841.89;
const MARGIN_X = 42;
const CONTENT_WIDTH = 595.28 - MARGIN_X * 2;
const FOOTER_LINE_Y = 780;
const FOOTER_TEXT_Y = 793.5;
const NAVY = '#001E39';
const GOLD = '#C8A064';
const BORDER = '#D1D1D1';
const MUTED = '#646464';
const TEXT = '#131313';
const LIGHT = '#F7F7F7';
const YELLOW_BG = '#FFEAB8';
const BODY_FONT_SIZE = 8.25;
const BODY_LINE_GAP = 2.2;
const SECONDARY_FONT_SIZE = 7.5;
const SECONDARY_LINE_GAP = 1.8;

@Injectable()
export class InspectionDetailReportPdfLayoutService extends InspectionDetailReportPdfTranslatedService {
  constructor(
    pdf: ReportPdfService,
    files: FilesService,
    reportTranslation: ReportTranslationService,
  ) {
    super(pdf, files, reportTranslation);

    const runtime = this as unknown as LayoutRuntime;
    runtime.drawPixelTimelineEvent = (document, event, _height, activeRuntime) =>
      this.drawAlignedTimelineEvent(document, event, activeRuntime);
    runtime.drawFooters = (document, context, activeRuntime) =>
      this.drawSafeFooters(document, context, activeRuntime);
  }

  private drawAlignedTimelineEvent(
    document: ReportPdfDocument,
    event: TimelineEvent,
    runtime: LayoutRuntime,
  ): void {
    const y = document.y;
    const circleX = MARGIN_X + 8;
    const circleY = y + 8;
    const radius = 8;
    const contentX = MARGIN_X + 30;
    const contentWidth = CONTENT_WIDTH - 30;
    const detailY = y + 18;
    const [spanishDetail, ...englishParts] = event.detail.split('\n');
    const englishDetail = englishParts.join('\n').trim();

    document.font('Helvetica').fontSize(BODY_FONT_SIZE);
    const spanishHeight = document.heightOfString(spanishDetail, {
      width: contentWidth,
      lineGap: BODY_LINE_GAP,
    });
    document.font('Helvetica-Oblique').fontSize(SECONDARY_FONT_SIZE);
    const englishHeight = englishDetail
      ? document.heightOfString(englishDetail, {
          width: contentWidth,
          lineGap: SECONDARY_LINE_GAP,
        })
      : 0;
    const detailHeight = spanishHeight + englishHeight;

    let summaryY = detailY + detailHeight;
    let summaryHeight = 0;
    if (event.summary) {
      summaryY += 4.5;
      document.font('Helvetica').fontSize(7.5);
      const summaryTextHeight = document.heightOfString(event.summary, {
        width: contentWidth - 16,
        lineGap: 0.75,
      });
      summaryHeight = Math.max(24.75, Math.min(36, summaryTextHeight + 13.5));
    }

    const contentBottom = event.summary
      ? summaryY + summaryHeight
      : detailY + detailHeight;
    const eventHeight = Math.max(52, contentBottom - y + 15);

    if (!event.last) {
      document
        .moveTo(circleX, circleY)
        .lineTo(circleX, y + eventHeight + 8)
        .strokeColor(BORDER)
        .lineWidth(0.65)
        .stroke();
    }

    document.circle(circleX, circleY, radius).fill(event.color);
    if (event.ongoing || event.color === GOLD) {
      document
        .moveTo(circleX - 2.8, circleY)
        .lineTo(circleX + 2.8, circleY)
        .strokeColor(NAVY)
        .lineWidth(0.95)
        .stroke();
      document
        .moveTo(circleX + 0.7, circleY - 2.4)
        .lineTo(circleX + 3.2, circleY)
        .lineTo(circleX + 0.7, circleY + 2.4)
        .strokeColor(NAVY)
        .lineWidth(0.95)
        .stroke();
    } else {
      document
        .moveTo(circleX - 2.8, circleY)
        .lineTo(circleX - 0.6, circleY + 2)
        .lineTo(circleX + 3.2, circleY - 2.2)
        .strokeColor('#FFFFFF')
        .lineWidth(0.95)
        .stroke();
    }

    document
      .font('Helvetica-Bold')
      .fontSize(8.25)
      .fillColor(TEXT)
      .text(event.title, contentX, y, { width: 315 });

    const dateLabel = event.ongoing
      ? `${runtime.formatDate(event.date)} · Estado actual / Current status`
      : runtime.formatDateTime(event.date);
    document
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(MUTED)
      .text(dateLabel, MARGIN_X + 345, y + 0.5, {
        width: 166,
        align: 'right',
      });

    document
      .font('Helvetica')
      .fontSize(BODY_FONT_SIZE)
      .fillColor('#333333')
      .text(spanishDetail, contentX, detailY, {
        width: contentWidth,
        lineGap: BODY_LINE_GAP,
      });

    if (englishDetail) {
      document
        .font('Helvetica-Oblique')
        .fontSize(SECONDARY_FONT_SIZE)
        .fillColor(MUTED)
        .text(englishDetail, contentX, detailY + spanishHeight, {
          width: contentWidth,
          lineGap: SECONDARY_LINE_GAP,
        });
    }

    if (event.summary) {
      const borderColor = event.ongoing ? GOLD : BORDER;
      const background = event.ongoing ? YELLOW_BG : LIGHT;
      document
        .roundedRect(contentX, summaryY, contentWidth, summaryHeight, 3)
        .fillAndStroke(background, borderColor);
      if (event.ongoing) {
        document
          .moveTo(contentX + 1, summaryY + 3)
          .lineTo(contentX + 1, summaryY + summaryHeight - 3)
          .strokeColor(GOLD)
          .lineWidth(1.5)
          .stroke();
      }
      document
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(MUTED)
        .text(event.summary, contentX + 8, summaryY + 6.75, {
          width: contentWidth - 16,
          height: summaryHeight - 13.5,
          lineGap: 0.75,
          ellipsis: true,
        });
    }

    document.y = y + eventHeight;
  }

  private drawSafeFooters(
    document: ReportPdfDocument,
    context: ReportContext,
    runtime: LayoutRuntime,
  ): void {
    const range = document.bufferedPageRange();
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
          { width: 238 },
        );
      document
        .font('Helvetica')
        .fontSize(5.6)
        .fillColor(MUTED)
        .text(
          `Generado / Generated: ${runtime.formatDateTime(context.generatedAt)} · Confidencial / Confidential`,
          282,
          FOOTER_TEXT_Y,
          { width: 222, align: 'right' },
        );
      document
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(MUTED)
        .text(`${index - range.start + 1} / ${range.count}`, 516, FOOTER_TEXT_Y - 0.5, {
          width: 37,
          align: 'right',
          height: PAGE_HEIGHT - FOOTER_TEXT_Y,
        });
    }
  }
}
