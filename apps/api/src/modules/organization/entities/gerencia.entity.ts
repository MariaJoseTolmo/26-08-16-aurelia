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
import { BusinessUnitEntity } from './business-unit.entity';

@Entity('gerencias')
export class GerenciaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_gerencias_business_unit')
  @Column({ name: 'business_unit_id', type: 'uuid', nullable: true })
  businessUnitId: string | null;

  @ManyToOne(() => BusinessUnitEntity, (businessUnit) => businessUnit.gerencias, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'business_unit_id', foreignKeyConstraintName: 'fk_gerencias_business_unit' })
  businessUnit: BusinessUnitEntity | null;

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

  @OneToMany(() => AreaEntity, (area) => area.gerencia)
  areas: AreaEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
