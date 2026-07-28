import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionLegacyImportEntity } from './entities/inspection-legacy-import.entity';
import { InspectionLegacyMilestoneEntity } from './entities/inspection-legacy-milestone.entity';
import { InspectionLegacyNormalizerService } from './inspection-legacy-normalizer.service';
import { InspectionLegacySourceManifestService } from './inspection-legacy-source-manifest.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InspectionLegacyImportEntity,
      InspectionLegacyMilestoneEntity,
    ]),
  ],
  providers: [
    InspectionLegacyNormalizerService,
    InspectionLegacySourceManifestService,
  ],
  exports: [
    TypeOrmModule,
    InspectionLegacyNormalizerService,
    InspectionLegacySourceManifestService,
  ],
})
export class InspectionLegacyImportModule {}
