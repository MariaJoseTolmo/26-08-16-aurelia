import { create } from 'zustand';
import type { LoginResponse } from '@aurelia/contracts';
import { clearSession, getStoredUser, getToken, saveSession } from '../services/auth.service';

interface SessionState {
  token: string | null;
  user: LoginResponse['user'] | null;
  hydrated: boolean;
  setSession: (response: LoginResponse) => void;
  clearSession: () => void;
  hydrateSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  setSession: (response) => {
    saveSession(response);
    set({ token: response.accessToken, user: response.user, hydrated: true });
  },
  clearSession: () => {
    clearSession();
    set({ token: null, user: null, hydrated: true });
  },
  hydrateSession: () => {
    set({ token: getToken(), user: getStoredUser(), hydrated: true });
  },
}));
