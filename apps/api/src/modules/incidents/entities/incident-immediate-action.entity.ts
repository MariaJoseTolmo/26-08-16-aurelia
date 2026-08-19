import { IncidentActionPlanStatus } from '@aurelia/contracts';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { IncidentEntity } from './incident.entity';

@Entity('incident_immediate_actions')
export class IncidentImmediateActionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'incident_id', type: 'uuid' })
  incidentId: string;

  @ManyToOne(() => IncidentEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incident_id', foreignKeyConstraintName: 'fk_iia_incident' })
  incident: IncidentEntity;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: IncidentActionPlanStatus, enumName: 'incident_action_plan_status', default: IncidentActionPlanStatus.OPEN })
  status: IncidentActionPlanStatus;

  @Column({ name: 'performed_by_user_id', type: 'uuid', nullable: true })
  performedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'performed_by_user_id', foreignKeyConstraintName: 'fk_iia_user' })
  performedByUser: UserEntity | null;

  @Column({ name: 'performed_at', type: 'timestamptz', nullable: true })
  performedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
