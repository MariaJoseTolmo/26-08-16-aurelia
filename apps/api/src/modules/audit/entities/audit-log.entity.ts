import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { EntityReferenceTypeEntity } from '../../evidences/entities/entity-reference-type.entity';

@Entity('audit_logs')
@Index('idx_audit_logs_entity', ['entityType', 'entityId'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 80, nullable: true })
  entityType: string | null;

  @ManyToOne(() => EntityReferenceTypeEntity, { nullable: true })
  @JoinColumn({ name: 'entity_type', referencedColumnName: 'code', foreignKeyConstraintName: 'fk_audit_logs_entity_type' })
  entityReferenceType: EntityReferenceTypeEntity | null;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId: string | null;

  @Index('idx_audit_logs_actor')
  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_user_id', foreignKeyConstraintName: 'fk_audit_logs_actor' })
  actorUser: UserEntity | null;

  @Column({ type: 'varchar', length: 120 })
  action: string;

  @Column({ name: 'old_value', type: 'jsonb', nullable: true })
  oldValue: Record<string, unknown> | null;

  @Column({ name: 'new_value', type: 'jsonb', nullable: true })
  newValue: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Index('idx_audit_logs_created_at')
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
