import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

@Injectable()
export class WasteService {
  constructor(
    @InjectRepository(WasteUnitEntity)
    private readonly unitsRepository: Repository<WasteUnitEntity>,
    @InjectRepository(WasteOperationalCategoryEntity)
    private readonly categoriesRepository: Repository<WasteOperationalCategoryEntity>,
    @InjectRepository(WasteTypeEntity)
    private readonly typesRepository: Repository<WasteTypeEntity>,
    @InjectRepository(WasteWarehouseEntity)
    private readonly warehousesRepository: Repository<WasteWarehouseEntity>,
    @InjectRepository(WasteReceiptEntity)
    private readonly receiptsRepository: Repository<WasteReceiptEntity>,
    @InjectRepository(WasteLotEntity)
    private readonly lotsRepository: Repository<WasteLotEntity>,
    @InjectRepository(WasteInventoryMovementEntity)
    private readonly movementsRepository: Repository<WasteInventoryMovementEntity>,
    @InjectRepository(WasteWithdrawalRequestEntity)
    private readonly withdrawalRequestsRepository: Repository<WasteWithdrawalRequestEntity>,
    @InjectRepository(WasteWithdrawalItemEntity)
    private readonly withdrawalItemsRepository: Repository<WasteWithdrawalItemEntity>,
    @InjectRepository(WasteSidrepRecordEntity)
    private readonly sidrepRecordsRepository: Repository<WasteSidrepRecordEntity>,
    @InjectRepository(WasteSinaderPeriodEntity)
    private readonly sinaderPeriodsRepository: Repository<WasteSinaderPeriodEntity>,
    @InjectRepository(WasteSinaderPeriodLineEntity)
    private readonly sinaderLinesRepository: Repository<WasteSinaderPeriodLineEntity>,
  ) {}

  findUnits() {
    return this.unitsRepository.find({ order: { name: 'ASC' } });
  }

  findCategories() {
    return this.categoriesRepository.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async findTypes(query: Record<string, string | undefined>) {
    const builder = this.typesRepository
      .createQueryBuilder('wasteType')
      .leftJoinAndSelect('wasteType.operationalCategory', 'operationalCategory')
      .leftJoinAndSelect('wasteType.defaultUnit', 'defaultUnit')
      .orderBy('operationalCategory.sort_order', 'ASC')
      .addOrderBy('wasteType.name', 'ASC');

    if (query.categoryId) {
      builder.andWhere('wasteType.operational_category_id = :categoryId', { categoryId: query.categoryId });
    }
    if (query.hazardous !== undefined) {
      builder.andWhere('wasteType.is_hazardous = :hazardous', { hazardous: this.parseBoolean(query.hazardous) });
    }
    if (query.status) {
      builder.andWhere('wasteType.status = :status', { status: query.status });
    }

    return builder.getMany();
  }

  async findWarehouses(query: Record<string, string | undefined>) {
    const builder = this.warehousesRepository
      .createQueryBuilder('warehouse')
      .leftJoinAndSelect('warehouse.businessUnit', 'businessUnit')
      .leftJoinAndSelect('warehouse.area', 'area')
      .leftJoinAndSelect('warehouse.sector', 'sector')
      .leftJoinAndSelect('warehouse.location', 'location')
      .orderBy('warehouse.name', 'ASC');

    if (query.businessUnitId) {
      builder.andWhere('warehouse.business_unit_id = :businessUnitId', { businessUnitId: query.businessUnitId });
    }
    if (query.areaId) builder.andWhere('warehouse.area_id = :areaId', { areaId: query.areaId });
    if (query.active !== undefined) {
      builder.andWhere('warehouse.is_active = :active', { active: this.parseBoolean(query.active) });
    }

    return builder.getMany();
  }

  async findReceipts(query: Record<string, string | undefined>) {
    const builder = this.receiptsRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.warehouse', 'warehouse')
      .leftJoinAndSelect('receipt.originArea', 'originArea')
      .leftJoinAndSelect('receipt.originSector', 'originSector')
      .orderBy('receipt.received_at', 'DESC');

    if (query.warehouseId) {
      builder.andWhere('receipt.warehouse_id = :warehouseId', { warehouseId: query.warehouseId });
    }
    if (query.from) builder.andWhere('receipt.received_at >= :from', { from: query.from });
    if (query.to) builder.andWhere('receipt.received_at <= :to', { to: query.to });

    return builder.getMany();
  }

  async findLots(query: Record<string, string | undefined>) {
    const builder = this.lotsRepository
      .createQueryBuilder('lot')
      .leftJoinAndSelect('lot.warehouse', 'warehouse')
      .leftJoinAndSelect('lot.wasteType', 'wasteType')
      .leftJoinAndSelect('wasteType.operationalCategory', 'operationalCategory')
      .leftJoinAndSelect('lot.unit', 'unit')
      .orderBy('lot.received_at', 'DESC');

    if (query.warehouseId) builder.andWhere('lot.warehouse_id = :warehouseId', { warehouseId: query.warehouseId });
    if (query.wasteTypeId) builder.andWhere('lot.waste_type_id = :wasteTypeId', { wasteTypeId: query.wasteTypeId });
    if (query.status) builder.andWhere('lot.status = :status', { status: query.status });
    if (query.hazardous !== undefined) {
      builder.andWhere('wasteType.is_hazardous = :hazardous', { hazardous: this.parseBoolean(query.hazardous) });
    }
    if (this.parseBoolean(query.availableOnly, false)) {
      builder.andWhere('(lot.current_quantity - lot.reserved_quantity) > 0');
    }
    if (this.parseBoolean(query.overdue, false)) {
      builder.andWhere('lot.storage_due_at IS NOT NULL AND lot.storage_due_at < now()');
    }
    if (this.parseBoolean(query.nearDue, false)) {
      builder.andWhere(
        `lot.storage_due_at IS NOT NULL
         AND lot.storage_due_at >= now()
         AND lot.storage_due_at <= now() + (wasteType.warning_before_days * interval '1 day')`,
      );
    }

    return builder.getMany();
  }

  async findLot(id: string) {
    const lot = await this.lotsRepository.findOne({
      where: { id },
      relations: {
        receipt: true,
        warehouse: true,
        wasteType: { operationalCategory: true, defaultUnit: true },
        unit: true,
      },
    });

    if (!lot) throw new NotFoundException('Waste lot not found');
    return lot;
  }

  async findLotMovements(id: string) {
    await this.findLot(id);
    return this.movementsRepository.find({
      where: { lotId: id },
      relations: { unit: true },
      order: { occurredAt: 'DESC' },
    });
  }

  async findWithdrawalRequests(query: Record<string, string | undefined>) {
    const builder = this.withdrawalRequestsRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.warehouse', 'warehouse')
      .leftJoinAndSelect('request.transportCompany', 'transportCompany')
      .leftJoinAndSelect('request.destinationCompany', 'destinationCompany')
      .orderBy('request.requested_at', 'DESC');

    if (query.warehouseId) builder.andWhere('request.warehouse_id = :warehouseId', { warehouseId: query.warehouseId });
    if (query.status) builder.andWhere('request.status = :status', { status: query.status });
    if (query.approvalStatus) {
      builder.andWhere('request.approval_status = :approvalStatus', { approvalStatus: query.approvalStatus });
    }
    if (query.hazardous !== undefined) {
      builder.andWhere('request.is_hazardous = :hazardous', { hazardous: this.parseBoolean(query.hazardous) });
    }

    return builder.getMany();
  }

  async findWithdrawalRequest(id: string) {
    const request = await this.withdrawalRequestsRepository.findOne({
      where: { id },
      relations: {
        warehouse: true,
        transportCompany: true,
        destinationCompany: true,
        destinationLocation: true,
      },
    });
    if (!request) throw new NotFoundException('Waste withdrawal request not found');

    const items = await this.withdrawalItemsRepository.find({
      where: { withdrawalRequestId: id },
      relations: { lot: { wasteType: true }, unit: true },
      order: { createdAt: 'ASC' },
    });

    return { ...request, items };
  }

  async findSidrepRecords(query: Record<string, string | undefined>) {
    const builder = this.sidrepRecordsRepository
      .createQueryBuilder('sidrep')
      .leftJoinAndSelect('sidrep.withdrawalRequest', 'withdrawalRequest')
      .leftJoinAndSelect('withdrawalRequest.transportCompany', 'transportCompany')
      .leftJoinAndSelect('withdrawalRequest.destinationCompany', 'destinationCompany')
      .orderBy('sidrep.created_at', 'DESC');

    if (query.status) builder.andWhere('sidrep.status = :status', { status: query.status });
    if (query.folio) builder.andWhere('sidrep.external_folio ILIKE :folio', { folio: `%${query.folio}%` });

    return builder.getMany();
  }

  async findSinaderPeriods(query: Record<string, string | undefined>) {
    const builder = this.sinaderPeriodsRepository
      .createQueryBuilder('period')
      .leftJoinAndSelect('period.businessUnit', 'businessUnit')
      .orderBy('period.period_year', 'DESC')
      .addOrderBy('period.period_month', 'DESC');

    if (query.businessUnitId) {
      builder.andWhere('period.business_unit_id = :businessUnitId', { businessUnitId: query.businessUnitId });
    }
    if (query.year) builder.andWhere('period.period_year = :year', { year: Number(query.year) });
    if (query.month) builder.andWhere('period.period_month = :month', { month: Number(query.month) });
    if (query.status) builder.andWhere('period.status = :status', { status: query.status });

    return builder.getMany();
  }

  async findSinaderPeriod(id: string) {
    const period = await this.sinaderPeriodsRepository.findOne({ where: { id }, relations: { businessUnit: true } });
    if (!period) throw new NotFoundException('SINADER period not found');

    const lines = await this.sinaderLinesRepository.find({
      where: { sinaderPeriodId: id },
      relations: { wasteType: true, unit: true, destinationCompany: true, transportCompany: true },
      order: { createdAt: 'ASC' },
    });

    return { ...period, lines };
  }

  private parseBoolean(value: string | undefined, defaultValue = false): boolean {
    if (value === undefined) return defaultValue;
    return value === 'true' || value === '1';
  }
}
