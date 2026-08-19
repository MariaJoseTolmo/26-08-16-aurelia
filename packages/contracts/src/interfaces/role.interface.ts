import type { Role } from '../enums';
import type { BaseEntity } from './entity.interface';

export interface Permission extends BaseEntity {
  code: string;
  name: string;
  module: string;
  action: string;
  description: string | null;
}

export interface RoleDefinition extends BaseEntity {
  code: Role;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  permissions?: Permission[];
}
