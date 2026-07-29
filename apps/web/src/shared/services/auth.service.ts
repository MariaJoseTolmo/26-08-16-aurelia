import type { AuthUserResponse, LoginRequest, LoginResponse, MeResponse } from '@aurelia/contracts';
import { httpGet, httpPost } from './http-client';
import { clearStoredSession, readStoredSession, writeStoredSession } from './session-storage';

type LoginApiResponse = {
  accessToken?: string;
  token?: string;
  user: AuthUserResponse;
};

function normalizeLoginResponse(response: LoginApiResponse): LoginResponse {
  const accessToken = response.accessToken ?? response.token;

  if (!accessToken) {
    throw new Error('Login response missing access token');
  }

  return {
    accessToken,
    user: response.user,
  };
}

export function login(payload: LoginRequest): Promise<LoginResponse> {
  return httpPost<LoginRequest, LoginApiResponse>('/auth/login', {
    ...payload,
    client: 'web',
  }).then(normalizeLoginResponse);
}

export function getMe(): Promise<MeResponse> {
  return httpGet<MeResponse>('/me');
}

export function saveSession(response: LoginResponse): void {
  writeStoredSession({ token: response.accessToken, user: response.user });
}

export function clearSession(): void {
  clearStoredSession();
}

export function getToken(): string | null {
  return readStoredSession()?.token ?? null;
}

// Backend responde 204 No Content — no usar httpPost (intenta parsear JSON).
export async function logout(): Promise<void> {
  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const details = (await response.text()).trim();
    throw new Error(`POST /auth/logout failed: ${response.status}${details ? ` - ${details}` : ''}`);
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getStoredUser(): LoginResponse['user'] | null {
  return readStoredSession()?.user ?? null;
}
