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
import { BusinessUnitEntity } from '../../organization/entities/business-unit.entity';
import { LocationEntity } from '../../organization/entities/location.entity';
import { SectorEntity } from '../../organization/entities/sector.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('waste_warehouses')
export class WasteWarehouseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Index('idx_waste_warehouses_business_unit')
  @Column({ name: 'business_unit_id', type: 'uuid', nullable: true })
  businessUnitId: string | null;

  @ManyToOne(() => BusinessUnitEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'business_unit_id', foreignKeyConstraintName: 'fk_waste_warehouses_business_unit' })
  businessUnit: BusinessUnitEntity | null;

  @Index('idx_waste_warehouses_area')
  @Column({ name: 'area_id', type: 'uuid', nullable: true })
  areaId: string | null;

  @ManyToOne(() => AreaEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'area_id', foreignKeyConstraintName: 'fk_waste_warehouses_area' })
  area: AreaEntity | null;

  @Index('idx_waste_warehouses_sector')
  @Column({ name: 'sector_id', type: 'uuid', nullable: true })
  sectorId: string | null;

  @ManyToOne(() => SectorEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sector_id', foreignKeyConstraintName: 'fk_waste_warehouses_sector' })
  sector: SectorEntity | null;

  @Index('idx_waste_warehouses_location')
  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string | null;

  @ManyToOne(() => LocationEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'location_id', foreignKeyConstraintName: 'fk_waste_warehouses_location' })
  location: LocationEntity | null;

  @Column({ name: 'responsible_user_id', type: 'uuid', nullable: true })
  responsibleUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'responsible_user_id', foreignKeyConstraintName: 'fk_waste_warehouses_responsible' })
  responsibleUser: UserEntity | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
