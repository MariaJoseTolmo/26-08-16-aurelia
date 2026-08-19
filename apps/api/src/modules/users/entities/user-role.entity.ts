import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { RoleEntity } from '../../roles/entities/role.entity';
import { UserEntity } from './user.entity';

@Entity('user_roles')
@Unique('uq_user_roles_user_role', ['user', 'role'])
export class UserRoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, (user) => user.userRoles, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'fk_user_roles_user' })
  user: UserEntity;

  @ManyToOne(() => RoleEntity, (role) => role.userRoles, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id', foreignKeyConstraintName: 'fk_user_roles_role' })
  role: RoleEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
