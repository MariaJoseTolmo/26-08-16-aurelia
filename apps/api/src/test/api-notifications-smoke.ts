import 'reflect-metadata';
import { pbkdf2, randomBytes, randomUUID } from 'crypto';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { AddressInfo } from 'net';
import { promisify } from 'util';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { ensureApiSmokeEnv } from './test-env';
import { requestIdMiddleware } from '../shared/security/request-id.middleware';
import { SanitizedExceptionFilter } from '../shared/security/sanitized-exception.filter';

type JsonObject = Record<string, unknown>;

type LoginSmokeResponse = JsonObject & {
  token: string;
};

let accessToken: string | null = null;

const deriveKey = promisify(pbkdf2);
const FORMAT = 'pbkdf2_sha256';
const ITERATIONS = 210000;
const KEY_LENGTH = 32;
const smokeUserEmail = 'carlos.aguirre@goldfields.com';
const notificationPermissions = [
  { code: 'notifications:read', name: 'Ver notificaciones', module: 'notifications', action: 'read' },
  { code: 'notifications:write', name: 'Crear notificaciones', module: 'notifications', action: 'write' },
  { code: 'workflows:read', name: 'Ver workflows', module: 'workflows', action: 'read' },
  { code: 'workflows:write', name: 'Editar workflows', module: 'workflows', action: 'write' },
];

function configureNotificationsSmokeAuthEnv(): string {
  return ensureApiSmokeEnv();
}

async function createPasswordHash(secret: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await deriveKey(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  return `${FORMAT}$${ITERATIONS}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

async function ensureNotificationsSmokeData(dataSource: DataSource, password: string): Promise<string> {
  const passwordHash = await createPasswordHash(password);
  await dataSource.query(
    `UPDATE users
     SET password_hash = $1,
         password_changed_at = NOW(),
         failed_login_attempts = 0,
         locked_until = NULL
     WHERE email = $2`,
    [passwordHash, smokeUserEmail],
  );

  for (const permission of notificationPermissions) {
    await dataSource.query(
      `INSERT INTO permissions (code, name, module, action)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO NOTHING`,
      [permission.code, permission.name, permission.module, permission.action],
    );
  }

  await dataSource.query(
    `INSERT INTO role_permissions (role_id, permission_id)
     SELECT r.id, p.id
     FROM roles r, permissions p
     WHERE r.code = 'ADMIN'
       AND p.code = ANY($1::text[])
     ON CONFLICT DO NOTHING`,
    [notificationPermissions.map((permission) => permission.code)],
  );

  await dataSource.query(
    `INSERT INTO entity_reference_types (code, description)
     VALUES ('inspection', 'Inspección')
     ON CONFLICT (code) DO NOTHING`,
  );

  const definitionRows = await dataSource.query(
    `INSERT INTO workflow_definitions (code, name, description, entity_type, is_active)
     VALUES ('WF-NOTIFICATION-SMOKE', 'Smoke notificaciones', 'Workflow smoke de notificaciones', 'inspection', true)
     ON CONFLICT (code) DO UPDATE SET is_active = EXCLUDED.is_active
     RETURNING id`,
  ) as Array<{ id: string }>;
  const workflowDefinitionId = definitionRows[0]?.id;
  if (!workflowDefinitionId) throw new Error('workflow definition was not created');

  await dataSource.query(
    `INSERT INTO workflow_definition_steps (workflow_definition_id, step_order, code, name, sla_hours)
     VALUES ($1, 1, 'review', 'Revisión', 24)
     ON CONFLICT ON CONSTRAINT uq_wds_definition_code DO NOTHING`,
    [workflowDefinitionId],
  );

  return workflowDefinitionId;
}

async function request(baseUrl: string, method: string, path: string, body?: JsonObject, expectedStatus = 200): Promise<unknown> {
  const headers: Record<string, string> = {};
  if (body) headers['content-type'] = 'application/json';
  if (accessToken) headers.authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();

  if (response.status !== expectedStatus) {
    throw new Error(`${method} ${path} expected ${expectedStatus} but got ${response.status}: ${text}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!text) return null;
  if (contentType.includes('application/json')) return JSON.parse(text);
  return text;
}

const asArray = <T>(value: unknown, label: string): T[] => {
  if (!Array.isArray(value)) throw new Error(`${label} did not return an array`);
  return value as T[];
};

const asObject = <T extends JsonObject>(value: unknown, label: string): T => {
  if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error(`${label} did not return an object`);
  return value as T;
};

async function login(baseUrl: string, password: string): Promise<JsonObject> {
  accessToken = null;
  const loginResponse = asObject<LoginSmokeResponse>(
    await request(baseUrl, 'POST', '/auth/login', { email: smokeUserEmail, password }),
    'notifications login',
  );
  accessToken = loginResponse.token;
  return asObject<JsonObject>(await request(baseUrl, 'GET', '/me'), 'notifications me');
}

async function runNotificationsSmoke(baseUrl: string, workflowDefinitionId: string, userId: string): Promise<void> {
  await request(baseUrl, 'GET', '/notifications');

  await request(baseUrl, 'POST', '/workflows/start', {
    workflowDefinitionId,
    entityType: 'inspection',
    entityId: randomUUID(),
    startedByUserId: userId,
  }, 201);

  const unread = asArray<JsonObject>(await request(baseUrl, 'GET', '/notifications?unreadOnly=true'), 'unread notifications');
  const notification = unread.find((row) => row.category === 'workflow' && row.readAt === null);
  if (!notification) throw new Error('workflow notification was not created');
  if (typeof notification.id !== 'string') throw new Error('workflow notification did not return id');

  const read = asObject<JsonObject>(await request(baseUrl, 'PATCH', `/notifications/${notification.id}/read`), 'read notification');
  if (typeof read.readAt !== 'string') throw new Error('notification was not marked as read');
}

async function main(): Promise<void> {
  const smokePassword = configureNotificationsSmokeAuthEnv();
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.setGlobalPrefix('api');
  app.use(requestIdMiddleware);
  app.useGlobalFilters(new SanitizedExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  const dataSource = app.get(DataSource);
  await dataSource.runMigrations();
  const workflowDefinitionId = await ensureNotificationsSmokeData(dataSource, smokePassword);
  await app.listen(0);

  const address = app.getHttpServer().address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    const me = await login(baseUrl, smokePassword);
    if (typeof me.id !== 'string') throw new Error('/me did not return user id');
    await runNotificationsSmoke(baseUrl, workflowDefinitionId, me.id);
    console.log('api notifications smoke tests passed');
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
