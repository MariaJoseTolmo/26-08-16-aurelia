import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionLegacyImportEntity } from './entities/inspection-legacy-import.entity';
import { InspectionLegacyMilestoneEntity } from './entities/inspection-legacy-milestone.entity';
import { InspectionLegacyNormalizerService } from './inspection-legacy-normalizer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InspectionLegacyImportEntity,
      InspectionLegacyMilestoneEntity,
    ]),
  ],
  providers: [InspectionLegacyNormalizerService],
  exports: [TypeOrmModule, InspectionLegacyNormalizerService],
})
export class InspectionLegacyImportModule {}
