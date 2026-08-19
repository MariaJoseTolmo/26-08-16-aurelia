import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IncidentEntity } from './incident.entity';

@Entity('incident_involved_people')
export class IncidentInvolvedPersonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'incident_id', type: 'uuid' })
  incidentId: string;

  @ManyToOne(() => IncidentEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incident_id', foreignKeyConstraintName: 'fk_iip_incident' })
  incident: IncidentEntity;

  @Column({ name: 'full_name', type: 'varchar', length: 180 })
  fullName: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  role: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  company: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  contact: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
