import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { WasteInventoryMovementEntity } from '../modules/waste/entities/waste-inventory-movement.entity';
import { WasteLotEntity } from '../modules/waste/entities/waste-lot.entity';
import { WasteOperationalCategoryEntity } from '../modules/waste/entities/waste-operational-category.entity';
import { WasteReceiptEntity } from '../modules/waste/entities/waste-receipt.entity';
import { WasteSidrepRecordEntity } from '../modules/waste/entities/waste-sidrep-record.entity';
import { WasteSinaderPeriodLineEntity } from '../modules/waste/entities/waste-sinader-period-line.entity';
import { WasteSinaderPeriodEntity } from '../modules/waste/entities/waste-sinader-period.entity';
import { WasteTypeEntity } from '../modules/waste/entities/waste-type.entity';
import { WasteUnitEntity } from '../modules/waste/entities/waste-unit.entity';
import { WasteWarehouseEntity } from '../modules/waste/entities/waste-warehouse.entity';
import { WasteWithdrawalItemEntity } from '../modules/waste/entities/waste-withdrawal-item.entity';
import { WasteWithdrawalRequestEntity } from '../modules/waste/entities/waste-withdrawal-request.entity';
import {
  WasteApprovalStatus,
  WasteLotStatus,
  WasteSidrepStatus,
  WasteSinaderPeriodStatus,
  WasteWithdrawalStatus,
} from '../modules/waste/waste.enums';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function main(): void {
  const entities = [
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
  const expectedTables = [
    'waste_units',
    'waste_operational_categories',
    'waste_types',
    'waste_warehouses',
    'waste_receipts',
    'waste_lots',
    'waste_inventory_movements',
    'waste_withdrawal_requests',
    'waste_withdrawal_items',
    'waste_sidrep_records',
    'waste_sinader_periods',
    'waste_sinader_period_lines',
  ];

  const registeredTables = new Map(
    getMetadataArgsStorage()
      .tables.filter((table) => entities.includes(table.target as (typeof entities)[number]))
      .map((table) => [table.name, table.target]),
  );

  for (const table of expectedTables) {
    assert(registeredTables.has(table), `Missing TypeORM waste entity metadata for ${table}`);
  }

  assert(WasteLotStatus.AVAILABLE === 'available', 'Waste lot status contract changed');
  assert(WasteWithdrawalStatus.SUBMITTED === 'submitted', 'Waste withdrawal status contract changed');
  assert(WasteApprovalStatus.PENDING === 'pending', 'Waste approval status contract changed');
  assert(WasteSidrepStatus.AWAITING_APPROVAL === 'awaiting_approval', 'SIDREP status contract changed');
  assert(WasteSinaderPeriodStatus.PENDING_DECLARATION === 'pending_declaration', 'SINADER status contract changed');

  console.log('Waste module foundation smoke test passed');
}

main();
