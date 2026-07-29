import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DatabaseMaintenanceService } from './database-maintenance.service';
import { RunDatabaseMaintenanceDto } from './dto/run-database-maintenance.dto';
import { DatabaseMaintenanceGuard } from './database-maintenance.guard';
import { LegacyInspectionsWebImportService } from './legacy-inspections-web-import.service';

const LEGACY_XLSX_UPLOAD_OPTIONS = {
  limits: {
    files: 1,
    fileSize: 2_000_000,
  },
};

@UseGuards(DatabaseMaintenanceGuard)
@Controller('admin/database')
export class DatabaseMaintenanceController {
  constructor(
    private readonly databaseMaintenanceService: DatabaseMaintenanceService,
    private readonly legacyInspectionsWebImportService: LegacyInspectionsWebImportService,
  ) {}

  @Get('maintenance/plan')
  plan() {
    return this.databaseMaintenanceService.plan();
  }

  @Post('maintenance')
  run(@Body() dto: RunDatabaseMaintenanceDto) {
    return this.databaseMaintenanceService.run(dto);
  }

  @Post('maintenance/legacy-inspections/preview')
  @UseInterceptors(FileInterceptor('file', LEGACY_XLSX_UPLOAD_OPTIONS))
  previewLegacyInspections(@UploadedFile() file: Express.Multer.File | undefined) {
    return this.legacyInspectionsWebImportService.preview(file);
  }

  @Post('maintenance/legacy-inspections/import')
  @UseInterceptors(FileInterceptor('file', LEGACY_XLSX_UPLOAD_OPTIONS))
  importLegacyInspections(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('confirmation') confirmation?: string,
  ) {
    return this.legacyInspectionsWebImportService.import(file, confirmation);
  }
}
