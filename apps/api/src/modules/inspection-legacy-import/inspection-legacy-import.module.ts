import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaEntity } from '../organization/entities/area.entity';
import { CompanyEntity } from '../organization/entities/company.entity';
import { UserEntity } from '../users/entities/user.entity';
import { InspectionLegacyImportEntity } from './entities/inspection-legacy-import.entity';
import { InspectionLegacyMilestoneEntity } from './entities/inspection-legacy-milestone.entity';
import { InspectionLegacyNormalizerService } from './inspection-legacy-normalizer.service';
import { InspectionLegacyResolverService } from './inspection-legacy-resolver.service';
import { InspectionLegacySourceManifestService } from './inspection-legacy-source-manifest.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InspectionLegacyImportEntity,
      InspectionLegacyMilestoneEntity,
      AreaEntity,
      CompanyEntity,
      UserEntity,
    ]),
  ],
  providers: [
    InspectionLegacyNormalizerService,
    InspectionLegacyResolverService,
    InspectionLegacySourceManifestService,
  ],
  exports: [
    TypeOrmModule,
    InspectionLegacyNormalizerService,
    InspectionLegacyResolverService,
    InspectionLegacySourceManifestService,
  ],
})
export class InspectionLegacyImportModule {}
