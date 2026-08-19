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

type InspectionTemplate = {
  id: string;
  inspectionTypeId: string;
};

type CatalogRow = {
  id: string;
};

let accessToken: string | null = null;

const deriveKey = promisify(pbkdf2);
const FORMAT = 'pbkdf2_sha256';
const ITERATIONS = 210000;
const KEY_LENGTH = 32;
const reportSmokePermissions = [
  { code: 'inspections:read', name: 'Ver inspecciones', module: 'inspections', action: 'read' },
  { code: 'inspections:write', name: 'Editar inspecciones', module: 'inspections', action: 'write' },
  { code: 'incidents:read', name: 'Ver incidentes', module: 'incidents', action: 'read' },
  { code: 'incidents:write', name: 'Editar incidentes', module: 'incidents', action: 'write' },
];

function configureReportsSmokeAuthEnv(): string {
  return ensureApiSmokeEnv();
}

async function createPasswordHash(secret: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await deriveKey(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  return `${FORMAT}$${ITERATIONS}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

async function ensureReportsSmokeAuth(dataSource: DataSource, password: string): Promise<void> {
  const passwordHash = await createPasswordHash(password);
  await dataSource.query(
    `UPDATE users
     SET password_hash = $1,
         password_changed_at = NOW(),
         failed_login_attempts = 0,
         locked_until = NULL
     WHERE email = $2`,
    [passwordHash, 'carlos.aguirre@goldfields.com'],
  );

  for (const permission of reportSmokePermissions) {
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
    [reportSmokePermissions.map((permission) => permission.code)],
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

const ensureId = (value: unknown, label: string): string => {
  const row = asObject<JsonObject>(value, label);
  if (typeof row.id !== 'string' || row.id.length === 0) throw new Error(`${label} did not return an id`);
  return row.id;
};

function assertNumberField(value: JsonObject, key: string, label: string): void {
  if (typeof value[key] !== 'number') throw new Error(`${label} did not return numeric ${key}`);
}

async function login(baseUrl: string, password: string): Promise<void> {
  accessToken = null;
  const loginResponse = asObject<LoginSmokeResponse>(
    await request(baseUrl, 'POST', '/auth/login', { email: 'carlos.aguirre@goldfields.com', password }),
    'reports login',
  );
  accessToken = loginResponse.token;
}

async function createReportData(baseUrl: string): Promise<void> {
  const templates = asArray<InspectionTemplate>(await request(baseUrl, 'GET', '/inspections/templates'), 'inspection templates');
  const template = templates[0];
  if (!template?.id || !template.inspectionTypeId) throw new Error('inspection template seed is missing');

  const incidentTypes = asArray<CatalogRow>(await request(baseUrl, 'GET', '/incidents/types'), 'incident types');
  const incidentLevels = asArray<CatalogRow>(await request(baseUrl, 'GET', '/incidents/levels'), 'incident levels');
  const incidentTypeId = incidentTypes[0]?.id;
  const incidentLevelId = incidentLevels[0]?.id;
  if (!incidentTypeId || !incidentLevelId) throw new Error('incident catalog seed is missing');

  const unique = Date.now();
  await request(baseUrl, 'POST', '/inspections', {
    inspectionTypeId: template.inspectionTypeId,
    templateId: template.id,
    title: `Reports smoke inspection ${unique}`,
    description: 'Reports smoke inspection',
  }, 201);

  const incidentId = ensureId(await request(baseUrl, 'POST', '/incidents', {
    incidentTypeId,
    incidentLevelId,
    title: `Reports smoke incident ${unique}`,
    description: 'Reports smoke incident',
    occurredAt: new Date().toISOString(),
  }, 201), 'reports smoke incident');

  await request(baseUrl, 'POST', `/incidents/${incidentId}/action-plans`, {
    title: `Reports smoke action ${unique}`,
    description: 'Reports smoke action plan',
    status: 'open',
  }, 201);
}

async function assertReports(baseUrl: string): Promise<void> {
  const summary = asObject<JsonObject>(await request(baseUrl, 'GET', '/reports/summary'), 'reports summary');
  assertNumberField(summary, 'totalInspections', 'reports summary');
  assertNumberField(summary, 'totalIncidents', 'reports summary');
  assertNumberField(summary, 'openIncidents', 'reports summary');

  const inspections = asObject<JsonObject>(await request(baseUrl, 'GET', '/reports/inspections/summary'), 'inspection reports summary');
  assertNumberField(inspections, 'total', 'inspection reports summary');
  assertNumberField(inspections, 'open', 'inspection reports summary');
  assertNumberField(inspections, 'openFindings', 'inspection reports summary');

  const incidents = asObject<JsonObject>(await request(baseUrl, 'GET', '/reports/incidents/summary'), 'incident reports summary');
  assertNumberField(incidents, 'total', 'incident reports summary');
  assertNumberField(incidents, 'open', 'incident reports summary');
  assertNumberField(incidents, 'overdueSla', 'incident reports summary');

  asArray<JsonObject>(await request(baseUrl, 'GET', '/reports/incidents/by-level'), 'incidents by level');
  asArray<JsonObject>(await request(baseUrl, 'GET', '/reports/incidents/by-type'), 'incidents by type');
  asArray<JsonObject>(await request(baseUrl, 'GET', '/reports/incidents/by-company'), 'incidents by company');
  asArray<JsonObject>(await request(baseUrl, 'GET', '/reports/incidents/by-period'), 'incidents by period');

  const openItems = asObject<JsonObject>(await request(baseUrl, 'GET', '/reports/open-items'), 'open items');
  assertNumberField(openItems, 'inspectionsOpen', 'open items');
  assertNumberField(openItems, 'incidentsOpen', 'open items');
  assertNumberField(openItems, 'incidentActionPlansOpen', 'open items');
}

async function main(): Promise<void> {
  const smokePassword = configureReportsSmokeAuthEnv();
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
  await ensureReportsSmokeAuth(dataSource, smokePassword);
  await app.listen(0);

  const address = app.getHttpServer().address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    await login(baseUrl, smokePassword);
    await createReportData(baseUrl);
    await assertReports(baseUrl);
    console.log('api reports smoke tests passed');
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
