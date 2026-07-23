import { useMobileSession } from '../../modules/auth/mobileSession.store';
import { env } from '../config/env';

export const API_URL = env.apiUrl;

function authHeaders(): Record<string, string> {
  const token = useMobileSession.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseJsonResponse<TResponse>(response: Response, method: string, path: string): Promise<TResponse> {
  if (!response.ok) {
    throw new Error(`${method} ${path} failed: ${response.status}`);
  }
  return (await response.json()) as TResponse;
}

export async function httpGet<TResponse>(path: string): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: authHeaders(),
  });
  return parseJsonResponse<TResponse>(response, 'GET', path);
}

export async function httpPost<TRequest, TResponse>(
  path: string,
  body: TRequest,
): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  return parseJsonResponse<TResponse>(response, 'POST', path);
}

export async function httpPatch<TRequest, TResponse>(
  path: string,
  body: TRequest,
): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  return parseJsonResponse<TResponse>(response, 'PATCH', path);
}
