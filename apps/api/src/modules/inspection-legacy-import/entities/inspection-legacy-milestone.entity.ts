import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { InspectionLegacyImportEntity } from './inspection-legacy-import.entity';

@Entity('inspection_legacy_milestones')
@Unique('uq_inspection_legacy_milestone_sequence', ['legacyImportId', 'sequenceNumber'])
@Check('chk_inspection_legacy_milestone_sequence', '"sequence_number" BETWEEN 1 AND 3')
@Check('chk_inspection_legacy_milestone_counts', '"closed_increment" >= 0 AND "pending_after" >= 0')
@Check(
  'chk_inspection_legacy_milestone_percentages',
  '("closed_percentage" IS NULL OR "closed_percentage" BETWEEN 0 AND 100) AND ("pending_percentage" IS NULL OR "pending_percentage" BETWEEN 0 AND 100)',
)
@Index('idx_inspection_legacy_milestones_import', ['legacyImportId'])
@Index('idx_inspection_legacy_milestones_occurred_at', ['occurredAt'])
export class InspectionLegacyMilestoneEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_import_id', type: 'uuid' })
  legacyImportId: string;

  @ManyToOne(() => InspectionLegacyImportEntity, (legacyImport) => legacyImport.milestones, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'legacy_import_id', foreignKeyConstraintName: 'fk_ilm_legacy_import' })
  legacyImport: InspectionLegacyImportEntity;

  @Column({ name: 'sequence_number', type: 'integer' })
  sequenceNumber: number;

  @Column({ name: 'occurred_at', type: 'date' })
  occurredAt: string;

  @Column({ name: 'closed_increment', type: 'integer', default: 0 })
  closedIncrement: number;

  @Column({ name: 'pending_after', type: 'integer', default: 0 })
  pendingAfter: number;

  @Column({ name: 'closed_percentage', type: 'numeric', precision: 5, scale: 2, nullable: true })
  closedPercentage: string | null;

  @Column({ name: 'pending_percentage', type: 'numeric', precision: 5, scale: 2, nullable: true })
  pendingPercentage: string | null;

  @Column({ name: 'raw_payload', type: 'jsonb', nullable: true })
  rawPayload: Record<string, unknown> | null;
}
