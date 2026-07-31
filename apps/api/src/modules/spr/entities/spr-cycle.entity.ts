import { SprCycleStatus } from '@aurelia/contracts';
import { Check, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('spr_cycles')
@Unique('uq_spr_cycles_period', ['periodYear', 'periodMonth'])
@Check('chk_spr_cycles_month', '"period_month" BETWEEN 1 AND 12')
@Check('chk_spr_cycles_year', '"period_year" BETWEEN 2000 AND 2100')
export class SprCycleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'period_year', type: 'integer' })
  periodYear: number;

  @Column({ name: 'period_month', type: 'integer' })
  periodMonth: number;

  @Column({ type: 'varchar', length: 80 })
  label: string;

  @Index('idx_spr_cycles_status')
  @Column({
    type: 'enum',
    enum: SprCycleStatus,
    enumName: 'spr_cycle_status',
    default: SprCycleStatus.EN_CURSO,
  })
  status: SprCycleStatus;

  /** Día 9 del mes siguiente al periodo (DATE). */
  @Column({ name: 'day9_at', type: 'date' })
  day9At: string;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
