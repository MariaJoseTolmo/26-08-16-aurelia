import type { ID } from '../../types/common';

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  position?: string;
  phone?: string;
  companyId?: ID;
  areaId?: ID;
  isActive?: boolean;
  password?: string;
}
