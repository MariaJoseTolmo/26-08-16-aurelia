import { env } from '../config/env';
import { readStoredToken } from './session-storage';

const API_URL = env.apiUrl;

function buildHeaders(init?: HeadersInit): HeadersInit {
  const headers = new Headers(init);
  const token = readStoredToken();

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

async function assertResponse(response: Response, method: string, path: string): Promise<void> {
  if (response.ok) return;
  const details = (await response.text()).trim();
  throw new Error(`${method} ${path} failed: ${response.status}${details ? ` - ${details}` : ''}`);
}

export async function httpGet<TResponse>(path: string): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: buildHeaders(),
  });
  await assertResponse(response, 'GET', path);
  return (await response.json()) as TResponse;
}

export async function httpDownload(path: string): Promise<{ blob: Blob; filename: string | null }> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: buildHeaders(),
  });
  await assertResponse(response, 'GET', path);
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const filename = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)?.[1]?.trim() ?? null;
  return {
    blob: await response.blob(),
    filename: filename ? decodeURIComponent(filename) : null,
  };
}

/**
 * Descarga un archivo generado a partir de un cuerpo JSON.
 *
 * Es POST y no GET porque el servidor no consulta nada: recibe el documento a
 * renderizar. Se usa para exportar vistas cuyo contenido ya está en el cliente.
 */
export async function httpDownloadPost<TRequest>(
  path: string,
  body: TRequest,
): Promise<{ blob: Blob; filename: string | null }> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  await assertResponse(response, 'POST', path);
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const filename = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)?.[1]?.trim() ?? null;
  return {
    blob: await response.blob(),
    filename: filename ? decodeURIComponent(filename) : null,
  };
}

export async function httpPost<TRequest, TResponse>(
  path: string,
  body: TRequest,
): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  await assertResponse(response, 'POST', path);
  return (await response.json()) as TResponse;
}

export async function httpPatch<TRequest, TResponse>(
  path: string,
  body: TRequest,
): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  await assertResponse(response, 'PATCH', path);
  return (await response.json()) as TResponse;
}

export async function httpPostForm<TResponse>(path: string, body: FormData): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: buildHeaders(),
    body,
  });
  await assertResponse(response, 'POST', path);
  return (await response.json()) as TResponse;
}
