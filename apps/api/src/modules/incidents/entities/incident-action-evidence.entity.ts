import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { EvidenceEntity } from '../../evidences/entities/evidence.entity';
import { IncidentActionPlanEntity } from './incident-action-plan.entity';

@Entity('incident_action_evidences')
@Unique('uq_iae_action_evidence', ['actionPlanId', 'evidenceId'])
export class IncidentActionEvidenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'action_plan_id', type: 'uuid' })
  actionPlanId: string;

  @ManyToOne(() => IncidentActionPlanEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'action_plan_id', foreignKeyConstraintName: 'fk_iae_action' })
  actionPlan: IncidentActionPlanEntity;

  @Column({ name: 'evidence_id', type: 'uuid' })
  evidenceId: string;

  @ManyToOne(() => EvidenceEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evidence_id', foreignKeyConstraintName: 'fk_iae_evidence' })
  evidence: EvidenceEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
