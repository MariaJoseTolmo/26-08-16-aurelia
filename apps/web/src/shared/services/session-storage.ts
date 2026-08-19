import type { AuthUserResponse, Role } from '@aurelia/contracts';

const TOKEN_KEY = 'aurelia_token';
const USER_KEY = 'aurelia_user';
const LEGACY_ROLE_CODES = new Set(['SUPERVISOR', 'APPROVER']);

export interface StoredSession {
  token: string;
  user: AuthUserResponse;
}

function isCurrentAuthUser(value: unknown): value is AuthUserResponse {
  if (!value || Array.isArray(value) || typeof value !== 'object') return false;
  const user = value as Partial<AuthUserResponse>;
  if (!Array.isArray(user.roles) || !Array.isArray(user.permissions)) return false;
  if (user.roles.some((role: Role) => LEGACY_ROLE_CODES.has(role))) return false;
  return typeof user.id === 'string' && typeof user.email === 'string' && typeof user.fullName === 'string';
}

export function readStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = window.localStorage.getItem(TOKEN_KEY);
  const userRaw = window.localStorage.getItem(USER_KEY);

  if (!token || !userRaw) {
    return null;
  }

  try {
    const user: unknown = JSON.parse(userRaw);
    if (!isCurrentAuthUser(user)) return null;
    return { token, user };
  } catch {
    return null;
  }
}

export function writeStoredSession(session: StoredSession): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, session.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function readStoredToken(): string | null {
  return readStoredSession()?.token ?? null;
}
