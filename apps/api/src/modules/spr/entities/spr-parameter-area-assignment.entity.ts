import { RecordStatus } from '@aurelia/contracts';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { AreaEntity } from '../../organization/entities/area.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { SprParameterEntity } from './spr-parameter.entity';

@Entity('spr_parameter_area_assignments')
@Unique('uq_spr_assignment_parameter_area', ['parameterId', 'areaId'])
export class SprParameterAreaAssignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_spr_assignments_parameter')
  @Column({ name: 'parameter_id', type: 'uuid' })
  parameterId: string;

  @ManyToOne(() => SprParameterEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parameter_id', foreignKeyConstraintName: 'fk_spr_assignment_parameter' })
  parameter: SprParameterEntity;

  @Index('idx_spr_assignments_area')
  @Column({ name: 'area_id', type: 'uuid', nullable: true })
  areaId: string | null;

  @ManyToOne(() => AreaEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'area_id', foreignKeyConstraintName: 'fk_spr_assignment_area' })
  area: AreaEntity | null;

  @Column({ name: 'responsible_user_id', type: 'uuid', nullable: true })
  responsibleUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'responsible_user_id', foreignKeyConstraintName: 'fk_spr_assignment_responsible' })
  responsibleUser: UserEntity | null;

  @Column({ name: 'approver_user_id', type: 'uuid', nullable: true })
  approverUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approver_user_id', foreignKeyConstraintName: 'fk_spr_assignment_approver' })
  approverUser: UserEntity | null;

  @Column({ type: 'enum', enum: RecordStatus, enumName: 'record_status', default: RecordStatus.ACTIVE })
  status: RecordStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
