import { SprCycleSignatureLevel, SprCycleSignatureStatus } from '@aurelia/contracts';
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
import { UserEntity } from '../../users/entities/user.entity';
import { SprCycleEntity } from './spr-cycle.entity';

@Entity('spr_cycle_signatures')
@Unique('uq_spr_cycle_signatures_cycle_level', ['cycleId', 'level'])
export class SprCycleSignatureEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_spr_signatures_cycle')
  @Column({ name: 'cycle_id', type: 'uuid' })
  cycleId: string;

  @ManyToOne(() => SprCycleEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cycle_id', foreignKeyConstraintName: 'fk_spr_signatures_cycle' })
  cycle: SprCycleEntity;

  @Column({
    type: 'enum',
    enum: SprCycleSignatureLevel,
    enumName: 'spr_cycle_signature_level',
  })
  level: SprCycleSignatureLevel;

  @Index('idx_spr_signatures_status')
  @Column({
    type: 'enum',
    enum: SprCycleSignatureStatus,
    enumName: 'spr_cycle_signature_status',
    default: SprCycleSignatureStatus.SIGNED,
  })
  status: SprCycleSignatureStatus;

  @Column({ name: 'signer_user_id', type: 'uuid', nullable: true })
  signerUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'signer_user_id', foreignKeyConstraintName: 'fk_spr_signatures_signer' })
  signer: UserEntity | null;

  @Column({ name: 'signed_at', type: 'timestamptz', nullable: true })
  signedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
