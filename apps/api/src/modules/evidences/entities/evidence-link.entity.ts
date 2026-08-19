import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { EvidenceEntity } from './evidence.entity';
import { EntityReferenceTypeEntity } from './entity-reference-type.entity';

@Entity('evidence_links')
@Unique('uq_evidence_links', ['evidenceId', 'entityType', 'entityId', 'relationType'])
@Index('idx_evidence_links_entity', ['entityType', 'entityId'])
export class EvidenceLinkEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'evidence_id', type: 'uuid' })
  evidenceId: string;

  @ManyToOne(() => EvidenceEntity, (evidence) => evidence.links, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evidence_id', foreignKeyConstraintName: 'fk_evidence_links_evidence' })
  evidence: EvidenceEntity;

  @Column({ name: 'entity_type', type: 'varchar', length: 80 })
  entityType: string;

  @ManyToOne(() => EntityReferenceTypeEntity)
  @JoinColumn({ name: 'entity_type', referencedColumnName: 'code', foreignKeyConstraintName: 'fk_evidence_links_entity_type' })
  entityReferenceType: EntityReferenceTypeEntity;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({ name: 'relation_type', type: 'varchar', length: 80, default: 'supporting_evidence' })
  relationType: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
