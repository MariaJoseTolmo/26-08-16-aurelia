import { Injectable } from '@nestjs/common';
import {
  InspectionFindingSeverity,
  type InspectionPeriodicReportCompanyRowResponse,
  type InspectionPeriodicReportInspectionRowResponse,
  type InspectionPeriodicReportResponse,
} from '@aurelia/contracts';
import { InspectionPeriodicReportPdfPageTwoCorrectionService } from './inspection-periodic-report-pdf-page-two-correction.service';
import { ReportPdfBrandingService, type PeriodicReportHeaderContext } from './report-pdf-branding.service';
import { ReportPdfService, type ReportPdfDocument } from './report-pdf.service';

const NAVY = '#001E39';
const BORDER = '#D1D1D1';
const MUTED = '#646464';
const TEXT = '#131313';
const LIGHT = '#F7F7F7';
const BLUE_TEXT = '#24588B';
const RED = '#F44336';
const RED_DARK = '#B71C1C';
const RED_TEXT = '#C62828';
const RED_BG = '#FFEBEE';
const YELLOW_BG = '#FFEAB8';
const YELLOW_TEXT = '#463100';
const TEAL_BG = '#C5FFF6';
const TEAL_TEXT = '#006153';
const GREEN_BG = '#E0FFD3';
const GREEN_TEXT = '#2A5C16';
const PINK_BG = '#FFD0DB';
const PINK_TEXT = '#570B1D';

interface PageThreePalette {
  background: string;
  color: string;
}

type InheritedPageTwoRenderer = {
  buildCorrectedHeaderContext(report: InspectionPeriodicReportResponse): PeriodicReportHeaderContext;
  drawSummaryPage(
    document: ReportPdfDocument,
    report: InspectionPeriodicReportResponse,
    header: PeriodicReportHeaderContext,
  ): void;
  drawCorrectedInspectionListPage(
    document: ReportPdfDocument,
    report: InspectionPeriodicReportResponse,
    header: PeriodicReportHeaderContext,
  ): void;
};

@Injectable()
export class InspectionPeriodicReportPdfPageThreeFidelityService extends InspectionPeriodicReportPdfPageTwoCorrectionService {
  constructor(
    private readonly pageThreePdfRenderer: ReportPdfService,
    private readonly pageThreeBrandingRenderer: ReportPdfBrandingService,
  ) {
    super(pageThreePdfRenderer, pageThreeBrandingRenderer);
  }

  override async render(report: InspectionPeriodicReportResponse): Promise<{ filename: string; buffer: Buffer }> {
    const inherited = this as unknown as InheritedPageTwoRenderer;
    const header = inherited.buildCorrectedHeaderContext(report);
    const buffer = await this.pageThreePdfRenderer.render(async (document) => {
      this.pageThreeBrandingRenderer.addPage(document);
      inherited.drawSummaryPage(document, report, header);
      this.pageThreeBrandingRenderer.addPage(document);
      inherited.drawCorrectedInspectionListPage(document, report, header);
      this.pageThreeBrandingRenderer.addPage(document);
      this.renderPageThree(document, report, header);
      this.pageThreeBrandingRenderer.drawFooters(document, report.metadata.generatedAt);
    }, {
      title: `Informe de inspecciones ${report.metadata.periodLabel}`,
      author: report.metadata.generatedBy,
      subject: 'Informe periódico de inspecciones ambientales',
    });

    const stateSuffix = report.metadata.inspectionState === 'all'
      ? ''
      : `-${report.metadata.inspectionState}`;
    return {
      filename: `informe-inspecciones-${report.metadata.year}-${report.metadata.period}${stateSuffix}.pdf`,
      buffer,
    };
  }

  private renderPageThree(
    document: ReportPdfDocument,
    report: InspectionPeriodicReportResponse,
    header: PeriodicReportHeaderContext,
  ): void {
    this.pageThreeBrandingRenderer.drawCompactHeader(document, header);
    this.renderAttentionBanner(document, report);
    document.y += 14;

    const attentionRows = report.attention.rows.slice(0, 5);
    this.pageThreeBrandingRenderer.drawSectionTitle(document, 'Inspecciones con SLA vencido o criticidad crítica', {
      text: `${report.attention.inspectionsCount} inspecciones · atención inmediata`,
      background: PINK_BG,
      color: PINK_TEXT,
    });
    this.renderAttentionCards(document, attentionRows);

    document.y += 18;
    this.pageThreeBrandingRenderer.drawSectionTitle(document, 'Empresas con mayor pendiente del período');
    this.renderCompanyTable(document, report.companiesWithMostPending.slice(0, 5));
  }

  private renderAttentionBanner(document: ReportPdfDocument, report: InspectionPeriodicReportResponse): void {
    const x = this.pageThreeBrandingRenderer.marginX;
    const y = document.y;
    const width = this.pageThreeBrandingRenderer.contentWidth;
    const height = 46.5;
    const radius = 6;
    const iconSize = 27;
    const iconX = x + 13.125;
    const iconY = y + 10.125;

    document
      .roundedRect(x, y, width, height, radius)
      .lineWidth(1.125)
      .fillAndStroke(RED_BG, RED);
    document.roundedRect(iconX, iconY, iconSize, iconSize, 6).fill(RED);

    const centerX = iconX + iconSize / 2;
    document
      .moveTo(centerX, iconY + 6.2)
      .lineTo(iconX + 20.2, iconY + 20.4)
      .lineTo(iconX + 6.8, iconY + 20.4)
      .closePath()
      .lineWidth(1.35)
      .strokeColor('#FFFFFF')
      .stroke();
    document
      .moveTo(centerX, iconY + 10.2)
      .lineTo(centerX, iconY + 15.1)
      .lineWidth(1.5)
      .strokeColor('#FFFFFF')
      .stroke();
    document.circle(centerX, iconY + 18, 0.95).fill('#FFFFFF');

    const textX = iconX + iconSize + 7.5;
    const textWidth = width - (textX - x) - 13.125;
    document
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(RED_DARK)
      .text(`${report.attention.inspectionsCount} inspecciones requieren atención — SLA vencido o criticidad crítica`, textX, y + 10.5, {
        width: textWidth,
        height: 12,
        ellipsis: true,
      });
    document
      .font('Helvetica')
      .fontSize(8.25)
      .fillColor(RED_TEXT)
      .text(`Estas inspecciones del período ${this.pageThreePeriodLabel(report)} presentan observaciones sin cerrar con plazo vencido o nivel crítico.`, textX, y + 25.5, {
        width: textWidth,
        height: 11,
        ellipsis: true,
      });
    document.y = y + height;
  }

  private renderAttentionCards(
    document: ReportPdfDocument,
    rows: InspectionPeriodicReportInspectionRowResponse[],
  ): void {
    const x = this.pageThreeBrandingRenderer.marginX;
    const height = 53.25;
    const gap = 6;

    if (rows.length === 0) {
      document.roundedRect(x, document.y, this.pageThreeBrandingRenderer.contentWidth, 45, 4.5).fillAndStroke(LIGHT, BORDER);
      document
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(MUTED)
        .text('No existen inspecciones que requieran atención inmediata en el período.', x + 12, document.y + 17, {
          width: this.pageThreeBrandingRenderer.contentWidth - 24,
          align: 'center',
        });
      document.y += 45;
      return;
    }

    rows.forEach((row, index) => {
      const y = document.y + index * (height + gap);
      const radius = 4.5;

      document.save();
      document.roundedRect(x, y, this.pageThreeBrandingRenderer.contentWidth, height, radius).clip();
      document.rect(x, y, this.pageThreeBrandingRenderer.contentWidth, height).fill('#FFFFFF');
      document.rect(x + 0.75, y + 0.75, 3, height - 1.5).fill(this.pageThreeAttentionAccent(row, index));
      document.restore();
      document
        .roundedRect(x, y, this.pageThreeBrandingRenderer.contentWidth, height, radius)
        .lineWidth(0.75)
        .strokeColor(BORDER)
        .stroke();

      this.renderAttentionTextColumn(document, x + 10.5, y, 90, 'INSPECCIÓN', `#${row.inspectionNumber} · ${this.pageThreeBrandingRenderer.formatDate(row.date ?? '')}`, row.areaSector, BLUE_TEXT);
      this.renderAttentionTextColumn(document, x + 106.5, y, 126, 'EMPRESA · INSPECTOR', row.company, this.pageThreeCompactName(row.inspector), TEXT);
      this.renderAttentionUrgencyColumn(document, x + 238.5, y, 126, row);
      this.renderAttentionTextColumn(document, x + 370.5, y, 130, 'DÍAS ABIERTA · % CIERRE', `${row.daysOpen} días`, `${Math.round(row.closureRate)}% cerrado · ${row.overdueObservations > 0 ? 'SLA vencido' : 'criticidad alta'}`, row.overdueObservations > 0 ? RED_DARK : YELLOW_TEXT);
    });

    document.y += rows.length * height + Math.max(0, rows.length - 1) * gap;
  }

  private renderAttentionTextColumn(
    document: ReportPdfDocument,
    x: number,
    y: number,
    width: number,
    label: string,
    primary: string,
    secondary: string,
    primaryColor: string,
  ): void {
    document
      .font('Helvetica-Bold')
      .fontSize(6)
      .fillColor(MUTED)
      .text(label, x, y + 11.5, {
        width,
        height: 8,
        characterSpacing: 0.3,
        ellipsis: true,
      });
    document
      .font('Helvetica-Bold')
      .fontSize(8.25)
      .fillColor(primaryColor)
      .text(primary, x, y + 22, {
        width,
        height: 10,
        ellipsis: true,
      });
    document
      .font('Helvetica')
      .fontSize(6.75)
      .fillColor(MUTED)
      .text(secondary, x, y + 34, {
        width,
        height: 9,
        ellipsis: true,
      });
  }

  private renderAttentionUrgencyColumn(
    document: ReportPdfDocument,
    x: number,
    y: number,
    width: number,
    row: InspectionPeriodicReportInspectionRowResponse,
  ): void {
    document
      .font('Helvetica-Bold')
      .fontSize(6)
      .fillColor(MUTED)
      .text('URGENCIA · ESTADO OBS.', x, y + 7.5, {
        width,
        height: 8,
        characterSpacing: 0.3,
      });

    this.renderPageThreeChip(document, x, y + 22, width, row.urgencyLabel, this.pageThreeUrgencyPalette(row));
    document
      .font('Helvetica')
      .fontSize(6.75)
      .fillColor(MUTED)
      .text(this.pageThreeObservationsLabel(row), x, y + 37, {
        width,
        height: 9,
        ellipsis: true,
      });
  }

  private renderCompanyTable(
    document: ReportPdfDocument,
    rows: InspectionPeriodicReportCompanyRowResponse[],
  ): void {
    const x = this.pageThreeBrandingRenderer.marginX;
    const y = document.y;
    const widths = [81, 89, 81, 90, 78, 92];
    const headers = ['EMPRESA', 'N° INSP. PERÍODO', 'INSP. ABIERTAS', 'OBS. PENDIENTES', 'SLA VENCIDOS', '% CUMPLIMIENTO'];
    const headerHeight = 20.25;
    const rowHeight = 22.125;
    const tableHeight = headerHeight + rows.length * rowHeight;
    const radius = 4.5;

    document.save();
    document.roundedRect(x, y, this.pageThreeBrandingRenderer.contentWidth, tableHeight, radius).clip();
    document.rect(x, y, this.pageThreeBrandingRenderer.contentWidth, headerHeight).fill(NAVY);

    rows.forEach((_, index) => {
      const rowY = y + headerHeight + index * rowHeight;
      document.rect(x, rowY, this.pageThreeBrandingRenderer.contentWidth, rowHeight).fill(index % 2 === 1 ? LIGHT : '#FFFFFF');
    });

    let headerX = x;
    headers.forEach((header, index) => {
      document
        .font('Helvetica-Bold')
        .fontSize(6.75)
        .fillColor('#FFFFFF')
        .opacity(0.75)
        .text(header, headerX + 7.875, y + 6.4, {
          width: widths[index] - 15.75,
          align: index === 0 ? 'left' : 'center',
          characterSpacing: 0.27,
          height: 9,
          ellipsis: true,
        });
      document.opacity(1);
      headerX += widths[index];
    });

    let boundaryX = x;
    widths.slice(0, -1).forEach((width) => {
      boundaryX += width;
      document
        .moveTo(boundaryX, y)
        .lineTo(boundaryX, y + headerHeight)
        .strokeColor('#FFFFFF')
        .opacity(0.1)
        .lineWidth(0.5)
        .stroke();
      document.opacity(1);
      document
        .moveTo(boundaryX, y + headerHeight)
        .lineTo(boundaryX, y + tableHeight)
        .strokeColor(BORDER)
        .lineWidth(0.5)
        .stroke();
    });

    rows.forEach((row, index) => {
      const rowY = y + headerHeight + index * rowHeight;
      if (index > 0) {
        document
          .moveTo(x, rowY)
          .lineTo(x + this.pageThreeBrandingRenderer.contentWidth, rowY)
          .strokeColor(BORDER)
          .lineWidth(0.5)
          .stroke();
      }

      const values = [row.company, row.inspectionsInPeriod, row.openInspections, row.pendingFindings];
      let cellX = x;
      values.forEach((value, cellIndex) => {
        document
          .font(cellIndex === 0 ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(7.875)
          .fillColor(TEXT)
          .text(String(value), cellX + 7.875, rowY + 7.1, {
            width: widths[cellIndex] - 15.75,
            height: 10,
            align: cellIndex === 0 ? 'left' : 'center',
            ellipsis: true,
          });
        cellX += widths[cellIndex];
      });

      this.renderSlaChip(document, cellX, rowY, widths[4], row.overdueFindings);
      cellX += widths[4];
      this.renderCompanyCompliance(document, cellX, rowY, widths[5], row.complianceRate);
    });

    document.restore();
    document
      .roundedRect(x, y, this.pageThreeBrandingRenderer.contentWidth, tableHeight, radius)
      .strokeColor(BORDER)
      .lineWidth(0.75)
      .stroke();
    document.y = y + tableHeight;
  }

  private renderSlaChip(
    document: ReportPdfDocument,
    x: number,
    y: number,
    width: number,
    value: number,
  ): void {
    const palette = value === 0
      ? { background: GREEN_BG, color: GREEN_TEXT }
      : value === 1
        ? { background: PINK_BG, color: PINK_TEXT }
        : { background: YELLOW_BG, color: YELLOW_TEXT };
    const label = String(value);
    const chipHeight = 10.875;
    const horizontalPadding = 10.5;

    document.font('Helvetica-Bold').fontSize(6.75);
    const chipWidth = Math.max(14.5, document.widthOfString(label) + horizontalPadding);
    const chipX = x + (width - chipWidth) / 2;
    const chipY = y + (22.125 - chipHeight) / 2;
    document.roundedRect(chipX, chipY, chipWidth, chipHeight, 3.75).fill(palette.background);
    document
      .fillColor(palette.color)
      .text(label, chipX, chipY + 2.15, {
        width: chipWidth,
        height: 7,
        align: 'center',
        lineBreak: false,
      });
  }

  private renderCompanyCompliance(
    document: ReportPdfDocument,
    x: number,
    y: number,
    width: number,
    rate: number,
  ): void {
    const color = rate >= 80 ? GREEN_TEXT : YELLOW_TEXT;
    const barX = x + 7.875;
    const barY = y + 9.55;
    const barWidth = 56.25;
    document.roundedRect(barX, barY, barWidth, 3, 1.5).fill(BORDER);
    document.roundedRect(barX, barY, barWidth * Math.min(100, rate) / 100, 3, 1.5).fill(color);
    document
      .font('Helvetica-Bold')
      .fontSize(6.75)
      .fillColor(color)
      .text(`${Math.round(rate)}%`, barX + barWidth + 3.75, y + 6.7, {
        width: width - barWidth - 19.5,
        height: 9,
        align: 'right',
      });
  }

  private renderPageThreeChip(
    document: ReportPdfDocument,
    x: number,
    y: number,
    maxWidth: number,
    label: string,
    palette: PageThreePalette,
  ): void {
    let fontSize = 6.75;
    document.font('Helvetica-Bold').fontSize(fontSize);
    while (document.widthOfString(label) + 10.5 > maxWidth && fontSize > 5.25) {
      fontSize -= 0.25;
      document.fontSize(fontSize);
    }

    const chipHeight = 10.875;
    const horizontalPadding = 10.5;
    const chipWidth = Math.min(maxWidth, document.widthOfString(label) + horizontalPadding);
    document.roundedRect(x, y, chipWidth, chipHeight, 3.75).fill(palette.background);
    document
      .fillColor(palette.color)
      .text(label, x + horizontalPadding / 2, y + 2.15, {
        width: chipWidth - horizontalPadding,
        height: 7,
        lineBreak: false,
      });
  }

  private pageThreeUrgencyPalette(row: InspectionPeriodicReportInspectionRowResponse): PageThreePalette {
    if (row.effectiveStatus === 'closed') return { background: GREEN_BG, color: GREEN_TEXT };
    if (row.maxSeverity === InspectionFindingSeverity.CRITICAL || row.maxSeverity === InspectionFindingSeverity.HIGH) {
      return { background: PINK_BG, color: PINK_TEXT };
    }
    if (row.executedObservations > 0) return { background: TEAL_BG, color: TEAL_TEXT };
    return { background: YELLOW_BG, color: YELLOW_TEXT };
  }

  private pageThreeAttentionAccent(row: InspectionPeriodicReportInspectionRowResponse, index: number): string {
    if (row.overdueObservations > 0 && row.maxSeverity === InspectionFindingSeverity.CRITICAL) return RED_DARK;
    if (row.overdueObservations > 0) return RED;
    return index < 2 ? '#FF8F00' : '#FFB300';
  }

  private pageThreeObservationsLabel(row: InspectionPeriodicReportInspectionRowResponse): string {
    const parts: string[] = [];
    if (row.executedObservations > 0) parts.push(`${row.executedObservations} ej.`);
    if (row.openObservations > 0) parts.push(`${row.openObservations} abiertas`);
    if (row.overdueObservations > 0 && row.openObservations === 0) parts.push(`${row.overdueObservations} vencidas`);
    if (row.closedObservations > 0) parts.push(`${row.closedObservations} cerradas`);
    return parts.length > 0 ? parts.join(' · ') : 'Sin observaciones pendientes';
  }

  private pageThreeCompactName(value: string): string {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length <= 1) return value;
    return `${parts[0]} ${parts.slice(1).map((part) => `${part.charAt(0)}.`).join(' ')}`;
  }

  private pageThreePeriodLabel(report: InspectionPeriodicReportResponse): string {
    const period = report.metadata.period.toLowerCase();
    if (/^q[1-4]$/.test(period)) return `T${period.slice(1)}`;
    if (period === 'year') return `año ${report.metadata.year}`;
    return report.metadata.periodLabel;
  }
}
