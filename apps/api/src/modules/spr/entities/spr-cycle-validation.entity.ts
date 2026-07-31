import { SprCycleValidationStatus } from '@aurelia/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { AreaEntity } from '../../organization/entities/area.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { SprCycleEntity } from './spr-cycle.entity';

@Entity('spr_cycle_validations')
@Unique('uq_spr_cycle_validations_cycle_area', ['cycleId', 'areaId'])
export class SprCycleValidationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_spr_validations_cycle')
  @Column({ name: 'cycle_id', type: 'uuid' })
  cycleId: string;

  @ManyToOne(() => SprCycleEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cycle_id', foreignKeyConstraintName: 'fk_spr_validations_cycle' })
  cycle: SprCycleEntity;

  @Index('idx_spr_validations_area')
  @Column({ name: 'area_id', type: 'uuid' })
  areaId: string;

  @ManyToOne(() => AreaEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'area_id', foreignKeyConstraintName: 'fk_spr_validations_area' })
  area: AreaEntity;

  @Index('idx_spr_validations_status')
  @Column({
    type: 'enum',
    enum: SprCycleValidationStatus,
    enumName: 'spr_cycle_validation_status',
  })
  status: SprCycleValidationStatus;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_user_id', foreignKeyConstraintName: 'fk_spr_validations_actor' })
  actor: UserEntity | null;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true })
  decidedAt: Date | null;

  /** Set when status → reopened; cleared when the area decides again. */
  @Column({ name: 'reopened_at', type: 'timestamptz', nullable: true })
  reopenedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
