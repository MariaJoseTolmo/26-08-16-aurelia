import { Injectable } from '@nestjs/common';
import { InspectionFindingStatus } from '@aurelia/contracts';
import { FilesService } from '../files/files.service';
import { InspectionDetailReportPdfFidelityService } from './inspection-detail-report-pdf-fidelity.service';
import { InspectionDetailReportPdfFinalService } from './inspection-detail-report-pdf-final.service';
import { InspectionDetailReportPdfService } from './inspection-detail-report-pdf.service';
import { ReportPdfService, type ReportPdfDocument } from './report-pdf.service';

type UnknownRecord = Record<string, unknown>;

type ReportContext = {
  inspectionNumber: string;
  generatedAt: string;
  inspectionDate: string;
};

type EvidenceAsset = {
  path: string;
  mimeType: string | null;
};

type FindingGroup = {
  statuses: InspectionFindingStatus[];
  title: string;
  badgeSuffix: string;
  color: string;
  background: string;
  textColor: string;
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

type BaseRenderer = {
  render: (payload: Record<string, unknown>) => Promise<Buffer>;
};

type FidelityRenderer = {
  buildFidelityTimeline: (
    inspection: UnknownRecord,
    findings: UnknownRecord[],
    comments: UnknownRecord[],
  ) => TimelineEvent[];
};

type PixelPerfectRuntime = {
  generatedAt: string;
  reportString: (value: unknown) => string;
  reportArray: (value: unknown) => unknown[];
  reportRecord: (value: unknown) => UnknownRecord;
  prepareFinding: (finding: UnknownRecord, generatedAt: string) => UnknownRecord;
  detailedSlaLabel: (finding: UnknownRecord) => string;
  normalizeValue: (value: unknown) => string;
  asString: (value: unknown) => string;
  asArray: (value: unknown) => unknown[];
  asRecord: (value: unknown) => UnknownRecord;
  asNumber: (value: unknown, fallback: number) => number;
  severityLabel: (value: string) => string;
  severityBackground: (value: string) => string;
  severityColor: (value: string) => string;
  statusColors: (value: string) => { background: string; text: string };
  statusLabel: (value: string) => string;
  shortName: (value: string) => string;
  slaColor: (finding: UnknownRecord) => string;
  summarySlaLabel: (finding: UnknownRecord) => string;
  slaLabel: (finding: UnknownRecord) => string;
  closureLabel: (finding: UnknownRecord) => string;
  resolveEvidenceSlot: (evidence: UnknownRecord) => 'before' | 'after' | 'other';
  drawEvidenceCard: (
    document: ReportPdfDocument,
    title: string,
    evidence: UnknownRecord | undefined,
    asset: EvidenceAsset | undefined,
    x: number,
    y: number,
    width: number,
    height: number,
    background: string,
  ) => void;
  inferInspectorCompany: (inspection: UnknownRecord) => string;
  addCompactPage: (document: ReportPdfDocument, context: ReportContext) => void;
  renderGroupsWithoutOrphanHeader: (
    document: ReportPdfDocument,
    context: ReportContext,
    findings: UnknownRecord[],
    assets: Map<string, EvidenceAsset>,
    runtime: PixelPerfectRuntime,
  ) => void;
  enrichTimelineEvents: (
    events: TimelineEvent[],
    inspection: UnknownRecord,
    findings: UnknownRecord[],
    runtime: PixelPerfectRuntime,
  ) => TimelineEvent[];
  drawFooters: (
    document: ReportPdfDocument,
    context: ReportContext,
    runtime: PixelPerfectRuntime,
  ) => void;
  drawFindingsSummaryTable: (
    document: ReportPdfDocument,
    context: ReportContext,
    findings: UnknownRecord[],
  ) => void;
  drawGroupTitle: (
    document: ReportPdfDocument,
    group: FindingGroup,
    count: number,
    continuation: boolean,
  ) => void;
  renderFinding: (
    document: ReportPdfDocument,
    context: ReportContext,
    finding: UnknownRecord,
    groupIndex: number,
    group: FindingGroup,
    assets: Map<string, EvidenceAsset>,
  ) => void;
  renderFindingGroups: (
    document: ReportPdfDocument,
    context: ReportContext,
    findings: UnknownRecord[],
    assets: Map<string, EvidenceAsset>,
  ) => void;
  estimateFindingHeight: (document: ReportPdfDocument, finding: UnknownRecord) => number;
  buildTimelineEvents: (
    inspection: UnknownRecord,
    findings: UnknownRecord[],
    comments: UnknownRecord[],
  ) => TimelineEvent[];
  drawTimelineEvent: (
    document: ReportPdfDocument,
    event: TimelineEvent,
    index: number,
    height: number,
  ) => void;
  drawSignatures: (
    document: ReportPdfDocument,
    inspection: UnknownRecord,
    findings: UnknownRecord[],
  ) => void;
  sectionTitle: (document: ReportPdfDocument, title: string) => void;
  drawChip: (
    document: ReportPdfDocument,
    label: string,
    x: number,
    y: number,
    width: number,
    background: string,
    color: string,
  ) => void;
  textHeight: (document: ReportPdfDocument, value: string, width: number, fontSize: number) => number;
  formatDate: (value: string) => string;
  formatDateTime: (value: string) => string;
  addFooters: (document: ReportPdfDocument, context: ReportContext) => void;
};

type SummaryRow = {
  condition: string;
  conditionEn: string;
  spanishHeight: number;
  englishHeight: number;
  rowHeight: number;
};

type FindingContent = {
  condition: string;
  conditionEn: string;
  proposed: string;
  proposedEn: string;
  executed: string;
  executedEn: string;
  rejectionReason: string;
  cancellationReason: string;
  status: string;
};

type DateParts = {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
};

const PAGE_WIDTH = 595.28;
const MARGIN_X = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const CONTENT_BOTTOM = 780;
const NAVY = '#001E39';
const BLUE = '#0D3862';
const GOLD = '#C8A064';
const BORDER = '#D1D1D1';
const MUTED = '#646464';
const TEXT = '#131313';
const LIGHT = '#F7F7F7';
const YELLOW_BG = '#FFEAB8';
const GREEN = '#2A5C16';
const RED = '#570B1D';
const PHOTO_BEFORE = '#D6EEF8';
const PHOTO_AFTER = '#DAFCCB';
const SECTION_TRACKING = 0.66;
const LABEL_TRACKING = 0.34;
const BODY_FONT_SIZE = 8.25;
const BODY_LINE_GAP = 2.2;
const SECONDARY_FONT_SIZE = 7.5;
const SECONDARY_LINE_GAP = 1.8;
const LABEL_FONT_SIZE = 6.75;
const BODY_PADDING_X = 10.5;
const BODY_ROW_GAP = 7.5;

@Injectable()
export class InspectionDetailReportPdfPixelPerfectService extends InspectionDetailReportPdfFinalService {
  constructor(pdf: ReportPdfService, files: FilesService) {
    super(pdf, files);
  }

  override async render(payload: Record<string, unknown>): Promise<Buffer> {
    const runtime = this.pixelRuntime();
    const generatedAt = runtime.reportString(payload.generatedAt) || new Date().toISOString();
    const preparedPayload = {
      ...payload,
      generatedAt,
      findings: runtime.reportArray(payload.findings).map((value) => {
        const rawFinding = runtime.reportRecord(value);
        const preparedFinding = runtime.prepareFinding(rawFinding, generatedAt);
        const condition = runtime.reportString(rawFinding.detectedCondition)
          || runtime.reportString(rawFinding.title)
          || 'Sin descripción';
        const conditionEn = runtime.reportString(rawFinding.detectedConditionEn)
          || runtime.reportString(rawFinding.titleEn)
          || runtime.reportString(rawFinding.descriptionEn);

        return {
          ...preparedFinding,
          title: condition,
          titleEn: conditionEn,
          detectedCondition: condition,
          detectedConditionEn: conditionEn,
          reportSummaryCondition: condition,
          reportSummaryConditionEn: conditionEn,
        };
      }),
    };

    runtime.slaLabel = (finding) => runtime.detailedSlaLabel(finding);
    runtime.generatedAt = generatedAt;
    runtime.asString = (value) => runtime.normalizeValue(value);
    runtime.formatDate = (value) => this.formatPixelDate(value);
    runtime.formatDateTime = (value) => this.formatPixelDateTime(value);
    runtime.drawChip = (document, label, x, y, width, background, color) =>
      this.drawPixelChip(document, label, x, y, width, background, color);
    runtime.sectionTitle = (document, title) => this.drawPixelSectionTitle(document, title);
    runtime.textHeight = (document, value, width) => this.measurePixelTimelineText(document, value, width);

    const base = InspectionDetailReportPdfService.prototype as unknown as BaseRenderer;
    const fidelity = InspectionDetailReportPdfFidelityService.prototype as unknown as FidelityRenderer;

    runtime.drawFindingsSummaryTable = (document, context, findings) =>
      this.drawPixelSummaryTable(document, context, findings, runtime);
    runtime.drawGroupTitle = (document, group, count, continuation) =>
      this.drawPixelGroupTitle(document, group, count, continuation);
    runtime.renderFinding = (document, context, finding, groupIndex, group, assets) =>
      this.renderPixelFinding(document, context, finding, groupIndex, group, assets, runtime);
    runtime.estimateFindingHeight = (document, finding) =>
      this.estimatePixelFindingHeight(document, finding, runtime);
    runtime.renderFindingGroups = (document, context, findings, assets) =>
      runtime.renderGroupsWithoutOrphanHeader(document, context, findings, assets, runtime);
    runtime.buildTimelineEvents = (inspection, findings, comments) => {
      const events = fidelity.buildFidelityTimeline.call(this, inspection, findings, comments);
      const enrichedEvents = runtime.enrichTimelineEvents(events, inspection, findings, runtime);
      return enrichedEvents.map((event, index) => ({
        ...event,
        last: index === enrichedEvents.length - 1,
      }));
    };
    runtime.drawTimelineEvent = (document, event, _index, height) =>
      this.drawPixelTimelineEvent(document, event, height, runtime);
    runtime.drawSignatures = (document, inspection, findings) =>
      this.drawPixelSignatures(document, inspection, findings, runtime);
    runtime.addFooters = (document, context) => runtime.drawFooters(document, context, runtime);

    return base.render.call(this, preparedPayload);
  }

  private drawPixelSummaryTable(
    document: ReportPdfDocument,
    context: ReportContext,
    findings: UnknownRecord[],
    runtime: PixelPerfectRuntime,
  ) {
    const widths = [27, 173.5, 87, 88.5, 75, 60];
    const headerHeight = 30;
    const headers = [
      'N°',
      'DESCRIPCIÓN / DESCRIPTION',
      'CRITICIDAD /\nCRITICALITY',
      'ESTADO / STATUS',
      'RESPONSABLE /\nRESPONSIBLE',
      'SLA',
    ];
    const rows = findings.map((finding) =>
      this.measurePixelSummaryRow(document, finding, widths[1], runtime),
    );
    const startY = document.y;
    const totalHeight = headerHeight + rows.reduce((total, row) => total + row.rowHeight, 0);
    const fitsCurrentPage = findings.length > 0 && startY + totalHeight <= CONTENT_BOTTOM - 120;

    if (fitsCurrentPage) {
      document.save();
      document.roundedRect(MARGIN_X, startY, CONTENT_WIDTH, totalHeight, 5).clip();
    }

    const drawHeader = () => {
      let x = MARGIN_X;
      const y = document.y;
      headers.forEach((header, index) => {
        document.rect(x, y, widths[index], headerHeight).fill(NAVY);
        document
          .font('Helvetica-Bold')
          .fontSize(6.5)
          .fillColor('#C4CED7')
          .text(header, x + 7, y + 7.5, {
            width: widths[index] - 14,
            align: index === 1 ? 'left' : 'center',
            lineGap: 0.35,
          });
        x += widths[index];
      });
      document.y = y + headerHeight;
    };

    drawHeader();

    if (findings.length === 0) {
      const y = document.y;
      document.roundedRect(MARGIN_X, y, CONTENT_WIDTH, 36, 4).fillAndStroke(LIGHT, BORDER);
      document
        .font('Helvetica')
        .fontSize(8.25)
        .fillColor(MUTED)
        .text('No hay observaciones registradas en esta inspección.', MARGIN_X + 12, y + 12, {
          width: CONTENT_WIDTH - 24,
          align: 'center',
        });
      document.y = y + 36;
    } else {
      findings.forEach((finding, index) => {
        const row = rows[index];
        if (!fitsCurrentPage && document.y + row.rowHeight > CONTENT_BOTTOM - 120) {
          runtime.addCompactPage(document, context);
          runtime.sectionTitle(document, 'Resumen de observaciones / Observations summary');
          drawHeader();
        }
        this.drawPixelSummaryRow(document, finding, row, widths, index, runtime);
      });
    }

    if (fitsCurrentPage) {
      document.restore();
      document
        .roundedRect(MARGIN_X, startY, CONTENT_WIDTH, document.y - startY, 5)
        .strokeColor(BORDER)
        .lineWidth(0.7)
        .stroke();
    }

    document.y += 14;
  }

  private measurePixelSummaryRow(
    document: ReportPdfDocument,
    finding: UnknownRecord,
    descriptionColumnWidth: number,
    runtime: PixelPerfectRuntime,
  ): SummaryRow {
    const condition = runtime.asString(finding.reportSummaryCondition)
      || runtime.asString(finding.detectedCondition)
      || runtime.asString(finding.title)
      || 'Sin descripción';
    const conditionEn = runtime.asString(finding.reportSummaryConditionEn)
      || runtime.asString(finding.detectedConditionEn)
      || runtime.asString(finding.titleEn);
    const textWidth = descriptionColumnWidth - 17;

    document.font('Helvetica-Bold').fontSize(8.25);
    const spanishHeight = Math.min(
      25,
      document.heightOfString(condition, { width: textWidth, lineGap: 0.75 }),
    );
    document.font('Helvetica-Oblique').fontSize(7.5);
    const englishHeight = conditionEn
      ? Math.min(23, document.heightOfString(conditionEn, { width: textWidth, lineGap: 0.65 }))
      : 0;
    const rowHeight = Math.max(
      45,
      8 + spanishHeight + (englishHeight > 0 ? englishHeight + 1.5 : 0) + 8,
    );

    return { condition, conditionEn, spanishHeight, englishHeight, rowHeight };
  }

  private drawPixelSummaryRow(
    document: ReportPdfDocument,
    finding: UnknownRecord,
    row: SummaryRow,
    widths: number[],
    index: number,
    runtime: PixelPerfectRuntime,
  ) {
    const y = document.y;
    const fill = index % 2 === 0 ? '#FFFFFF' : LIGHT;
    let x = MARGIN_X;
    widths.forEach((width) => {
      document.rect(x, y, width, row.rowHeight).fillAndStroke(fill, BORDER);
      x += width;
    });

    document
      .font('Helvetica-Bold')
      .fontSize(8.25)
      .fillColor(BLUE)
      .text(String(runtime.asNumber(finding.observationNumber, index + 1)), MARGIN_X, y + 9, {
        width: widths[0],
        align: 'center',
      });

    const descriptionX = MARGIN_X + widths[0] + 9;
    const descriptionWidth = widths[1] - 17;
    document
      .font('Helvetica-Bold')
      .fontSize(8.25)
      .fillColor(TEXT)
      .text(row.condition, descriptionX, y + 8, {
        width: descriptionWidth,
        height: row.spanishHeight,
        lineGap: 0.75,
        ellipsis: true,
      });

    if (row.conditionEn) {
      document
        .font('Helvetica-Oblique')
        .fontSize(7.5)
        .fillColor(MUTED)
        .text(row.conditionEn, descriptionX, y + 8 + row.spanishHeight + 1.5, {
          width: descriptionWidth,
          height: row.englishHeight,
          lineGap: 0.65,
          ellipsis: true,
        });
    }

    const severityX = MARGIN_X + widths[0] + widths[1];
    runtime.drawChip(
      document,
      runtime.severityLabel(runtime.asString(finding.severity)),
      severityX + 8,
      y + 8,
      widths[2] - 16,
      runtime.severityBackground(runtime.asString(finding.severity)),
      runtime.severityColor(runtime.asString(finding.severity)),
    );

    const statusX = severityX + widths[2];
    const statusColors = runtime.statusColors(runtime.asString(finding.status));
    runtime.drawChip(
      document,
      runtime.statusLabel(runtime.asString(finding.status)),
      statusX + 8,
      y + 8,
      widths[3] - 16,
      statusColors.background,
      statusColors.text,
    );

    const responsibleX = statusX + widths[3];
    document
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(TEXT)
      .text(
        runtime.shortName(runtime.asString(finding.ownerUserName))
          || runtime.asString(finding.responsibleCompanyName)
          || '—',
        responsibleX + 8,
        y + 9,
        { width: widths[4] - 16, height: row.rowHeight - 14, ellipsis: true },
      );

    const slaX = responsibleX + widths[4];
    document
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .fillColor(runtime.slaColor(finding))
      .text(runtime.summarySlaLabel(finding), slaX + 8, y + 9, {
        width: widths[5] - 14,
        height: row.rowHeight - 14,
        lineGap: 0.65,
        ellipsis: true,
      });

    document.y = y + row.rowHeight;
  }

  private drawPixelGroupTitle(
    document: ReportPdfDocument,
    group: FindingGroup,
    count: number,
    continuation: boolean,
  ) {
    const y = document.y;
    document.rect(MARGIN_X, y + 1, 2.25, 12).fill(GOLD);

    if (continuation) {
      document
        .font('Helvetica-Bold')
        .fontSize(8.25)
        .fillColor(NAVY)
        .text(group.title.toUpperCase(), MARGIN_X + 9.75, y + 1, {
          width: 305,
          characterSpacing: SECTION_TRACKING,
        });
      document
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(MUTED)
        .text('(CONTINUACIÓN / CONTINUED)', MARGIN_X + 345, y + 2, {
          width: 166,
          align: 'right',
          characterSpacing: SECTION_TRACKING,
        });
      document.y = y + 22;
      return;
    }

    const noun = count === 1
      ? '1 observación / 1 observation'
      : `${count} observaciones / ${count} observations`;
    const badge = `${noun}${group.badgeSuffix ? ` · ${group.badgeSuffix}` : ''}`;
    document.font('Helvetica-Bold').fontSize(6.75);
    const badgeWidth = Math.min(246, Math.max(108, document.widthOfString(badge) + 14));
    const badgeTextWidth = badgeWidth - 14;
    const badgeTextHeight = document.heightOfString(badge, { width: badgeTextWidth, lineGap: 0.4 });
    const badgeHeight = Math.max(11, badgeTextHeight + 4);
    const titleWidth = CONTENT_WIDTH - badgeWidth - 24;

    document
      .font('Helvetica-Bold')
      .fontSize(8.25)
      .fillColor(NAVY)
      .text(group.title.toUpperCase(), MARGIN_X + 9.75, y + 1, {
        width: titleWidth,
        characterSpacing: SECTION_TRACKING,
      });
    document
      .roundedRect(MARGIN_X + CONTENT_WIDTH - badgeWidth, y, badgeWidth, badgeHeight, 4)
      .fill(group.background);
    document
      .font('Helvetica-Bold')
      .fontSize(6.75)
      .fillColor(group.textColor)
      .text(badge, MARGIN_X + CONTENT_WIDTH - badgeWidth + 7, y + 2.5, {
        width: badgeTextWidth,
        align: 'center',
        lineGap: 0.4,
      });

    document.y = y + Math.max(22, badgeHeight + 9);
  }

  private renderPixelFinding(
    document: ReportPdfDocument,
    context: ReportContext,
    finding: UnknownRecord,
    groupIndex: number,
    group: FindingGroup,
    assets: Map<string, EvidenceAsset>,
    runtime: PixelPerfectRuntime,
  ) {
    const content = this.pixelFindingContent(finding, runtime);
    const observationNumber = runtime.asNumber(finding.observationNumber, groupIndex + 1);
    const cardY = document.y;
    const titleX = MARGIN_X + 75;
    const chipsX = MARGIN_X + 362;
    const titleWidth = chipsX - titleX - 8;

    document.font('Helvetica-Bold').fontSize(8.25);
    const titleHeight = Math.min(
      24,
      document.heightOfString(content.condition, { width: titleWidth, lineGap: 0.6 }),
    );
    document.font('Helvetica-BoldOblique').fontSize(7.5);
    const titleEnHeight = content.conditionEn
      ? Math.min(19, document.heightOfString(content.conditionEn, { width: titleWidth, lineGap: 0.45 }))
      : 0;
    const headerHeight = Math.max(
      36,
      7.5 + titleHeight + (titleEnHeight > 0 ? titleEnHeight + 1 : 0) + 6.5,
    );

    document.roundedRect(MARGIN_X, cardY, CONTENT_WIDTH, headerHeight, 4.5).fillAndStroke(group.background, BORDER);
    document.rect(MARGIN_X, cardY, 3, headerHeight).fill(group.color);
    document
      .font('Helvetica-Bold')
      .fontSize(8.25)
      .fillColor(BLUE)
      .text(`#${context.inspectionNumber} · Obs. ${observationNumber}`, MARGIN_X + 13.5, cardY + (headerHeight - 10) / 2, {
        width: 54,
        height: 12,
        ellipsis: true,
      });
    document
      .font('Helvetica-Bold')
      .fontSize(8.25)
      .fillColor(TEXT)
      .text(content.condition, titleX, cardY + 7.5, {
        width: titleWidth,
        height: titleHeight,
        lineGap: 0.6,
        ellipsis: true,
      });
    if (content.conditionEn) {
      document
        .font('Helvetica-BoldOblique')
        .fontSize(7.5)
        .fillColor(MUTED)
        .text(content.conditionEn, titleX, cardY + 7.5 + titleHeight + 1, {
          width: titleWidth,
          height: titleEnHeight,
          lineGap: 0.45,
          ellipsis: true,
        });
    }

    const chipY = cardY + (headerHeight - 15) / 2;
    runtime.drawChip(
      document,
      runtime.statusLabel(content.status),
      chipsX,
      chipY,
      72,
      group.background,
      group.textColor,
    );
    runtime.drawChip(
      document,
      runtime.severityLabel(runtime.asString(finding.severity)),
      MARGIN_X + 438,
      chipY,
      66,
      runtime.severityBackground(runtime.asString(finding.severity)),
      runtime.severityColor(runtime.asString(finding.severity)),
    );

    let y = cardY + headerHeight + 9;
    y = this.drawPixelLabeledBlock(document, 'DESCRIPCIÓN / DESCRIPTION', content.condition, content.conditionEn, y);

    if (content.status === InspectionFindingStatus.CLOSED && content.executed) {
      y = this.drawPixelLabeledBlock(document, 'ACCIÓN EJECUTADA / ACTION TAKEN', content.executed, content.executedEn, y);
    } else if (content.proposed) {
      y = this.drawPixelLabeledBlock(document, 'MEDIDAS CORRECTIVAS / CORRECTIVE ACTIONS', content.proposed, content.proposedEn, y);
    }

    if (content.status === InspectionFindingStatus.REJECTED && content.rejectionReason) {
      y = this.drawPixelLabeledBlock(document, 'MOTIVO DE RECHAZO / REJECTION REASON', content.rejectionReason, '', y, RED);
    }
    if (content.status === InspectionFindingStatus.CANCELLED && content.cancellationReason) {
      y = this.drawPixelLabeledBlock(document, 'MOTIVO DE CANCELACIÓN / CANCELLATION REASON', content.cancellationReason, '', y, MUTED);
    }

    const responsible = [runtime.asString(finding.ownerUserName), runtime.asString(finding.responsibleCompanyName)]
      .filter(Boolean)
      .join(' · ') || 'Sin responsable asignado';
    y = this.drawPixelInlineRow(document, 'RESPONSABLE / RESPONSIBLE', responsible, y);

    if (content.status === InspectionFindingStatus.CLOSED) {
      const approvedBy = [runtime.asString(finding.closedByUserName), runtime.formatDateTime(runtime.asString(finding.closedAt))]
        .filter((value) => value && value !== '—')
        .join(' · ');
      if (approvedBy) y = this.drawPixelInlineRow(document, 'APROBADO POR / APPROVED BY', approvedBy, y);
      y = this.drawPixelInlineRow(document, 'DÍAS DE CIERRE / DAYS TO CLOSE', runtime.closureLabel(finding), y, GREEN, true);
    } else if (content.status === InspectionFindingStatus.REJECTED) {
      const rejectedBy = [runtime.asString(finding.rejectedByUserName), runtime.formatDateTime(runtime.asString(finding.rejectedAt))]
        .filter((value) => value && value !== '—')
        .join(' · ');
      if (rejectedBy) y = this.drawPixelInlineRow(document, 'RECHAZADO POR / REJECTED BY', rejectedBy, y, RED);
      y = this.drawPixelInlineRow(document, 'SLA', runtime.slaLabel(finding), y, RED, true);
    } else if (content.status !== InspectionFindingStatus.CANCELLED) {
      y = this.drawPixelInlineRow(document, 'SLA', runtime.slaLabel(finding), y, runtime.slaColor(finding), true);
    }

    const evidences = runtime.asArray(finding.evidences).map((value) => runtime.asRecord(value));
    if (evidences.length > 0) {
      document
        .font('Helvetica-Bold')
        .fontSize(LABEL_FONT_SIZE)
        .fillColor(MUTED)
        .text('EVIDENCIA FOTOGRÁFICA / PHOTOGRAPHIC EVIDENCE', MARGIN_X + BODY_PADDING_X, y + 1, {
          width: 275,
          characterSpacing: LABEL_TRACKING,
        });
      y += 20;
      const before = evidences.find((evidence) => runtime.resolveEvidenceSlot(evidence) === 'before') ?? evidences[0];
      const after = evidences.find((evidence) => runtime.resolveEvidenceSlot(evidence) === 'after')
        ?? evidences.find((evidence) => evidence !== before);
      const evidenceGap = 7.5;
      const evidenceWidth = (CONTENT_WIDTH - BODY_PADDING_X * 2 - evidenceGap) / 2;
      runtime.drawEvidenceCard(
        document,
        `Antes / Before · ${runtime.formatDateTime(runtime.asString(before?.createdAt))}`,
        before,
        assets.get(runtime.asString(before?.fileId)),
        MARGIN_X + BODY_PADDING_X,
        y,
        evidenceWidth,
        91,
        PHOTO_BEFORE,
      );
      if (after) {
        runtime.drawEvidenceCard(
          document,
          `Después / After · ${runtime.formatDateTime(runtime.asString(after.createdAt))}`,
          after,
          assets.get(runtime.asString(after.fileId)),
          MARGIN_X + BODY_PADDING_X + evidenceWidth + evidenceGap,
          y,
          evidenceWidth,
          91,
          PHOTO_AFTER,
        );
      }
      y += 100;
    }

    const cardEndY = y + 9;
    document
      .roundedRect(MARGIN_X, cardY, CONTENT_WIDTH, cardEndY - cardY, 4.5)
      .strokeColor(BORDER)
      .lineWidth(0.7)
      .stroke();
    document.y = cardEndY + 12;
  }

  private pixelFindingContent(finding: UnknownRecord, runtime: PixelPerfectRuntime): FindingContent {
    return {
      condition: runtime.asString(finding.reportSummaryCondition)
        || runtime.asString(finding.detectedCondition)
        || runtime.asString(finding.title)
        || 'Sin descripción registrada',
      conditionEn: runtime.asString(finding.reportSummaryConditionEn)
        || runtime.asString(finding.detectedConditionEn)
        || runtime.asString(finding.titleEn),
      proposed: runtime.asString(finding.proposedCorrectiveAction),
      proposedEn: runtime.asString(finding.proposedCorrectiveActionEn),
      executed: runtime.asString(finding.executedActionDescription),
      executedEn: runtime.asString(finding.executedActionDescriptionEn),
      rejectionReason: runtime.asString(finding.rejectionReason),
      cancellationReason: runtime.asString(finding.cancellationReason),
      status: runtime.asString(finding.status),
    };
  }

  private drawPixelLabeledBlock(
    document: ReportPdfDocument,
    label: string,
    value: string,
    secondary: string,
    y: number,
    valueColor = TEXT,
  ): number {
    const labelWidth = this.pixelLabelWidth(document, label);
    const valueX = MARGIN_X + BODY_PADDING_X + labelWidth + BODY_ROW_GAP;
    const valueWidth = CONTENT_WIDTH - BODY_PADDING_X * 2 - labelWidth - BODY_ROW_GAP;

    document.font('Helvetica').fontSize(BODY_FONT_SIZE);
    const primaryHeight = document.heightOfString(value, { width: valueWidth, lineGap: BODY_LINE_GAP });
    document.font('Helvetica-Oblique').fontSize(BODY_FONT_SIZE);
    const secondaryHeight = secondary
      ? document.heightOfString(secondary, { width: valueWidth, lineGap: BODY_LINE_GAP })
      : 0;
    const contentHeight = Math.max(12.4, primaryHeight + secondaryHeight);

    document
      .font('Helvetica-Bold')
      .fontSize(LABEL_FONT_SIZE)
      .fillColor(MUTED)
      .text(label, MARGIN_X + BODY_PADDING_X, y + 1, {
        width: labelWidth,
        characterSpacing: LABEL_TRACKING,
      });
    document
      .font('Helvetica')
      .fontSize(BODY_FONT_SIZE)
      .fillColor(valueColor)
      .text(value, valueX, y, {
        width: valueWidth,
        lineGap: BODY_LINE_GAP,
      });
    if (secondary) {
      document
        .font('Helvetica-Oblique')
        .fontSize(BODY_FONT_SIZE)
        .fillColor(MUTED)
        .text(secondary, valueX, y + primaryHeight, {
          width: valueWidth,
          lineGap: BODY_LINE_GAP,
        });
    }

    return y + contentHeight + 6;
  }

  private drawPixelInlineRow(
    document: ReportPdfDocument,
    label: string,
    value: string,
    y: number,
    color = TEXT,
    bold = false,
  ): number {
    const labelWidth = this.pixelLabelWidth(document, label);
    const valueX = MARGIN_X + BODY_PADDING_X + labelWidth + BODY_ROW_GAP;
    const valueWidth = CONTENT_WIDTH - BODY_PADDING_X * 2 - labelWidth - BODY_ROW_GAP;
    const fontName = bold ? 'Helvetica-Bold' : 'Helvetica';
    document.font(fontName).fontSize(BODY_FONT_SIZE);
    const valueHeight = document.heightOfString(value, { width: valueWidth, lineGap: 1.4 });
    const rowHeight = Math.max(18.4, valueHeight + 6);

    document
      .font('Helvetica-Bold')
      .fontSize(LABEL_FONT_SIZE)
      .fillColor(MUTED)
      .text(label, MARGIN_X + BODY_PADDING_X, y + 1, {
        width: labelWidth,
        characterSpacing: LABEL_TRACKING,
      });
    document
      .font(fontName)
      .fontSize(BODY_FONT_SIZE)
      .fillColor(color)
      .text(value, valueX, y, {
        width: valueWidth,
        height: rowHeight - 2,
        lineGap: 1.4,
        ellipsis: true,
      });

    return y + rowHeight;
  }

  private pixelLabelWidth(document: ReportPdfDocument, label: string): number {
    document.font('Helvetica-Bold').fontSize(LABEL_FONT_SIZE);
    const spacingWidth = Math.max(0, label.length - 1) * LABEL_TRACKING;
    return Math.min(177, Math.max(90, document.widthOfString(label) + spacingWidth + 4));
  }

  private estimatePixelFindingHeight(
    document: ReportPdfDocument,
    finding: UnknownRecord,
    runtime: PixelPerfectRuntime,
  ): number {
    const content = this.pixelFindingContent(finding, runtime);
    const titleWidth = MARGIN_X + 362 - (MARGIN_X + 75) - 8;
    document.font('Helvetica-Bold').fontSize(8.25);
    const titleHeight = Math.min(24, document.heightOfString(content.condition, { width: titleWidth, lineGap: 0.6 }));
    document.font('Helvetica-BoldOblique').fontSize(7.5);
    const titleEnHeight = content.conditionEn
      ? Math.min(19, document.heightOfString(content.conditionEn, { width: titleWidth, lineGap: 0.45 }))
      : 0;
    const headerHeight = Math.max(36, 7.5 + titleHeight + (titleEnHeight > 0 ? titleEnHeight + 1 : 0) + 6.5);

    let height = headerHeight + 9;
    height += this.measurePixelLabeledBlock(document, 'DESCRIPCIÓN / DESCRIPTION', content.condition, content.conditionEn);
    if (content.status === InspectionFindingStatus.CLOSED && content.executed) {
      height += this.measurePixelLabeledBlock(document, 'ACCIÓN EJECUTADA / ACTION TAKEN', content.executed, content.executedEn);
    } else if (content.proposed) {
      height += this.measurePixelLabeledBlock(document, 'MEDIDAS CORRECTIVAS / CORRECTIVE ACTIONS', content.proposed, content.proposedEn);
    }
    if (content.status === InspectionFindingStatus.REJECTED && content.rejectionReason) {
      height += this.measurePixelLabeledBlock(document, 'MOTIVO DE RECHAZO / REJECTION REASON', content.rejectionReason, '');
    }
    if (content.status === InspectionFindingStatus.CANCELLED && content.cancellationReason) {
      height += this.measurePixelLabeledBlock(document, 'MOTIVO DE CANCELACIÓN / CANCELLATION REASON', content.cancellationReason, '');
    }

    height += 18.4;
    if (content.status === InspectionFindingStatus.CLOSED) height += 36.8;
    else if (content.status === InspectionFindingStatus.REJECTED) height += 36.8;
    else if (content.status !== InspectionFindingStatus.CANCELLED) height += 18.4;
    if (runtime.asArray(finding.evidences).length > 0) height += 120;

    return Math.min(620, height + 21);
  }

  private measurePixelLabeledBlock(
    document: ReportPdfDocument,
    label: string,
    value: string,
    secondary: string,
  ): number {
    const labelWidth = this.pixelLabelWidth(document, label);
    const valueWidth = CONTENT_WIDTH - BODY_PADDING_X * 2 - labelWidth - BODY_ROW_GAP;
    document.font('Helvetica').fontSize(BODY_FONT_SIZE);
    const primaryHeight = document.heightOfString(value, { width: valueWidth, lineGap: BODY_LINE_GAP });
    document.font('Helvetica-Oblique').fontSize(BODY_FONT_SIZE);
    const secondaryHeight = secondary
      ? document.heightOfString(secondary, { width: valueWidth, lineGap: BODY_LINE_GAP })
      : 0;
    return Math.max(12.4, primaryHeight + secondaryHeight) + 6;
  }

  private drawPixelTimelineEvent(
    document: ReportPdfDocument,
    event: TimelineEvent,
    height: number,
    runtime: PixelPerfectRuntime,
  ) {
    const y = document.y;
    const circleX = MARGIN_X + 8;
    const circleY = y + 8;
    const radius = 8;
    const contentX = MARGIN_X + 30;
    const contentWidth = CONTENT_WIDTH - 30;

    if (!event.last) {
      document
        .moveTo(circleX, circleY)
        .lineTo(circleX, y + height + 8)
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
      .text(dateLabel, MARGIN_X + 345, y + 0.5, { width: 166, align: 'right' });

    const [spanishDetail, ...englishParts] = event.detail.split('\n');
    const englishDetail = englishParts.join('\n').trim();
    const detailY = y + 18;
    document.font('Helvetica').fontSize(BODY_FONT_SIZE);
    const spanishHeight = document.heightOfString(spanishDetail, {
      width: contentWidth,
      lineGap: BODY_LINE_GAP,
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
      const summaryHeight = 24;
      const summaryY = y + height - summaryHeight - 3;
      document
        .roundedRect(contentX, summaryY, contentWidth, summaryHeight, 3)
        .fillAndStroke(event.ongoing ? YELLOW_BG : LIGHT, event.ongoing ? GOLD : BORDER);
      document
        .font('Helvetica')
        .fontSize(6.75)
        .fillColor(MUTED)
        .text(event.summary, contentX + 8, summaryY + 7, {
          width: contentWidth - 16,
          height: 11,
          ellipsis: true,
        });
    }

    document.y = y + height;
  }

  private measurePixelTimelineText(
    document: ReportPdfDocument,
    value: string,
    width: number,
  ): number {
    if (!value) return 0;
    const [spanish, ...englishParts] = value.split('\n');
    const english = englishParts.join('\n').trim();
    document.font('Helvetica').fontSize(BODY_FONT_SIZE);
    const spanishHeight = document.heightOfString(spanish, { width, lineGap: BODY_LINE_GAP });
    document.font('Helvetica-Oblique').fontSize(SECONDARY_FONT_SIZE);
    const englishHeight = english
      ? document.heightOfString(english, { width, lineGap: SECONDARY_LINE_GAP })
      : 0;
    return spanishHeight + englishHeight;
  }

  private drawPixelSignatures(
    document: ReportPdfDocument,
    inspection: UnknownRecord,
    findings: UnknownRecord[],
    runtime: PixelPerfectRuntime,
  ) {
    const inspector = runtime.asString(inspection.inspectorName) || 'Pendiente / Pending';
    const responsible = findings.map((finding) => runtime.asString(finding.ownerUserName)).find(Boolean) || 'Pendiente / Pending';
    const responsibleCompany = findings.map((finding) => runtime.asString(finding.responsibleCompanyName)).find(Boolean) || '—';
    const approver = findings.map((finding) => runtime.asString(finding.closedByUserName)).find(Boolean) || 'Pendiente / Pending';
    const cellWidth = 244;
    const gap = 23;
    const rowStride = 61.5;
    const startY = document.y + 6;
    const inspectionDate = runtime.asString(inspection.startedAt) || runtime.asString(inspection.createdAt);
    const cells: Array<[string, string, string]> = [
      [
        'Inspector / Inspector',
        inspector,
        `${runtime.asString(inspection.inspectorCompanyName) || runtime.inferInspectorCompany(inspection)} · ${runtime.formatDate(inspectionDate)}`,
      ],
      ['Responsable EECC / EECC Responsible', responsible, responsibleCompany],
      ['Admin GF HSE / GF HSE Admin', approver, 'Gold Fields · Admin HSE Salares Norte'],
      ['Gerencia / Management', 'Pendiente / Pending', 'Revisión y validación final · Final review and validation'],
    ];

    cells.forEach(([role, name, detail], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = MARGIN_X + column * (cellWidth + gap);
      const y = startY + row * rowStride;
      document.moveTo(x, y).lineTo(x + cellWidth, y).strokeColor(TEXT).lineWidth(0.75).stroke();
      document
        .font('Helvetica-Bold')
        .fontSize(6.75)
        .fillColor(MUTED)
        .text(role, x, y + 6, { width: cellWidth, characterSpacing: 0.2 });
      document
        .font(name.includes('Pendiente') ? 'Helvetica-Oblique' : 'Helvetica-Bold')
        .fontSize(8.25)
        .fillColor(TEXT)
        .text(name, x, y + 18, { width: cellWidth, height: 12, ellipsis: true });
      document
        .font('Helvetica')
        .fontSize(6.75)
        .fillColor(MUTED)
        .text(detail, x, y + 32, { width: cellWidth, height: 18, lineGap: 0.6, ellipsis: true });
    });

    document.y = startY + rowStride * 2 + 4;
  }

  private drawPixelSectionTitle(document: ReportPdfDocument, title: string) {
    const y = document.y;
    document.rect(MARGIN_X, y + 1, 2.25, 12).fill(GOLD);
    document
      .font('Helvetica-Bold')
      .fontSize(8.25)
      .fillColor(NAVY)
      .text(title.toUpperCase(), MARGIN_X + 9.75, y + 1, {
        width: CONTENT_WIDTH - 9.75,
        characterSpacing: SECTION_TRACKING,
      });
    document.y = y + 21;
  }

  private drawPixelChip(
    document: ReportPdfDocument,
    label: string,
    x: number,
    y: number,
    width: number,
    background: string,
    color: string,
  ) {
    const availableWidth = width - 8;
    let fontSize = 6.75;
    document.font('Helvetica-Bold').fontSize(fontSize);
    while (fontSize > 5.7 && document.widthOfString(label) > availableWidth) {
      fontSize -= 0.2;
      document.fontSize(fontSize);
    }
    document.roundedRect(x, y, width, 15, 4).fill(background);
    document
      .font('Helvetica-Bold')
      .fontSize(fontSize)
      .fillColor(color)
      .text(label, x + 4, y + 4.1, {
        width: availableWidth,
        align: 'center',
        height: 8,
        ellipsis: true,
      });
  }

  private formatPixelDate(value: string): string {
    const parts = this.pixelDateParts(value, false);
    return parts ? `${parts.day}-${parts.month}-${parts.year}` : '—';
  }

  private formatPixelDateTime(value: string): string {
    const parts = this.pixelDateParts(value, true);
    return parts
      ? `${parts.day}-${parts.month}-${parts.year} ${parts.hour}:${parts.minute}`
      : '—';
  }

  private pixelDateParts(value: string, includeTime: boolean): DateParts | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Santiago',
      ...(includeTime
        ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' as const }
        : {}),
    };
    const entries = new Intl.DateTimeFormat('en-GB', options)
      .formatToParts(date)
      .map((part) => [part.type, part.value] as const);
    const parts = new Map(entries);
    return {
      day: parts.get('day') ?? '',
      month: parts.get('month') ?? '',
      year: parts.get('year') ?? '',
      hour: includeTime ? parts.get('hour') ?? '00' : '00',
      minute: includeTime ? parts.get('minute') ?? '00' : '00',
    };
  }

  private pixelRuntime(): PixelPerfectRuntime {
    return this as unknown as PixelPerfectRuntime;
  }
}
