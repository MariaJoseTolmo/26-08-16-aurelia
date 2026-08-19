import { SetMetadata } from '@nestjs/common';
import type { Role } from '@aurelia/contracts';

export const REQUIRED_ROLES_KEY = 'requiredRoles';

/** El usuario debe tener al menos uno de los roles indicados. */
export const RequireRoles = (...roles: Role[]) => SetMetadata(REQUIRED_ROLES_KEY, roles);
