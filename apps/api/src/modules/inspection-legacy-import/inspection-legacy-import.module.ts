import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaEntity } from '../organization/entities/area.entity';
import { CompanyEntity } from '../organization/entities/company.entity';
import { SectorEntity } from '../organization/entities/sector.entity';
import { UserEntity } from '../users/entities/user.entity';
import { InspectionLegacyImportEntity } from './entities/inspection-legacy-import.entity';
import { InspectionLegacyMilestoneEntity } from './entities/inspection-legacy-milestone.entity';
import { InspectionLegacyParticipantEntity } from './entities/inspection-legacy-participant.entity';
import { InspectionLegacySectorLinkEntity } from './entities/inspection-legacy-sector-link.entity';
import { InspectionLegacyApplyService } from './inspection-legacy-apply.service';
import { InspectionLegacyDryRunReporterService } from './inspection-legacy-dry-run-reporter.service';
import { InspectionLegacyNormalizerService } from './inspection-legacy-normalizer.service';
import { InspectionLegacyReadOnlyInterceptor } from './inspection-legacy-read-only.interceptor';
import { InspectionLegacyReconciliationService } from './inspection-legacy-reconciliation.service';
import { InspectionLegacyResolverService } from './inspection-legacy-resolver.service';
import { InspectionLegacySourceManifestService } from './inspection-legacy-source-manifest.service';
import { InspectionLegacyValidatorService } from './inspection-legacy-validator.service';
import { InspectionLegacyXlsxReaderService } from './inspection-legacy-xlsx-reader.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InspectionLegacyImportEntity,
      InspectionLegacyMilestoneEntity,
      InspectionLegacyParticipantEntity,
      InspectionLegacySectorLinkEntity,
      AreaEntity,
      CompanyEntity,
      SectorEntity,
      UserEntity,
    ]),
  ],
  providers: [
    InspectionLegacyApplyService,
    InspectionLegacyDryRunReporterService,
    InspectionLegacyNormalizerService,
    InspectionLegacyReadOnlyInterceptor,
    InspectionLegacyReconciliationService,
    InspectionLegacyResolverService,
    InspectionLegacySourceManifestService,
    InspectionLegacyValidatorService,
    InspectionLegacyXlsxReaderService,
    {
      provide: APP_INTERCEPTOR,
      useExisting: InspectionLegacyReadOnlyInterceptor,
    },
  ],
  exports: [
    TypeOrmModule,
    InspectionLegacyApplyService,
    InspectionLegacyDryRunReporterService,
    InspectionLegacyNormalizerService,
    InspectionLegacyReconciliationService,
    InspectionLegacyResolverService,
    InspectionLegacySourceManifestService,
    InspectionLegacyValidatorService,
    InspectionLegacyXlsxReaderService,
  ],
})
export class InspectionLegacyImportModule {}
