import { SetMetadata } from '@nestjs/common';

export const REQUIRED_ANY_PERMISSIONS_KEY = 'requiredAnyPermissions';

export const RequireAnyPermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRED_ANY_PERMISSIONS_KEY, permissions);
