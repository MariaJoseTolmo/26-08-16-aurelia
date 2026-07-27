import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionLegacyImportEntity } from './entities/inspection-legacy-import.entity';
import { InspectionLegacyMilestoneEntity } from './entities/inspection-legacy-milestone.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InspectionLegacyImportEntity,
      InspectionLegacyMilestoneEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class InspectionLegacyImportModule {}
