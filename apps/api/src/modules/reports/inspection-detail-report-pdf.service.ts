import { Injectable } from '@nestjs/common';
import { InspectionFindingStatus } from '@aurelia/contracts';
import { FilesService } from '../files/files.service';
import { GOLD_FIELDS_LOGO } from './inspection-report-assets';
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
  pending?: boolean;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const CONTENT_BOTTOM = 780;
const FOOTER_Y = 804;
const NAVY = '#001E39';
const BLUE = '#0D3862';
const GOLD = '#C8A064';
const BORDER = '#D1D1D1';
const MUTED = '#646464';
const TEXT = '#131313';
const LIGHT = '#F7F7F7';
const GREEN = '#2A5C16';
const GREEN_BORDER = '#6CC24A';
const GREEN_BG = '#E0FFD3';
const TEAL = '#006153';
const TEAL_BORDER = '#00B398';
const TEAL_BG = '#C5FFF6';
const RED = '#570B1D';
const RED_BORDER = '#BD3B5B';
const RED_BG = '#FFD0DB';
const ORANGE = '#532A0E';
const ORANGE_BG = '#FFE1CD';
const YELLOW = '#463100';
const YELLOW_BORDER = '#E8A820';
const YELLOW_BG = '#FFEAB8';
const PHOTO_BEFORE = '#D6EEF8';
const PHOTO_AFTER = '#DAFCCB';

@Injectable()
export class InspectionDetailReportPdfService {
  constructor(
    private readonly pdf: ReportPdfService,
    private readonly files: FilesService,
  ) {}

  async render(payload: Record<string, unknown>): Promise<Buffer> {
    const inspection = this.asRecord(payload.inspection);
    const findings = this.asArray(payload.findings).map((value) => this.asRecord(value));
    const comments = this.asArray(payload.comments).map((value) => this.asRecord(value));
    const inspectionNumber = this.asString(inspection.inspectionNumber) || this.resolveNumber(this.asString(inspection.title));
    const generatedAt = this.asString(payload.generatedAt) || new Date().toISOString();
    const inspectionDate = this.asString(inspection.startedAt) || this.asString(inspection.scheduledAt) || this.asString(inspection.createdAt);
    const context: ReportContext = { inspectionNumber, generatedAt, inspectionDate };
    const assets = await this.loadEvidenceAssets(payload);

    return this.pdf.render(async (document) => {
      this.addFirstPage(document, context);
      this.renderCover(document, context, inspection, findings, payload, assets);
      this.renderFindingGroups(document, context, findings, assets);
      this.renderTimeline(document, context, inspection, findings, comments);
      this.addFooters(document, context);
    }, {
      title: `Inspección ${inspectionNumber}`,
      subject: `Informe de inspección ${inspectionNumber}`,
    });
  }

  private renderCover(
    document: ReportPdfDocument,
    context: ReportContext,
    inspection: UnknownRecord,
    findings: UnknownRecord[],
    payload: Record<string, unknown>,
    assets: Map<string, EvidenceAsset>,
  ) {
    const closedCount = findings.filter((finding) => this.asString(finding.status) === InspectionFindingStatus.CLOSED).length;
    const closureRate = findings.length > 0 ? Math.round((closedCount / findings.length) * 100) : 0;
    const effectiveStatus = closureRate === 100 && findings.length > 0 ? InspectionFindingStatus.CLOSED : this.asString(inspection.status);
    const primaryResponsibleCompany = findings.map((finding) => this.asString(finding.responsibleCompanyName)).find(Boolean) || this.asString(inspection.companyName) || '—';
    const primaryResponsible = findings.map((finding) => this.asString(finding.ownerUserName)).find(Boolean) || '—';

    this.drawSummaryBand(document, [
      ['N° INSPECCIÓN /\nINSPECTION NO.', `#${context.inspectionNumber}`],
      ['FECHA / DATE', this.formatDate(context.inspectionDate)],
      ['ESTADO / STATUS', this.statusLabel(effectiveStatus)],
      ['% CIERRE / CLOSURE', `${closureRate}%`],
    ], effectiveStatus);

    this.sectionTitle(document, 'Datos generales / General information');
    this.drawGeneralGrid(document, [
      ['INSPECTOR', this.asString(inspection.inspectorName) || '—', 'ÁREA / AREA', this.asString(inspection.areaName) || '—'],
      ['EMPRESA /\nCOMPANY', this.asString(inspection.inspectorCompanyName) || this.inferInspectorCompany(inspection), 'SECTOR', this.asString(inspection.sectorName) || '—'],
      ['EMPRESA EECC', primaryResponsibleCompany, 'TIPO / TYPE', this.bilingualInspectionType(this.asString(inspection.inspectionTypeName))],
      ['RESPONSABLE EECC', primaryResponsible, 'UBICACIÓN /\nLOCATION', this.locationLabel(inspection)],
    ]);

    document.y += 5;
    this.drawFindingsSummaryTable(document, context, findings);

    const generalEvidence = this.findGeneralEvidence(payload, findings);
    const generalAsset = generalEvidence ? assets.get(this.asString(generalEvidence.fileId)) : undefined;
    this.ensureSpace(document, context, 128);
    this.sectionTitle(document, 'Fotografía general de la inspección');
    this.drawEvidenceCard(
      document,
      `Fotografía general · ${this.formatDateTime(this.asString(generalEvidence?.createdAt) || context.inspectionDate)}`,
      generalEvidence,
      generalAsset,
      MARGIN_X,
      document.y,
      241,
      91,
      PHOTO_BEFORE,
    );
    document.y += 99;
  }

  private renderFindingGroups(
    document: ReportPdfDocument,
    context: ReportContext,
    findings: UnknownRecord[],
    assets: Map<string, EvidenceAsset>,
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
      const rows = findings.filter((finding) => group.statuses.includes(this.asString(finding.status) as InspectionFindingStatus));
      if (rows.length === 0) continue;
      this.ensureSpace(document, context, 90);
      this.drawGroupTitle(document, group, rows.length, false);
      rows.forEach((finding, index) => {
        const required = this.estimateFindingHeight(document, finding);
        if (document.y + required > CONTENT_BOTTOM) {
          this.addCompactPage(document, context);
          this.drawGroupTitle(document, group, rows.length, true);
        }
        this.renderFinding(document, context, finding, index, group, assets);
      });
    }
  }

  private renderFinding(
    document: ReportPdfDocument,
    context: ReportContext,
    finding: UnknownRecord,
    groupIndex: number,
    group: FindingGroup,
    assets: Map<string, EvidenceAsset>,
  ) {
    const observationNumber = this.asNumber(finding.observationNumber, groupIndex + 1);
    const condition = this.asString(finding.detectedCondition) || this.asString(finding.description) || this.asString(finding.title) || 'Sin descripción registrada';
    const conditionEn = this.asString(finding.detectedConditionEn) || this.asString(finding.descriptionEn) || this.asString(finding.titleEn);
    const proposed = this.asString(finding.proposedCorrectiveAction);
    const proposedEn = this.asString(finding.proposedCorrectiveActionEn);
    const executed = this.asString(finding.executedActionDescription);
    const executedEn = this.asString(finding.executedActionDescriptionEn);
    const rejectionReason = this.asString(finding.rejectionReason);
    const cancellationReason = this.asString(finding.cancellationReason);
    const status = this.asString(finding.status);
    const headerHeight = 46;
    const cardY = document.y;

    document.roundedRect(MARGIN_X, cardY, CONTENT_WIDTH, headerHeight, 5).fillAndStroke(group.background, BORDER);
    document.rect(MARGIN_X, cardY, 4, headerHeight).fill(group.color);
    document.font('Helvetica-Bold').fontSize(7.6).fillColor(BLUE).text(`#${context.inspectionNumber} · Obs. ${observationNumber}`, MARGIN_X + 13, cardY + 16, { width: 67 });
    document.font('Helvetica-Bold').fontSize(7.5).fillColor(TEXT).text(this.asString(finding.title) || condition, MARGIN_X + 82, cardY + 8, { width: 275, height: 20, ellipsis: true });
    if (conditionEn) document.font('Helvetica-Oblique').fontSize(6.6).fillColor(MUTED).text(conditionEn, MARGIN_X + 82, cardY + 28, { width: 275, height: 11, ellipsis: true });

    const statusLabel = this.statusLabel(status);
    const severityLabel = this.severityLabel(this.asString(finding.severity));
    this.drawChip(document, statusLabel, MARGIN_X + 362, cardY + 14, 72, group.background, group.textColor);
    this.drawChip(document, severityLabel, MARGIN_X + 438, cardY + 14, 66, this.severityBackground(this.asString(finding.severity)), this.severityColor(this.asString(finding.severity)));

    let y = cardY + headerHeight + 12;
    y = this.drawLabeledText(document, 'DESCRIPCIÓN / DESCRIPTION', condition, conditionEn, y);

    if (status === InspectionFindingStatus.CLOSED && executed) {
      y = this.drawLabeledText(document, 'ACCIÓN EJECUTADA / ACTION TAKEN', executed, executedEn, y);
    } else if (proposed) {
      y = this.drawLabeledText(document, 'MEDIDAS CORRECTIVAS / CORRECTIVE ACTIONS', proposed, proposedEn, y);
    }

    if (status === InspectionFindingStatus.REJECTED && rejectionReason) {
      y = this.drawLabeledText(document, 'MOTIVO DE RECHAZO / REJECTION REASON', rejectionReason, '', y, RED);
    }
    if (status === InspectionFindingStatus.CANCELLED && cancellationReason) {
      y = this.drawLabeledText(document, 'MOTIVO DE CANCELACIÓN / CANCELLATION REASON', cancellationReason, '', y, MUTED);
    }

    const responsible = [this.asString(finding.ownerUserName), this.asString(finding.responsibleCompanyName)].filter(Boolean).join(' · ') || 'Sin responsable asignado';
    y = this.drawInlineRow(document, 'RESPONSABLE / RESPONSIBLE', responsible, y);

    if (status === InspectionFindingStatus.CLOSED) {
      const approvedBy = [this.asString(finding.closedByUserName), this.formatDateTime(this.asString(finding.closedAt))].filter((value) => value && value !== '—').join(' · ');
      if (approvedBy) y = this.drawInlineRow(document, 'APROBADO POR / APPROVED BY', approvedBy, y);
      y = this.drawInlineRow(document, 'DÍAS DE CIERRE / DAYS TO CLOSE', this.closureLabel(finding), y, GREEN);
    } else if (status === InspectionFindingStatus.REJECTED) {
      const rejectedBy = [this.asString(finding.rejectedByUserName), this.formatDateTime(this.asString(finding.rejectedAt))].filter((value) => value && value !== '—').join(' · ');
      if (rejectedBy) y = this.drawInlineRow(document, 'RECHAZADO POR / REJECTED BY', rejectedBy, y, RED);
      y = this.drawInlineRow(document, 'SLA', this.slaLabel(finding), y, RED);
    } else if (status !== InspectionFindingStatus.CANCELLED) {
      y = this.drawInlineRow(document, 'SLA', this.slaLabel(finding), y, this.slaColor(finding));
    }

    const evidences = this.asArray(finding.evidences).map((value) => this.asRecord(value));
    if (evidences.length > 0) {
      document.font('Helvetica-Bold').fontSize(5.9).fillColor(MUTED).text('EVIDENCIA FOTOGRÁFICA / PHOTOGRAPHIC EVIDENCE', MARGIN_X + 10, y + 4, { width: 250 });
      y += 19;
      const before = evidences.find((evidence) => this.resolveEvidenceSlot(evidence) === 'before') ?? evidences[0];
      const after = evidences.find((evidence) => this.resolveEvidenceSlot(evidence) === 'after') ?? evidences.find((evidence) => evidence !== before);
      const width = 241;
      this.drawEvidenceCard(document, `Antes / Before · ${this.formatDateTime(this.asString(before?.createdAt))}`, before, assets.get(this.asString(before?.fileId)), MARGIN_X + 10, y, width, 91, PHOTO_BEFORE);
      if (after) this.drawEvidenceCard(document, `Después / After · ${this.formatDateTime(this.asString(after.createdAt))}`, after, assets.get(this.asString(after.fileId)), MARGIN_X + 260, y, width, 91, PHOTO_AFTER);
      y += 101;
    }

    document.y = y + 12;
  }

  private renderTimeline(
    document: ReportPdfDocument,
    context: ReportContext,
    inspection: UnknownRecord,
    findings: UnknownRecord[],
    comments: UnknownRecord[],
  ) {
    this.addCompactPage(document, context);
    this.sectionTitle(document, 'Historial de seguimiento / Follow-up history');
    const events = this.buildTimelineEvents(inspection, findings, comments);

    for (const [index, event] of events.entries()) {
      const eventHeight = Math.max(52, 34 + this.textHeight(document, event.detail, CONTENT_WIDTH - 72, 7.4) + (event.summary ? 30 : 0));
      if (document.y + eventHeight > CONTENT_BOTTOM - 150) {
        this.addCompactPage(document, context);
        this.sectionTitle(document, 'Historial de seguimiento / Follow-up history');
      }
      this.drawTimelineEvent(document, event, index, eventHeight);
    }

    if (document.y + 170 > CONTENT_BOTTOM) this.addCompactPage(document, context);
    document.y += 10;
    document.moveTo(MARGIN_X, document.y).lineTo(MARGIN_X + CONTENT_WIDTH, document.y).strokeColor(BORDER).lineWidth(0.6).stroke();
    document.y += 18;
    this.sectionTitle(document, 'Firmas / Signatures');
    this.drawSignatures(document, inspection, findings);
  }

  private buildTimelineEvents(inspection: UnknownRecord, findings: UnknownRecord[], comments: UnknownRecord[]): TimelineEvent[] {
    const events: TimelineEvent[] = [{
      date: this.asString(inspection.startedAt) || this.asString(inspection.createdAt),
      title: 'Inspección inicial · Initial inspection',
      detail: `Inspección realizada por ${this.asString(inspection.inspectorName) || 'inspector no identificado'}. Se detectaron ${findings.length} observaciones.`,
      summary: `${findings.length} observaciones detectadas · Inspector: ${this.asString(inspection.inspectorName) || '—'} · Empresa EECC: ${findings.map((finding) => this.asString(finding.responsibleCompanyName)).find(Boolean) || this.asString(inspection.companyName) || '—'}`,
      color: NAVY,
    }];

    for (const finding of findings) {
      const number = this.asNumber(finding.observationNumber, 0);
      const label = this.asString(finding.title) || this.asString(finding.detectedCondition) || 'Observación';
      if (this.asString(finding.executedAt)) {
        events.push({
          date: this.asString(finding.executedAt),
          title: `Obs. ${number} ejecutada · Obs. ${number} executed`,
          detail: `${this.asString(finding.executedByUserName) || 'Responsable'} marcó la observación como ejecutada y adjuntó evidencia.`,
          summary: `Obs. ${number} · ${label} · Evidencia adjunta · Pendiente aprobación Admin GF`,
          color: NAVY,
        });
      }
      if (this.asString(finding.rejectedAt)) {
        events.push({
          date: this.asString(finding.rejectedAt),
          title: `Obs. ${number} rechazada · Obs. ${number} rejected`,
          detail: `${this.asString(finding.rejectedByUserName) || 'Admin GF'} rechazó la evidencia de la observación.`,
          summary: this.asString(finding.rejectionReason) || label,
          color: RED_BORDER,
        });
      }
      if (this.asString(finding.closedAt)) {
        events.push({
          date: this.asString(finding.closedAt),
          title: `Obs. ${number} aprobada y cerrada · Obs. ${number} approved and closed`,
          detail: `${this.asString(finding.closedByUserName) || 'Admin GF'} aprobó el cierre de la observación.`,
          summary: `Obs. ${number} · Cerrada · ${this.closureLabel(finding)}`,
          color: NAVY,
        });
      }
      for (const value of this.asArray(finding.followups)) {
        const followup = this.asRecord(value);
        events.push({
          date: this.asString(followup.performedAt) || this.asString(followup.createdAt),
          title: `Seguimiento ${this.asNumber(followup.sequenceNumber, 0)} · Follow-up ${this.asNumber(followup.sequenceNumber, 0)}`,
          detail: this.asString(followup.description) || 'Seguimiento registrado.',
          summary: this.asString(followup.result) || '',
          color: GOLD,
        });
      }
    }

    comments.forEach((comment) => {
      events.push({
        date: this.asString(comment.createdAt),
        title: 'Comentario registrado · Comment added',
        detail: this.asString(comment.body) || this.asString(comment.description) || 'Comentario',
        summary: '',
        color: NAVY,
      });
    });

    return events.filter((event) => event.date).sort((left, right) => this.timestamp(left.date) - this.timestamp(right.date));
  }

  private drawTimelineEvent(document: ReportPdfDocument, event: TimelineEvent, index: number, height: number) {
    const y = document.y;
    const circleX = MARGIN_X + 8;
    if (index > 0) document.moveTo(circleX, y - 16).lineTo(circleX, y + 14).strokeColor(BORDER).lineWidth(0.8).stroke();
    document.circle(circleX, y + 8, 9).fill(event.color);
    document.font('Helvetica-Bold').fontSize(7).fillColor(event.color === GOLD ? NAVY : '#FFFFFF').text(event.color === GOLD ? '→' : '✓', circleX - 4, y + 4, { width: 8, align: 'center' });
    document.font('Helvetica-Bold').fontSize(8.2).fillColor(TEXT).text(event.title, MARGIN_X + 26, y, { width: 330 });
    document.font('Helvetica').fontSize(6.5).fillColor(MUTED).text(this.formatDateTime(event.date), MARGIN_X + 365, y + 1, { width: 145, align: 'right' });
    document.font('Helvetica').fontSize(7.4).fillColor('#333333').text(event.detail, MARGIN_X + 26, y + 17, { width: CONTENT_WIDTH - 26, lineGap: 1.5 });
    if (event.summary) {
      const summaryY = y + height - 28;
      document.roundedRect(MARGIN_X + 26, summaryY, CONTENT_WIDTH - 26, 22, 3).fillAndStroke(event.color === GOLD ? YELLOW_BG : LIGHT, event.color === GOLD ? GOLD : BORDER);
      document.font('Helvetica').fontSize(6.4).fillColor(MUTED).text(event.summary, MARGIN_X + 34, summaryY + 7, { width: CONTENT_WIDTH - 42, height: 10, ellipsis: true });
    }
    document.y = y + height;
  }

  private drawSignatures(document: ReportPdfDocument, inspection: UnknownRecord, findings: UnknownRecord[]) {
    const inspector = this.asString(inspection.inspectorName) || 'Pendiente / Pending';
    const responsible = findings.map((finding) => this.asString(finding.ownerUserName)).find(Boolean) || 'Pendiente / Pending';
    const responsibleCompany = findings.map((finding) => this.asString(finding.responsibleCompanyName)).find(Boolean) || '—';
    const approver = findings.map((finding) => this.asString(finding.closedByUserName)).find(Boolean) || 'Pendiente / Pending';
    const cellWidth = 244;
    const gap = 23;
    const startY = document.y + 6;
    const cells: Array<[string, string, string]> = [
      ['Inspector / Inspector', inspector, `${this.asString(inspection.inspectorCompanyName) || this.inferInspectorCompany(inspection)} · ${this.formatDate(contextDate(inspection))}`],
      ['Responsable EECC / EECC Responsible', responsible, responsibleCompany],
      ['Admin GF HSE / GF HSE Admin', approver, 'Gold Fields · Admin HSE Salares Norte'],
      ['Gerencia / Management', 'Pendiente / Pending', 'Revisión y validación final · Final review and validation'],
    ];
    cells.forEach(([role, name, detail], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = MARGIN_X + column * (cellWidth + gap);
      const y = startY + row * 82;
      document.moveTo(x, y).lineTo(x + cellWidth, y).strokeColor(TEXT).lineWidth(0.8).stroke();
      document.font('Helvetica').fontSize(6.5).fillColor(MUTED).text(role, x, y + 8, { width: cellWidth });
      document.font(name.includes('Pendiente') ? 'Helvetica-Oblique' : 'Helvetica-Bold').fontSize(8).fillColor(TEXT).text(name, x, y + 20, { width: cellWidth });
      document.font('Helvetica').fontSize(6.4).fillColor(MUTED).text(detail, x, y + 32, { width: cellWidth, height: 18, ellipsis: true });
    });
    document.y = startY + 155;
  }

  private drawSummaryBand(document: ReportPdfDocument, metrics: Array<[string, string]>, status: string) {
    const y = document.y;
    const width = CONTENT_WIDTH / metrics.length;
    document.roundedRect(MARGIN_X, y, CONTENT_WIDTH, 45, 4).fillAndStroke(LIGHT, BORDER);
    metrics.forEach(([label, value], index) => {
      const x = MARGIN_X + index * width;
      if (index > 0) document.moveTo(x, y).lineTo(x, y + 45).strokeColor(BORDER).lineWidth(0.6).stroke();
      document.font('Helvetica-Bold').fontSize(5.8).fillColor(MUTED).text(label, x + 10, y + 9, { width: width - 20, lineGap: 0.4 });
      if (index === 2) {
        const colors = this.statusColors(status);
        this.drawChip(document, value, x + 10, y + 25, 70, colors.background, colors.text);
      } else {
        document.font('Helvetica-Bold').fontSize(8.2).fillColor(TEXT).text(value, x + 10, y + 27, { width: width - 20, height: 10, ellipsis: true });
      }
    });
    document.y = y + 62;
  }

  private drawGeneralGrid(document: ReportPdfDocument, rows: Array<[string, string, string, string]>) {
    const y = document.y;
    const half = CONTENT_WIDTH / 2;
    const labelWidth = 105;
    const rowHeights = [23, 31, 23, 30];
    let cursorY = y;
    rows.forEach(([leftLabel, leftValue, rightLabel, rightValue], index) => {
      const height = rowHeights[index] ?? 23;
      this.drawGeneralCell(document, MARGIN_X, cursorY, half, labelWidth, height, leftLabel, leftValue);
      this.drawGeneralCell(document, MARGIN_X + half, cursorY, half, labelWidth, height, rightLabel, rightValue);
      cursorY += height;
    });
    document.roundedRect(MARGIN_X, y, CONTENT_WIDTH, cursorY - y, 4).strokeColor(BORDER).lineWidth(0.7).stroke();
    document.y = cursorY;
  }

  private drawGeneralCell(document: ReportPdfDocument, x: number, y: number, width: number, labelWidth: number, height: number, label: string, value: string) {
    document.rect(x, y, labelWidth, height).fillAndStroke(LIGHT, BORDER);
    document.rect(x + labelWidth, y, width - labelWidth, height).fillAndStroke('#FFFFFF', BORDER);
    document.font('Helvetica-Bold').fontSize(6).fillColor(MUTED).text(label, x + 10, y + 7, { width: labelWidth - 18, height: height - 10, ellipsis: true });
    document.font(label.includes('UBICACIÓN') ? 'Courier' : 'Helvetica').fontSize(6.9).fillColor(TEXT).text(value, x + labelWidth + 10, y + 7, { width: width - labelWidth - 18, height: height - 10, ellipsis: true });
  }

  private drawFindingsSummaryTable(document: ReportPdfDocument, context: ReportContext, findings: UnknownRecord[]) {
    const widths = [27, 173.5, 87, 88.5, 75, 60];
    const headers = ['N°', 'DESCRIPCIÓN / DESCRIPTION', 'CRITICIDAD /\nCRITICALITY', 'ESTADO / STATUS', 'RESPONSABLE /\nRESPONSIBLE', 'SLA'];
    const drawHeader = () => {
      let x = MARGIN_X;
      const y = document.y;
      headers.forEach((header, index) => {
        document.rect(x, y, widths[index], 28).fill(NAVY);
        document.font('Helvetica-Bold').fontSize(5.3).fillColor('#C4CED7').text(header, x + 7, y + 8, { width: widths[index] - 14, align: index === 1 ? 'left' : 'center', lineGap: 0.5 });
        x += widths[index];
      });
      document.y = y + 28;
    };

    drawHeader();
    if (findings.length === 0) {
      this.drawEmptyState(document, 'No hay observaciones registradas en esta inspección.');
      return;
    }

    findings.forEach((finding, index) => {
      const condition = this.asString(finding.detectedCondition) || this.asString(finding.description) || this.asString(finding.title) || 'Sin descripción';
      const conditionEn = this.asString(finding.detectedConditionEn) || this.asString(finding.descriptionEn);
      const rowHeight = Math.max(43, Math.min(58, 18 + this.textHeight(document, condition, widths[1] - 16, 7.2) + (conditionEn ? this.textHeight(document, conditionEn, widths[1] - 16, 6.5) : 0)));
      if (document.y + rowHeight > CONTENT_BOTTOM - 120) {
        this.addCompactPage(document, context);
        this.sectionTitle(document, 'Resumen de observaciones / Observations summary');
        drawHeader();
      }
      const y = document.y;
      const fill = index % 2 === 0 ? '#FFFFFF' : LIGHT;
      let x = MARGIN_X;
      widths.forEach((width) => {
        document.rect(x, y, width, rowHeight).fillAndStroke(fill, BORDER);
        x += width;
      });
      document.font('Helvetica-Bold').fontSize(7.2).fillColor(BLUE).text(String(this.asNumber(finding.observationNumber, index + 1)), MARGIN_X, y + 9, { width: widths[0], align: 'center' });
      document.font('Helvetica-Bold').fontSize(7).fillColor(TEXT).text(condition, MARGIN_X + widths[0] + 9, y + 8, { width: widths[1] - 17, height: rowHeight - 15, ellipsis: true });
      if (conditionEn) document.font('Helvetica-Oblique').fontSize(6.3).fillColor(MUTED).text(conditionEn, MARGIN_X + widths[0] + 9, y + rowHeight - 18, { width: widths[1] - 17, height: 10, ellipsis: true });
      const severityX = MARGIN_X + widths[0] + widths[1];
      this.drawChip(document, this.severityLabel(this.asString(finding.severity)), severityX + 8, y + 9, widths[2] - 16, this.severityBackground(this.asString(finding.severity)), this.severityColor(this.asString(finding.severity)));
      const statusX = severityX + widths[2];
      const statusColors = this.statusColors(this.asString(finding.status));
      this.drawChip(document, this.statusLabel(this.asString(finding.status)), statusX + 8, y + 9, widths[3] - 16, statusColors.background, statusColors.text);
      const responsibleX = statusX + widths[3];
      document.font('Helvetica').fontSize(6.5).fillColor(TEXT).text(this.shortName(this.asString(finding.ownerUserName)) || this.asString(finding.responsibleCompanyName) || '—', responsibleX + 8, y + 9, { width: widths[4] - 16, height: rowHeight - 14, ellipsis: true });
      const slaX = responsibleX + widths[4];
      document.font('Helvetica-Bold').fontSize(6.4).fillColor(this.slaColor(finding)).text(this.summarySlaLabel(finding), slaX + 8, y + 9, { width: widths[5] - 14, height: rowHeight - 14, ellipsis: true });
      document.y = y + rowHeight;
    });
  }

  private drawGroupTitle(document: ReportPdfDocument, group: FindingGroup, count: number, continuation: boolean) {
    const y = document.y;
    document.rect(MARGIN_X, y + 1, 2.2, 12).fill(GOLD);
    document.font('Helvetica-Bold').fontSize(7.3).fillColor(NAVY).text(group.title.toUpperCase(), MARGIN_X + 9, y + 2, { width: 285 });
    if (continuation) {
      document.font('Helvetica').fontSize(6.4).fillColor(MUTED).text('(CONTINUACIÓN / CONTINUED)', MARGIN_X + 350, y + 3, { width: 160, align: 'right' });
    } else {
      const noun = count === 1 ? 'observación / 1 observation' : `observaciones / ${count} observations`;
      const badge = `${count} ${noun.replace(/^\d+\s*/, '')}${group.badgeSuffix ? ` · ${group.badgeSuffix}` : ''}`;
      document.font('Helvetica-Bold').fontSize(5.8);
      const width = Math.min(245, Math.max(95, document.widthOfString(badge) + 14));
      document.roundedRect(MARGIN_X + CONTENT_WIDTH - width, y, width, 15, 4).fill(group.background);
      document.font('Helvetica-Bold').fontSize(5.8).fillColor(group.textColor).text(badge, MARGIN_X + CONTENT_WIDTH - width + 7, y + 4, { width: width - 14, align: 'center', height: 8, ellipsis: true });
    }
    document.y = y + 25;
  }

  private drawLabeledText(document: ReportPdfDocument, label: string, value: string, secondary: string, y: number, valueColor = TEXT): number {
    const labelWidth = 105;
    const valueWidth = CONTENT_WIDTH - labelWidth - 20;
    const primaryHeight = this.textHeight(document, value, valueWidth, 7.4);
    const secondaryHeight = secondary ? this.textHeight(document, secondary, valueWidth, 7.1) : 0;
    const height = Math.max(22, primaryHeight + secondaryHeight + 6);
    document.font('Helvetica-Bold').fontSize(5.9).fillColor(MUTED).text(label, MARGIN_X + 10, y + 1, { width: labelWidth - 5 });
    document.font('Helvetica').fontSize(7.4).fillColor(valueColor).text(value, MARGIN_X + labelWidth + 10, y, { width: valueWidth, lineGap: 1.2 });
    if (secondary) document.font('Helvetica-Oblique').fontSize(7.1).fillColor(MUTED).text(secondary, MARGIN_X + labelWidth + 10, y + primaryHeight + 2, { width: valueWidth, lineGap: 1.2 });
    return y + height + 6;
  }

  private drawInlineRow(document: ReportPdfDocument, label: string, value: string, y: number, color = TEXT): number {
    const labelWidth = 105;
    document.font('Helvetica-Bold').fontSize(5.9).fillColor(MUTED).text(label, MARGIN_X + 10, y + 1, { width: labelWidth - 5 });
    document.font('Helvetica-Bold').fontSize(7.2).fillColor(color).text(value, MARGIN_X + labelWidth + 10, y, { width: CONTENT_WIDTH - labelWidth - 20, height: 20, ellipsis: true });
    return y + 20;
  }

  private drawChip(document: ReportPdfDocument, label: string, x: number, y: number, width: number, background: string, color: string) {
    document.roundedRect(x, y, width, 13, 4).fill(background);
    document.font('Helvetica-Bold').fontSize(5.7).fillColor(color).text(label, x + 4, y + 4, { width: width - 8, align: 'center', height: 7, ellipsis: true });
  }

  private drawEvidenceCard(
    document: ReportPdfDocument,
    title: string,
    evidence: UnknownRecord | undefined,
    asset: EvidenceAsset | undefined,
    x: number,
    y: number,
    width: number,
    height: number,
    background: string,
  ) {
    document.roundedRect(x, y, width, height, 3).fillAndStroke(background, BORDER);
    document.rect(x, y, width, 16).fill(NAVY);
    document.font('Helvetica-Bold').fontSize(5.5).fillColor('#C4CED7').text(title.toUpperCase(), x + 7, y + 5, { width: width - 14, height: 7, ellipsis: true });
    const imageY = y + 17;
    if (asset) {
      this.drawImage(document, asset, x + 1, imageY, width - 2, height - 18);
    } else {
      this.drawCameraPlaceholder(document, x, imageY, width, height - 17, this.evidenceFileName(evidence));
    }
  }

  private drawCameraPlaceholder(document: ReportPdfDocument, x: number, y: number, width: number, height: number, label: string) {
    const centerX = x + width / 2;
    const centerY = y + height / 2 - 7;
    document.roundedRect(centerX - 10, centerY - 6, 20, 13, 2).fillColor('#5F6B73').fill();
    document.circle(centerX, centerY, 4).fillColor('#D1D1D1').fill();
    document.rect(centerX - 5, centerY - 9, 10, 3).fillColor('#5F6B73').fill();
    document.font('Helvetica').fontSize(6.3).fillColor(MUTED).text(label || 'Evidencia registrada', x + 10, y + height - 17, { width: width - 20, align: 'center', height: 9, ellipsis: true });
  }

  private drawImage(document: ReportPdfDocument, asset: EvidenceAsset, x: number, y: number, width: number, height: number) {
    try {
      document.save();
      document.rect(x, y, width, height).clip();
      document.image(asset.path, x, y, { fit: [width, height], align: 'center', valign: 'center' });
      document.restore();
    } catch {
      document.restore();
      this.drawCameraPlaceholder(document, x, y, width, height, 'Vista previa no disponible');
    }
  }

  private drawEmptyState(document: ReportPdfDocument, text: string) {
    const y = document.y;
    document.roundedRect(MARGIN_X, y, CONTENT_WIDTH, 32, 4).fillAndStroke(LIGHT, BORDER);
    document.font('Helvetica').fontSize(7).fillColor(MUTED).text(text, MARGIN_X + 10, y + 12, { width: CONTENT_WIDTH - 20, align: 'center' });
    document.y = y + 40;
  }

  private addFirstPage(document: ReportPdfDocument, context: ReportContext) {
    document.addPage({ size: 'A4', margins: { top: 36, bottom: 8, left: MARGIN_X, right: MARGIN_X } });
    document.image(GOLD_FIELDS_LOGO, MARGIN_X, 35, { fit: [104, 34], valign: 'center' });
    document.moveTo(MARGIN_X + 119, 35).lineTo(MARGIN_X + 119, 68).strokeColor(BORDER).lineWidth(0.7).stroke();
    document.font('Helvetica-Bold').fontSize(11).fillColor(NAVY).text('AUREL', MARGIN_X + 136, 47, { continued: true });
    document.fillColor(GOLD).text('IA');
    document.font('Helvetica-Bold').fontSize(7).fillColor(MUTED).text('INFORME DE INSPECCIÓN / INSPECTION REPORT', 330, 35, { width: 223, align: 'right' });
    document.font('Helvetica-Bold').fontSize(14).fillColor(NAVY).text(`Inspección #${context.inspectionNumber}`, 330, 50, { width: 223, align: 'right' });
    document.font('Helvetica').fontSize(6.5).fillColor(MUTED).text('SGA · Sistema de Gestión Ambiental · Environmental Management System', 260, 70, { width: 293, align: 'right' });
    document.moveTo(MARGIN_X, 92).lineTo(MARGIN_X + CONTENT_WIDTH, 92).strokeColor(NAVY).lineWidth(1.1).stroke();
    document.y = 112;
  }

  private addCompactPage(document: ReportPdfDocument, context: ReportContext) {
    document.addPage({ size: 'A4', margins: { top: 36, bottom: 8, left: MARGIN_X, right: MARGIN_X } });
    document.font('Helvetica-Bold').fontSize(9).fillColor(NAVY).text('AUREL', MARGIN_X, 36, { continued: true });
    document.fillColor(GOLD).text('IA');
    document.moveTo(MARGIN_X + 43, 34).lineTo(MARGIN_X + 43, 50).strokeColor(BORDER).lineWidth(0.6).stroke();
    document.font('Helvetica').fontSize(6.6).fillColor(MUTED).text(`Informe de Inspección #${context.inspectionNumber} · Inspection Report #${context.inspectionNumber}`, MARGIN_X + 52, 37, { width: 280 });
    document.font('Helvetica').fontSize(6.2).fillColor(MUTED).text(`Gold Fields Salares Norte · ${this.formatDate(context.inspectionDate)}`, 365, 37, { width: 188, align: 'right' });
    document.moveTo(MARGIN_X, 57).lineTo(MARGIN_X + CONTENT_WIDTH, 57).strokeColor(NAVY).lineWidth(1).stroke();
    document.y = 72;
  }

  private ensureSpace(document: ReportPdfDocument, context: ReportContext, height: number) {
    if (document.y + height <= CONTENT_BOTTOM) return;
    this.addCompactPage(document, context);
  }

  private addFooters(document: ReportPdfDocument, context: ReportContext) {
    const range = document.bufferedPageRange();
    for (let index = range.start; index < range.start + range.count; index += 1) {
      document.switchToPage(index);
      document.moveTo(MARGIN_X, FOOTER_Y).lineTo(MARGIN_X + CONTENT_WIDTH, FOOTER_Y).strokeColor(BORDER).lineWidth(0.5).stroke();
      document.font('Helvetica').fontSize(5.3).fillColor(MUTED).text('Generado por AurelIA SGA · Gold Fields Salares Norte · aurelia.goldfields.cl', MARGIN_X, FOOTER_Y + 14, { width: 285 });
      document.font('Helvetica').fontSize(5.3).fillColor(MUTED).text(`Generado / Generated: ${this.formatDateTime(context.generatedAt)} · Confidencial / Confidential`, 300, FOOTER_Y + 14, { width: 253, align: 'right' });
      document.font('Helvetica').fontSize(6).fillColor(MUTED).text(`${index - range.start + 1} / ${range.count}`, 520, PAGE_HEIGHT - 25, { width: 33, align: 'right' });
    }
  }

  private sectionTitle(document: ReportPdfDocument, title: string) {
    const y = document.y;
    document.rect(MARGIN_X, y + 1, 2.2, 12).fill(GOLD);
    document.font('Helvetica-Bold').fontSize(7.3).fillColor(NAVY).text(title.toUpperCase(), MARGIN_X + 9, y + 2, { width: CONTENT_WIDTH - 9 });
    document.y = y + 23;
  }

  private estimateFindingHeight(document: ReportPdfDocument, finding: UnknownRecord): number {
    const condition = this.asString(finding.detectedCondition) || this.asString(finding.description) || this.asString(finding.title);
    const proposed = this.asString(finding.proposedCorrectiveAction);
    const executed = this.asString(finding.executedActionDescription);
    const rejection = this.asString(finding.rejectionReason) || this.asString(finding.cancellationReason);
    const narratives = [condition, proposed || executed, rejection].filter(Boolean);
    const narrativeHeight = narratives.reduce((total, value) => total + this.textHeight(document, value, CONTENT_WIDTH - 125, 7.4) + 14, 0);
    const evidenceHeight = this.asArray(finding.evidences).length > 0 ? 120 : 0;
    return Math.min(520, 92 + narrativeHeight + evidenceHeight);
  }

  private textHeight(document: ReportPdfDocument, value: string, width: number, fontSize: number): number {
    if (!value) return 0;
    document.font('Helvetica').fontSize(fontSize);
    return document.heightOfString(value, { width, lineGap: 1.2 });
  }

  private async loadEvidenceAssets(payload: Record<string, unknown>): Promise<Map<string, EvidenceAsset>> {
    const evidences = this.collectEvidenceRecords(payload);
    const entries = await Promise.all(evidences.map(async (evidence) => {
      const fileId = this.asString(evidence.fileId);
      if (!fileId) return null;
      try {
        const content = await this.files.getContent(fileId);
        if (content.mimeType && !content.mimeType.startsWith('image/')) return null;
        return [fileId, { path: content.path, mimeType: content.mimeType }] as const;
      } catch {
        return null;
      }
    }));
    return new Map(entries.filter((entry): entry is readonly [string, EvidenceAsset] => Boolean(entry)));
  }

  private collectEvidenceRecords(payload: Record<string, unknown>): UnknownRecord[] {
    const records = new Map<string, UnknownRecord>();
    const visit = (value: unknown) => {
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (!value || typeof value !== 'object') return;
      const record = value as UnknownRecord;
      const id = this.asString(record.id);
      const fileId = this.asString(record.fileId);
      if (id && fileId) records.set(id, record);
      Object.values(record).forEach(visit);
    };
    visit(payload.evidences);
    visit(payload.findings);
    return Array.from(records.values());
  }

  private findGeneralEvidence(payload: Record<string, unknown>, findings: UnknownRecord[]): UnknownRecord | undefined {
    const groups = this.asRecord(payload.evidenceGroups);
    const inspectionEvidence = this.asArray(groups.inspection).map((value) => this.asRecord(value))[0];
    if (inspectionEvidence) return inspectionEvidence;
    const root = this.asArray(payload.evidences).map((value) => this.asRecord(value));
    const linked = root.find((evidence) => this.asArray(evidence.links).some((value) => this.asString(this.asRecord(value).entityType) === 'inspection'));
    if (linked) return linked;
    return findings.length === 0 ? root[0] : undefined;
  }

  private resolveEvidenceSlot(evidence: UnknownRecord): 'before' | 'after' | 'other' {
    const links = this.asArray(evidence.links).map((value) => this.asRecord(value));
    const signal = [
      this.asString(evidence.title),
      this.asString(evidence.description),
      this.asString(evidence.evidenceType),
      ...links.map((link) => this.asString(link.relationType)),
    ].join(' ').toLowerCase();
    if (signal.includes('after') || signal.includes('después') || signal.includes('despues') || signal.includes('cierre') || signal.includes('execution')) return 'after';
    if (signal.includes('before') || signal.includes('antes') || signal.includes('inicial') || signal.includes('detect')) return 'before';
    return 'other';
  }

  private evidenceFileName(evidence: UnknownRecord | undefined): string {
    if (!evidence) return 'Sin evidencia';
    return this.asString(evidence.originalName) || this.asString(evidence.fileName) || this.asString(evidence.title) || 'Evidencia registrada';
  }

  private inferInspectorCompany(inspection: UnknownRecord): string {
    const email = this.asString(inspection.inspectorEmail).toLowerCase();
    if (email.endsWith('@goldfields.com')) return 'Gold Fields';
    return 'Gold Fields';
  }

  private locationLabel(inspection: UnknownRecord): string {
    const latitude = this.asString(inspection.latitude);
    const longitude = this.asString(inspection.longitude);
    if (latitude && longitude) return `${latitude}, ${longitude}`;
    return this.asString(inspection.locationLabel) || '—';
  }

  private bilingualInspectionType(value: string): string {
    const normalized = value.toLowerCase();
    if (normalized.includes('hallazgo')) return `${value} / Finding`;
    if (normalized.includes('checklist')) return `${value} / Checklist`;
    return value || '—';
  }

  private severityLabel(value: string): string {
    if (value === 'critical') return 'Crítica / Critical';
    if (value === 'high') return 'Grave / Critical';
    if (value === 'medium') return 'Moderado / Medium';
    if (value === 'low') return 'Menor / Low';
    return value || 'Sin criticidad';
  }

  private severityBackground(value: string): string {
    if (value === 'critical' || value === 'high') return RED_BG;
    if (value === 'medium') return ORANGE_BG;
    return GREEN_BG;
  }

  private severityColor(value: string): string {
    if (value === 'critical' || value === 'high') return RED;
    if (value === 'medium') return ORANGE;
    return GREEN;
  }

  private statusLabel(value: string): string {
    if (value === InspectionFindingStatus.OPEN || value === 'open') return 'Abierto / Open';
    if (value === InspectionFindingStatus.IN_PROGRESS || value === 'in_progress') return 'Ejecutado / Executed';
    if (value === InspectionFindingStatus.CLOSED || value === 'closed') return 'Cerrado / Closed';
    if (value === InspectionFindingStatus.REJECTED || value === 'rejected') return 'Rechazado / Rejected';
    if (value === InspectionFindingStatus.CANCELLED || value === 'cancelled') return 'Cancelado / Cancelled';
    if (value === 'draft') return 'Borrador / Draft';
    if (value === 'submitted') return 'Enviada / Submitted';
    if (value === 'under_review') return 'En revisión / Under review';
    return value || 'Sin estado';
  }

  private statusColors(value: string): { background: string; text: string } {
    if (value === InspectionFindingStatus.CLOSED || value === 'closed') return { background: GREEN_BG, text: GREEN };
    if (value === InspectionFindingStatus.IN_PROGRESS || value === 'in_progress') return { background: TEAL_BG, text: TEAL };
    if (value === InspectionFindingStatus.REJECTED || value === 'rejected') return { background: RED_BG, text: RED };
    if (value === InspectionFindingStatus.CANCELLED || value === 'cancelled') return { background: LIGHT, text: MUTED };
    return { background: YELLOW_BG, text: YELLOW };
  }

  private slaLabel(finding: UnknownRecord): string {
    const dueAt = this.asString(finding.dueAt);
    if (!dueAt) return 'Sin SLA registrado / No SLA registered';
    const due = new Date(dueAt);
    if (Number.isNaN(due.getTime())) return 'Sin SLA registrado / No SLA registered';
    const reference = this.asString(finding.closedAt) ? new Date(this.asString(finding.closedAt)) : new Date();
    const days = Math.max(0, Math.ceil(Math.abs(reference.getTime() - due.getTime()) / 86400000));
    if (reference.getTime() > due.getTime()) return `Vencido hace ${days} días · Overdue by ${days} days`;
    return `${days} días restantes / ${days} days remaining`;
  }

  private summarySlaLabel(finding: UnknownRecord): string {
    const status = this.asString(finding.status);
    if (status === InspectionFindingStatus.CLOSED) return 'Cerrado /\nClosed';
    const dueAt = this.asString(finding.dueAt);
    if (!dueAt) return '—';
    const due = new Date(dueAt);
    if (Number.isNaN(due.getTime())) return '—';
    const days = Math.max(0, Math.ceil(Math.abs(Date.now() - due.getTime()) / 86400000));
    if (Date.now() > due.getTime()) return `Vencido /\nOverdue · ${days}d`;
    return `${days} días /\ndays`;
  }

  private slaColor(finding: UnknownRecord): string {
    const status = this.asString(finding.status);
    if (status === InspectionFindingStatus.CLOSED) return GREEN;
    const dueAt = this.asString(finding.dueAt);
    if (!dueAt) return MUTED;
    const due = new Date(dueAt);
    if (Number.isNaN(due.getTime())) return MUTED;
    return Date.now() > due.getTime() ? RED : YELLOW;
  }

  private closureLabel(finding: UnknownRecord): string {
    const createdAt = this.asString(finding.createdAt);
    const closedAt = this.asString(finding.closedAt);
    if (!createdAt || !closedAt) return 'Cerrado / Closed';
    const start = new Date(createdAt);
    const end = new Date(closedAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Cerrado / Closed';
    const days = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    return `${days} días · ${days} days`;
  }

  private shortName(value: string): string {
    const parts = value.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    return `${parts[0][0]}. ${parts[parts.length - 1]}`;
  }

  private formatDate(value: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Santiago' }).format(date);
  }

  private formatDateTime(value: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Santiago' }).format(date);
  }

  private timestamp(value: string): number {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime();
  }

  private resolveNumber(title: string): string {
    return title.match(/#?(\d+)/)?.[1] ?? '—';
  }

  private asRecord(value: unknown): UnknownRecord {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {};
  }

  private asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private asString(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return String(value);
    return '';
  }

  private asNumber(value: unknown, fallback: number): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}

function contextDate(inspection: UnknownRecord): string {
  const value = inspection.startedAt ?? inspection.createdAt;
  return typeof value === 'string' ? value : '';
}
