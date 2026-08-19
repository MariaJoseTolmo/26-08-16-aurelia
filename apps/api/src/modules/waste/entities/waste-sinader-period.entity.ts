import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { BusinessUnitEntity } from '../../organization/entities/business-unit.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { WasteSinaderPeriodStatus } from '../waste.enums';

@Entity('waste_sinader_periods')
@Unique('uq_waste_sinader_period_business_unit', ['businessUnitId', 'periodYear', 'periodMonth'])
export class WasteSinaderPeriodEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_waste_sinader_periods_business_unit')
  @Column({ name: 'business_unit_id', type: 'uuid' })
  businessUnitId: string;

  @ManyToOne(() => BusinessUnitEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'business_unit_id', foreignKeyConstraintName: 'fk_waste_sinader_periods_business_unit' })
  businessUnit: BusinessUnitEntity;

  @Column({ name: 'period_year', type: 'integer' })
  periodYear: number;

  @Column({ name: 'period_month', type: 'integer' })
  periodMonth: number;

  @Index('idx_waste_sinader_periods_status')
  @Column({
    type: 'enum',
    enum: WasteSinaderPeriodStatus,
    enumName: 'waste_sinader_period_status',
    default: WasteSinaderPeriodStatus.IN_PROGRESS,
  })
  status: WasteSinaderPeriodStatus;

  @Column({ name: 'total_quantity_kg', type: 'numeric', precision: 18, scale: 3, default: 0 })
  totalQuantityKg: string;

  @Column({ name: 'movement_count', type: 'integer', default: 0 })
  movementCount: number;

  @Column({ name: 'category_count', type: 'integer', default: 0 })
  categoryCount: number;

  @Column({ name: 'declared_folio', type: 'varchar', length: 120, nullable: true, unique: true })
  declaredFolio: string | null;

  @Column({ name: 'declared_at', type: 'timestamptz', nullable: true })
  declaredAt: Date | null;

  @Column({ name: 'declared_by_user_id', type: 'uuid', nullable: true })
  declaredByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'declared_by_user_id', foreignKeyConstraintName: 'fk_waste_sinader_periods_declared_by' })
  declaredByUser: UserEntity | null;

  @Column({ name: 'source_snapshot', type: 'jsonb', nullable: true })
  sourceSnapshot: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
