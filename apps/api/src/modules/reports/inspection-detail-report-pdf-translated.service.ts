import { Injectable } from '@nestjs/common';
import { FilesService } from '../files/files.service';
import { InspectionDetailReportPdfPixelPerfectService } from './inspection-detail-report-pdf-pixel-perfect.service';
import { ReportPdfService } from './report-pdf.service';
import { ReportTranslationService } from './report-translation.service';

type UnknownRecord = Record<string, unknown>;

type TranslationTarget =
  | 'condition'
  | 'proposedCorrectiveActionEn'
  | 'executedActionDescriptionEn'
  | 'rejectionReasonEn'
  | 'cancellationReasonEn';

type TranslationJob = {
  findingIndex: number;
  target: TranslationTarget;
  source: string;
};

@Injectable()
export class InspectionDetailReportPdfTranslatedService extends InspectionDetailReportPdfPixelPerfectService {
  constructor(
    pdf: ReportPdfService,
    files: FilesService,
    private readonly reportTranslation: ReportTranslationService,
  ) {
    super(pdf, files);
  }

  override async render(payload: Record<string, unknown>): Promise<Buffer> {
    const findings = this.translationArray(payload.findings).map((value) => ({
      ...this.translationRecord(value),
    }));
    if (findings.length === 0) return super.render(payload);

    const jobs: TranslationJob[] = [];

    findings.forEach((finding, findingIndex) => {
      const conditionEnglish = this.explicitConditionEnglish(finding);
      if (conditionEnglish) {
        this.assignTranslation(finding, 'condition', conditionEnglish);
      } else {
        this.enqueueTranslation(
          jobs,
          findingIndex,
          'condition',
          this.translationString(finding.detectedCondition) || this.translationString(finding.title),
        );
      }

      this.enqueueFieldTranslation(
        jobs,
        finding,
        findingIndex,
        'proposedCorrectiveAction',
        'proposedCorrectiveActionEn',
      );
      this.enqueueFieldTranslation(
        jobs,
        finding,
        findingIndex,
        'executedActionDescription',
        'executedActionDescriptionEn',
      );
      this.enqueueFieldTranslation(
        jobs,
        finding,
        findingIndex,
        'rejectionReason',
        'rejectionReasonEn',
      );
      this.enqueueFieldTranslation(
        jobs,
        finding,
        findingIndex,
        'cancellationReason',
        'cancellationReasonEn',
      );
    });

    if (jobs.length > 0) {
      const translations = await this.reportTranslation.translateToEnglish(
        jobs.map((job) => job.source),
      );
      jobs.forEach((job, index) => {
        const translation = translations[index]?.trim() ?? '';
        if (translation) this.assignTranslation(findings[job.findingIndex], job.target, translation);
      });
    }

    return super.render({
      ...payload,
      findings,
    });
  }

  private enqueueFieldTranslation(
    jobs: TranslationJob[],
    finding: UnknownRecord,
    findingIndex: number,
    sourceField: string,
    targetField: Exclude<TranslationTarget, 'condition'>,
  ): void {
    if (this.translationString(finding[targetField])) return;
    this.enqueueTranslation(
      jobs,
      findingIndex,
      targetField,
      this.translationString(finding[sourceField]),
    );
  }

  private enqueueTranslation(
    jobs: TranslationJob[],
    findingIndex: number,
    target: TranslationTarget,
    source: string,
  ): void {
    if (!source) return;
    jobs.push({ findingIndex, target, source });
  }

  private assignTranslation(
    finding: UnknownRecord,
    target: TranslationTarget,
    translation: string,
  ): void {
    if (target === 'condition') {
      finding.titleEn = translation;
      finding.detectedConditionEn = translation;
      finding.reportSummaryConditionEn = translation;
      return;
    }
    finding[target] = translation;
  }

  private explicitConditionEnglish(finding: UnknownRecord): string {
    return this.translationString(finding.reportSummaryConditionEn)
      || this.translationString(finding.detectedConditionEn)
      || this.translationString(finding.titleEn)
      || this.translationString(finding.descriptionEn);
  }

  private translationArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private translationRecord(value: unknown): UnknownRecord {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as UnknownRecord
      : {};
  }

  private translationString(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return String(value);
    return '';
  }
}
