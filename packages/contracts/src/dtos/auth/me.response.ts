import type { Role } from '../../enums';

export interface MeResponse {
  id: string;
  email: string;
  fullName: string;
  roles: Role[];
  permissions: string[];
  isPlaceholder: boolean;
}
