import { IncidentInvestigationMethod } from '@aurelia/contracts';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { IncidentEntity } from './incident.entity';

@Entity('incident_investigations')
export class IncidentInvestigationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'incident_id', type: 'uuid' })
  incidentId: string;

  @ManyToOne(() => IncidentEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incident_id', foreignKeyConstraintName: 'fk_ii_incident' })
  incident: IncidentEntity;

  @Column({ type: 'enum', enum: IncidentInvestigationMethod, enumName: 'incident_investigation_method' })
  method: IncidentInvestigationMethod;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'varchar', length: 80, default: 'open' })
  status: string;

  @Column({ name: 'lead_user_id', type: 'uuid', nullable: true })
  leadUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lead_user_id', foreignKeyConstraintName: 'fk_ii_lead_user' })
  leadUser: UserEntity | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
