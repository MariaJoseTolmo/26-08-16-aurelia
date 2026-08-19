import { Injectable } from '@nestjs/common';
import type { InspectionPeriodicReportCompanyRowResponse, InspectionPeriodicReportInspectionRowResponse, InspectionPeriodicReportResponse } from '@aurelia/contracts';
import { readFileSync } from 'fs';
import { join } from 'path';
import { InspectionPeriodicReportPdfPageThreeFidelityService } from './inspection-periodic-report-pdf-page-three-fidelity.service';
import { ReportPdfBrandingService, type PeriodicReportHeaderContext } from './report-pdf-branding.service';
import { ReportPdfService, type ReportPdfDocument } from './report-pdf.service';

const RED = '#F44336';
const RED_DARK = '#B71C1C';
const RED_TEXT = '#C62828';
const RED_BG = '#FFEBEE';
const PINK_BG = '#FFD0DB';
const PINK_TEXT = '#570B1D';

const ATTENTION_CARD_HEIGHT = 53.25;
const ATTENTION_CARD_GAP = 6;
const EMPTY_ATTENTION_HEIGHT = 45;
const COMPANIES_SECTION_GAP = 18;

const FIGMA_TO_PDF_SCALE = 0.75;
const SUMMARY_CARD_WIDTH = 120;
const SUMMARY_CARD_Y_OFFSET = 159.5;
const SUMMARY_ICON_X_OFFSET = 14.25;
const SUMMARY_ICON_Y_OFFSET = 17.25;
const SUMMARY_TITLE_Y_OFFSET = 12.75;
const SUMMARY_TITLE_HEIGHT = 16.5;
const SUMMARY_TITLE_FONT_SIZE = 6.75;
const SUMMARY_TITLE_CHARACTER_SPACING = 0.405;

const ALERT_ICON_PATH = 'M-0.00355113 13.0908L7.70099 -0.0000896454L15.4055 13.0908H-0.00355113ZM7.70099 11.6249C7.99266 11.6249 8.24077 11.5226 8.44531 11.3181C8.65365 11.1098 8.75781 10.8598 8.75781 10.5681C8.75781 10.2764 8.65365 10.0283 8.44531 9.82377C8.24077 9.61544 7.99266 9.51127 7.70099 9.51127C7.40933 9.51127 7.15933 9.61544 6.95099 9.82377C6.74645 10.0283 6.64418 10.2764 6.64418 10.5681C6.64418 10.8598 6.74645 11.1098 6.95099 11.3181C7.15933 11.5226 7.40933 11.6249 7.70099 11.6249ZM7.00781 8.22718H8.39418L8.49645 4.36355H6.90554L7.00781 8.22718Z';

type SummaryIconKey = 'total-inspections' | 'open-inspections' | 'pending-approval' | 'closed-observations';
type SvgLineCap = 'butt' | 'round' | 'square';
type SvgLineJoin = 'miter' | 'round' | 'bevel';

interface SummaryIconDefinition {
  key: SummaryIconKey;
  filename: string;
  figmaNodeId: string;
  title: string;
  titleX: number;
  titleWidth: number;
  background: string;
  color: string;
}

interface SummarySvgPath {
  d: string;
  stroke: string;
  strokeWidth: number;
  lineCap: SvgLineCap;
  lineJoin: SvgLineJoin;
}

const SUMMARY_ICON_DEFINITIONS: readonly SummaryIconDefinition[] = [
  {
    key: 'total-inspections',
    filename: 'total-inspections.svg',
    figmaNodeId: '842:8598',
    title: 'TOTAL INSPECCIONES',
    titleX: 25.3828125,
    titleWidth: 81,
    background: '#F6FAFF',
    color: '#24588B',
  },
  {
    key: 'open-inspections',
    filename: 'open-inspections.svg',
    figmaNodeId: '842:8608',
    title: 'INSPECCIONES ABIERTAS',
    titleX: 24.486330270767212,
    titleWidth: 81.75,
    background: '#FFEAB8',
    color: '#463100',
  },
  {
    key: 'pending-approval',
    filename: 'pending-approval.svg',
    figmaNodeId: '842:8618',
    title: 'OBS. PEND. APROBACIÓN',
    titleX: 24.509767770767212,
    titleWidth: 81.75,
    background: '#C5FFF6',
    color: '#006153',
  },
  {
    key: 'closed-observations',
    filename: 'closed-observations.svg',
    figmaNodeId: '842:8628',
    title: 'OBS. TOTALES CERRADAS',
    titleX: 24.3984375,
    titleWidth: 81.75,
    background: '#E0FFD3',
    color: '#2A5C16',
  },
];

interface InheritedReportRenderer {
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
  renderAttentionCards(
    document: ReportPdfDocument,
    rows: InspectionPeriodicReportInspectionRowResponse[],
  ): void;
  renderCompanyTable(
    document: ReportPdfDocument,
    rows: InspectionPeriodicReportCompanyRowResponse[],
  ): void;
}

@Injectable()
export class InspectionPeriodicReportPdfAlertIconFidelityService extends InspectionPeriodicReportPdfPageThreeFidelityService {
  private readonly summaryIconCache = new Map<SummaryIconKey, SummarySvgPath[]>();

  constructor(
    private readonly alertPdfRenderer: ReportPdfService,
    private readonly alertBrandingRenderer: ReportPdfBrandingService,
  ) {
    super(alertPdfRenderer, alertBrandingRenderer);
  }

  override async render(report: InspectionPeriodicReportResponse): Promise<{ filename: string; buffer: Buffer }> {
    const inherited = this as unknown as InheritedReportRenderer;
    const header = inherited.buildCorrectedHeaderContext(report);
    const buffer = await this.alertPdfRenderer.render(async (document) => {
      this.alertBrandingRenderer.addPage(document);
      inherited.drawSummaryPage(document, report, header);
      this.drawFigmaSummaryCardIcons(document);
      this.alertBrandingRenderer.addPage(document);
      inherited.drawCorrectedInspectionListPage(document, report, header);
      this.alertBrandingRenderer.addPage(document);
      this.renderAlertIconPage(document, report, header, inherited);
      this.alertBrandingRenderer.drawFooters(document, report.metadata.generatedAt);
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

  private drawFigmaSummaryCardIcons(document: ReportPdfDocument): void {
    const preservedY = document.y;
    const cardY = this.alertBrandingRenderer.marginTop + SUMMARY_CARD_Y_OFFSET;
    const gap = (this.alertBrandingRenderer.contentWidth - SUMMARY_CARD_WIDTH * SUMMARY_ICON_DEFINITIONS.length)
      / (SUMMARY_ICON_DEFINITIONS.length - 1);

    SUMMARY_ICON_DEFINITIONS.forEach((definition, index) => {
      const cardX = this.alertBrandingRenderer.marginX + index * (SUMMARY_CARD_WIDTH + gap);

      document.save();
      document
        .rect(cardX + 8.5, cardY + 8.5, SUMMARY_CARD_WIDTH - 17, 23)
        .fill(definition.background);
      document.restore();

      this.drawSummarySvgIcon(
        document,
        definition,
        cardX + SUMMARY_ICON_X_OFFSET,
        cardY + SUMMARY_ICON_Y_OFFSET,
      );
      document
        .font('Helvetica-Bold')
        .fontSize(SUMMARY_TITLE_FONT_SIZE)
        .fillColor(definition.color)
        .text(definition.title, cardX + definition.titleX, cardY + SUMMARY_TITLE_Y_OFFSET, {
          width: definition.titleWidth,
          height: SUMMARY_TITLE_HEIGHT,
          characterSpacing: SUMMARY_TITLE_CHARACTER_SPACING,
          lineGap: 0,
        });
    });

    document.y = preservedY;
  }

  private drawSummarySvgIcon(
    document: ReportPdfDocument,
    definition: SummaryIconDefinition,
    x: number,
    y: number,
  ): void {
    const paths = this.loadSummarySvgPaths(definition);

    document.save();
    document.translate(x, y);
    document.scale(FIGMA_TO_PDF_SCALE);
    paths.forEach((path) => {
      document
        .path(path.d)
        .lineWidth(path.strokeWidth)
        .strokeColor(path.stroke)
        .lineCap(path.lineCap)
        .lineJoin(path.lineJoin)
        .stroke();
    });
    document.restore();
  }

  private loadSummarySvgPaths(definition: SummaryIconDefinition): SummarySvgPath[] {
    const cached = this.summaryIconCache.get(definition.key);
    if (cached) return cached;

    const assetPath = join(__dirname, 'assets', 'periodic-summary-icons', definition.filename);
    const svg = readFileSync(assetPath, 'utf8');
    const paths: SummarySvgPath[] = [];
    const pathPattern = /<path\b([^>]*)\/>/g;
    let match: RegExpExecArray | null = pathPattern.exec(svg);

    while (match) {
      const attributes = match[1] ?? '';
      const d = this.svgAttribute(attributes, 'd');
      const stroke = this.svgAttribute(attributes, 'stroke');
      const strokeWidthValue = this.svgAttribute(attributes, 'stroke-width');
      const strokeWidth = Number(strokeWidthValue);

      if (!d || !stroke || !Number.isFinite(strokeWidth)) {
        throw new Error(`SVG inválido para el nodo Figma ${definition.figmaNodeId}`);
      }

      paths.push({
        d,
        stroke,
        strokeWidth,
        lineCap: this.svgLineCap(this.svgAttribute(attributes, 'stroke-linecap')),
        lineJoin: this.svgLineJoin(this.svgAttribute(attributes, 'stroke-linejoin')),
      });
      match = pathPattern.exec(svg);
    }

    if (paths.length === 0) {
      throw new Error(`El SVG del nodo Figma ${definition.figmaNodeId} no contiene paths renderizables`);
    }

    this.summaryIconCache.set(definition.key, paths);
    return paths;
  }

  private svgAttribute(attributes: string, name: string): string | null {
    const match = new RegExp(`${name}="([^"]+)"`).exec(attributes);
    return match?.[1] ?? null;
  }

  private svgLineCap(value: string | null): SvgLineCap {
    if (value === 'round' || value === 'square') return value;
    return 'butt';
  }

  private svgLineJoin(value: string | null): SvgLineJoin {
    if (value === 'round' || value === 'bevel') return value;
    return 'miter';
  }

  private renderAlertIconPage(
    document: ReportPdfDocument,
    report: InspectionPeriodicReportResponse,
    header: PeriodicReportHeaderContext,
    inherited: InheritedReportRenderer,
  ): void {
    this.alertBrandingRenderer.drawCompactHeader(document, header);
    this.drawExactAlertBanner(document, report);
    document.y += 14;

    const attentionRows = report.attention.rows.slice(0, 5);
    this.alertBrandingRenderer.drawSectionTitle(document, 'Inspecciones con SLA vencido o criticidad crítica', {
      text: `${report.attention.inspectionsCount} inspecciones · atención inmediata`,
      background: PINK_BG,
      color: PINK_TEXT,
    });

    const attentionStartY = document.y;
    inherited.renderAttentionCards(document, attentionRows);
    const attentionHeight = attentionRows.length > 0
      ? attentionRows.length * ATTENTION_CARD_HEIGHT + Math.max(0, attentionRows.length - 1) * ATTENTION_CARD_GAP
      : EMPTY_ATTENTION_HEIGHT;
    document.y = attentionStartY + attentionHeight + COMPANIES_SECTION_GAP;

    this.alertBrandingRenderer.drawSectionTitle(document, 'Empresas con mayor pendiente del período');
    inherited.renderCompanyTable(document, report.companiesWithMostPending.slice(0, 5));
  }

  private drawExactAlertBanner(document: ReportPdfDocument, report: InspectionPeriodicReportResponse): void {
    const x = this.alertBrandingRenderer.marginX;
    const y = document.y;
    const width = this.alertBrandingRenderer.contentWidth;
    const height = 46.5;
    const radius = 6;
    const iconContainerSize = 27;
    const iconContainerX = x + 13.125;
    const iconContainerY = y + 10.125;

    document
      .roundedRect(x, y, width, height, radius)
      .lineWidth(1.125)
      .fillAndStroke(RED_BG, RED);
    document
      .roundedRect(iconContainerX, iconContainerY, iconContainerSize, iconContainerSize, 6)
      .fill(RED);

    const iconScale = 0.75;
    const renderedIconWidth = 16 * iconScale;
    const renderedIconHeight = 14 * iconScale;
    const iconX = iconContainerX + (iconContainerSize - renderedIconWidth) / 2;
    const iconY = iconContainerY + (iconContainerSize - renderedIconHeight) / 2;

    document.save();
    document.translate(iconX, iconY);
    document.scale(iconScale);
    document.path(ALERT_ICON_PATH).fill('#FFFFFF');
    document.restore();

    const textX = iconContainerX + iconContainerSize + 7.5;
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
      .text(`Estas inspecciones del período ${this.alertPeriodLabel(report)} presentan observaciones sin cerrar con plazo vencido o nivel crítico.`, textX, y + 25.5, {
        width: textWidth,
        height: 11,
        ellipsis: true,
      });
    document.y = y + height;
  }

  private alertPeriodLabel(report: InspectionPeriodicReportResponse): string {
    const period = report.metadata.period.toLowerCase();
    if (/^q[1-4]$/.test(period)) return `T${period.slice(1)}`;
    if (period === 'year') return `año ${report.metadata.year}`;
    return report.metadata.periodLabel;
  }
}
