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
import { AreaEntity } from '../../organization/entities/area.entity';
import { SectorEntity } from '../../organization/entities/sector.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { WasteWarehouseEntity } from './waste-warehouse.entity';

@Entity('waste_receipts')
export class WasteReceiptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'receipt_number', type: 'varchar', length: 80, unique: true })
  receiptNumber: string;

  @Index('idx_waste_receipts_warehouse')
  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId: string;

  @ManyToOne(() => WasteWarehouseEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouse_id', foreignKeyConstraintName: 'fk_waste_receipts_warehouse' })
  warehouse: WasteWarehouseEntity;

  @Column({ name: 'received_at', type: 'timestamptz' })
  receivedAt: Date;

  @Column({ name: 'origin_area_id', type: 'uuid', nullable: true })
  originAreaId: string | null;

  @ManyToOne(() => AreaEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'origin_area_id', foreignKeyConstraintName: 'fk_waste_receipts_origin_area' })
  originArea: AreaEntity | null;

  @Column({ name: 'origin_sector_id', type: 'uuid', nullable: true })
  originSectorId: string | null;

  @ManyToOne(() => SectorEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'origin_sector_id', foreignKeyConstraintName: 'fk_waste_receipts_origin_sector' })
  originSector: SectorEntity | null;

  @Column({ name: 'origin_location_text', type: 'varchar', length: 240, nullable: true })
  originLocationText: string | null;

  @Column({ name: 'vehicle_plate', type: 'varchar', length: 30, nullable: true })
  vehiclePlate: string | null;

  @Column({ name: 'driver_name', type: 'varchar', length: 180, nullable: true })
  driverName: string | null;

  @Column({ name: 'registered_by_user_id', type: 'uuid', nullable: true })
  registeredByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'registered_by_user_id', foreignKeyConstraintName: 'fk_waste_receipts_registered_by' })
  registeredByUser: UserEntity | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
