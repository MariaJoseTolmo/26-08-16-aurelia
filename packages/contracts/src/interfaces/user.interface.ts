import type { ID } from '../types/common';
import type { BaseEntity } from './entity.interface';
import type { Area, Company } from './organization.interface';
import type { RoleDefinition } from './role.interface';

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string | null;
  phone: string | null;
  companyId: ID | null;
  areaId: ID | null;
  isActive: boolean;
  lastLoginAt: string | null;
  roles?: RoleDefinition[];
  companies?: Company[];
  areas?: Area[];
}
