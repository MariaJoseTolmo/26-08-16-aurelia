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
import { AreaEntity } from '../../organization/entities/area.entity';
import { CompanyEntity } from '../../organization/entities/company.entity';
import { UserAreaEntity } from './user-area.entity';
import { UserCompanyEntity } from './user-company.entity';
import { UserRoleEntity } from './user-role.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'citext', unique: true })
  email: string;

  @Column({ name: 'first_name', length: 120 })
  firstName: string;

  @Column({ name: 'last_name', length: 120 })
  lastName: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  position: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Index('idx_users_company')
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string | null;

  @ManyToOne(() => CompanyEntity, (company) => company.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'company_id', foreignKeyConstraintName: 'fk_users_company' })
  company: CompanyEntity | null;

  @Index('idx_users_area')
  @Column({ name: 'area_id', type: 'uuid', nullable: true })
  areaId: string | null;

  @ManyToOne(() => AreaEntity, (area) => area.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'area_id', foreignKeyConstraintName: 'fk_users_area' })
  area: AreaEntity | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  @Column({ name: 'password_changed_at', type: 'timestamptz', nullable: true })
  passwordChangedAt: Date | null;

  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Index('idx_users_locked_until')
  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.user)
  userRoles: UserRoleEntity[];

  @OneToMany(() => UserCompanyEntity, (userCompany) => userCompany.user)
  userCompanies: UserCompanyEntity[];

  @OneToMany(() => UserAreaEntity, (userArea) => userArea.user)
  userAreas: UserAreaEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
