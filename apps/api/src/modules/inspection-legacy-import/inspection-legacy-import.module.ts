import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaEntity } from '../organization/entities/area.entity';
import { CompanyEntity } from '../organization/entities/company.entity';
import { SectorEntity } from '../organization/entities/sector.entity';
import { UserEntity } from '../users/entities/user.entity';
import { InspectionLegacyImportEntity } from './entities/inspection-legacy-import.entity';
import { InspectionLegacyMilestoneEntity } from './entities/inspection-legacy-milestone.entity';
import { InspectionLegacyDryRunReporterService } from './inspection-legacy-dry-run-reporter.service';
import { InspectionLegacyNormalizerService } from './inspection-legacy-normalizer.service';
import { InspectionLegacyReconciliationService } from './inspection-legacy-reconciliation.service';
import { InspectionLegacyResolverService } from './inspection-legacy-resolver.service';
import { InspectionLegacySourceManifestService } from './inspection-legacy-source-manifest.service';
import { InspectionLegacyValidatorService } from './inspection-legacy-validator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InspectionLegacyImportEntity,
      InspectionLegacyMilestoneEntity,
      AreaEntity,
      CompanyEntity,
      SectorEntity,
      UserEntity,
    ]),
  ],
  providers: [
    InspectionLegacyDryRunReporterService,
    InspectionLegacyNormalizerService,
    InspectionLegacyReconciliationService,
    InspectionLegacyResolverService,
    InspectionLegacySourceManifestService,
    InspectionLegacyValidatorService,
  ],
  exports: [
    TypeOrmModule,
    InspectionLegacyDryRunReporterService,
    InspectionLegacyNormalizerService,
    InspectionLegacyReconciliationService,
    InspectionLegacyResolverService,
    InspectionLegacySourceManifestService,
    InspectionLegacyValidatorService,
  ],
})
export class InspectionLegacyImportModule {}
