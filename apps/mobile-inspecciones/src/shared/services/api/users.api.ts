import type { UserResponse } from '@aurelia/contracts';
import { getMobileBootstrapLocalFirst } from '../../offline/local-catalogs';

export type { UserResponse };

export async function fetchUsers(filters?: { companyId?: string; role?: string }): Promise<UserResponse[]> {
  const bootstrap = await getMobileBootstrapLocalFirst();
  return bootstrap.catalogs.users.filter((user) => {
    if (filters?.companyId && user.companyId !== filters.companyId) return false;
    return user.isActive;
  });
}
