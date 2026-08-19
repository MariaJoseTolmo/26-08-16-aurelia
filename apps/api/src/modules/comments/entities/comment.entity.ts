import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { EntityReferenceTypeEntity } from '../../evidences/entities/entity-reference-type.entity';

@Entity('comments')
@Index('idx_comments_entity', ['entityType', 'entityId'])
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 80 })
  entityType: string;

  @ManyToOne(() => EntityReferenceTypeEntity)
  @JoinColumn({ name: 'entity_type', referencedColumnName: 'code', foreignKeyConstraintName: 'fk_comments_entity_type' })
  entityReferenceType: EntityReferenceTypeEntity;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Index('idx_comments_author')
  @Column({ name: 'author_user_id', type: 'uuid', nullable: true })
  authorUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'author_user_id', foreignKeyConstraintName: 'fk_comments_author' })
  authorUser: UserEntity | null;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'is_internal', type: 'boolean', default: false })
  isInternal: boolean;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
