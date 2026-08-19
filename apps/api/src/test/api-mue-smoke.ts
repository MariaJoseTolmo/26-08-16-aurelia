import 'reflect-metadata';
import { pbkdf2, randomBytes } from 'crypto';
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

type MueRow = JsonObject & {
  id: string;
  code: string;
};

type ControlRow = JsonObject & {
  id: string;
  code: string;
  mueId: string;
};

type VerificationItemRow = JsonObject & {
  id: string;
  code: string;
  criticalControlId: string;
};

let accessToken: string | null = null;

const deriveKey = promisify(pbkdf2);
const FORMAT = 'pbkdf2_sha256';
const ITERATIONS = 210000;
const KEY_LENGTH = 32;
const smokeUserEmail = 'carlos.aguirre@goldfields.com';

function configureMueSmokeAuthEnv(): string {
  return ensureApiSmokeEnv();
}

async function createPasswordHash(secret: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await deriveKey(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  return `${FORMAT}$${ITERATIONS}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

async function ensureMueSmokeAuth(dataSource: DataSource, password: string): Promise<void> {
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

async function login(baseUrl: string, password: string): Promise<void> {
  accessToken = null;
  const loginResponse = asObject<LoginSmokeResponse>(
    await request(baseUrl, 'POST', '/auth/login', { email: smokeUserEmail, password }),
    'mue login',
  );
  accessToken = loginResponse.token;
}

async function assertMueFlow(baseUrl: string): Promise<void> {
  const mues = asArray<MueRow>(await request(baseUrl, 'GET', '/mue'), 'mue catalog');
  if (mues.length < 6) throw new Error('MUE catalog does not include the expected 6 records');

  const mue = mues.find((row) => row.code === 'MUE1') ?? mues[0];
  const controls = asArray<ControlRow>(await request(baseUrl, 'GET', `/mue/${mue.id}/controls`), 'mue controls');
  if (controls.length === 0) throw new Error('MUE controls were not seeded');

  const control = controls[0];
  const items = asArray<VerificationItemRow>(await request(baseUrl, 'GET', `/critical-controls/catalog/verification-items?criticalControlId=${control.id}`), 'verification items');
  if (items.length === 0) throw new Error('Control verification items were not seeded');

  const periodYear = 2090 + (Date.now() % 10);
  const periodMonth = 1 + (Date.now() % 11);
  const assessment = asObject<JsonObject>(await request(baseUrl, 'POST', '/critical-controls/self-assessments', {
    mueId: mue.id,
    criticalControlId: control.id,
    periodYear,
    periodMonth,
  }, 201), 'control assessment');

  if (typeof assessment.id !== 'string') throw new Error('Control assessment did not return id');

  const answered = asObject<JsonObject>(await request(baseUrl, 'PATCH', `/critical-controls/self-assessments/${assessment.id}/answers`, {
    answers: [
      {
        verificationItemId: items[0].id,
        answer: 'yes',
        comment: 'Smoke test validation',
      },
    ],
  }), 'control assessment answers');

  if (answered.complianceScore !== 100) throw new Error('Compliance score was not recalculated');

  const submitted = asObject<JsonObject>(await request(baseUrl, 'POST', `/critical-controls/self-assessments/${assessment.id}/submit`, undefined, 201), 'control assessment submit');
  if (submitted.status !== 'submitted') throw new Error('Control assessment was not submitted');
}

async function main(): Promise<void> {
  const smokePassword = configureMueSmokeAuthEnv();
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
  await ensureMueSmokeAuth(dataSource, smokePassword);
  await app.listen(0);

  const address = app.getHttpServer().address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    await login(baseUrl, smokePassword);
    await assertMueFlow(baseUrl);
    console.log('api mue smoke tests passed');
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
