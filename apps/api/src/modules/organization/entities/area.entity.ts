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
import { UserAreaEntity } from '../../users/entities/user-area.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { GerenciaEntity } from './gerencia.entity';
import { SectorEntity } from './sector.entity';

@Entity('areas')
export class AreaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_areas_gerencia')
  @Column({ name: 'gerencia_id', type: 'uuid', nullable: true })
  gerenciaId: string | null;

  @ManyToOne(() => GerenciaEntity, (gerencia) => gerencia.areas, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'gerencia_id', foreignKeyConstraintName: 'fk_areas_gerencia' })
  gerencia: GerenciaEntity | null;

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

  @OneToMany(() => SectorEntity, (sector) => sector.area)
  sectors: SectorEntity[];

  @OneToMany(() => UserEntity, (user) => user.area)
  users: UserEntity[];

  @OneToMany(() => UserAreaEntity, (userArea) => userArea.area)
  userAreas: UserAreaEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
