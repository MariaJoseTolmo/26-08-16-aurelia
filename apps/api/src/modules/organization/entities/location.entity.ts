import { RecordStatus } from '@aurelia/contracts';
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
import { SectorEntity } from './sector.entity';

@Entity('locations')
@Unique('uq_locations_sector_name', ['sectorId', 'name'])
export class LocationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_locations_sector')
  @Column({ name: 'sector_id', type: 'uuid', nullable: true })
  sectorId: string | null;

  @ManyToOne(() => SectorEntity, (sector) => sector.locations, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'sector_id', foreignKeyConstraintName: 'fk_locations_sector' })
  sector: SectorEntity | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  code: string | null;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ name: 'altitude_m', type: 'numeric', precision: 10, scale: 2, nullable: true })
  altitudeM: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  macrozone: string | null;

  @Column({
    type: 'enum',
    enum: RecordStatus,
    enumName: 'record_status',
    default: RecordStatus.ACTIVE,
  })
  status: RecordStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
