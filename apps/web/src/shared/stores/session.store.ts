import { create } from 'zustand';
import { Role, type LoginResponse } from '@aurelia/contracts';
import { clearSession, getStoredUser, getToken, saveSession } from '../services/auth.service';

interface SessionState {
  token: string | null;
  user: LoginResponse['user'] | null;
  hydrated: boolean;
  setSession: (response: LoginResponse) => void;
  clearSession: () => void;
  hydrateSession: () => void;
}

function isMobileOnlyInspector(user: LoginResponse['user'] | null): boolean {
  if (!user) return false;
  return user.roles.includes(Role.INSPECTOR) && !user.roles.includes(Role.ADMIN);
}

export const useSessionStore = create<SessionState>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  setSession: (response) => {
    if (isMobileOnlyInspector(response.user)) {
      clearSession();
      set({ token: null, user: null, hydrated: true });
      return;
    }
    saveSession(response);
    set({ token: response.accessToken, user: response.user, hydrated: true });
  },
  clearSession: () => {
    clearSession();
    set({ token: null, user: null, hydrated: true });
  },
  hydrateSession: () => {
    const user = getStoredUser();
    if (isMobileOnlyInspector(user)) {
      clearSession();
      set({ token: null, user: null, hydrated: true });
      return;
    }
    set({ token: getToken(), user, hydrated: true });
  },
}));
