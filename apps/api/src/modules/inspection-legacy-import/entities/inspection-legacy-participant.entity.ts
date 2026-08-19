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
import { UserEntity } from '../../users/entities/user.entity';
import { InspectionLegacyImportEntity } from './inspection-legacy-import.entity';

@Entity('inspection_legacy_participants')
@Unique('uq_inspection_legacy_participant_sequence', ['legacyImportId', 'sequenceNumber'])
@Check('chk_inspection_legacy_participant_sequence', '"sequence_number" > 0')
@Index('idx_inspection_legacy_participant_import', ['legacyImportId'])
@Index('idx_inspection_legacy_participant_user', ['userId'])
export class InspectionLegacyParticipantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_import_id', type: 'uuid' })
  legacyImportId: string;

  @ManyToOne(() => InspectionLegacyImportEntity, (legacyImport) => legacyImport.participants, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'legacy_import_id', foreignKeyConstraintName: 'fk_ilp_legacy_import' })
  legacyImport: InspectionLegacyImportEntity;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'fk_ilp_user' })
  user: UserEntity | null;

  @Column({ name: 'source_name', type: 'varchar', length: 255 })
  sourceName: string;

  @Column({ name: 'sequence_number', type: 'integer' })
  sequenceNumber: number;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;
}
