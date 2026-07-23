import { INSPECTION_CAPABILITIES, type InspectionCapability } from '@aurelia/contracts';
import { useMemo } from 'react';
import { useSessionStore } from '../stores/session.store';

type RuntimeInspectionUser = {
  role?: string | null;
  roles?: string[] | null;
  permissions?: string[] | null;
};

export type InspectionCapabilities = {
  read: boolean;
  create: boolean;
  execute: boolean;
  review: boolean;
  reassign: boolean;
  admin: boolean;
};

function rolesOf(user: RuntimeInspectionUser | null): string[] {
  return Array.from(new Set([...(user?.roles ?? []), user?.role].filter((role): role is string => Boolean(role))));
}

export function hasInspectionCapability(
  user: RuntimeInspectionUser | null,
  capability: InspectionCapability,
): boolean {
  const roles = rolesOf(user);
  if (roles.includes('ADMIN')) return true;

  const permissions = user?.permissions ?? [];
  if (permissions.includes(capability)) return true;

  if (permissions.includes('inspections:write')) {
    return capability === INSPECTION_CAPABILITIES.create || capability === INSPECTION_CAPABILITIES.execute;
  }

  return false;
}

export function resolveInspectionCapabilities(user: RuntimeInspectionUser | null): InspectionCapabilities {
  return {
    read: hasInspectionCapability(user, INSPECTION_CAPABILITIES.read),
    create: hasInspectionCapability(user, INSPECTION_CAPABILITIES.create),
    execute: hasInspectionCapability(user, INSPECTION_CAPABILITIES.execute),
    review: hasInspectionCapability(user, INSPECTION_CAPABILITIES.review),
    reassign: hasInspectionCapability(user, INSPECTION_CAPABILITIES.reassign),
    admin: hasInspectionCapability(user, INSPECTION_CAPABILITIES.admin),
  };
}

export function useInspectionCapabilities(): InspectionCapabilities {
  const user = useSessionStore((state) => state.user) as RuntimeInspectionUser | null;
  return useMemo(() => resolveInspectionCapabilities(user), [user]);
}
