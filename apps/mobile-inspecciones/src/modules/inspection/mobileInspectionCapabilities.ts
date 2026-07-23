import { INSPECTION_CAPABILITIES, type InspectionCapability } from '@aurelia/contracts';
import { useMemo } from 'react';
import { useMobileSession } from '../auth/mobileSession.store';

type MobileInspectionUser = {
  roles?: string[] | null;
  permissions?: string[] | null;
};

export type MobileInspectionCapabilities = {
  read: boolean;
  create: boolean;
  execute: boolean;
  review: boolean;
  reassign: boolean;
  admin: boolean;
};

export function hasMobileInspectionCapability(
  user: MobileInspectionUser | null,
  capability: InspectionCapability,
): boolean {
  if (user?.roles?.includes('ADMIN')) return true;
  return (user?.permissions ?? []).includes(capability);
}

export function resolveMobileInspectionCapabilities(
  user: MobileInspectionUser | null,
): MobileInspectionCapabilities {
  return {
    read: hasMobileInspectionCapability(user, INSPECTION_CAPABILITIES.read),
    create: hasMobileInspectionCapability(user, INSPECTION_CAPABILITIES.create),
    execute: hasMobileInspectionCapability(user, INSPECTION_CAPABILITIES.execute),
    review: hasMobileInspectionCapability(user, INSPECTION_CAPABILITIES.review),
    reassign: hasMobileInspectionCapability(user, INSPECTION_CAPABILITIES.reassign),
    admin: hasMobileInspectionCapability(user, INSPECTION_CAPABILITIES.admin),
  };
}

export function useMobileInspectionCapabilities(): MobileInspectionCapabilities {
  const user = useMobileSession((state) => state.user);
  return useMemo(() => resolveMobileInspectionCapabilities(user), [user]);
}
