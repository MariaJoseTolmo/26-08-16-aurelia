import { INSPECTION_CAPABILITIES } from '@aurelia/contracts';
import { create } from 'zustand';
import type { AuthUser } from '../../shared/services/api/auth.api';
import { localStorageDriver } from '../../shared/storage/local-storage';

const MOBILE_SESSION_KEY = 'mobile_session:v1';
const LEGACY_INSPECTIONS_WRITE_PERMISSION = 'inspections:write';

interface PersistedMobileSession {
  accessToken: string;
  user: AuthUser;
}

interface MobileSessionState {
  accessToken: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  setMobileSession: (accessToken: string, user: AuthUser) => void;
  clearMobileSession: () => void;
  hydrateMobileSession: () => Promise<void>;
}

function normalizeMobileUser(user: AuthUser): AuthUser {
  const permissions = new Set(user.permissions ?? []);
  if (permissions.has(INSPECTION_CAPABILITIES.create)) {
    permissions.add(LEGACY_INSPECTIONS_WRITE_PERMISSION);
  } else {
    permissions.delete(LEGACY_INSPECTIONS_WRITE_PERMISSION);
  }
  return { ...user, permissions: Array.from(permissions) };
}

export const useMobileSession = create<MobileSessionState>((set) => ({
  accessToken: null,
  user: null,
  hydrated: false,
  setMobileSession: (accessToken, user) => {
    const normalizedUser = normalizeMobileUser(user);
    void localStorageDriver.set<PersistedMobileSession>(MOBILE_SESSION_KEY, {
      accessToken,
      user: normalizedUser,
    });
    set({ accessToken, user: normalizedUser, hydrated: true });
  },
  clearMobileSession: () => {
    void localStorageDriver.remove(MOBILE_SESSION_KEY);
    set({ accessToken: null, user: null, hydrated: true });
  },
  hydrateMobileSession: async () => {
    const session = await localStorageDriver.get<PersistedMobileSession>(MOBILE_SESSION_KEY);
    set({
      accessToken: session?.accessToken ?? null,
      user: session?.user ? normalizeMobileUser(session.user) : null,
      hydrated: true,
    });
  },
}));
