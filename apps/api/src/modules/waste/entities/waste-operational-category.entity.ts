import { RecordStatus } from '@aurelia/contracts';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('waste_operational_categories')
export class WasteOperationalCategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 180 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'default_hazardous', type: 'boolean', default: false })
  defaultHazardous: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ type: 'enum', enum: RecordStatus, enumName: 'record_status', default: RecordStatus.ACTIVE })
  status: RecordStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
