import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { IncidentInvestigationEntity } from './incident-investigation.entity';

@Entity('incident_peepo_analysis')
export class IncidentPeepoAnalysisEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'investigation_id', type: 'uuid', unique: true })
  investigationId: string;

  @ManyToOne(() => IncidentInvestigationEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'investigation_id', foreignKeyConstraintName: 'fk_ipa_investigation' })
  investigation: IncidentInvestigationEntity;

  @Column({ type: 'text', nullable: true })
  people: string | null;

  @Column({ type: 'text', nullable: true })
  environment: string | null;

  @Column({ type: 'text', nullable: true })
  equipment: string | null;

  @Column({ type: 'text', nullable: true })
  procedures: string | null;

  @Column({ type: 'text', nullable: true })
  organization: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
