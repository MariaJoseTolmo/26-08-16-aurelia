import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { NotificationRecipientEntity } from './notification-recipient.entity';

@Entity('notifications')
@Index('idx_notifications_entity', ['entityType', 'entityId'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 140 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Index('idx_notifications_category')
  @Column({ type: 'varchar', length: 80, default: 'general' })
  category: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 80, nullable: true })
  entityType: string | null;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId: string | null;

  @Column({ name: 'triggered_by_user_id', type: 'uuid', nullable: true })
  triggeredByUserId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => NotificationRecipientEntity, (recipient) => recipient.notification)
  recipients: NotificationRecipientEntity[];
}
