import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { IncidentEntity } from './incident.entity';

@Entity('incident_flash_reports')
export class IncidentFlashReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'incident_id', type: 'uuid', unique: true })
  incidentId: string;

  @ManyToOne(() => IncidentEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incident_id', foreignKeyConstraintName: 'fk_ifr_incident' })
  incident: IncidentEntity;

  @Column({ type: 'text' })
  summary: string;

  @Column({ name: 'immediate_causes', type: 'text', nullable: true })
  immediateCauses: string | null;

  @Column({ name: 'affected_components', type: 'text', nullable: true })
  affectedComponents: string | null;

  @Column({ name: 'potential_impact', type: 'text', nullable: true })
  potentialImpact: string | null;

  @Column({ name: 'reporter_name', type: 'varchar', length: 180, nullable: true })
  reporterName: string | null;

  @Column({ name: 'generated_at', type: 'timestamptz', nullable: true })
  generatedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
