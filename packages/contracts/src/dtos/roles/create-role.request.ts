import type { Role } from '../../enums';

export interface CreateRoleRequest {
  code: Role;
  name: string;
  description?: string;
  isSystem?: boolean;
  isActive?: boolean;
}
