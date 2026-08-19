import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AreaEntity } from '../../organization/entities/area.entity';
import { CompanyEntity } from '../../organization/entities/company.entity';
import { GerenciaEntity } from '../../organization/entities/gerencia.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { CriticalControlEntity } from './critical-control.entity';
import { MueEntity } from './mue.entity';

@Entity('control_area_assignments')
export class ControlAreaAssignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_control_area_assignments_mue')
  @Column({ name: 'mue_id', type: 'uuid' })
  mueId: string;

  @ManyToOne(() => MueEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mue_id', foreignKeyConstraintName: 'fk_control_area_assignments_mue' })
  mue: MueEntity;

  @Index('idx_control_area_assignments_control')
  @Column({ name: 'critical_control_id', type: 'uuid', nullable: true })
  criticalControlId: string | null;

  @ManyToOne(() => CriticalControlEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'critical_control_id', foreignKeyConstraintName: 'fk_control_area_assignments_control' })
  criticalControl: CriticalControlEntity | null;

  @Column({ name: 'area_id', type: 'uuid', nullable: true })
  areaId: string | null;

  @ManyToOne(() => AreaEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'area_id', foreignKeyConstraintName: 'fk_control_area_assignments_area' })
  area: AreaEntity | null;

  @Column({ name: 'gerencia_id', type: 'uuid', nullable: true })
  gerenciaId: string | null;

  @ManyToOne(() => GerenciaEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'gerencia_id', foreignKeyConstraintName: 'fk_control_area_assignments_gerencia' })
  gerencia: GerenciaEntity | null;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string | null;

  @ManyToOne(() => CompanyEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'company_id', foreignKeyConstraintName: 'fk_control_area_assignments_company' })
  company: CompanyEntity | null;

  @Column({ name: 'responsible_user_id', type: 'uuid', nullable: true })
  responsibleUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'responsible_user_id', foreignKeyConstraintName: 'fk_control_area_assignments_user' })
  responsibleUser: UserEntity | null;

  @Column({ name: 'area_name_snapshot', type: 'varchar', length: 240, nullable: true })
  areaNameSnapshot: string | null;

  @Column({ name: 'responsible_name_snapshot', type: 'varchar', length: 240, nullable: true })
  responsibleNameSnapshot: string | null;

  @Column({ name: 'responsible_role', type: 'varchar', length: 160, nullable: true })
  responsibleRole: string | null;

  @Column({ name: 'is_primary', type: 'boolean', default: true })
  isPrimary: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
