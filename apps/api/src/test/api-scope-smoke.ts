import 'reflect-metadata';
import { pbkdf2, randomBytes } from 'crypto';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { AddressInfo } from 'net';
import { promisify } from 'util';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { ensureApiSmokeEnv } from './test-env';
import { ResourceScopeInterceptor } from '../modules/access-control/resource-scope.interceptor';
import { ResourceScopeService } from '../modules/access-control/resource-scope.service';
import { IncidentEntity } from '../modules/incidents/entities/incident.entity';
import { InspectionEntity } from '../modules/inspections/entities/inspection.entity';
import { UserEntity } from '../modules/users/entities/user.entity';
import { requestIdMiddleware } from '../shared/security/request-id.middleware';
import { SanitizedExceptionFilter } from '../shared/security/sanitized-exception.filter';

type JsonObject = Record<string, unknown>;

type LoginSmokeResponse = JsonObject & {
  token: string;
};

type CatalogRow = {
  id: string;
};

type InspectionTemplate = {
  id: string;
  inspectionTypeId: string;
};

type ScopeSeed = {
  somacorCompanyId: string;
  straconCompanyId: string;
};

type CreatedScopeResources = {
  somacorInspectionId: string;
  straconInspectionId: string;
  somacorIncidentId: string;
  straconIncidentId: string;
};

let accessToken: string | null = null;

const deriveKey = promisify(pbkdf2);
const FORMAT = 'pbkdf2_sha256';
const ITERATIONS = 210000;
const KEY_LENGTH = 32;
const scopeUsersForSmoke = [
  'carlos.aguirre@goldfields.com',
  'roberto.gonzalez@somacor.com',
  'ana.morales@stracon.com',
];

const scopePermissions = [
  { code: 'inspections:read', name: 'Ver inspecciones', module: 'inspections', action: 'read' },
  { code: 'inspections:write', name: 'Editar inspecciones', module: 'inspections', action: 'write' },
  { code: 'incidents:read', name: 'Ver incidentes', module: 'incidents', action: 'read' },
  { code: 'incidents:write', name: 'Editar incidentes', module: 'incidents', action: 'write' },
];

function configureScopeSmokeAuthEnv(): string {
  return ensureApiSmokeEnv();
}

function createResourceScopeInterceptor(dataSource: DataSource): ResourceScopeInterceptor {
  return new ResourceScopeInterceptor(
    new ResourceScopeService(dataSource.getRepository(UserEntity)),
    dataSource.getRepository(InspectionEntity),
    dataSource.getRepository(IncidentEntity),
  );
}

async function createPasswordHash(secret: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await deriveKey(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  return `${FORMAT}$${ITERATIONS}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

async function ensureScopeSmokeUsers(dataSource: DataSource, password: string): Promise<void> {
  const passwordHash = await createPasswordHash(password);
  await dataSource.query(
    `UPDATE users
     SET password_hash = $1,
         password_changed_at = NOW(),
         failed_login_attempts = 0,
         locked_until = NULL
     WHERE email = ANY($2::text[])`,
    [passwordHash, scopeUsersForSmoke],
  );
}

async function ensureScopePermissionMatrix(dataSource: DataSource): Promise<void> {
  for (const permission of scopePermissions) {
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
     ON CONFLICT DO NOTHING`,
  );

  await dataSource.query(
    `INSERT INTO role_permissions (role_id, permission_id)
     SELECT r.id, p.id
     FROM roles r, permissions p
     WHERE r.code IN ('INSPECTOR', 'SUPERVISOR')
       AND p.code = ANY($1::text[])
     ON CONFLICT DO NOTHING`,
    [scopePermissions.map((permission) => permission.code)],
  );
}

async function loadScopeSeed(dataSource: DataSource): Promise<ScopeSeed> {
  const rows = await dataSource.query(
    `SELECT code, id
     FROM companies
     WHERE code = ANY($1::text[])`,
    [['SOMACOR', 'STRACON']],
  ) as Array<{ code: string; id: string }>;

  const somacorCompanyId = rows.find((row) => row.code === 'SOMACOR')?.id;
  const straconCompanyId = rows.find((row) => row.code === 'STRACON')?.id;

  if (!somacorCompanyId || !straconCompanyId) throw new Error('Scope company seed data is missing');
  return { somacorCompanyId, straconCompanyId };
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

async function login(baseUrl: string, email: string, password: string): Promise<void> {
  accessToken = null;
  const loginResponse = asObject<LoginSmokeResponse>(
    await request(baseUrl, 'POST', '/auth/login', { email, password }),
    'scope login',
  );
  accessToken = loginResponse.token;
}

async function createScopedResources(baseUrl: string, seed: ScopeSeed): Promise<CreatedScopeResources> {
  const templates = asArray<InspectionTemplate>(await request(baseUrl, 'GET', '/inspections/templates'), 'inspection templates');
  const template = templates[0];
  if (!template?.id || !template.inspectionTypeId) throw new Error('inspection template seed is missing');

  const incidentTypes = asArray<CatalogRow>(await request(baseUrl, 'GET', '/incidents/types'), 'incident types');
  const incidentLevels = asArray<CatalogRow>(await request(baseUrl, 'GET', '/incidents/levels'), 'incident levels');
  const incidentTypeId = incidentTypes[0]?.id;
  const incidentLevelId = incidentLevels[0]?.id;
  if (!incidentTypeId || !incidentLevelId) throw new Error('incident catalog seed is missing');

  const unique = Date.now();
  const somacorInspectionId = ensureId(await request(baseUrl, 'POST', '/inspections', {
    inspectionTypeId: template.inspectionTypeId,
    templateId: template.id,
    companyId: seed.somacorCompanyId,
    title: `Scope SOMACOR inspection ${unique}`,
    description: 'Scope smoke allowed inspection',
  }, 201), 'create SOMACOR inspection');

  const straconInspectionId = ensureId(await request(baseUrl, 'POST', '/inspections', {
    inspectionTypeId: template.inspectionTypeId,
    templateId: template.id,
    companyId: seed.straconCompanyId,
    title: `Scope STRACON inspection ${unique}`,
    description: 'Scope smoke denied inspection',
  }, 201), 'create STRACON inspection');

  const somacorIncidentId = ensureId(await request(baseUrl, 'POST', '/incidents', {
    incidentTypeId,
    incidentLevelId,
    companyId: seed.somacorCompanyId,
    title: `Scope SOMACOR incident ${unique}`,
    description: 'Scope smoke allowed incident',
    occurredAt: new Date().toISOString(),
  }, 201), 'create SOMACOR incident');

  const straconIncidentId = ensureId(await request(baseUrl, 'POST', '/incidents', {
    incidentTypeId,
    incidentLevelId,
    companyId: seed.straconCompanyId,
    title: `Scope STRACON incident ${unique}`,
    description: 'Scope smoke denied incident',
    occurredAt: new Date().toISOString(),
  }, 201), 'create STRACON incident');

  return { somacorInspectionId, straconInspectionId, somacorIncidentId, straconIncidentId };
}

function assertResourceVisibility(rows: JsonObject[], allowedId: string, deniedId: string, label: string): void {
  const ids = rows.map((row) => row.id).filter((id): id is string => typeof id === 'string');
  if (!ids.includes(allowedId)) throw new Error(`${label} did not include allowed resource`);
  if (ids.includes(deniedId)) throw new Error(`${label} exposed resource outside user scope`);
}

async function assertSomacorScope(baseUrl: string, seed: ScopeSeed, resources: CreatedScopeResources): Promise<void> {
  await request(baseUrl, 'GET', `/inspections/${resources.somacorInspectionId}`);
  await request(baseUrl, 'GET', `/inspections/${resources.straconInspectionId}`, undefined, 403);
  await request(baseUrl, 'GET', `/incidents/${resources.somacorIncidentId}`);
  await request(baseUrl, 'GET', `/incidents/${resources.straconIncidentId}`, undefined, 403);

  assertResourceVisibility(
    asArray<JsonObject>(await request(baseUrl, 'GET', '/inspections'), 'SOMACOR inspections'),
    resources.somacorInspectionId,
    resources.straconInspectionId,
    'SOMACOR inspections',
  );

  assertResourceVisibility(
    asArray<JsonObject>(await request(baseUrl, 'GET', '/incidents'), 'SOMACOR incidents'),
    resources.somacorIncidentId,
    resources.straconIncidentId,
    'SOMACOR incidents',
  );

  const templates = asArray<InspectionTemplate>(await request(baseUrl, 'GET', '/inspections/templates'), 'inspection templates');
  const template = templates[0];
  await request(baseUrl, 'POST', '/inspections', {
    inspectionTypeId: template.inspectionTypeId,
    templateId: template.id,
    companyId: seed.straconCompanyId,
    title: `Scope forbidden inspection ${Date.now()}`,
  }, 403);

  const incidentTypes = asArray<CatalogRow>(await request(baseUrl, 'GET', '/incidents/types'), 'incident types');
  const incidentLevels = asArray<CatalogRow>(await request(baseUrl, 'GET', '/incidents/levels'), 'incident levels');
  await request(baseUrl, 'POST', '/incidents', {
    incidentTypeId: incidentTypes[0].id,
    incidentLevelId: incidentLevels[0].id,
    companyId: seed.straconCompanyId,
    title: `Scope forbidden incident ${Date.now()}`,
    description: 'Scope smoke forbidden incident',
    occurredAt: new Date().toISOString(),
  }, 403);
}

async function assertStraconScope(baseUrl: string, resources: CreatedScopeResources): Promise<void> {
  await request(baseUrl, 'GET', `/inspections/${resources.straconInspectionId}`);
  await request(baseUrl, 'GET', `/inspections/${resources.somacorInspectionId}`, undefined, 403);
  await request(baseUrl, 'GET', `/incidents/${resources.straconIncidentId}`);
  await request(baseUrl, 'GET', `/incidents/${resources.somacorIncidentId}`, undefined, 403);
}

async function runScopeSmoke(baseUrl: string, password: string, seed: ScopeSeed): Promise<void> {
  await login(baseUrl, 'carlos.aguirre@goldfields.com', password);
  const resources = await createScopedResources(baseUrl, seed);

  await login(baseUrl, 'roberto.gonzalez@somacor.com', password);
  await assertSomacorScope(baseUrl, seed, resources);

  await login(baseUrl, 'ana.morales@stracon.com', password);
  await assertStraconScope(baseUrl, resources);
}

async function main(): Promise<void> {
  const smokePassword = configureScopeSmokeAuthEnv();
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

  const dataSource = app.get(DataSource);
  app.useGlobalInterceptors(createResourceScopeInterceptor(dataSource));

  await app.init();
  await dataSource.runMigrations();
  await ensureScopePermissionMatrix(dataSource);
  await ensureScopeSmokeUsers(dataSource, smokePassword);
  const seed = await loadScopeSeed(dataSource);
  await app.listen(0);

  const address = app.getHttpServer().address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    await runScopeSmoke(baseUrl, smokePassword, seed);
    console.log('api resource scope smoke tests passed');
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
