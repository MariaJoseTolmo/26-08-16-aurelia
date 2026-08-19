import { Injectable } from '@nestjs/common';
import {
  InspectionFindingSeverity,
  type InspectionPeriodicReportInspectionRowResponse,
  type InspectionPeriodicReportResponse,
} from '@aurelia/contracts';
import { InspectionPeriodicReportPdfService } from './inspection-periodic-report-pdf.service';
import { ReportPdfBrandingService, type PeriodicReportHeaderContext } from './report-pdf-branding.service';
import { ReportPdfService, type ReportPdfDocument } from './report-pdf.service';

const NAVY = '#001E39';
const BORDER = '#D1D1D1';
const MUTED = '#646464';
const TEXT = '#131313';
const LIGHT = '#F7F7F7';
const BLUE_TEXT = '#24588B';
const YELLOW_BG = '#FFEAB8';
const YELLOW_TEXT = '#463100';
const TEAL_BG = '#C5FFF6';
const TEAL_TEXT = '#006153';
const GREEN_BG = '#E0FFD3';
const GREEN_TEXT = '#2A5C16';
const PINK_BG = '#FFD0DB';
const PINK_TEXT = '#570B1D';

interface StatusPalette {
  background: string;
  color: string;
}

type InheritedPeriodicRenderer = {
  drawSummaryPage(
    document: ReportPdfDocument,
    report: InspectionPeriodicReportResponse,
    header: PeriodicReportHeaderContext,
  ): void;
  drawAttentionPage(
    document: ReportPdfDocument,
    report: InspectionPeriodicReportResponse,
    header: PeriodicReportHeaderContext,
  ): void;
};

@Injectable()
export class InspectionPeriodicReportPdfPageTwoFidelityService extends InspectionPeriodicReportPdfService {
  constructor(
    private readonly pdfRenderer: ReportPdfService,
    private readonly brandingRenderer: ReportPdfBrandingService,
  ) {
    super(pdfRenderer, brandingRenderer);
  }

  override async render(report: InspectionPeriodicReportResponse): Promise<{ filename: string; buffer: Buffer }> {
    const header = this.buildFidelityHeaderContext(report);
    const inherited = this as unknown as InheritedPeriodicRenderer;
    const buffer = await this.pdfRenderer.render(async (document) => {
      this.brandingRenderer.addPage(document);
      inherited.drawSummaryPage(document, report, header);
      this.brandingRenderer.addPage(document);
      this.drawFidelityInspectionListPage(document, report, header);
      this.brandingRenderer.addPage(document);
      inherited.drawAttentionPage(document, report, header);
      this.brandingRenderer.drawFooters(document, report.metadata.generatedAt);
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

  private drawFidelityInspectionListPage(
    document: ReportPdfDocument,
    report: InspectionPeriodicReportResponse,
    header: PeriodicReportHeaderContext,
  ): void {
    this.brandingRenderer.drawCompactHeader(document, header);
    const sample = this.selectFidelityRows(report.inspections.rows, 15);
    this.brandingRenderer.drawSectionTitle(document, 'Listado de inspecciones del período', {
      text: `${report.inspections.total} inspecciones · mostrando muestra representativa`,
    });
    this.drawFidelityInspectionTable(document, sample);
    this.drawFidelitySampleNote(document, report.inspections.total, sample.length);
  }

  private drawFidelityInspectionTable(
    document: ReportPdfDocument,
    rows: InspectionPeriodicReportInspectionRowResponse[],
  ): void {
    const x = this.brandingRenderer.marginX;
    const y = document.y;
    const widths = [36, 40, 57, 59, 55, 57, 85, 33, 41, 48];
    const headers = ['N°', 'FECHA', 'INSPECTOR', 'ÁREA ·\nSECTOR', 'EMPRESA', 'TIPO', 'URGENCIA MÁXIMA', 'N°\nOBS.', '%\nCIERRE', 'ESTADO'];
    const headerHeight = 28.125;
    const rowHeights = rows.map((row) => this.measureInspectionRowHeight(document, row, widths));
    const tableHeight = headerHeight + rowHeights.reduce((sum, height) => sum + height, 0);
    const radius = 4.5;

    document.save();
    document.roundedRect(x, y, this.brandingRenderer.contentWidth, tableHeight, radius).clip();
    document.rect(x, y, this.brandingRenderer.contentWidth, headerHeight).fill(NAVY);

    let cursorX = x;
    headers.forEach((header, index) => {
      if (index > 0) {
        document
          .moveTo(cursorX, y)
          .lineTo(cursorX, y + headerHeight)
          .strokeColor('#FFFFFF')
          .opacity(0.1)
          .lineWidth(0.5)
          .stroke();
        document.opacity(1);
      }

      const textWidth = widths[index] - 15.75;
      const align: 'left' | 'center' = index === 7 || index === 8 ? 'center' : 'left';
      document
        .font('Helvetica-Bold')
        .fontSize(6.75)
        .fillColor('#FFFFFF')
        .opacity(0.75);
      const textHeight = Math.min(headerHeight, document.heightOfString(header, {
        width: textWidth,
        align,
        characterSpacing: 0.27,
        lineGap: 0.2,
      }));
      const textY = y + Math.max(0, (headerHeight - textHeight) / 2);
      document.text(header, cursorX + 7.875, textY, {
        width: textWidth,
        height: textHeight,
        align,
        characterSpacing: 0.27,
        lineGap: 0.2,
      });
      document.opacity(1);
      cursorX += widths[index];
    });

    let rowY = y + headerHeight;
    rows.forEach((row, rowIndex) => {
      const rowHeight = rowHeights[rowIndex];
      const urgent = row.effectiveStatus === 'open' && (
        row.overdueObservations > 0
        || row.maxSeverity === InspectionFindingSeverity.CRITICAL
        || row.maxSeverity === InspectionFindingSeverity.HIGH
      );
      document
        .rect(x, rowY, this.brandingRenderer.contentWidth, rowHeight)
        .fill(urgent ? '#FFF8F9' : rowIndex % 2 === 1 ? LIGHT : '#FFFFFF');
      document
        .moveTo(x, rowY)
        .lineTo(x + this.brandingRenderer.contentWidth, rowY)
        .strokeColor(BORDER)
        .lineWidth(0.5)
        .stroke();
      this.drawFidelityInspectionTableRow(document, x, rowY, rowHeight, widths, row);
      rowY += rowHeight;
    });
    document.restore();

    document
      .roundedRect(x, y, this.brandingRenderer.contentWidth, tableHeight, radius)
      .strokeColor(BORDER)
      .lineWidth(0.75)
      .stroke();
    document.y = y + tableHeight;
  }

  private drawFidelityInspectionTableRow(
    document: ReportPdfDocument,
    x: number,
    y: number,
    rowHeight: number,
    widths: number[],
    row: InspectionPeriodicReportInspectionRowResponse,
  ): void {
    const cells = [
      `#${row.inspectionNumber}`,
      this.formatFidelityShortDate(row.date),
      this.compactFidelityName(row.inspector),
      row.areaSector,
      row.company,
      row.type,
      row.urgencyLabel,
      this.fidelityObservationsLabel(row),
      '',
      row.effectiveStatus === 'closed' ? 'Cerrada' : 'Abierta',
    ];
    let cursorX = x;

    cells.forEach((value, index) => {
      if (index > 0) {
        document
          .moveTo(cursorX, y)
          .lineTo(cursorX, y + rowHeight)
          .strokeColor(BORDER)
          .lineWidth(0.5)
          .stroke();
      }
      const cellWidth = widths[index];
      if (index === 5 || index === 6 || index === 9) {
        const palette = index === 5
          ? this.fidelityTypePalette(value)
          : index === 6
            ? this.fidelityUrgencyPalette(row)
            : this.fidelityStatusPalette(row);
        const chipHeight = 11.25;
        this.drawFidelityChip(
          document,
          cursorX + 7.875,
          y + (rowHeight - chipHeight) / 2,
          cellWidth - 15.75,
          value,
          palette,
          chipHeight,
        );
      } else if (index === 8) {
        this.drawFidelityClosureCell(document, cursorX, y, rowHeight, cellWidth, row.closureRate);
      } else {
        const font = index === 0 || index === 2 ? 'Helvetica-Bold' : 'Helvetica';
        const color = index === 0 ? BLUE_TEXT : TEXT;
        const fontSize = index === 0 ? 7.875 : 7.5;
        const textWidth = cellWidth - 15.75;
        const align: 'left' | 'center' = index === 7 ? 'center' : 'left';
        document.font(font).fontSize(fontSize).fillColor(color);
        const availableHeight = rowHeight - 6;
        const textHeight = Math.min(availableHeight, document.heightOfString(value, {
          width: textWidth,
          align,
          lineGap: 0.2,
        }));
        const textY = y + Math.max(3, (rowHeight - textHeight) / 2);
        document.text(value, cursorX + 7.875, textY, {
          width: textWidth,
          height: Math.min(availableHeight, textHeight),
          align,
          lineGap: 0.2,
          ellipsis: true,
        });
      }
      cursorX += cellWidth;
    });
  }

  private drawFidelityChip(
    document: ReportPdfDocument,
    x: number,
    y: number,
    maxWidth: number,
    label: string,
    palette: StatusPalette,
    height: number,
  ): void {
    document.font('Helvetica-Bold').fontSize(6.75);
    const horizontalPadding = 10.5;
    const width = Math.min(maxWidth, Math.max(25, document.widthOfString(label) + horizontalPadding));
    const textWidth = width - horizontalPadding;
    const textHeight = Math.min(height, document.heightOfString(label, {
      width: textWidth,
      lineBreak: false,
    }));
    const textY = y + Math.max(0, (height - textHeight) / 2) - 0.2;

    document.roundedRect(x, y, width, height, 3.75).fill(palette.background);
    document
      .fillColor(palette.color)
      .text(label, x + horizontalPadding / 2, textY, {
        width: textWidth,
        height: textHeight,
        ellipsis: true,
        lineBreak: false,
      });
  }

  private drawFidelityClosureCell(
    document: ReportPdfDocument,
    x: number,
    y: number,
    rowHeight: number,
    width: number,
    rate: number,
  ): void {
    const color = rate >= 80 ? GREEN_TEXT : rate > 0 ? YELLOW_TEXT : PINK_TEXT;
    const centerY = y + rowHeight / 2;
    const barWidth = 13;
    document.roundedRect(x + 7.875, centerY - 1.5, barWidth, 3, 1.5).fill(BORDER);
    document
      .roundedRect(x + 7.875, centerY - 1.5, Math.max(0.5, barWidth * Math.min(100, rate) / 100), 3, 1.5)
      .fill(color);

    const label = `${Math.round(rate)}%`;
    const labelWidth = width - 29;
    document.font('Helvetica-Bold').fontSize(6.75).fillColor(color);
    const textHeight = Math.min(rowHeight, document.heightOfString(label, {
      width: labelWidth,
      align: 'right',
    }));
    document.text(label, x + 25, y + Math.max(0, (rowHeight - textHeight) / 2), {
      width: labelWidth,
      height: textHeight,
      align: 'right',
    });
  }

  private drawFidelitySampleNote(document: ReportPdfDocument, total: number, sampleSize: number): void {
    const y = document.y + 7.5;
    const text = sampleSize < total
      ? `Se muestra una muestra representativa de ${sampleSize} inspecciones. El informe completo contiene las ${total} inspecciones del período. Para el listado completo, exporte desde la vista de tabla con el filtro de período aplicado.`
      : `El informe contiene las ${total} inspecciones del período seleccionado.`;
    const iconSize = 8.25;
    const paddingX = 11.25;
    const paddingY = 6.75;
    const gap = 4.5;
    const textX = this.brandingRenderer.marginX + paddingX + iconSize + gap;
    const textWidth = this.brandingRenderer.contentWidth - paddingX * 2 - iconSize - gap;

    document.font('Helvetica').fontSize(7.5);
    const textHeight = document.heightOfString(text, {
      width: textWidth,
      lineGap: 0.25,
    });
    const height = Math.max(24, textHeight + paddingY * 2);

    document
      .roundedRect(this.brandingRenderer.marginX, y, this.brandingRenderer.contentWidth, height, 4.5)
      .fillAndStroke(LIGHT, BORDER);

    document.font('Helvetica-Oblique').fontSize(8.25).fillColor(MUTED);
    const iconTextHeight = Math.min(iconSize, document.heightOfString('i', {
      width: iconSize,
      align: 'center',
    }));
    document.text('i', this.brandingRenderer.marginX + paddingX, y + (height - iconTextHeight) / 2 - 0.25, {
      width: iconSize,
      height: iconTextHeight,
      align: 'center',
    });

    document.font('Helvetica').fontSize(7.5).fillColor(MUTED);
    document.text(text, textX, y + (height - textHeight) / 2, {
      width: textWidth,
      height: textHeight,
      lineGap: 0.25,
    });
    document.y = y + height;
  }

  private measureInspectionRowHeight(
    document: ReportPdfDocument,
    row: InspectionPeriodicReportInspectionRowResponse,
    widths: number[],
  ): number {
    const values = [
      this.formatFidelityShortDate(row.date),
      this.compactFidelityName(row.inspector),
      row.areaSector,
      row.company,
      this.fidelityObservationsLabel(row),
    ];
    const columns = [1, 2, 3, 4, 7];
    const heights = values.map((value, index) => {
      const columnIndex = columns[index];
      document
        .font(columnIndex === 2 ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(7.5);
      return document.heightOfString(value, {
        width: widths[columnIndex] - 15.75,
        lineGap: 0.2,
      });
    });
    const contentHeight = Math.max(11.25, ...heights);
    return Math.min(47.25, Math.max(29.625, contentHeight + 10.5));
  }

  private selectFidelityRows(
    rows: InspectionPeriodicReportInspectionRowResponse[],
    limit: number,
  ): InspectionPeriodicReportInspectionRowResponse[] {
    if (rows.length <= limit) return rows;
    const priority = rows
      .filter((row) => row.effectiveStatus === 'open')
      .sort((left, right) => right.overdueObservations - left.overdueObservations || right.daysOpen - left.daysOpen);
    const selected = new Map(priority.slice(0, Math.min(5, limit)).map((row) => [row.inspectionId, row]));
    const remainingSlots = limit - selected.size;
    if (remainingSlots <= 0) return Array.from(selected.values());
    const available = rows.filter((row) => !selected.has(row.inspectionId));
    const step = available.length / remainingSlots;
    for (let index = 0; index < remainingSlots; index += 1) {
      const row = available[Math.min(available.length - 1, Math.floor(index * step))];
      if (row) selected.set(row.inspectionId, row);
    }
    return Array.from(selected.values()).sort((left, right) => (
      new Date(left.date ?? 0).getTime() - new Date(right.date ?? 0).getTime()
    ));
  }

  private buildFidelityHeaderContext(report: InspectionPeriodicReportResponse): PeriodicReportHeaderContext {
    const months = report.inspectionsByMonth.map((row) => row.label);
    const monthLabel = months.length > 0
      ? months.map((month) => month.charAt(0).toUpperCase() + month.slice(1)).join(' · ')
      : this.formatFidelityPeriodRange(report);
    return {
      periodTitle: report.metadata.periodLabel,
      periodSubtitle: `${monthLabel} ${report.metadata.year} · SGA · Sistema de Gestión Ambiental`,
      compactTitle: this.buildCompactTitle(report),
      generatedBy: report.metadata.generatedBy || 'Usuario Aurelia',
      generatedAt: report.metadata.generatedAt,
    };
  }

  private buildCompactTitle(report: InspectionPeriodicReportResponse): string {
    const period = report.metadata.period.toLowerCase();
    const range = this.formatFidelityPeriodRange(report).replace(` ${report.metadata.year}`, '');
    if (period === 'year') return `Informe Anual · Año ${report.metadata.year}`;
    if (/^q[1-4]$/.test(period)) {
      return `Informe Trimestral · Año ${report.metadata.year} · T${period.slice(1)} · ${range}`;
    }
    if (/^m(?:[1-9]|1[0-2])$/.test(period)) {
      return `Informe Mensual · Año ${report.metadata.year} · ${range}`;
    }
    return `Informe ${report.metadata.periodLabel}`;
  }

  private formatFidelityPeriodRange(report: InspectionPeriodicReportResponse): string {
    const start = new Date(report.metadata.start);
    const endExclusive = new Date(report.metadata.end);
    const end = new Date(endExclusive.getTime() - 86400000);
    const startMonth = new Intl.DateTimeFormat('es-CL', { month: 'long', timeZone: 'UTC' }).format(start);
    const endMonth = new Intl.DateTimeFormat('es-CL', { month: 'long', timeZone: 'UTC' }).format(end);
    const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
    return startMonth === endMonth
      ? `${capitalize(startMonth)} ${report.metadata.year}`
      : `${capitalize(startMonth)} — ${capitalize(endMonth)} ${report.metadata.year}`;
  }

  private formatFidelityShortDate(value: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      timeZone: 'UTC',
    }).format(date).replace(/\//g, '-');
  }

  private compactFidelityName(value: string): string {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length <= 1) return value;
    return `${parts[0]} ${parts.slice(1).map((part) => `${part.charAt(0)}.`).join(' ')}`;
  }

  private fidelityObservationsLabel(row: InspectionPeriodicReportInspectionRowResponse): string {
    if (row.observationsCount === 0) return '0';
    if (row.closedObservations === row.observationsCount) return `${row.closedObservations} / ${row.observationsCount}\ncer.`;
    const parts: string[] = [];
    if (row.executedObservations > 0) parts.push(`${row.executedObservations} ej.`);
    if (row.openObservations > 0) parts.push(`${row.openObservations} ab.`);
    if (row.overdueObservations > 0) parts.push(`${row.overdueObservations} ven.`);
    if (row.closedObservations > 0) parts.unshift(`${row.closedObservations} cer.`);
    return parts.join(' ·\n');
  }

  private fidelityUrgencyPalette(row: InspectionPeriodicReportInspectionRowResponse): StatusPalette {
    if (row.effectiveStatus === 'closed') return { background: GREEN_BG, color: GREEN_TEXT };
    if (row.maxSeverity === InspectionFindingSeverity.CRITICAL || row.maxSeverity === InspectionFindingSeverity.HIGH) {
      return { background: PINK_BG, color: PINK_TEXT };
    }
    if (row.executedObservations > 0) return { background: TEAL_BG, color: TEAL_TEXT };
    return { background: YELLOW_BG, color: YELLOW_TEXT };
  }

  private fidelityTypePalette(label: string): StatusPalette {
    return label.toLowerCase().includes('check')
      ? { background: TEAL_BG, color: TEAL_TEXT }
      : { background: '#E6F3FF', color: '#0D3862' };
  }

  private fidelityStatusPalette(row: InspectionPeriodicReportInspectionRowResponse): StatusPalette {
    return row.effectiveStatus === 'closed'
      ? { background: GREEN_BG, color: GREEN_TEXT }
      : { background: YELLOW_BG, color: YELLOW_TEXT };
  }
}
