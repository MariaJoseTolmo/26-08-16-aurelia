import { RecordStatus } from '@aurelia/contracts';
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
import { AreaEntity } from './area.entity';
import { LocationEntity } from './location.entity';

@Entity('sectors')
export class SectorEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_sectors_area')
  @Column({ name: 'area_id', type: 'uuid', nullable: true })
  areaId: string | null;

  @ManyToOne(() => AreaEntity, (area) => area.sectors, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'area_id', foreignKeyConstraintName: 'fk_sectors_area' })
  area: AreaEntity | null;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: RecordStatus,
    enumName: 'record_status',
    default: RecordStatus.ACTIVE,
  })
  status: RecordStatus;

  @OneToMany(() => LocationEntity, (location) => location.sector)
  locations: LocationEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
