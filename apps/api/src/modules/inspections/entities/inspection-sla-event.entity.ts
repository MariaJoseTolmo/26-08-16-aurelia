import { InspectionSlaEventType } from '@aurelia/contracts';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { InspectionFindingEntity } from './inspection-finding.entity';
import { InspectionSlaPolicyEntity } from './inspection-sla-policy.entity';

@Entity('inspection_sla_events')
@Index('uq_inspection_sla_events_key', ['eventKey'], { unique: true })
@Index('idx_inspection_sla_events_finding', ['findingId'])
export class InspectionSlaEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'finding_id', type: 'uuid' })
  findingId: string;

  @ManyToOne(() => InspectionFindingEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'finding_id', foreignKeyConstraintName: 'fk_ise_finding' })
  finding: InspectionFindingEntity;

  @Column({ name: 'policy_id', type: 'uuid', nullable: true })
  policyId: string | null;

  @ManyToOne(() => InspectionSlaPolicyEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'policy_id', foreignKeyConstraintName: 'fk_ise_policy' })
  policy: InspectionSlaPolicyEntity | null;

  @Column({ type: 'enum', enum: InspectionSlaEventType, enumName: 'inspection_sla_event_type' })
  type: InspectionSlaEventType;

  @Column({ name: 'event_key', type: 'varchar', length: 180 })
  eventKey: string;

  @Column({ name: 'due_at', type: 'timestamptz', nullable: true })
  dueAt: Date | null;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
