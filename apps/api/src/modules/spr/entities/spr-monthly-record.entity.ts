import { SprRecordStatus } from '@aurelia/contracts';
import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { AreaEntity } from '../../organization/entities/area.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { SprParameterAreaAssignmentEntity } from './spr-parameter-area-assignment.entity';
import { SprParameterEntity } from './spr-parameter.entity';

@Entity('spr_monthly_records')
@Index('idx_spr_records_period', ['periodYear', 'periodMonth'])
@Unique('uq_spr_record_period', ['parameterId', 'areaId', 'periodYear', 'periodMonth'])
@Check('chk_spr_record_month', '"period_month" BETWEEN 1 AND 12')
@Check('chk_spr_record_year', '"period_year" BETWEEN 2000 AND 2100')
export class SprMonthlyRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_spr_records_parameter')
  @Column({ name: 'parameter_id', type: 'uuid' })
  parameterId: string;

  @ManyToOne(() => SprParameterEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'parameter_id', foreignKeyConstraintName: 'fk_spr_record_parameter' })
  parameter: SprParameterEntity;

  @Column({ name: 'area_id', type: 'uuid', nullable: true })
  areaId: string | null;

  @ManyToOne(() => AreaEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'area_id', foreignKeyConstraintName: 'fk_spr_record_area' })
  area: AreaEntity | null;

  @Column({ name: 'assignment_id', type: 'uuid', nullable: true })
  assignmentId: string | null;

  @ManyToOne(() => SprParameterAreaAssignmentEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignment_id', foreignKeyConstraintName: 'fk_spr_record_assignment' })
  assignment: SprParameterAreaAssignmentEntity | null;

  @Column({ name: 'period_year', type: 'integer' })
  periodYear: number;

  @Column({ name: 'period_month', type: 'integer' })
  periodMonth: number;

  @Column({ name: 'numeric_value', type: 'numeric', precision: 18, scale: 6, nullable: true })
  numericValue: string | null;

  @Column({ name: 'text_value', type: 'text', nullable: true })
  textValue: string | null;

  @Column({ name: 'boolean_value', type: 'boolean', nullable: true })
  booleanValue: boolean | null;

  @Index('idx_spr_records_status')
  @Column({ type: 'enum', enum: SprRecordStatus, enumName: 'spr_record_status', default: SprRecordStatus.DRAFT })
  status: SprRecordStatus;

  @Column({ name: 'submitted_by_user_id', type: 'uuid', nullable: true })
  submittedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'submitted_by_user_id', foreignKeyConstraintName: 'fk_spr_record_submitted_by' })
  submittedByUser: UserEntity | null;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'approved_by_user_id', type: 'uuid', nullable: true })
  approvedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by_user_id', foreignKeyConstraintName: 'fk_spr_record_approved_by' })
  approvedByUser: UserEntity | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
