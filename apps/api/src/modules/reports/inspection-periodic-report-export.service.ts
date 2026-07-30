import { Injectable } from '@nestjs/common';
import type { InspectionPeriodicReportRequest, InspectionPeriodicReportResponse } from '@aurelia/contracts';
import type { AccessTokenPayload } from '../auth/jwt-token.service';
import { InspectionPeriodicReportClassificationService } from './inspection-periodic-report-classification.service';
import { InspectionPeriodicReportLegacyProjectionService } from './inspection-periodic-report-legacy-projection.service';
import { InspectionPeriodicReportPdfService } from './inspection-periodic-report-pdf.service';
import { InspectionPeriodicReportService } from './inspection-periodic-report.service';
import { InspectionPeriodicReportXlsxService } from './inspection-periodic-report-xlsx.service';

export interface InspectionPeriodicReportFile {
  filename: string;
  buffer: Buffer;
}

@Injectable()
export class InspectionPeriodicReportExportService {
  constructor(
    private readonly reports: InspectionPeriodicReportService,
    private readonly legacyProjection: InspectionPeriodicReportLegacyProjectionService,
    private readonly classifications: InspectionPeriodicReportClassificationService,
    private readonly pdf: InspectionPeriodicReportPdfService,
    private readonly xlsx: InspectionPeriodicReportXlsxService,
  ) {}

  async buildData(
    request: InspectionPeriodicReportRequest,
    user: AccessTokenPayload,
  ): Promise<InspectionPeriodicReportResponse> {
    const report = await this.reports.build(request, user);
    const projected = await this.legacyProjection.project(report);
    return this.classifications.normalize(projected);
  }

  async renderPdf(
    request: InspectionPeriodicReportRequest,
    user: AccessTokenPayload,
  ): Promise<InspectionPeriodicReportFile> {
    const report = await this.buildData(request, user);
    return this.pdf.render(report);
  }

  async renderXlsx(
    request: InspectionPeriodicReportRequest,
    user: AccessTokenPayload,
  ): Promise<InspectionPeriodicReportFile> {
    const report = await this.buildData(request, user);
    return this.xlsx.render(report);
  }
}
