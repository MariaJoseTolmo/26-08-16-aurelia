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
import { CompanyEntity } from '../../organization/entities/company.entity';
import { LocationEntity } from '../../organization/entities/location.entity';
import { WasteSinaderPeriodEntity } from './waste-sinader-period.entity';
import { WasteTypeEntity } from './waste-type.entity';
import { WasteUnitEntity } from './waste-unit.entity';

@Entity('waste_sinader_period_lines')
@Unique('uq_waste_sinader_line_dimensions', [
  'sinaderPeriodId',
  'wasteTypeId',
  'transportCompanyId',
  'destinationCompanyId',
])
export class WasteSinaderPeriodLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_waste_sinader_lines_period')
  @Column({ name: 'sinader_period_id', type: 'uuid' })
  sinaderPeriodId: string;

  @ManyToOne(() => WasteSinaderPeriodEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sinader_period_id', foreignKeyConstraintName: 'fk_waste_sinader_lines_period' })
  sinaderPeriod: WasteSinaderPeriodEntity;

  @Index('idx_waste_sinader_lines_type')
  @Column({ name: 'waste_type_id', type: 'uuid' })
  wasteTypeId: string;

  @ManyToOne(() => WasteTypeEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'waste_type_id', foreignKeyConstraintName: 'fk_waste_sinader_lines_type' })
  wasteType: WasteTypeEntity;

  @Column({ name: 'unit_id', type: 'uuid' })
  unitId: string;

  @ManyToOne(() => WasteUnitEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unit_id', foreignKeyConstraintName: 'fk_waste_sinader_lines_unit' })
  unit: WasteUnitEntity;

  @Column({ type: 'numeric', precision: 18, scale: 6 })
  quantity: string;

  @Column({ name: 'treatment_type', type: 'varchar', length: 120, nullable: true })
  treatmentType: string | null;

  @Column({ name: 'destination_company_id', type: 'uuid', nullable: true })
  destinationCompanyId: string | null;

  @ManyToOne(() => CompanyEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'destination_company_id', foreignKeyConstraintName: 'fk_waste_sinader_lines_destination_company' })
  destinationCompany: CompanyEntity | null;

  @Column({ name: 'destination_location_id', type: 'uuid', nullable: true })
  destinationLocationId: string | null;

  @ManyToOne(() => LocationEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'destination_location_id', foreignKeyConstraintName: 'fk_waste_sinader_lines_destination_location' })
  destinationLocation: LocationEntity | null;

  @Column({ name: 'transport_company_id', type: 'uuid', nullable: true })
  transportCompanyId: string | null;

  @ManyToOne(() => CompanyEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'transport_company_id', foreignKeyConstraintName: 'fk_waste_sinader_lines_transport_company' })
  transportCompany: CompanyEntity | null;

  @Column({ name: 'movement_count', type: 'integer', default: 0 })
  movementCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
