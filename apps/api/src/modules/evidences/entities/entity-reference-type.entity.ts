import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('entity_reference_types')
export class EntityReferenceTypeEntity {
  @PrimaryColumn({ type: 'varchar', length: 80 })
  code: string;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
