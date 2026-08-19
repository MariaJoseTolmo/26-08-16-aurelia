import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { InspectionEntity } from './inspection.entity';

@Entity('inspection_status_history')
export class InspectionStateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inspection_id', type: 'uuid' })
  inspectionId: string;

  @ManyToOne(() => InspectionEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inspection_id', foreignKeyConstraintName: 'fk_ish_inspection' })
  inspection: InspectionEntity;

  @Column({ name: 'from_status', type: 'varchar', length: 80, nullable: true })
  previousStatus: string | null;

  @Column({ name: 'to_status', type: 'varchar', length: 80 })
  nextStatus: string;

  @Column({ name: 'changed_by_user_id', type: 'uuid', nullable: true })
  changedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changed_by_user_id', foreignKeyConstraintName: 'fk_ish_user' })
  changedByUser: UserEntity | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
