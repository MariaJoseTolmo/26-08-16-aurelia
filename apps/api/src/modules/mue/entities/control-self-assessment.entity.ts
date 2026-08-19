import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AreaEntity } from '../../organization/entities/area.entity';
import { CompanyEntity } from '../../organization/entities/company.entity';
import { GerenciaEntity } from '../../organization/entities/gerencia.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { CriticalControlEntity } from './critical-control.entity';
import { ControlSelfAssessmentAnswerEntity } from './control-self-assessment-answer.entity';
import { MueEntity } from './mue.entity';

@Entity('control_self_assessments')
@Index('idx_control_self_assessments_period', ['periodYear', 'periodMonth'])
export class ControlSelfAssessmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_control_self_assessments_mue')
  @Column({ name: 'mue_id', type: 'uuid' })
  mueId: string;

  @ManyToOne(() => MueEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mue_id', foreignKeyConstraintName: 'fk_control_self_assessments_mue' })
  mue: MueEntity;

  @Column({ name: 'critical_control_id', type: 'uuid', nullable: true })
  criticalControlId: string | null;

  @ManyToOne(() => CriticalControlEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'critical_control_id', foreignKeyConstraintName: 'fk_control_self_assessments_control' })
  criticalControl: CriticalControlEntity | null;

  @Column({ name: 'area_id', type: 'uuid', nullable: true })
  areaId: string | null;

  @ManyToOne(() => AreaEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'area_id', foreignKeyConstraintName: 'fk_control_self_assessments_area' })
  area: AreaEntity | null;

  @Column({ name: 'gerencia_id', type: 'uuid', nullable: true })
  gerenciaId: string | null;

  @ManyToOne(() => GerenciaEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'gerencia_id', foreignKeyConstraintName: 'fk_control_self_assessments_gerencia' })
  gerencia: GerenciaEntity | null;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string | null;

  @ManyToOne(() => CompanyEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'company_id', foreignKeyConstraintName: 'fk_control_self_assessments_company' })
  company: CompanyEntity | null;

  @Column({ name: 'period_year', type: 'integer' })
  periodYear: number;

  @Column({ name: 'period_month', type: 'integer' })
  periodMonth: number;

  @Index('idx_control_self_assessments_status')
  @Column({ type: 'varchar', length: 40, default: 'draft' })
  status: string;

  @Column({ name: 'compliance_score', type: 'numeric', precision: 5, scale: 2, nullable: true })
  complianceScore: string | null;

  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_user_id', foreignKeyConstraintName: 'fk_control_self_assessments_created_by' })
  createdByUser: UserEntity | null;

  @Column({ name: 'submitted_by_user_id', type: 'uuid', nullable: true })
  submittedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'submitted_by_user_id', foreignKeyConstraintName: 'fk_control_self_assessments_submitted_by' })
  submittedByUser: UserEntity | null;

  @Column({ name: 'validated_by_user_id', type: 'uuid', nullable: true })
  validatedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'validated_by_user_id', foreignKeyConstraintName: 'fk_control_self_assessments_validated_by' })
  validatedByUser: UserEntity | null;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'validated_at', type: 'timestamptz', nullable: true })
  validatedAt: Date | null;

  @OneToMany(() => ControlSelfAssessmentAnswerEntity, (answer) => answer.assessment)
  answers: ControlSelfAssessmentAnswerEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
