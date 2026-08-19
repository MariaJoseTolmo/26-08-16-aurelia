import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { IncidentEntity } from './incident.entity';

@Entity('incident_validations')
export class IncidentValidationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'incident_id', type: 'uuid' })
  incidentId: string;

  @ManyToOne(() => IncidentEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incident_id', foreignKeyConstraintName: 'fk_iv_incident' })
  incident: IncidentEntity;

  @Column({ type: 'varchar', length: 80 })
  status: string;

  @Column({ name: 'validator_user_id', type: 'uuid', nullable: true })
  validatorUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'validator_user_id', foreignKeyConstraintName: 'fk_iv_user' })
  validatorUser: UserEntity | null;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ name: 'validated_at', type: 'timestamptz', nullable: true })
  validatedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
