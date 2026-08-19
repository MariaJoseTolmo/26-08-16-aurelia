import { EvidenceStatus } from '@aurelia/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FileEntity } from '../../files/entities/file.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { EvidenceLinkEntity } from './evidence-link.entity';

@Entity('evidences')
export class EvidenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_evidences_file')
  @Column({ name: 'file_id', type: 'uuid', nullable: true })
  fileId: string | null;

  @ManyToOne(() => FileEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'file_id', foreignKeyConstraintName: 'fk_evidences_file' })
  file: FileEntity | null;

  @Column({ type: 'varchar', length: 250, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'evidence_type', type: 'varchar', length: 80, nullable: true })
  evidenceType: string | null;

  @Index('idx_evidences_status')
  @Column({
    type: 'enum',
    enum: EvidenceStatus,
    enumName: 'evidence_status',
    default: EvidenceStatus.UPLOADED,
  })
  status: EvidenceStatus;

  @Column({ name: 'captured_at', type: 'timestamptz', nullable: true })
  capturedAt: Date | null;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Index('idx_evidences_created_by')
  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_user_id', foreignKeyConstraintName: 'fk_evidences_created_by' })
  createdByUser: UserEntity | null;

  @Column({ name: 'validated_by_user_id', type: 'uuid', nullable: true })
  validatedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'validated_by_user_id', foreignKeyConstraintName: 'fk_evidences_validated_by' })
  validatedByUser: UserEntity | null;

  @Column({ name: 'validated_at', type: 'timestamptz', nullable: true })
  validatedAt: Date | null;

  @Column({ name: 'validation_notes', type: 'text', nullable: true })
  validationNotes: string | null;

  @OneToMany(() => EvidenceLinkEntity, (link) => link.evidence)
  links: EvidenceLinkEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
