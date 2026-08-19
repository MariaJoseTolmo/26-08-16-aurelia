import { randomUUID } from 'crypto';

export function ensureApiSmokeEnv(): string {
  process.env.API_TOKEN_KEY ??= `api-smoke-token-key-${randomUUID().replaceAll('-', '')}`;
  process.env.AURELIA_DEMO_USER_PASSWORD ??= `api-smoke-demo-password-${randomUUID().replaceAll('-', '')}`;

  const password = process.env.AURELIA_DEMO_USER_PASSWORD;
  if (!password) throw new Error('AURELIA_DEMO_USER_PASSWORD is not configured for smoke tests');

  return password;
}