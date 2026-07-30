import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesModule } from '../files/files.module';
import { InspectionLegacyImportEntity } from '../inspection-legacy-import/entities/inspection-legacy-import.entity';
import { InspectionFindingEntity } from '../inspections/entities/inspection-finding.entity';
import { InspectionTypeEntity } from '../inspections/entities/inspection-type.entity';
import { InspectionEntity } from '../inspections/entities/inspection.entity';
import { AreaEntity } from '../organization/entities/area.entity';
import { CompanyEntity } from '../organization/entities/company.entity';
import { SectorEntity } from '../organization/entities/sector.entity';
import { UserEntity } from '../users/entities/user.entity';
import { InspectionDetailReportPdfFidelityService } from './inspection-detail-report-pdf-fidelity.service';
import { InspectionDetailReportPdfFinalService } from './inspection-detail-report-pdf-final.service';
import { InspectionDetailReportPdfLayoutService } from './inspection-detail-report-pdf-layout.service';
import { InspectionDetailReportPdfPixelPerfectService } from './inspection-detail-report-pdf-pixel-perfect.service';
import { InspectionDetailReportPdfRuntimeService } from './inspection-detail-report-pdf-runtime.service';
import { InspectionDetailReportPdfService } from './inspection-detail-report-pdf.service';
import { InspectionDetailReportPdfTranslatedService } from './inspection-detail-report-pdf-translated.service';
import { InspectionPeriodicReportClassificationService } from './inspection-periodic-report-classification.service';
import { InspectionPeriodicReportController } from './inspection-periodic-report.controller';
import { InspectionPeriodicReportExportService } from './inspection-periodic-report-export.service';
import { InspectionPeriodicReportPdfAlertIconFidelityService } from './inspection-periodic-report-pdf-alert-icon-fidelity.service';
import { InspectionPeriodicReportPdfService } from './inspection-periodic-report-pdf.service';
import { InspectionPeriodicReportService } from './inspection-periodic-report.service';
import { InspectionPeriodicReportXlsxService } from './inspection-periodic-report-xlsx.service';
import { ReportPdfBrandingService } from './report-pdf-branding.service';
import { ReportPdfService } from './report-pdf.service';
import { ReportPeriodService } from './report-period.service';
import { ReportScopeService } from './report-scope.service';
import { ReportTranslationService } from './report-translation.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { XlsxWorkbookService } from './xlsx-workbook.service';

@Module({
  imports: [
    FilesModule,
    TypeOrmModule.forFeature([
      InspectionEntity,
      InspectionFindingEntity,
      InspectionLegacyImportEntity,
      InspectionTypeEntity,
      CompanyEntity,
      AreaEntity,
      SectorEntity,
      UserEntity,
    ]),
  ],
  controllers: [ReportsController, InspectionPeriodicReportController],
  providers: [
    ReportsService,
    ReportPdfService,
    ReportPdfBrandingService,
    ReportPeriodService,
    ReportScopeService,
    ReportTranslationService,
    XlsxWorkbookService,
    InspectionPeriodicReportService,
    InspectionPeriodicReportClassificationService,
    InspectionPeriodicReportPdfAlertIconFidelityService,
    {
      provide: InspectionPeriodicReportPdfService,
      useExisting: InspectionPeriodicReportPdfAlertIconFidelityService,
    },
    InspectionPeriodicReportXlsxService,
    InspectionPeriodicReportExportService,
    InspectionDetailReportPdfFidelityService,
    InspectionDetailReportPdfRuntimeService,
    InspectionDetailReportPdfFinalService,
    InspectionDetailReportPdfPixelPerfectService,
    InspectionDetailReportPdfTranslatedService,
    InspectionDetailReportPdfLayoutService,
    {
      provide: InspectionDetailReportPdfService,
      useExisting: InspectionDetailReportPdfLayoutService,
    },
  ],
  exports: [
    ReportPdfService,
    ReportPdfBrandingService,
    ReportPeriodService,
    ReportScopeService,
    XlsxWorkbookService,
    InspectionDetailReportPdfService,
  ],
})
export class ReportsModule {}
