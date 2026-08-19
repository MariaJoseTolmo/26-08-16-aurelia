import { Module } from '@nestjs/common';
import { DatabaseMaintenanceController } from './database-maintenance.controller';
import { DatabaseMaintenanceGuard } from './database-maintenance.guard';
import { DatabaseMaintenanceService } from './database-maintenance.service';
import { LegacyInspectionsWebImportService } from './legacy-inspections-web-import.service';

@Module({
  controllers: [DatabaseMaintenanceController],
  providers: [
    DatabaseMaintenanceService,
    DatabaseMaintenanceGuard,
    LegacyInspectionsWebImportService,
  ],
})
export class DatabaseMaintenanceModule {}
