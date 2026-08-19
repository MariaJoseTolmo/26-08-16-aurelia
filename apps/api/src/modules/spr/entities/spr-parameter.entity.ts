import { RecordStatus } from '@aurelia/contracts';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SprMeasureGroupEntity } from './spr-measure-group.entity';
import { SprUnitEntity } from './spr-unit.entity';

@Entity('spr_parameters')
export class SprParameterEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_spr_parameters_group')
  @Column({ name: 'measure_group_id', type: 'uuid' })
  measureGroupId: string;

  @ManyToOne(() => SprMeasureGroupEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'measure_group_id', foreignKeyConstraintName: 'fk_spr_parameters_group' })
  measureGroup: SprMeasureGroupEntity;

  @Index('idx_spr_parameters_unit')
  @Column({ name: 'unit_id', type: 'uuid', nullable: true })
  unitId: string | null;

  @ManyToOne(() => SprUnitEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'unit_id', foreignKeyConstraintName: 'fk_spr_parameters_unit' })
  unit: SprUnitEntity | null;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 240 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_sox', type: 'boolean', default: false })
  isSox: boolean;

  @Column({ name: 'requires_evidence', type: 'boolean', default: false })
  requiresEvidence: boolean;

  @Column({ name: 'value_type', type: 'varchar', length: 40, default: 'numeric' })
  valueType: string;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ type: 'enum', enum: RecordStatus, enumName: 'record_status', default: RecordStatus.ACTIVE })
  status: RecordStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
