import type { Role } from '../../enums';
import type { ID } from '../../types/common';

export interface AuthUserResponse {
  id: ID;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  position: string | null;
  companyId: ID | null;
  companyName: string | null;
  areaId: ID | null;
  areaName: string | null;
  roles: Role[];
  permissions: string[];
}

/** Respuesta normalizada por los clientes web. */
export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: AuthUserResponse;
}
