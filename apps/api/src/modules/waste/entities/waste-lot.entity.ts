import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WasteLotStatus } from '../waste.enums';
import { WasteReceiptEntity } from './waste-receipt.entity';
import { WasteTypeEntity } from './waste-type.entity';
import { WasteUnitEntity } from './waste-unit.entity';
import { WasteWarehouseEntity } from './waste-warehouse.entity';

@Entity('waste_lots')
export class WasteLotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lot_number', type: 'varchar', length: 80, unique: true })
  lotNumber: string;

  @Index('idx_waste_lots_receipt')
  @Column({ name: 'receipt_id', type: 'uuid' })
  receiptId: string;

  @ManyToOne(() => WasteReceiptEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'receipt_id', foreignKeyConstraintName: 'fk_waste_lots_receipt' })
  receipt: WasteReceiptEntity;

  @Index('idx_waste_lots_warehouse')
  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId: string;

  @ManyToOne(() => WasteWarehouseEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouse_id', foreignKeyConstraintName: 'fk_waste_lots_warehouse' })
  warehouse: WasteWarehouseEntity;

  @Index('idx_waste_lots_type')
  @Column({ name: 'waste_type_id', type: 'uuid' })
  wasteTypeId: string;

  @ManyToOne(() => WasteTypeEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'waste_type_id', foreignKeyConstraintName: 'fk_waste_lots_type' })
  wasteType: WasteTypeEntity;

  @Column({ name: 'unit_id', type: 'uuid' })
  unitId: string;

  @ManyToOne(() => WasteUnitEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unit_id', foreignKeyConstraintName: 'fk_waste_lots_unit' })
  unit: WasteUnitEntity;

  @Column({ name: 'original_quantity', type: 'numeric', precision: 18, scale: 6 })
  originalQuantity: string;

  @Column({ name: 'current_quantity', type: 'numeric', precision: 18, scale: 6 })
  currentQuantity: string;

  @Column({ name: 'reserved_quantity', type: 'numeric', precision: 18, scale: 6, default: 0 })
  reservedQuantity: string;

  @Column({ name: 'net_weight_kg', type: 'numeric', precision: 18, scale: 3, nullable: true })
  netWeightKg: string | null;

  @Column({ name: 'received_at', type: 'timestamptz' })
  receivedAt: Date;

  @Index('idx_waste_lots_storage_due_at')
  @Column({ name: 'storage_due_at', type: 'timestamptz', nullable: true })
  storageDueAt: Date | null;

  @Index('idx_waste_lots_status')
  @Column({
    type: 'enum',
    enum: WasteLotStatus,
    enumName: 'waste_lot_status',
    default: WasteLotStatus.AVAILABLE,
  })
  status: WasteLotStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
