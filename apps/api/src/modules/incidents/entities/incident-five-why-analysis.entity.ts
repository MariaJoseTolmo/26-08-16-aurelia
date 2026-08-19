import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { IncidentInvestigationEntity } from './incident-investigation.entity';

@Entity('incident_five_why_analysis')
export class IncidentFiveWhyAnalysisEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'investigation_id', type: 'uuid', unique: true })
  investigationId: string;

  @ManyToOne(() => IncidentInvestigationEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'investigation_id', foreignKeyConstraintName: 'fk_ifwa_investigation' })
  investigation: IncidentInvestigationEntity;

  @Column({ name: 'problem_statement', type: 'text' })
  problemStatement: string;

  @Column({ type: 'text', nullable: true })
  why1: string | null;

  @Column({ type: 'text', nullable: true })
  why2: string | null;

  @Column({ type: 'text', nullable: true })
  why3: string | null;

  @Column({ type: 'text', nullable: true })
  why4: string | null;

  @Column({ type: 'text', nullable: true })
  why5: string | null;

  @Column({ name: 'root_cause', type: 'text', nullable: true })
  rootCause: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
