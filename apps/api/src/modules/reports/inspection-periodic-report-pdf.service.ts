import { Injectable } from '@nestjs/common';
import {
  InspectionFindingSeverity,
  type InspectionPeriodicReportCompanyRowResponse,
  type InspectionPeriodicReportDistributionRowResponse,
  type InspectionPeriodicReportInspectionRowResponse,
  type InspectionPeriodicReportResponse,
} from '@aurelia/contracts';
import { ReportPdfBrandingService, type PeriodicReportHeaderContext } from './report-pdf-branding.service';
import { ReportPdfService, type ReportPdfDocument } from './report-pdf.service';

const NAVY = '#001E39';
const GOLD = '#C8A064';
const BORDER = '#D1D1D1';
const MUTED = '#646464';
const TEXT = '#131313';
const LIGHT = '#F7F7F7';
const BLUE_BG = '#F6FAFF';
const BLUE_BORDER = '#C8DCFF';
const BLUE_TEXT = '#24588B';
const YELLOW_BG = '#FFEAB8';
const YELLOW_BORDER = '#E8C86A';
const YELLOW_TEXT = '#463100';
const TEAL_BG = '#C5FFF6';
const TEAL_BORDER = '#80DDD0';
const TEAL_TEXT = '#006153';
const GREEN_BG = '#E0FFD3';
const GREEN_BORDER = '#A8DFA0';
const GREEN_TEXT = '#2A5C16';
const PINK_BG = '#FFD0DB';
const PINK_BORDER = '#E090A8';
const PINK_TEXT = '#570B1D';
const RED_BG = '#FFEBEE';
const RED = '#F44336';
const RED_DARK = '#B71C1C';
const ORANGE = '#FF9800';
const AMBER = '#FFC107';

interface SummaryCard {
  title: string;
  value: string;
  detail: string;
  background: string;
  border: string;
  color: string;
}

interface StatusPalette {
  background: string;
  color: string;
  border: string;
}

@Injectable()
export class InspectionPeriodicReportPdfService {
  constructor(
    private readonly pdf: ReportPdfService,
    private readonly branding: ReportPdfBrandingService,
  ) {}

  async render(report: InspectionPeriodicReportResponse): Promise<{ filename: string; buffer: Buffer }> {
    const header = this.buildHeaderContext(report);
    const buffer = await this.pdf.render(async (document) => {
      this.branding.addPage(document);
      this.drawSummaryPage(document, report, header);
      this.branding.addPage(document);
      this.drawInspectionListPage(document, report, header);
      this.branding.addPage(document);
      this.drawAttentionPage(document, report, header);
      this.branding.drawFooters(document, report.metadata.generatedAt);
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

  private drawSummaryPage(
    document: ReportPdfDocument,
    report: InspectionPeriodicReportResponse,
    header: PeriodicReportHeaderContext,
  ): void {
    this.branding.drawCoverHeader(document, header);
    this.drawMetadataBand(document, report);
    this.branding.drawSectionTitle(document, 'Resumen ejecutivo del período');
    this.drawSummaryCards(document, report);
    document.y += 18;
    this.branding.drawSectionTitle(document, 'Distribución del período');
    this.drawDistributionCards(document, report);
    document.y += 17;
    this.branding.drawSectionTitle(document, 'Estado de observaciones del período');
    this.drawObservationStatus(document, report);
  }

  private drawMetadataBand(document: ReportPdfDocument, report: InspectionPeriodicReportResponse): void {
    const y = document.y;
    const height = 37.5;
    const width = this.branding.contentWidth / 4;
    const cells = [
      ['PERÍODO', this.formatPeriodRange(report)],
      ['GENERADO POR', report.metadata.generatedBy || 'Usuario Aurelia'],
      ['FECHA DE EMISIÓN', this.branding.formatDate(report.metadata.generatedAt)],
      ['CLASIFICACIÓN', 'Uso interno'],
    ];

    document.roundedRect(this.branding.marginX, y, this.branding.contentWidth, height, 4.5).fillAndStroke(LIGHT, BORDER);
    cells.forEach(([label, value], index) => {
      const x = this.branding.marginX + width * index;
      if (index > 0) {
        document.moveTo(x, y).lineTo(x, y + height).strokeColor(BORDER).lineWidth(0.5).stroke();
      }
      document
        .font('Helvetica-Bold')
        .fontSize(6.25)
        .fillColor(MUTED)
        .text(label, x + 10.5, y + 8, {
          width: width - 21,
          characterSpacing: 0.38,
        });
      document
        .font('Helvetica-Bold')
        .fontSize(8.25)
        .fillColor(TEXT)
        .text(value, x + 10.5, y + 19, {
          width: width - 21,
          height: 15,
          ellipsis: true,
        });
    });
    document.y = y + height + 21;
  }

  private drawSummaryCards(document: ReportPdfDocument, report: InspectionPeriodicReportResponse): void {
    const monthlyDetail = report.inspectionsByMonth
      .slice(0, 3)
      .map((row) => `${row.label}: ${row.count}`)
      .join(' · ');
    const summary = report.summary;
    const cards: SummaryCard[] = [
      {
        title: 'TOTAL INSPECCIONES',
        value: String(summary.totalInspections),
        detail: monthlyDetail || 'Sin inspecciones en el período',
        background: BLUE_BG,
        border: BLUE_BORDER,
        color: NAVY,
      },
      {
        title: 'INSPECCIONES ABIERTAS',
        value: String(summary.openInspections),
        detail: `${this.percent(summary.openInspections, summary.totalInspections)} del total del período`,
        background: YELLOW_BG,
        border: YELLOW_BORDER,
        color: YELLOW_TEXT,
      },
      {
        title: 'OBS. PEND. APROBACIÓN',
        value: String(summary.pendingApprovalFindings),
        detail: 'Ejecutadas · esperando Admin GF',
        background: TEAL_BG,
        border: TEAL_BORDER,
        color: TEAL_TEXT,
      },
      {
        title: 'OBS. TOTALES CERRADAS',
        value: String(summary.closedFindings),
        detail: `${this.percent(summary.closedFindings, summary.totalFindings)} del total de observaciones`,
        background: GREEN_BG,
        border: GREEN_BORDER,
        color: GREEN_TEXT,
      },
    ];

    const y = document.y;
    const width = 120;
    const gap = (this.branding.contentWidth - width * cards.length) / (cards.length - 1);
    cards.forEach((card, index) => this.drawSummaryCard(
      document,
      this.branding.marginX + index * (width + gap),
      y,
      width,
      87.75,
      card,
    ));
    document.y = y + 87.75;
  }

  private drawSummaryCard(
    document: ReportPdfDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    card: SummaryCard,
  ): void {
    document.roundedRect(x, y, width, height, 6).fillAndStroke(card.background, card.border);
    document.circle(x + 13.5, y + 18, 2.6).strokeColor(card.color).lineWidth(1).stroke();
    document
      .font('Helvetica-Bold')
      .fontSize(6.25)
      .fillColor(card.color)
      .text(card.title, x + 21, y + 12.5, {
        width: width - 31,
        height: 19,
        characterSpacing: 0.35,
      });
    document
      .font('Helvetica-Bold')
      .fontSize(21)
      .fillColor(card.color)
      .text(card.value, x + 12, y + 32, { width: width - 24 });
    document
      .font('Helvetica')
      .fontSize(6.7)
      .fillColor(MUTED)
      .text(card.detail, x + 12, y + 61, {
        width: width - 24,
        height: 19,
        lineGap: 0.5,
        ellipsis: true,
      });
  }

  private drawDistributionCards(document: ReportPdfDocument, report: InspectionPeriodicReportResponse): void {
    const y = document.y;
    const gap = 10.5;
    const width = (this.branding.contentWidth - gap * 2) / 3;
    const height = 121;
    this.drawChartCard(document, this.branding.marginX, y, width, height, 'INSPECCIONES POR MES', (x, chartY, chartWidth) => {
      this.drawMonthlyBars(document, x, chartY, chartWidth, report.inspectionsByMonth);
    });
    this.drawChartCard(document, this.branding.marginX + width + gap, y, width, height, 'POR TIPO DE INSPECCIÓN', (x, chartY, chartWidth) => {
      this.drawTypeDonut(document, x, chartY, chartWidth, report.inspectionsByType);
    });
    this.drawChartCard(document, this.branding.marginX + (width + gap) * 2, y, width, height, 'POR ÁREA OPERATIVA', (x, chartY, chartWidth) => {
      this.drawAreaBars(document, x, chartY, chartWidth, report.inspectionsByArea);
    });
    document.y = y + height;
  }

  private drawChartCard(
    document: ReportPdfDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    draw: (chartX: number, chartY: number, chartWidth: number) => void,
  ): void {
    document.roundedRect(x, y, width, height, 6).fillAndStroke(LIGHT, BORDER);
    document
      .font('Helvetica-Bold')
      .fontSize(6.8)
      .fillColor(MUTED)
      .text(title, x + 11, y + 11, {
        width: width - 22,
        characterSpacing: 0.32,
      });
    draw(x + 11, y + 31, width - 22);
  }

  private drawMonthlyBars(
    document: ReportPdfDocument,
    x: number,
    y: number,
    width: number,
    rows: InspectionPeriodicReportDistributionRowResponse[],
  ): void {
    const visible = rows.slice(0, 12);
    const max = Math.max(1, ...visible.map((row) => row.count));
    const gap = visible.length > 6 ? 2.5 : 7;
    const barWidth = Math.max(4, (width - gap * Math.max(0, visible.length - 1)) / Math.max(1, visible.length));
    const chartHeight = 49;
    const colors = [GOLD, NAVY, '#00B398', BLUE_TEXT, ORANGE, GREEN_TEXT];

    visible.forEach((row, index) => {
      const barHeight = Math.max(2, (row.count / max) * chartHeight);
      const barX = x + index * (barWidth + gap);
      const barY = y + chartHeight - barHeight + 10;
      document.roundedRect(barX, barY, barWidth, barHeight, 1.5).fill(colors[index % colors.length]);
      document
        .font('Helvetica-Bold')
        .fontSize(5.8)
        .fillColor(TEXT)
        .text(String(row.count), barX - 2, barY - 8, { width: barWidth + 4, align: 'center' });
      document
        .font('Helvetica')
        .fontSize(4.8)
        .fillColor(MUTED)
        .text(row.label.slice(0, 3), barX - 3, y + chartHeight + 13, {
          width: barWidth + 6,
          align: 'center',
        });
    });

    if (visible.length === 0) this.drawEmptyChart(document, x, y + 27, width);
  }

  private drawTypeDonut(
    document: ReportPdfDocument,
    x: number,
    y: number,
    width: number,
    rows: InspectionPeriodicReportDistributionRowResponse[],
  ): void {
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    const first = rows[0];
    const second = rows[1];
    const centerX = x + 43;
    const centerY = y + 39;
    const radius = 24;
    document.circle(centerX, centerY, radius).lineWidth(7).strokeColor(BORDER).stroke();

    if (total > 0 && first) {
      const endAngle = -90 + (first.count / total) * 360;
      document
        .path(this.arcPath(centerX, centerY, radius, -90, endAngle))
        .lineWidth(7)
        .lineCap('butt')
        .strokeColor(NAVY)
        .stroke();
      if (second) {
        document
          .path(this.arcPath(centerX, centerY, radius, endAngle, 270))
          .lineWidth(7)
          .lineCap('butt')
          .strokeColor(GOLD)
          .stroke();
      }
      document
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(NAVY)
        .text(`${Math.round((first.count / total) * 100)}%`, centerX - 15, centerY - 4.5, {
          width: 30,
          align: 'center',
        });
    }

    [first, second].filter((row): row is InspectionPeriodicReportDistributionRowResponse => Boolean(row)).forEach((row, index) => {
      const rowY = y + 18 + index * 30;
      document.roundedRect(x + 82, rowY + 1, 6, 6, 1.5).fill(index === 0 ? NAVY : GOLD);
      document
        .font('Helvetica-Bold')
        .fontSize(6.5)
        .fillColor(TEXT)
        .text(row.label, x + 93, rowY, { width: width - 93, height: 10, ellipsis: true });
      document
        .font('Helvetica')
        .fontSize(5.8)
        .fillColor(MUTED)
        .text(`${row.count} insp.`, x + 93, rowY + 10, { width: width - 93 });
    });

    if (rows.length === 0) this.drawEmptyChart(document, x, y + 27, width);
  }

  private drawAreaBars(
    document: ReportPdfDocument,
    x: number,
    y: number,
    width: number,
    rows: InspectionPeriodicReportDistributionRowResponse[],
  ): void {
    const visible = rows.slice(0, 5);
    const max = Math.max(1, ...visible.map((row) => row.count));
    const colors = [NAVY, GOLD, '#00B398', ORANGE, BLUE_TEXT];

    visible.forEach((row, index) => {
      const rowY = y + index * 16;
      document
        .font('Helvetica')
        .fontSize(5.8)
        .fillColor(MUTED)
        .text(row.label, x, rowY, { width: width - 22, height: 8, ellipsis: true });
      document
        .font('Helvetica-Bold')
        .fontSize(5.8)
        .fillColor(TEXT)
        .text(String(row.count), x + width - 20, rowY, { width: 20, align: 'right' });
      document.roundedRect(x, rowY + 8, width, 3.75, 1.5).fill(BORDER);
      document.roundedRect(x, rowY + 8, Math.max(2, (row.count / max) * width), 3.75, 1.5).fill(colors[index]);
    });

    if (visible.length === 0) this.drawEmptyChart(document, x, y + 27, width);
  }

  private drawObservationStatus(document: ReportPdfDocument, report: InspectionPeriodicReportResponse): void {
    const y = document.y;
    const gap = 6;
    const width = (this.branding.contentWidth - gap * 4) / 5;
    const cards = [
      { value: report.summary.totalFindings, label: 'TOTAL OBS.', background: LIGHT, border: BORDER, color: TEXT },
      { value: report.summary.closedFindings, label: 'CERRADAS', background: GREEN_BG, border: GREEN_BORDER, color: GREEN_TEXT },
      { value: report.summary.executedFindings, label: 'EJECUTADAS', background: TEAL_BG, border: TEAL_BORDER, color: TEAL_TEXT },
      { value: report.summary.openFindings, label: 'ABIERTAS', background: YELLOW_BG, border: YELLOW_BORDER, color: YELLOW_TEXT },
      { value: report.summary.overdueFindings, label: 'SLA VENCIDO', background: PINK_BG, border: PINK_BORDER, color: PINK_TEXT },
    ];

    cards.forEach((card, index) => {
      const x = this.branding.marginX + index * (width + gap);
      document.roundedRect(x, y, width, 42.5, 4.5).fillAndStroke(card.background, card.border);
      document
        .font('Helvetica-Bold')
        .fontSize(13.5)
        .fillColor(card.color)
        .text(String(card.value), x, y + 8, { width, align: 'center' });
      document
        .font('Helvetica')
        .fontSize(5.8)
        .fillColor(card.color)
        .text(card.label, x, y + 26.5, { width, align: 'center', characterSpacing: 0.25 });
    });

    const panelY = y + 49;
    document.roundedRect(this.branding.marginX, panelY, this.branding.contentWidth, 46, 4.5).fillAndStroke(LIGHT, BORDER);
    document
      .font('Helvetica-Bold')
      .fontSize(6.5)
      .fillColor(MUTED)
      .text('% Cumplimiento global del período', this.branding.marginX + 10, panelY + 9, { width: 220 });
    document
      .font('Helvetica-Bold')
      .fontSize(6.5)
      .fillColor(GREEN_TEXT)
      .text(`${Math.round(report.summary.complianceRate)}%`, this.branding.marginX + this.branding.contentWidth - 45, panelY + 9, {
        width: 35,
        align: 'right',
      });
    document.roundedRect(this.branding.marginX + 10, panelY + 20, this.branding.contentWidth - 20, 6, 3).fill(BORDER);
    document.roundedRect(
      this.branding.marginX + 10,
      panelY + 20,
      Math.max(0, (this.branding.contentWidth - 20) * Math.min(100, report.summary.complianceRate) / 100),
      6,
      3,
    ).fill(GREEN_TEXT);

    const total = Math.max(1, report.summary.totalFindings);
    const legends = [
      [GREEN_TEXT, `Cerradas ${Math.round((report.summary.closedFindings / total) * 100)}%`],
      ['#00B398', `Ejecutadas ${Math.round((report.summary.executedFindings / total) * 100)}%`],
      [YELLOW_TEXT, `Abiertas ${Math.round((report.summary.openFindings / total) * 100)}%`],
      [PINK_TEXT, `SLA vencido ${Math.round((report.summary.overdueFindings / total) * 100)}%`],
    ];
    let legendX = this.branding.marginX + 10;
    legends.forEach(([color, label]) => {
      document.roundedRect(legendX, panelY + 33, 5, 5, 1).fill(color);
      document.font('Helvetica').fontSize(5.5).fillColor(MUTED);
      const labelWidth = document.widthOfString(label);
      document.text(label, legendX + 8, panelY + 32.5, { width: labelWidth + 2 });
      legendX += labelWidth + 20;
    });
    document.y = panelY + 46;
  }

  private drawInspectionListPage(
    document: ReportPdfDocument,
    report: InspectionPeriodicReportResponse,
    header: PeriodicReportHeaderContext,
  ): void {
    this.branding.drawCompactHeader(document, header);
    const sample = this.selectRepresentativeRows(report.inspections.rows, 15);
    this.branding.drawSectionTitle(document, 'Listado de inspecciones del período', {
      text: `${report.inspections.total} inspecciones · mostrando muestra representativa`,
    });
    this.drawInspectionTable(document, sample);
    this.drawSampleNote(document, report.inspections.total, sample.length);
  }

  private drawInspectionTable(
    document: ReportPdfDocument,
    rows: InspectionPeriodicReportInspectionRowResponse[],
  ): void {
    const x = this.branding.marginX;
    const y = document.y;
    const widths = [36, 40, 57, 59, 55, 57, 85, 33, 41, 48];
    const headers = ['N°', 'FECHA', 'INSPECTOR', 'ÁREA ·\nSECTOR', 'EMPRESA', 'TIPO', 'URGENCIA MÁXIMA', 'N°\nOBS.', '%\nCIERRE', 'ESTADO'];
    const headerHeight = 28;
    const rowHeight = 31.5;

    document.roundedRect(x, y, this.branding.contentWidth, headerHeight + rows.length * rowHeight, 4.5).strokeColor(BORDER).lineWidth(0.6).stroke();
    document.rect(x, y, this.branding.contentWidth, headerHeight).fill(NAVY);
    let cursorX = x;
    headers.forEach((header, index) => {
      if (index > 0) document.moveTo(cursorX, y).lineTo(cursorX, y + headerHeight).strokeColor('#17344F').lineWidth(0.4).stroke();
      document
        .font('Helvetica-Bold')
        .fontSize(5.7)
        .fillColor('#FFFFFF')
        .opacity(0.78)
        .text(header, cursorX + 5, y + (header.includes('\n') ? 7 : 10), {
          width: widths[index] - 10,
          align: index === 7 || index === 8 ? 'center' : 'left',
          characterSpacing: 0.2,
          lineGap: 0.3,
        });
      document.opacity(1);
      cursorX += widths[index];
    });

    rows.forEach((row, rowIndex) => {
      const rowY = y + headerHeight + rowIndex * rowHeight;
      const urgent = row.effectiveStatus === 'open' && (
        row.overdueObservations > 0
        || row.maxSeverity === InspectionFindingSeverity.CRITICAL
        || row.maxSeverity === InspectionFindingSeverity.HIGH
      );
      document.rect(x, rowY, this.branding.contentWidth, rowHeight).fill(urgent ? '#FFF8F9' : rowIndex % 2 === 1 ? LIGHT : '#FFFFFF');
      document.moveTo(x, rowY).lineTo(x + this.branding.contentWidth, rowY).strokeColor(BORDER).lineWidth(0.4).stroke();
      this.drawInspectionTableRow(document, x, rowY, widths, row);
    });

    document.y = y + headerHeight + rows.length * rowHeight;
  }

  private drawInspectionTableRow(
    document: ReportPdfDocument,
    x: number,
    y: number,
    widths: number[],
    row: InspectionPeriodicReportInspectionRowResponse,
  ): void {
    const cells = [
      `#${row.inspectionNumber}`,
      this.shortDate(row.date),
      this.compactName(row.inspector),
      row.areaSector,
      row.company,
      row.type,
      row.urgencyLabel,
      this.observationsLabel(row),
      '',
      row.effectiveStatus === 'closed' ? 'Cerrada' : 'Abierta',
    ];
    let cursorX = x;
    cells.forEach((value, index) => {
      if (index > 0) document.moveTo(cursorX, y).lineTo(cursorX, y + 31.5).strokeColor(BORDER).lineWidth(0.35).stroke();
      const cellWidth = widths[index];
      if (index === 5 || index === 6 || index === 9) {
        const palette = index === 5 ? this.typePalette(value) : index === 6 ? this.urgencyPalette(row) : this.statusPalette(row);
        this.drawCompactChip(document, cursorX + 5, y + 10, cellWidth - 10, value, palette);
      } else if (index === 8) {
        this.drawClosureCell(document, cursorX, y, cellWidth, row.closureRate);
      } else {
        document
          .font(index === 0 || index === 2 ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(index === 0 ? 6.8 : 6.25)
          .fillColor(index === 0 ? BLUE_TEXT : TEXT)
          .text(value, cursorX + 5, y + 7, {
            width: cellWidth - 10,
            height: 19,
            align: index === 7 ? 'center' : 'left',
            lineGap: 0.2,
            ellipsis: true,
          });
      }
      cursorX += cellWidth;
    });
  }

  private drawCompactChip(
    document: ReportPdfDocument,
    x: number,
    y: number,
    maxWidth: number,
    label: string,
    palette: StatusPalette,
  ): void {
    document.font('Helvetica-Bold').fontSize(5.25);
    const width = Math.min(maxWidth, Math.max(22, document.widthOfString(label) + 8));
    document.roundedRect(x, y, width, 11.5, 3.5).fill(palette.background);
    document.fillColor(palette.color).text(label, x + 4, y + 3, {
      width: width - 8,
      height: 7,
      ellipsis: true,
    });
  }

  private drawClosureCell(
    document: ReportPdfDocument,
    x: number,
    y: number,
    width: number,
    rate: number,
  ): void {
    const palette = rate >= 80 ? GREEN_TEXT : rate > 0 ? YELLOW_TEXT : PINK_TEXT;
    document.roundedRect(x + 5, y + 14, 13, 3, 1.5).fill(BORDER);
    document.roundedRect(x + 5, y + 14, Math.max(0.5, 13 * Math.min(100, rate) / 100), 3, 1.5).fill(palette);
    document
      .font('Helvetica-Bold')
      .fontSize(5.3)
      .fillColor(palette)
      .text(`${Math.round(rate)}%`, x + 21, y + 11.5, { width: width - 23, align: 'right' });
  }

  private drawSampleNote(document: ReportPdfDocument, total: number, sampleSize: number): void {
    const y = document.y + 8;
    document.roundedRect(this.branding.marginX, y, this.branding.contentWidth, 28, 4.5).fillAndStroke(LIGHT, BORDER);
    document.circle(this.branding.marginX + 11, y + 10.5, 3.8).fill('#7FA4C7');
    document
      .font('Helvetica-Bold')
      .fontSize(5.5)
      .fillColor('#FFFFFF')
      .text('i', this.branding.marginX + 8.5, y + 7, { width: 5, align: 'center' });
    document
      .font('Helvetica')
      .fontSize(5.8)
      .fillColor(MUTED)
      .text(
        sampleSize < total
          ? `Se muestra una muestra representativa de ${sampleSize} inspecciones. El informe completo contiene las ${total} inspecciones del período. Para el listado completo, exporte el archivo Excel con el mismo filtro aplicado.`
          : `El informe contiene las ${total} inspecciones del período seleccionado.`,
        this.branding.marginX + 19,
        y + 6.5,
        { width: this.branding.contentWidth - 29, height: 17, lineGap: 0.5 },
      );
    document.y = y + 28;
  }

  private drawAttentionPage(
    document: ReportPdfDocument,
    report: InspectionPeriodicReportResponse,
    header: PeriodicReportHeaderContext,
  ): void {
    this.branding.drawCompactHeader(document, header);
    this.drawAttentionBanner(document, report.attention.inspectionsCount);
    document.y += 14;
    const attentionRows = report.attention.rows.slice(0, 5);
    this.branding.drawSectionTitle(document, 'Inspecciones con SLA vencido o criticidad crítica', {
      text: `${report.attention.inspectionsCount} inspecciones · atención inmediata`,
      background: PINK_BG,
      color: PINK_TEXT,
    });
    this.drawAttentionCards(document, attentionRows);
    document.y += 18;
    this.branding.drawSectionTitle(document, 'Empresas con mayor pendiente del período');
    this.drawCompanyTable(document, report.companiesWithMostPending);
  }

  private drawAttentionBanner(document: ReportPdfDocument, count: number): void {
    const y = document.y;
    document.roundedRect(this.branding.marginX, y, this.branding.contentWidth, 40.5, 6).fillAndStroke(RED_BG, RED);
    document.roundedRect(this.branding.marginX + 11, y + 9, 24, 24, 6).fill(RED);
    document
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#FFFFFF')
      .text('!', this.branding.marginX + 11, y + 13.5, { width: 24, align: 'center' });
    document
      .font('Helvetica-Bold')
      .fontSize(8.25)
      .fillColor(RED_DARK)
      .text(`${count} inspecciones requieren atención — SLA vencido o criticidad crítica`, this.branding.marginX + 44, y + 9.5, {
        width: this.branding.contentWidth - 55,
      });
    document
      .font('Helvetica')
      .fontSize(6.8)
      .fillColor('#C62828')
      .text('Estas inspecciones presentan observaciones sin cerrar con plazo vencido o nivel crítico.', this.branding.marginX + 44, y + 23, {
        width: this.branding.contentWidth - 55,
      });
    document.y = y + 40.5;
  }

  private drawAttentionCards(
    document: ReportPdfDocument,
    rows: InspectionPeriodicReportInspectionRowResponse[],
  ): void {
    const x = this.branding.marginX;
    const height = 53.25;
    const gap = 6;
    if (rows.length === 0) {
      document.roundedRect(x, document.y, this.branding.contentWidth, 45, 4.5).fillAndStroke(LIGHT, BORDER);
      document.font('Helvetica').fontSize(7.5).fillColor(MUTED).text('No existen inspecciones que requieran atención inmediata en el período.', x + 12, document.y + 17, {
        width: this.branding.contentWidth - 24,
        align: 'center',
      });
      document.y += 45;
      return;
    }

    rows.forEach((row, index) => {
      const y = document.y + index * (height + gap);
      document.roundedRect(x, y, this.branding.contentWidth, height, 4.5).fillAndStroke('#FFFFFF', BORDER);
      document.rect(x, y, 3, height).fill(this.attentionAccent(row, index));
      const columns = [96, 128, 114, 140];
      let cursor = x + 12;
      this.drawAttentionColumn(document, cursor, y, columns[0], 'INSPECCIÓN', `#${row.inspectionNumber} · ${this.branding.formatDate(row.date ?? '')}`, row.areaSector, BLUE_TEXT);
      cursor += columns[0];
      this.drawAttentionColumn(document, cursor, y, columns[1], 'EMPRESA · INSPECTOR', row.company, this.compactName(row.inspector), TEXT);
      cursor += columns[1];
      this.drawAttentionUrgencyColumn(document, cursor, y, columns[2], row);
      cursor += columns[2];
      this.drawAttentionColumn(document, cursor, y, columns[3], 'DÍAS ABIERTA · % CIERRE', `${row.daysOpen} días`, `${Math.round(row.closureRate)}% cerrado · ${row.overdueObservations > 0 ? 'SLA vencido' : 'criticidad alta'}`, row.overdueObservations > 0 ? RED_DARK : YELLOW_TEXT);
    });
    document.y += rows.length * height + Math.max(0, rows.length - 1) * gap;
  }

  private drawAttentionColumn(
    document: ReportPdfDocument,
    x: number,
    y: number,
    width: number,
    label: string,
    primary: string,
    secondary: string,
    primaryColor: string,
  ): void {
    document.font('Helvetica-Bold').fontSize(5.5).fillColor(MUTED).text(label, x, y + 11, {
      width: width - 8,
      characterSpacing: 0.28,
    });
    document.font('Helvetica-Bold').fontSize(7.1).fillColor(primaryColor).text(primary, x, y + 22, {
      width: width - 8,
      height: 9,
      ellipsis: true,
    });
    document.font('Helvetica').fontSize(5.8).fillColor(MUTED).text(secondary, x, y + 34, {
      width: width - 8,
      height: 10,
      ellipsis: true,
    });
  }

  private drawAttentionUrgencyColumn(
    document: ReportPdfDocument,
    x: number,
    y: number,
    width: number,
    row: InspectionPeriodicReportInspectionRowResponse,
  ): void {
    document.font('Helvetica-Bold').fontSize(5.5).fillColor(MUTED).text('URGENCIA · ESTADO OBS.', x, y + 11, {
      width: width - 8,
      characterSpacing: 0.28,
    });
    this.drawCompactChip(document, x, y + 22, width - 8, row.urgencyLabel, this.urgencyPalette(row));
    document.font('Helvetica').fontSize(5.8).fillColor(MUTED).text(this.observationsLabel(row).replace(/\n/g, ' '), x, y + 37, {
      width: width - 8,
      height: 9,
      ellipsis: true,
    });
  }

  private drawCompanyTable(document: ReportPdfDocument, rows: InspectionPeriodicReportCompanyRowResponse[]): void {
    const x = this.branding.marginX;
    const y = document.y;
    const widths = [80, 89, 80, 90, 78, 94];
    const headers = ['EMPRESA', 'N° INSP. PERÍODO', 'INSP. ABIERTAS', 'OBS. PENDIENTES', 'SLA VENCIDOS', '% CUMPLIMIENTO'];
    const headerHeight = 20.25;
    const rowHeight = 22;
    document.roundedRect(x, y, this.branding.contentWidth, headerHeight + rows.length * rowHeight, 4.5).strokeColor(BORDER).lineWidth(0.5).stroke();
    document.rect(x, y, this.branding.contentWidth, headerHeight).fill(NAVY);
    let cursorX = x;
    headers.forEach((header, index) => {
      document.font('Helvetica-Bold').fontSize(5.3).fillColor('#FFFFFF').opacity(0.78).text(header, cursorX + 5, y + 7, {
        width: widths[index] - 10,
        align: index === 0 ? 'left' : 'center',
        characterSpacing: 0.18,
      });
      document.opacity(1);
      cursorX += widths[index];
    });

    rows.forEach((row, index) => {
      const rowY = y + headerHeight + index * rowHeight;
      document.rect(x, rowY, this.branding.contentWidth, rowHeight).fill(index % 2 === 1 ? LIGHT : '#FFFFFF');
      document.moveTo(x, rowY).lineTo(x + this.branding.contentWidth, rowY).strokeColor(BORDER).lineWidth(0.35).stroke();
      const values = [row.company, row.inspectionsInPeriod, row.openInspections, row.pendingFindings, row.overdueFindings];
      let cellX = x;
      values.forEach((value, cellIndex) => {
        if (cellIndex > 0) document.moveTo(cellX, rowY).lineTo(cellX, rowY + rowHeight).strokeColor(BORDER).lineWidth(0.3).stroke();
        if (cellIndex === 4) {
          const background = Number(value) > 0 ? PINK_BG : GREEN_BG;
          const color = Number(value) > 0 ? PINK_TEXT : GREEN_TEXT;
          this.drawCompactChip(document, cellX + widths[cellIndex] / 2 - 12, rowY + 5.5, 24, String(value), {
            background,
            color,
            border: background,
          });
        } else {
          document
            .font(cellIndex === 0 ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(6.5)
            .fillColor(TEXT)
            .text(String(value), cellX + 5, rowY + 7, {
              width: widths[cellIndex] - 10,
              align: cellIndex === 0 ? 'left' : 'center',
              height: 9,
              ellipsis: true,
            });
        }
        cellX += widths[cellIndex];
      });
      this.drawCompanyCompliance(document, cellX, rowY, widths[5], row.complianceRate);
    });
    document.y = y + headerHeight + rows.length * rowHeight;
  }

  private drawCompanyCompliance(
    document: ReportPdfDocument,
    x: number,
    y: number,
    width: number,
    rate: number,
  ): void {
    const color = rate >= 80 ? GREEN_TEXT : YELLOW_TEXT;
    document.roundedRect(x + 7, y + 9.5, 50, 3, 1.5).fill(BORDER);
    document.roundedRect(x + 7, y + 9.5, 50 * Math.min(100, rate) / 100, 3, 1.5).fill(color);
    document.font('Helvetica-Bold').fontSize(5.8).fillColor(color).text(`${Math.round(rate)}%`, x + 62, y + 7, {
      width: width - 67,
      align: 'right',
    });
  }

  private selectRepresentativeRows(
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

  private buildHeaderContext(report: InspectionPeriodicReportResponse): PeriodicReportHeaderContext {
    const months = report.inspectionsByMonth.map((row) => row.label);
    const monthLabel = months.length > 0
      ? months.map((month) => month.charAt(0).toUpperCase() + month.slice(1)).join(' · ')
      : this.formatPeriodRange(report);
    return {
      periodTitle: report.metadata.periodLabel,
      periodSubtitle: `${monthLabel} ${report.metadata.year} · SGA · Sistema de Gestión Ambiental`,
      generatedBy: report.metadata.generatedBy || 'Usuario Aurelia',
      generatedAt: report.metadata.generatedAt,
    };
  }

  private formatPeriodRange(report: InspectionPeriodicReportResponse): string {
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

  private shortDate(value: string | null): string {
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

  private compactName(value: string): string {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length <= 1) return value;
    return `${parts[0]} ${parts.slice(1).map((part) => `${part.charAt(0)}.`).join(' ')}`;
  }

  private observationsLabel(row: InspectionPeriodicReportInspectionRowResponse): string {
    if (row.observationsCount === 0) return '0';
    if (row.closedObservations === row.observationsCount) return `${row.closedObservations} / ${row.observationsCount}\ncer.`;
    const parts: string[] = [];
    if (row.executedObservations > 0) parts.push(`${row.executedObservations} ej.`);
    if (row.openObservations > 0) parts.push(`${row.openObservations} ab.`);
    if (row.overdueObservations > 0) parts.push(`${row.overdueObservations} ven.`);
    if (row.closedObservations > 0) parts.unshift(`${row.closedObservations} cer.`);
    return parts.join(' ·\n');
  }

  private urgencyPalette(row: InspectionPeriodicReportInspectionRowResponse): StatusPalette {
    if (row.effectiveStatus === 'closed') return { background: GREEN_BG, color: GREEN_TEXT, border: GREEN_BORDER };
    if (row.maxSeverity === InspectionFindingSeverity.CRITICAL || row.maxSeverity === InspectionFindingSeverity.HIGH) {
      return { background: PINK_BG, color: PINK_TEXT, border: PINK_BORDER };
    }
    if (row.executedObservations > 0) return { background: TEAL_BG, color: TEAL_TEXT, border: TEAL_BORDER };
    return { background: YELLOW_BG, color: YELLOW_TEXT, border: YELLOW_BORDER };
  }

  private typePalette(label: string): StatusPalette {
    return label.toLowerCase().includes('check')
      ? { background: TEAL_BG, color: TEAL_TEXT, border: TEAL_BORDER }
      : { background: '#E6F3FF', color: '#0D3862', border: BLUE_BORDER };
  }

  private statusPalette(row: InspectionPeriodicReportInspectionRowResponse): StatusPalette {
    return row.effectiveStatus === 'closed'
      ? { background: GREEN_BG, color: GREEN_TEXT, border: GREEN_BORDER }
      : { background: YELLOW_BG, color: YELLOW_TEXT, border: YELLOW_BORDER };
  }

  private attentionAccent(row: InspectionPeriodicReportInspectionRowResponse, index: number): string {
    if (row.maxSeverity === InspectionFindingSeverity.CRITICAL) return RED_DARK;
    if (row.maxSeverity === InspectionFindingSeverity.HIGH) return RED;
    if (row.overdueObservations > 0) return index < 2 ? ORANGE : AMBER;
    return GOLD;
  }

  private drawEmptyChart(document: ReportPdfDocument, x: number, y: number, width: number): void {
    document.font('Helvetica').fontSize(6.5).fillColor(MUTED).text('Sin datos', x, y, { width, align: 'center' });
  }

  private percent(value: number, total: number): string {
    return `${total > 0 ? Math.round((value / total) * 100) : 0}%`;
  }

  private arcPath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
    const start = this.polar(cx, cy, radius, startAngle);
    const end = this.polar(cx, cy, radius, endAngle);
    const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    const sweep = endAngle >= startAngle ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
  }

  private polar(cx: number, cy: number, radius: number, angle: number): { x: number; y: number } {
    const radians = angle * Math.PI / 180;
    return {
      x: cx + radius * Math.cos(radians),
      y: cy + radius * Math.sin(radians),
    };
  }
}
