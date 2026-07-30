import { RecordStatus } from '@aurelia/contracts';
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
import { WasteOperationalCategoryEntity } from './waste-operational-category.entity';
import { WasteUnitEntity } from './waste-unit.entity';

@Entity('waste_types')
export class WasteTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_waste_types_category')
  @Column({ name: 'operational_category_id', type: 'uuid' })
  operationalCategoryId: string;

  @ManyToOne(() => WasteOperationalCategoryEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'operational_category_id', foreignKeyConstraintName: 'fk_waste_types_category' })
  operationalCategory: WasteOperationalCategoryEntity;

  @Index('idx_waste_types_default_unit')
  @Column({ name: 'default_unit_id', type: 'uuid', nullable: true })
  defaultUnitId: string | null;

  @ManyToOne(() => WasteUnitEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'default_unit_id', foreignKeyConstraintName: 'fk_waste_types_default_unit' })
  defaultUnit: WasteUnitEntity | null;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 220 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_hazardous', type: 'boolean', default: false })
  isHazardous: boolean;

  @Column({ name: 'sidrep_code', type: 'varchar', length: 100, nullable: true })
  sidrepCode: string | null;

  @Column({ name: 'sinader_code', type: 'varchar', length: 100, nullable: true })
  sinaderCode: string | null;

  @Column({ name: 'storage_limit_days', type: 'integer', nullable: true })
  storageLimitDays: number | null;

  @Column({ name: 'warning_before_days', type: 'integer', default: 30 })
  warningBeforeDays: number;

  @Column({ name: 'requires_sidrep', type: 'boolean', default: false })
  requiresSidrep: boolean;

  @Column({ name: 'requires_sinader', type: 'boolean', default: false })
  requiresSinader: boolean;

  @Column({ name: 'requires_hds', type: 'boolean', default: false })
  requiresHds: boolean;

  @Column({ name: 'requires_vehicle_photos', type: 'boolean', default: false })
  requiresVehiclePhotos: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'enum', enum: RecordStatus, enumName: 'record_status', default: RecordStatus.ACTIVE })
  status: RecordStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
