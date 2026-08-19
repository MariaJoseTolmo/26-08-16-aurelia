import type { AuthUserResponse, LoginRequest } from '@aurelia/contracts';
import { httpPost } from '../http-client';

export type AuthUser = AuthUserResponse;

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return httpPost<LoginRequest, LoginResponse>('/auth/login', {
    email: email.trim().toLowerCase(),
    password,
    client: 'mobile-inspecciones',
  });
}

export function exchangeDesktopLaunch(code: string): Promise<LoginResponse> {
  return httpPost<{ ticket: string }, LoginResponse>('/auth/iframe-session', { ticket: code });
}
