import { Injectable } from '@nestjs/common';
import { FilesService } from '../files/files.service';
import { InspectionDetailReportPdfRuntimeService } from './inspection-detail-report-pdf-runtime.service';
import { ReportPdfService } from './report-pdf.service';

type UnknownRecord = Record<string, unknown>;

type Runtime = {
  slaLabel: (finding: UnknownRecord) => string;
};

@Injectable()
export class InspectionDetailReportPdfFinalService extends InspectionDetailReportPdfRuntimeService {
  constructor(pdf: ReportPdfService, files: FilesService) {
    super(pdf, files);
  }

  override async render(payload: Record<string, unknown>): Promise<Buffer> {
    const generatedAt = this.reportString(payload.generatedAt) || new Date().toISOString();
    const runtime = this as unknown as Runtime;
    runtime.slaLabel = (finding) => this.detailedSlaLabel(finding);

    return super.render({
      ...payload,
      generatedAt,
      findings: this.reportArray(payload.findings).map((value) => this.prepareFinding(this.reportRecord(value), generatedAt)),
    });
  }

  private prepareFinding(finding: UnknownRecord, generatedAt: string): UnknownRecord {
    const detectedCondition = this.reportString(finding.detectedCondition);
    const description = this.reportString(finding.description);
    const originalTitle = this.reportString(finding.title);
    const primaryTitle = detectedCondition || originalTitle || description || 'Observación';
    const translatedTitle = this.reportString(finding.detectedConditionEn)
      || this.reportString(finding.descriptionEn)
      || this.reportString(finding.titleEn);

    return {
      ...finding,
      title: primaryTitle,
      titleEn: translatedTitle,
      detectedCondition: detectedCondition || primaryTitle,
      detectedConditionEn: translatedTitle,
      reportGeneratedAt: generatedAt,
    };
  }

  private detailedSlaLabel(finding: UnknownRecord): string {
    const dueAt = this.reportDate(finding.dueAt);
    if (!dueAt) return 'Sin SLA registrado / No SLA registered';

    const reference = this.reportDate(finding.closedAt)
      || this.reportDate(finding.reportGeneratedAt)
      || new Date();
    const overdue = reference.getTime() > dueAt.getTime();
    const elapsedDays = this.reportBusinessDays(overdue ? dueAt : reference, overdue ? reference : dueAt);
    const totalDays = this.resolveAllocatedBusinessDays(finding, dueAt);
    const currentEs = overdue
      ? `Vencido hace ${elapsedDays} ${elapsedDays === 1 ? 'día' : 'días'}`
      : `${elapsedDays} ${elapsedDays === 1 ? 'día restante' : 'días restantes'}`;
    const currentEn = overdue
      ? `Overdue by ${elapsedDays} ${elapsedDays === 1 ? 'day' : 'days'}`
      : `${elapsedDays} ${elapsedDays === 1 ? 'day remaining' : 'days remaining'}`;
    const allocation = totalDays > 0
      ? ` (SLA: ${totalDays} ${totalDays === 1 ? 'día hábil' : 'días hábiles'} / ${totalDays} business ${totalDays === 1 ? 'day' : 'days'})`
      : '';

    return `${currentEs} / ${currentEn}${allocation}`;
  }

  private resolveAllocatedBusinessDays(finding: UnknownRecord, dueAt: Date): number {
    const explicit = [finding.slaBusinessDays, finding.slaDays, finding.severitySlaDays]
      .map((value) => this.reportNumber(value))
      .find((value) => value > 0);
    if (explicit) return explicit;

    const severityCatalog = this.reportRecord(finding.severityCatalog);
    const label = this.reportString(severityCatalog.closureTimeLabel)
      || this.reportString(finding.severityClosureTimeLabel);
    const labelDays = Number(label.match(/\d+/)?.[0] ?? 0);
    if (labelDays > 0) return labelDays;

    const createdAt = this.reportDate(finding.createdAt);
    return createdAt ? this.reportBusinessDays(createdAt, dueAt) : 0;
  }

  private reportBusinessDays(start: Date, end: Date): number {
    const from = this.reportUtcDate(start);
    const to = this.reportUtcDate(end);
    if (from.getTime() >= to.getTime()) return 0;

    let days = 0;
    const cursor = new Date(from);
    while (cursor.getTime() < to.getTime()) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      const weekday = cursor.getUTCDay();
      if (weekday !== 0 && weekday !== 6) days += 1;
    }
    return days;
  }

  private reportUtcDate(value: Date): Date {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  private reportDate(value: unknown): Date | null {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value !== 'string' || !value.trim()) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private reportString(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return String(value);
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
    return '';
  }

  private reportNumber(value: unknown): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private reportArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private reportRecord(value: unknown): UnknownRecord {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {};
  }
}
