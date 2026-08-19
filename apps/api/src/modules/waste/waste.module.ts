import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WasteInventoryMovementEntity } from './entities/waste-inventory-movement.entity';
import { WasteLotEntity } from './entities/waste-lot.entity';
import { WasteOperationalCategoryEntity } from './entities/waste-operational-category.entity';
import { WasteReceiptEntity } from './entities/waste-receipt.entity';
import { WasteSidrepRecordEntity } from './entities/waste-sidrep-record.entity';
import { WasteSinaderPeriodLineEntity } from './entities/waste-sinader-period-line.entity';
import { WasteSinaderPeriodEntity } from './entities/waste-sinader-period.entity';
import { WasteTypeEntity } from './entities/waste-type.entity';
import { WasteUnitEntity } from './entities/waste-unit.entity';
import { WasteWarehouseEntity } from './entities/waste-warehouse.entity';
import { WasteWithdrawalItemEntity } from './entities/waste-withdrawal-item.entity';
import { WasteWithdrawalRequestEntity } from './entities/waste-withdrawal-request.entity';
import { ReportsModule } from '../reports/reports.module';
import { WasteIntakeExportXlsxService } from './waste-intake-export-xlsx.service';
import { WasteIntakeExportController } from './waste-intake-export.controller';
import { WasteFolioSupportExportPdfService } from './waste-folio-support-export-pdf.service';
import { WasteSidrepExportController } from './waste-sidrep-export.controller';
import { WasteSinaderExportPdfService } from './waste-sinader-export-pdf.service';
import { WasteSinaderExportXlsxService } from './waste-sinader-export-xlsx.service';
import { WasteSinaderExportController } from './waste-sinader-export.controller';
import { WasteWarehouseExportPdfService } from './waste-warehouse-export-pdf.service';
import { WasteWarehouseExportXlsxService } from './waste-warehouse-export-xlsx.service';
import { WasteWarehouseExportController } from './waste-warehouse-export.controller';
import { WasteController } from './waste.controller';
import { WasteService } from './waste.service';

const WASTE_ENTITIES = [
  WasteUnitEntity,
  WasteOperationalCategoryEntity,
  WasteTypeEntity,
  WasteWarehouseEntity,
  WasteReceiptEntity,
  WasteLotEntity,
  WasteInventoryMovementEntity,
  WasteWithdrawalRequestEntity,
  WasteWithdrawalItemEntity,
  WasteSidrepRecordEntity,
  WasteSinaderPeriodEntity,
  WasteSinaderPeriodLineEntity,
];

@Module({
  // `ReportsModule` aporta `ReportPdfService` (pdfkit) y `XlsxWorkbookService`,
  // ambos exportados por ese módulo. No hay ciclo: reports no conoce waste.
  imports: [TypeOrmModule.forFeature(WASTE_ENTITIES), ReportsModule],
  controllers: [
    WasteController,
    WasteWarehouseExportController,
    WasteIntakeExportController,
    WasteSinaderExportController,
    WasteSidrepExportController,
  ],
  providers: [
    WasteService,
    WasteWarehouseExportPdfService,
    WasteWarehouseExportXlsxService,
    WasteIntakeExportXlsxService,
    WasteSinaderExportPdfService,
    WasteFolioSupportExportPdfService,
    WasteSinaderExportXlsxService,
  ],
  exports: [WasteService],
})
export class WasteModule {}
