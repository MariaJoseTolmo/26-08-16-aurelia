import { Injectable } from '@nestjs/common';
import { InspectionFindingStatus } from '@aurelia/contracts';
import { FilesService } from '../files/files.service';
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
};

type RuntimeService = {
  drawFindingsSummaryTable: (document: ReportPdfDocument, context: ReportContext, findings: UnknownRecord[]) => void;
  drawGroupTitle: (document: ReportPdfDocument, group: FindingGroup, count: number, continuation: boolean) => void;
  renderFinding: (
    document: ReportPdfDocument,
    context: ReportContext,
    finding: UnknownRecord,
    groupIndex: number,
    group: FindingGroup,
    assets: Map<string, EvidenceAsset>,
  ) => void;
  buildTimelineEvents: (inspection: UnknownRecord, findings: UnknownRecord[], comments: UnknownRecord[]) => TimelineEvent[];
  drawTimelineEvent: (document: ReportPdfDocument, event: TimelineEvent, index: number, height: number) => void;
  asString: (value: unknown) => string;
  asArray: (value: unknown) => unknown[];
  asRecord: (value: unknown) => UnknownRecord;
  asNumber: (value: unknown, fallback: number) => number;
  textHeight: (document: ReportPdfDocument, value: string, width: number, fontSize: number) => number;
  drawChip: (document: ReportPdfDocument, label: string, x: number, y: number, width: number, background: string, color: string) => void;
  severityLabel: (value: string) => string;
  severityBackground: (value: string) => string;
  severityColor: (value: string) => string;
  statusColors: (value: string) => { background: string; text: string };
  statusLabel: (value: string) => string;
  shortName: (value: string) => string;
  slaColor: (finding: UnknownRecord) => string;
  summarySlaLabel: (finding: UnknownRecord) => string;
  closureLabel: (finding: UnknownRecord) => string;
  timestamp: (value: string) => number;
  formatDate: (value: string) => string;
  formatDateTime: (value: string) => string;
  resolveEvidenceSlot: (evidence: UnknownRecord) => 'before' | 'after' | 'other';
  estimateFindingHeight: (document: ReportPdfDocument, finding: UnknownRecord) => number;
};

const MARGIN_X = 42;
const PAGE_WIDTH = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const CONTENT_BOTTOM = 780;
const NAVY = '#001E39';
const GOLD = '#C8A064';
const BORDER = '#D1D1D1';
const MUTED = '#646464';
const TEXT = '#131313';
const LIGHT = '#F7F7F7';
const YELLOW_BG = '#FFEAB8';

@Injectable()
export class InspectionDetailReportPdfFidelityService extends InspectionDetailReportPdfService {
  private generatedAt = '';

  constructor(pdf: ReportPdfService, files: FilesService) {
    super(pdf, files);
  }

  override async render(payload: Record<string, unknown>): Promise<Buffer> {
    this.generatedAt = this.stringValue(payload.generatedAt) || new Date().toISOString();
    const runtime = this.runtime();
    const baseSummaryTable = runtime.drawFindingsSummaryTable.bind(this);
    const baseFinding = runtime.renderFinding.bind(this);

    runtime.drawFindingsSummaryTable = (document, context, findings) => {
      this.drawRoundedSummaryTable(document, context, findings, baseSummaryTable);
    };
    runtime.drawGroupTitle = (document, group, count) => {
      this.drawPersistentGroupTitle(document, group, count);
    };
    runtime.renderFinding = (document, context, finding, groupIndex, group, assets) => {
      this.drawBorderedFinding(document, context, finding, groupIndex, group, assets, baseFinding);
    };
    runtime.buildTimelineEvents = (inspection, findings, comments) => this.buildFidelityTimeline(inspection, findings, comments);
    runtime.drawTimelineEvent = (document, event, index, height) => this.drawFidelityTimelineEvent(document, event, index, height);

    return super.render(payload);
  }

  private drawRoundedSummaryTable(
    document: ReportPdfDocument,
    context: ReportContext,
    findings: UnknownRecord[],
    baseSummaryTable: (document: ReportPdfDocument, context: ReportContext, findings: UnknownRecord[]) => void,
  ) {
    const runtime = this.runtime();
    const widths = [27, 173.5, 87, 88.5, 75, 60];
    const estimatedRowsHeight = findings.reduce((total, finding) => {
      const condition = runtime.asString(finding.detectedCondition) || runtime.asString(finding.description) || runtime.asString(finding.title) || 'Sin descripción';
      const conditionEn = runtime.asString(finding.detectedConditionEn) || runtime.asString(finding.descriptionEn);
      const rowHeight = Math.max(
        43,
        Math.min(
          58,
          18
            + runtime.textHeight(document, condition, widths[1] - 16, 7.2)
            + (conditionEn ? runtime.textHeight(document, conditionEn, widths[1] - 16, 6.5) : 0),
        ),
      );
      return total + rowHeight;
    }, 0);
    const totalHeight = 28 + estimatedRowsHeight;
    const startY = document.y;

    if (findings.length > 0 && startY + totalHeight <= CONTENT_BOTTOM - 120) {
      document.save();
      document.roundedRect(MARGIN_X, startY, CONTENT_WIDTH, totalHeight, 5).clip();
      baseSummaryTable(document, context, findings);
      document.restore();
      document.roundedRect(MARGIN_X, startY, CONTENT_WIDTH, document.y - startY, 5).strokeColor(BORDER).lineWidth(0.7).stroke();
    } else {
      baseSummaryTable(document, context, findings);
    }

    document.y += 14;
  }

  private drawPersistentGroupTitle(document: ReportPdfDocument, group: FindingGroup, count: number) {
    const y = document.y;
    document.rect(MARGIN_X, y + 1, 2.2, 12).fill(GOLD);
    document.font('Helvetica-Bold').fontSize(7.3).fillColor(NAVY).text(group.title.toUpperCase(), MARGIN_X + 9, y + 2, { width: 285 });
    const noun = count === 1 ? '1 observación / 1 observation' : `${count} observaciones / ${count} observations`;
    const badge = `${noun}${group.badgeSuffix ? ` · ${group.badgeSuffix}` : ''}`;
    document.font('Helvetica-Bold').fontSize(5.8);
    const width = Math.min(245, Math.max(105, document.widthOfString(badge) + 14));
    document.roundedRect(MARGIN_X + CONTENT_WIDTH - width, y, width, 15, 4).fill(group.background);
    document.font('Helvetica-Bold').fontSize(5.8).fillColor(group.textColor).text(badge, MARGIN_X + CONTENT_WIDTH - width + 7, y + 4, {
      width: width - 14,
      align: 'center',
      height: 8,
      ellipsis: true,
    });
    document.y = y + 25;
  }

  private drawBorderedFinding(
    document: ReportPdfDocument,
    context: ReportContext,
    finding: UnknownRecord,
    groupIndex: number,
    group: FindingGroup,
    assets: Map<string, EvidenceAsset>,
    baseFinding: (
      document: ReportPdfDocument,
      context: ReportContext,
      finding: UnknownRecord,
      groupIndex: number,
      group: FindingGroup,
      assets: Map<string, EvidenceAsset>,
    ) => void,
  ) {
    const startY = document.y;
    baseFinding(document, context, finding, groupIndex, group, assets);
    const endY = Math.max(startY + 54, document.y - 12);
    document.roundedRect(MARGIN_X, startY, CONTENT_WIDTH, endY - startY, 5).strokeColor(BORDER).lineWidth(0.7).stroke();
    document.y += 4;
  }

  private buildFidelityTimeline(inspection: UnknownRecord, findings: UnknownRecord[], comments: UnknownRecord[]): TimelineEvent[] {
    const runtime = this.runtime();
    const inspector = runtime.asString(inspection.inspectorName) || 'inspector no identificado';
    const company = findings.map((finding) => runtime.asString(finding.responsibleCompanyName)).find(Boolean) || runtime.asString(inspection.companyName) || '—';
    const responsible = findings.map((finding) => runtime.asString(finding.ownerUserName)).find(Boolean) || '—';
    const events: TimelineEvent[] = [{
      date: runtime.asString(inspection.startedAt) || runtime.asString(inspection.createdAt),
      title: 'Inspección inicial · Initial inspection',
      detail: `Inspección realizada por ${inspector}. Se detectaron ${findings.length} observaciones.`,
      summary: `${findings.length} observaciones detectadas · Inspector: ${inspector} · Empresa EECC notificada: ${company} · Responsable asignado: ${responsible}`,
      color: NAVY,
    }];

    let maxFollowupSequence = 0;
    for (const finding of findings) {
      const number = runtime.asNumber(finding.observationNumber, 0);
      const label = runtime.asString(finding.title) || runtime.asString(finding.detectedCondition) || 'Observación';
      const evidences = runtime.asArray(finding.evidences).map((value) => runtime.asRecord(value));
      const afterEvidence = evidences.find((evidence) => runtime.resolveEvidenceSlot(evidence) === 'after');
      const status = runtime.asString(finding.status);
      const executionSignal = runtime.asString(finding.executedActionDescription) || status === InspectionFindingStatus.IN_PROGRESS || status === InspectionFindingStatus.CLOSED || status === InspectionFindingStatus.REJECTED;
      const executedAt = runtime.asString(finding.executedAt)
        || runtime.asString(afterEvidence?.createdAt)
        || (executionSignal ? runtime.asString(finding.updatedAt) : '');

      if (executedAt) {
        const executor = runtime.asString(finding.executedByUserName) || runtime.asString(finding.ownerUserName) || 'Responsable';
        events.push({
          date: executedAt,
          title: `Obs. ${number} ejecutada · Obs. ${number} executed`,
          detail: `${executor} marcó la Obs. ${number} como ejecutada y adjuntó evidencia fotográfica.`,
          summary: `Obs. ${number} · ${label} · Evidencia fotográfica adjunta · Pendiente aprobación Admin GF`,
          color: NAVY,
        });
      }

      if (runtime.asString(finding.rejectedAt)) {
        events.push({
          date: runtime.asString(finding.rejectedAt),
          title: `Obs. ${number} rechazada · Obs. ${number} rejected`,
          detail: `${runtime.asString(finding.rejectedByUserName) || 'Admin GF'} rechazó la evidencia de la observación.`,
          summary: runtime.asString(finding.rejectionReason) || label,
          color: '#BD3B5B',
        });
      }

      if (runtime.asString(finding.closedAt)) {
        events.push({
          date: runtime.asString(finding.closedAt),
          title: `Obs. ${number} aprobada y cerrada · Obs. ${number} approved and closed`,
          detail: `${runtime.asString(finding.closedByUserName) || 'Admin GF'} aprobó el cierre de la Obs. ${number}.`,
          summary: `Obs. ${number} · Cerrada · ${runtime.closureLabel(finding)}`,
          color: NAVY,
        });
      }

      for (const value of runtime.asArray(finding.followups)) {
        const followup = runtime.asRecord(value);
        const sequence = runtime.asNumber(followup.sequenceNumber, 0);
        maxFollowupSequence = Math.max(maxFollowupSequence, sequence);
        events.push({
          date: runtime.asString(followup.performedAt) || runtime.asString(followup.createdAt),
          title: `Seguimiento ${sequence} · Follow-up ${sequence}`,
          detail: runtime.asString(followup.description) || 'Seguimiento registrado.',
          summary: runtime.asString(followup.result),
          color: GOLD,
        });
      }
    }

    comments.forEach((comment) => {
      events.push({
        date: runtime.asString(comment.createdAt),
        title: 'Comentario registrado · Comment added',
        detail: runtime.asString(comment.body) || runtime.asString(comment.description) || 'Comentario',
        summary: '',
        color: NAVY,
      });
    });

    const active = findings.filter((finding) => {
      const status = runtime.asString(finding.status);
      return status !== InspectionFindingStatus.CLOSED && status !== InspectionFindingStatus.CANCELLED;
    });
    if (active.length > 0) {
      const executedCount = active.filter((finding) => runtime.asString(finding.status) === InspectionFindingStatus.IN_PROGRESS).length;
      const openCount = active.filter((finding) => runtime.asString(finding.status) === InspectionFindingStatus.OPEN).length;
      const rejectedCount = active.filter((finding) => runtime.asString(finding.status) === InspectionFindingStatus.REJECTED).length;
      const detailParts = [
        executedCount > 0 ? `${executedCount} observación${executedCount === 1 ? '' : 'es'} ejecutada${executedCount === 1 ? '' : 's'} pendiente${executedCount === 1 ? '' : 's'} de aprobación del Admin GF.` : '',
        openCount > 0 ? `${openCount} observación${openCount === 1 ? '' : 'es'} abierta${openCount === 1 ? '' : 's'} pendiente${openCount === 1 ? '' : 's'} de acción por EECC.` : '',
        rejectedCount > 0 ? `${rejectedCount} observación${rejectedCount === 1 ? '' : 'es'} rechazada${rejectedCount === 1 ? '' : 's'} pendiente${rejectedCount === 1 ? '' : 's'} de corrección.` : '',
      ].filter(Boolean);
      const summary = active.slice(0, 5).map((finding) => {
        const number = runtime.asNumber(finding.observationNumber, 0);
        return `Obs. ${number}: ${runtime.statusLabel(runtime.asString(finding.status))}`;
      }).join(' · ');
      events.push({
        date: runtime.asString(inspection.updatedAt) || this.generatedAt,
        title: `Seguimiento ${Math.max(1, maxFollowupSequence + 1)} · Follow-up ${Math.max(1, maxFollowupSequence + 1)} (en curso / ongoing)`,
        detail: detailParts.join(' '),
        summary,
        color: GOLD,
        ongoing: true,
      });
    }

    return events.filter((event) => event.date).sort((left, right) => runtime.timestamp(left.date) - runtime.timestamp(right.date));
  }

  private drawFidelityTimelineEvent(document: ReportPdfDocument, event: TimelineEvent, index: number, height: number) {
    const runtime = this.runtime();
    const y = document.y;
    const circleX = MARGIN_X + 8;
    if (index > 0) document.moveTo(circleX, y - 16).lineTo(circleX, y + 15).strokeColor(BORDER).lineWidth(0.8).stroke();
    document.circle(circleX, y + 8, 9).fill(event.color);
    if (event.ongoing || event.color === GOLD) {
      document.moveTo(circleX - 3.3, y + 8).lineTo(circleX + 3.5, y + 8).strokeColor(NAVY).lineWidth(1.1).stroke();
      document.moveTo(circleX + 1, y + 5).lineTo(circleX + 4, y + 8).lineTo(circleX + 1, y + 11).strokeColor(NAVY).lineWidth(1.1).stroke();
    } else {
      document.moveTo(circleX - 3.5, y + 8).lineTo(circleX - 0.8, y + 10.5).lineTo(circleX + 4, y + 5.5).strokeColor('#FFFFFF').lineWidth(1.2).stroke();
    }
    document.font('Helvetica-Bold').fontSize(8.2).fillColor(TEXT).text(event.title, MARGIN_X + 26, y, { width: 330 });
    const dateLabel = event.ongoing
      ? `${runtime.formatDate(event.date)} · Estado actual / Current status`
      : runtime.formatDateTime(event.date);
    document.font('Helvetica').fontSize(6.5).fillColor(MUTED).text(dateLabel, MARGIN_X + 350, y + 1, { width: 160, align: 'right' });
    document.font('Helvetica').fontSize(7.4).fillColor('#333333').text(event.detail, MARGIN_X + 26, y + 17, { width: CONTENT_WIDTH - 26, lineGap: 1.5 });
    if (event.summary) {
      const summaryY = y + height - 28;
      document.roundedRect(MARGIN_X + 26, summaryY, CONTENT_WIDTH - 26, 22, 3).fillAndStroke(event.ongoing ? YELLOW_BG : LIGHT, event.ongoing ? GOLD : BORDER);
      document.font('Helvetica').fontSize(6.4).fillColor(MUTED).text(event.summary, MARGIN_X + 34, summaryY + 7, {
        width: CONTENT_WIDTH - 42,
        height: 10,
        ellipsis: true,
      });
    }
    document.y = y + height;
  }

  private runtime(): RuntimeService {
    return this as unknown as RuntimeService;
  }

  private stringValue(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return String(value);
    return '';
  }
}
