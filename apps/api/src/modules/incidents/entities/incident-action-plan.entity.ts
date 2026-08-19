import { IncidentActionPlanStatus } from '@aurelia/contracts';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { IncidentEntity } from './incident.entity';
import { IncidentInvestigationEntity } from './incident-investigation.entity';

@Entity('incident_action_plans')
export class IncidentActionPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'incident_id', type: 'uuid' })
  incidentId: string;

  @ManyToOne(() => IncidentEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incident_id', foreignKeyConstraintName: 'fk_iap_incident' })
  incident: IncidentEntity;

  @Column({ name: 'investigation_id', type: 'uuid', nullable: true })
  investigationId: string | null;

  @ManyToOne(() => IncidentInvestigationEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'investigation_id', foreignKeyConstraintName: 'fk_iap_investigation' })
  investigation: IncidentInvestigationEntity | null;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'owner_user_id', type: 'uuid', nullable: true })
  ownerUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'owner_user_id', foreignKeyConstraintName: 'fk_iap_owner' })
  ownerUser: UserEntity | null;

  @Column({ name: 'due_at', type: 'timestamptz', nullable: true })
  dueAt: Date | null;

  @Column({ type: 'enum', enum: IncidentActionPlanStatus, enumName: 'incident_action_plan_status', default: IncidentActionPlanStatus.OPEN })
  status: IncidentActionPlanStatus;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'closed_by_user_id', type: 'uuid', nullable: true })
  closedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'closed_by_user_id', foreignKeyConstraintName: 'fk_iap_closed_by' })
  closedByUser: UserEntity | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
