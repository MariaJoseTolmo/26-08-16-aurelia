import { Injectable } from '@nestjs/common';
import { InspectionFindingStatus } from '@aurelia/contracts';
import { FilesService } from '../files/files.service';
import { InspectionDetailReportPdfFidelityService } from './inspection-detail-report-pdf-fidelity.service';
import { InspectionDetailReportPdfService } from './inspection-detail-report-pdf.service';
import { ReportPdfService, type ReportPdfDocument } from './report-pdf.service';

type RuntimeMethod = (...args: unknown[]) => unknown;
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

type TimelineSla = {
  es: string;
  en: string;
  overdue: boolean;
};

type Runtime = {
  generatedAt: string;
  asString: (value: unknown) => string;
  formatDate: (value: string) => string;
  formatDateTime: (value: string) => string;
  drawFindingsSummaryTable: RuntimeMethod;
  drawGroupTitle: (document: ReportPdfDocument, group: FindingGroup, count: number, continuation: boolean) => void;
  renderFinding: (
    document: ReportPdfDocument,
    context: ReportContext,
    finding: UnknownRecord,
    groupIndex: number,
    group: FindingGroup,
    assets: Map<string, EvidenceAsset>,
  ) => void;
  renderFindingGroups: RuntimeMethod;
  estimateFindingHeight: (document: ReportPdfDocument, finding: UnknownRecord) => number;
  addCompactPage: (document: ReportPdfDocument, context: ReportContext) => void;
  buildTimelineEvents: RuntimeMethod;
  drawTimelineEvent: RuntimeMethod;
  addFooters: RuntimeMethod;
  drawRoundedSummaryTable: RuntimeMethod;
  drawPersistentGroupTitle: RuntimeMethod;
  drawBorderedFinding: RuntimeMethod;
  buildFidelityTimeline: RuntimeMethod;
  render: RuntimeMethod;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const CONTENT_BOTTOM = 780;
const FOOTER_Y = 804;
const NAVY = '#001E39';
const GOLD = '#C8A064';
const BORDER = '#D1D1D1';
const MUTED = '#646464';
const TEXT = '#131313';
const LIGHT = '#F7F7F7';
const YELLOW_BG = '#FFEAB8';
const GREEN = '#2A5C16';
const GREEN_BORDER = '#6CC24A';
const GREEN_BG = '#E0FFD3';
const TEAL = '#006153';
const TEAL_BORDER = '#00B398';
const TEAL_BG = '#C5FFF6';
const RED = '#570B1D';
const RED_BORDER = '#BD3B5B';
const RED_BG = '#FFD0DB';
const YELLOW = '#463100';
const YELLOW_BORDER = '#E8A820';

@Injectable()
export class InspectionDetailReportPdfRuntimeService extends InspectionDetailReportPdfFidelityService {
  constructor(pdf: ReportPdfService, files: FilesService) {
    super(pdf, files);
  }

  override async render(payload: Record<string, unknown>): Promise<Buffer> {
    const runtime = this as unknown as Runtime;
    const base = InspectionDetailReportPdfService.prototype as unknown as Runtime;
    const fidelity = InspectionDetailReportPdfFidelityService.prototype as unknown as Runtime;
    runtime.generatedAt = typeof payload.generatedAt === 'string' ? payload.generatedAt : new Date().toISOString();
    runtime.asString = (value) => this.normalizeValue(value);
    const baseSummaryTable = base.drawFindingsSummaryTable.bind(this);
    const baseFinding = base.renderFinding.bind(this);

    runtime.drawFindingsSummaryTable = (...args) => fidelity.drawRoundedSummaryTable.call(this, ...args, baseSummaryTable);
    runtime.drawGroupTitle = (document, group, count) => fidelity.drawPersistentGroupTitle.call(this, document, group, count);
    runtime.renderFinding = (...args) => fidelity.drawBorderedFinding.call(this, ...args, baseFinding);
    runtime.renderFindingGroups = (...args) => {
      this.renderGroupsWithoutOrphanHeader(
        args[0] as ReportPdfDocument,
        args[1] as ReportContext,
        args[2] as UnknownRecord[],
        args[3] as Map<string, EvidenceAsset>,
        runtime,
      );
    };
    runtime.buildTimelineEvents = (...args) => {
      const inspection = args[0] as UnknownRecord;
      const findings = args[1] as UnknownRecord[];
      const events = fidelity.buildFidelityTimeline.call(this, ...args) as TimelineEvent[];
      return this.enrichTimelineEvents(events, inspection, findings, runtime)
        .map((event, index, enrichedEvents) => ({ ...event, last: index === enrichedEvents.length - 1 }));
    };
    runtime.drawTimelineEvent = (...args) => {
      const [document, event, , height] = args;
      this.drawConnectedTimelineEvent(
        document as ReportPdfDocument,
        event as TimelineEvent,
        Number(height),
        runtime,
      );
    };
    runtime.addFooters = (...args) => {
      this.drawFooters(
        args[0] as ReportPdfDocument,
        args[1] as ReportContext,
        runtime,
      );
    };

    return base.render.call(this, payload) as Promise<Buffer>;
  }

  private renderGroupsWithoutOrphanHeader(
    document: ReportPdfDocument,
    context: ReportContext,
    findings: UnknownRecord[],
    assets: Map<string, EvidenceAsset>,
    runtime: Runtime,
  ) {
    const groups: FindingGroup[] = [
      {
        statuses: [InspectionFindingStatus.IN_PROGRESS],
        title: 'Observaciones ejecutadas / Executed observations',
        badgeSuffix: 'Pendiente aprobación Admin GF / Pending Admin GF approval',
        color: TEAL_BORDER,
        background: TEAL_BG,
        textColor: TEAL,
      },
      {
        statuses: [InspectionFindingStatus.OPEN],
        title: 'Observaciones abiertas / Open observations',
        badgeSuffix: 'Pendiente EECC / Pending EECC',
        color: YELLOW_BORDER,
        background: YELLOW_BG,
        textColor: YELLOW,
      },
      {
        statuses: [InspectionFindingStatus.CLOSED],
        title: 'Observaciones cerradas / Closed observations',
        badgeSuffix: '',
        color: GREEN_BORDER,
        background: GREEN_BG,
        textColor: GREEN,
      },
      {
        statuses: [InspectionFindingStatus.REJECTED],
        title: 'Observaciones rechazadas / Rejected observations',
        badgeSuffix: 'Pendiente de corrección / Pending correction',
        color: RED_BORDER,
        background: RED_BG,
        textColor: RED,
      },
      {
        statuses: [InspectionFindingStatus.CANCELLED],
        title: 'Observaciones canceladas / Cancelled observations',
        badgeSuffix: '',
        color: BORDER,
        background: LIGHT,
        textColor: MUTED,
      },
    ];

    for (const group of groups) {
      const rows = findings.filter((finding) => group.statuses.includes(runtime.asString(finding.status) as InspectionFindingStatus));
      if (rows.length === 0) continue;

      const firstFindingHeight = runtime.estimateFindingHeight(document, rows[0]);
      if (document.y + 25 + firstFindingHeight > CONTENT_BOTTOM) {
        runtime.addCompactPage(document, context);
      }

      runtime.drawGroupTitle(document, group, rows.length, false);
      rows.forEach((finding, index) => {
        const required = runtime.estimateFindingHeight(document, finding);
        if (document.y + required > CONTENT_BOTTOM) {
          runtime.addCompactPage(document, context);
          runtime.drawGroupTitle(document, group, rows.length, true);
        }
        runtime.renderFinding(document, context, finding, index, group, assets);
      });
    }
  }

  private enrichTimelineEvents(
    events: TimelineEvent[],
    inspection: UnknownRecord,
    findings: UnknownRecord[],
    runtime: Runtime,
  ): TimelineEvent[] {
    const inspector = runtime.asString(inspection.inspectorName) || 'inspector no identificado';
    const coordinatesCaptured = Boolean(runtime.asString(inspection.latitude) && runtime.asString(inspection.longitude));

    return events.map((event) => {
      if (event.title === 'Inspección inicial · Initial inspection') {
        const count = findings.length;
        const spanish = `Inspección realizada por ${inspector}. Se detectaron ${count} observación${count === 1 ? '' : 'es'}.${coordinatesCaptured ? ' Coordenadas capturadas automáticamente vía GPS.' : ''}`;
        const english = `Inspection conducted by ${inspector}. ${count} observation${count === 1 ? '' : 's'} detected.${coordinatesCaptured ? ' Coordinates automatically captured via GPS.' : ''}`;
        return { ...event, detail: this.bilingualDetail(spanish, english) };
      }

      if (event.ongoing) {
        return {
          ...event,
          detail: this.buildOngoingDetail(findings, runtime),
          summary: this.buildOngoingSummary(findings, event.date, runtime),
        };
      }

      const observationNumber = this.observationNumberFromTitle(event.title);
      if (observationNumber === null) return event;
      const finding = findings.find((item) => this.numberValue(item.observationNumber) === observationNumber);
      if (!finding) return event;

      const responsibleCompany = runtime.asString(finding.responsibleCompanyName);
      if (event.title.includes(' ejecutada · ')) {
        const executor = runtime.asString(finding.executedByUserName) || runtime.asString(finding.ownerUserName) || 'Responsable';
        const actor = responsibleCompany && !executor.includes(responsibleCompany) ? `${executor} (${responsibleCompany})` : executor;
        const sla = this.timelineSla(finding, event.date, runtime);
        const overdueEs = sla?.overdue ? ' SLA ya vencido al momento de la ejecución.' : '';
        const overdueEn = sla?.overdue ? ' SLA already overdue at time of execution.' : '';
        const summarySla = sla ? ` · SLA: ${sla.es}` : '';
        return {
          ...event,
          detail: this.bilingualDetail(
            `${actor} marcó la Obs. ${observationNumber} como ejecutada y adjuntó evidencia fotográfica.${overdueEs}`,
            `${actor} marked Obs. ${observationNumber} as executed and uploaded photographic evidence.${overdueEn}`,
          ),
          summary: `${event.summary}${summarySla}`,
        };
      }

      if (event.title.includes(' aprobada y cerrada · ')) {
        const approver = runtime.asString(finding.closedByUserName) || 'Admin GF';
        return {
          ...event,
          detail: this.bilingualDetail(
            `${approver} revisó la evidencia fotográfica y aprobó el cierre de la Obs. ${observationNumber}.`,
            `${approver} reviewed photographic evidence and approved closure of Obs. ${observationNumber}.`,
          ),
        };
      }

      if (event.title.includes(' rechazada · ')) {
        const approver = runtime.asString(finding.rejectedByUserName) || 'Admin GF';
        const sla = this.timelineSla(finding, event.date, runtime);
        return {
          ...event,
          detail: this.bilingualDetail(
            `${approver} rechazó la evidencia de la Obs. ${observationNumber}.`,
            `${approver} rejected the evidence for Obs. ${observationNumber}.`,
          ),
          summary: `${event.summary}${sla ? ` · SLA: ${sla.es}` : ''}`,
        };
      }

      return event;
    });
  }

  private buildOngoingDetail(findings: UnknownRecord[], runtime: Runtime): string {
    const active = findings.filter((finding) => {
      const status = runtime.asString(finding.status);
      return status !== InspectionFindingStatus.CLOSED && status !== InspectionFindingStatus.CANCELLED;
    });
    const executedCount = active.filter((finding) => runtime.asString(finding.status) === InspectionFindingStatus.IN_PROGRESS).length;
    const openCount = active.filter((finding) => runtime.asString(finding.status) === InspectionFindingStatus.OPEN).length;
    const rejectedCount = active.filter((finding) => runtime.asString(finding.status) === InspectionFindingStatus.REJECTED).length;
    const spanish = [
      executedCount > 0 ? `${executedCount} observación${executedCount === 1 ? '' : 'es'} ejecutada${executedCount === 1 ? '' : 's'} pendiente${executedCount === 1 ? '' : 's'} de aprobación del Admin GF.` : '',
      openCount > 0 ? `${openCount} observación${openCount === 1 ? '' : 'es'} abierta${openCount === 1 ? '' : 's'} pendiente${openCount === 1 ? '' : 's'} de acción por EECC.` : '',
      rejectedCount > 0 ? `${rejectedCount} observación${rejectedCount === 1 ? '' : 'es'} rechazada${rejectedCount === 1 ? '' : 's'} pendiente${rejectedCount === 1 ? '' : 's'} de corrección.` : '',
    ].filter(Boolean).join(' ');
    const english = [
      executedCount > 0 ? `${executedCount} executed observation${executedCount === 1 ? '' : 's'} pending Admin GF approval.` : '',
      openCount > 0 ? `${openCount} open observation${openCount === 1 ? '' : 's'} pending EECC action.` : '',
      rejectedCount > 0 ? `${rejectedCount} rejected observation${rejectedCount === 1 ? '' : 's'} pending correction.` : '',
    ].filter(Boolean).join(' ');
    return this.bilingualDetail(spanish, english);
  }

  private buildOngoingSummary(findings: UnknownRecord[], referenceDate: string, runtime: Runtime): string {
    return findings
      .filter((finding) => {
        const status = runtime.asString(finding.status);
        return status !== InspectionFindingStatus.CLOSED && status !== InspectionFindingStatus.CANCELLED;
      })
      .sort((left, right) => this.numberValue(left.observationNumber) - this.numberValue(right.observationNumber))
      .slice(0, 5)
      .map((finding) => {
        const number = this.numberValue(finding.observationNumber);
        const status = runtime.asString(finding.status);
        const sla = this.timelineSla(finding, referenceDate, runtime);
        if (status === InspectionFindingStatus.IN_PROGRESS) {
          return `Obs. ${number}: Ejecutada · pendiente aprobación Admin GF${sla ? ` · ${sla.es}` : ''}`;
        }
        if (status === InspectionFindingStatus.OPEN) {
          return `Obs. ${number}: Abierta${sla ? ` · ${sla.es}` : ''}`;
        }
        if (status === InspectionFindingStatus.REJECTED) {
          return `Obs. ${number}: Rechazada · pendiente de corrección${sla ? ` · ${sla.es}` : ''}`;
        }
        return `Obs. ${number}: ${runtime.asString(finding.status)}`;
      })
      .join(' · ');
  }

  private timelineSla(finding: UnknownRecord, referenceDate: string, runtime: Runtime): TimelineSla | null {
    const dueAt = runtime.asString(finding.dueAt);
    if (!dueAt) return null;
    const due = new Date(dueAt);
    const reference = new Date(referenceDate || runtime.generatedAt);
    if (Number.isNaN(due.getTime()) || Number.isNaN(reference.getTime())) return null;
    const overdue = reference.getTime() > due.getTime();
    const days = Math.max(0, Math.ceil(Math.abs(reference.getTime() - due.getTime()) / 86400000));
    const dayEs = days === 1 ? 'día' : 'días';
    const dayEn = days === 1 ? 'day' : 'days';
    return overdue
      ? { es: `SLA vencido ${days} ${dayEs}`, en: `SLA overdue by ${days} ${dayEn}`, overdue }
      : { es: `${days} ${dayEs} restantes`, en: `${days} ${dayEn} remaining`, overdue };
  }

  private bilingualDetail(spanish: string, english: string): string {
    return english ? `${spanish}\n${english}` : spanish;
  }

  private observationNumberFromTitle(title: string): number | null {
    const match = title.match(/Obs\.\s*(\d+)/);
    if (!match) return null;
    const value = Number(match[1]);
    return Number.isFinite(value) ? value : null;
  }

  private numberValue(value: unknown): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private normalizeValue(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return String(value);
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
    return '';
  }

  private drawConnectedTimelineEvent(
    document: ReportPdfDocument,
    event: TimelineEvent,
    height: number,
    runtime: Runtime,
  ) {
    const y = document.y;
    const circleX = MARGIN_X + 8;
    if (!event.last) {
      document
        .moveTo(circleX, y + 8)
        .lineTo(circleX, y + height + 8)
        .strokeColor(BORDER)
        .lineWidth(0.8)
        .stroke();
    }
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
    const [spanishDetail, ...englishParts] = event.detail.split('\n');
    const englishDetail = englishParts.join('\n').trim();
    const detailX = MARGIN_X + 26;
    const detailY = y + 17;
    const detailWidth = CONTENT_WIDTH - 26;
    document.font('Helvetica').fontSize(7.4).fillColor('#333333').text(spanishDetail, detailX, detailY, { width: detailWidth, lineGap: 1.5 });
    if (englishDetail) {
      document.font('Helvetica').fontSize(7.4);
      const spanishHeight = document.heightOfString(spanishDetail, { width: detailWidth, lineGap: 1.5 });
      document.font('Helvetica-Oblique').fontSize(7.1).fillColor(MUTED).text(englishDetail, detailX, detailY + spanishHeight + 1, { width: detailWidth, lineGap: 1.5 });
    }
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

  private drawFooters(document: ReportPdfDocument, context: ReportContext, runtime: Runtime) {
    const range = document.bufferedPageRange();
    for (let index = range.start; index < range.start + range.count; index += 1) {
      document.switchToPage(index);
      document.moveTo(MARGIN_X, FOOTER_Y).lineTo(MARGIN_X + CONTENT_WIDTH, FOOTER_Y).strokeColor(BORDER).lineWidth(0.5).stroke();
      document.font('Helvetica').fontSize(5.3).fillColor(MUTED).text('Generado por AurelIA SGA · Gold Fields Salares Norte · aurelia.goldfields.cl', MARGIN_X, FOOTER_Y + 14, { width: 285 });
      document.font('Helvetica').fontSize(5.3).fillColor(MUTED).text(`Generado / Generated: ${runtime.formatDateTime(context.generatedAt)} · Confidencial / Confidential`, 300, FOOTER_Y + 14, { width: 253, align: 'right' });
      document.font('Helvetica').fontSize(6).fillColor(MUTED).text(`${index - range.start + 1} / ${range.count}`, 520, FOOTER_Y + 28, { width: 33, align: 'right', height: PAGE_HEIGHT - FOOTER_Y - 28 });
    }
  }
}
