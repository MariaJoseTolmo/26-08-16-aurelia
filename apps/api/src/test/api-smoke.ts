import 'reflect-metadata';
import { pbkdf2, randomBytes, randomUUID } from 'crypto';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import type { AddressInfo } from 'net';
import { promisify } from 'util';
import { AppModule } from '../app.module';
import { ensureApiSmokeEnv } from './test-env';

type JsonObject = Record<string, unknown>;

type InspectionTemplate = {
  id: string;
  inspectionTypeId: string;
  sections: Array<{
    items: Array<{ id: string }>;
  }>;
};

type CatalogRow = {
  id: string;
};

type SprParameterRow = CatalogRow & {
  isSox?: boolean;
  requiresEvidence?: boolean;
};

type LoginSmokeResponse = JsonObject & {
  token: string;
  refreshToken: string;
};

type PermissionSeed = {
  code: string;
  name: string;
  module: string;
  action: string;
};

let accessToken: string | null = null;

const deriveKey = promisify(pbkdf2);
const FORMAT = 'pbkdf2_sha256';
const ITERATIONS = 210000;
const KEY_LENGTH = 32;
const demoUsersForSmoke = [
  'admin@aurelia.local',
  'karen.opazo@goldfields.com',
  'pedro.silva@goldfields.com',
  'carlos.aguirre@goldfields.com',
];

const securityPermissions: PermissionSeed[] = [
  { code: 'organization:read', name: 'Ver organización', module: 'organization', action: 'read' },
  { code: 'organization:write', name: 'Editar organización', module: 'organization', action: 'write' },
  { code: 'users:read', name: 'Ver usuarios', module: 'users', action: 'read' },
  { code: 'users:write', name: 'Editar usuarios', module: 'users', action: 'write' },
  { code: 'roles:read', name: 'Ver roles', module: 'roles', action: 'read' },
  { code: 'roles:write', name: 'Editar roles', module: 'roles', action: 'write' },
  { code: 'permissions:read', name: 'Ver permisos', module: 'permissions', action: 'read' },
  { code: 'permissions:write', name: 'Editar permisos', module: 'permissions', action: 'write' },
  { code: 'mobile:read', name: 'Ver bootstrap mobile', module: 'mobile', action: 'read' },
  { code: 'mobile:sync', name: 'Sincronizar mobile', module: 'mobile', action: 'sync' },
  { code: 'inspections:read', name: 'Ver inspecciones', module: 'inspections', action: 'read' },
  { code: 'inspections:write', name: 'Editar inspecciones', module: 'inspections', action: 'write' },
  { code: 'incidents:read', name: 'Ver incidentes', module: 'incidents', action: 'read' },
  { code: 'incidents:write', name: 'Editar incidentes', module: 'incidents', action: 'write' },
  { code: 'spr:read', name: 'Ver SPR', module: 'spr', action: 'read' },
  { code: 'spr:write', name: 'Editar SPR', module: 'spr', action: 'write' },
  { code: 'spr:submit', name: 'Enviar SPR', module: 'spr', action: 'submit' },
  { code: 'spr:approve', name: 'Aprobar SPR', module: 'spr', action: 'approve' },
  { code: 'evidences:read', name: 'Ver evidencias', module: 'evidences', action: 'read' },
  { code: 'evidences:write', name: 'Editar evidencias', module: 'evidences', action: 'write' },
  { code: 'evidences:validate', name: 'Validar evidencias', module: 'evidences', action: 'validate' },
  { code: 'comments:read', name: 'Ver comentarios', module: 'comments', action: 'read' },
  { code: 'comments:write', name: 'Crear comentarios', module: 'comments', action: 'write' },
  { code: 'workflows:read', name: 'Ver workflows', module: 'workflows', action: 'read' },
  { code: 'workflows:write', name: 'Editar workflows', module: 'workflows', action: 'write' },
  { code: 'workflows:approve', name: 'Aprobar workflows', module: 'workflows', action: 'approve' },
];

const rolePermissions: Record<string, string[]> = {
  SUPERVISOR: [
    'organization:read',
    'users:read',
    'mobile:read',
    'mobile:sync',
    'inspections:read',
    'inspections:write',
    'incidents:read',
    'incidents:write',
    'spr:read',
    'spr:write',
    'spr:submit',
    'spr:approve',
    'evidences:read',
    'evidences:write',
    'evidences:validate',
    'comments:read',
    'comments:write',
    'workflows:read',
    'workflows:write',
    'workflows:approve',
  ],
  INSPECTOR: [
    'organization:read',
    'mobile:read',
    'mobile:sync',
    'inspections:read',
    'inspections:write',
    'incidents:read',
    'incidents:write',
    'spr:read',
    'spr:write',
    'spr:submit',
    'evidences:read',
    'evidences:write',
    'comments:read',
    'comments:write',
    'workflows:read',
  ],
  APPROVER: [
    'organization:read',
    'users:read',
    'mobile:read',
    'inspections:read',
    'incidents:read',
    'spr:read',
    'spr:approve',
    'evidences:read',
    'evidences:validate',
    'comments:read',
    'comments:write',
    'workflows:read',
    'workflows:approve',
  ],
  VIEWER: [
    'organization:read',
    'mobile:read',
    'inspections:read',
    'incidents:read',
    'spr:read',
    'evidences:read',
    'comments:read',
    'workflows:read',
  ],
};

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

const ensureStringArray = (value: unknown, label: string): string[] => {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(`${label} did not return a string array`);
  }
  return value;
};

function configureSmokeAuthEnv(): string {
  return ensureApiSmokeEnv();
}

async function createPasswordHash(secret: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await deriveKey(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  return `${FORMAT}$${ITERATIONS}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

async function ensureDemoUserCredentialHashes(dataSource: DataSource, password: string): Promise<void> {
  const passwordHash = await createPasswordHash(password);
  await dataSource.query(
    `UPDATE users
     SET password_hash = $1,
         password_changed_at = NOW(),
         failed_login_attempts = 0,
         locked_until = NULL
     WHERE email = ANY($2::text[])`,
    [passwordHash, demoUsersForSmoke],
  );
}

async function ensureSecurityPermissionMatrix(dataSource: DataSource): Promise<void> {
  for (const permission of securityPermissions) {
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

  for (const [roleCode, permissionCodes] of Object.entries(rolePermissions)) {
    await dataSource.query(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT r.id, p.id
       FROM roles r, permissions p
       WHERE r.code = $1
         AND p.code = ANY($2::text[])
       ON CONFLICT DO NOTHING`,
      [roleCode, permissionCodes],
    );
  }
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

async function loginWithSession(baseUrl: string, email: string, password: string): Promise<LoginSmokeResponse> {
  accessToken = null;
  const login = asObject<LoginSmokeResponse>(
    await request(baseUrl, 'POST', '/auth/login', { email, password }),
    'login with session',
  );
  if (typeof login.token !== 'string' || login.token.length === 0) {
    throw new Error('login with session did not return a token');
  }
  if (typeof login.refreshToken !== 'string' || login.refreshToken.length === 0) {
    throw new Error('login with session did not return a refresh token');
  }
  return login;
}

function assertIncludesAll(values: string[], expected: string[], label: string): void {
  for (const item of expected) {
    if (!values.includes(item)) throw new Error(`${label} is missing ${item}`);
  }
}

function assertExcludesAll(values: string[], excluded: string[], label: string): void {
  for (const item of excluded) {
    if (values.includes(item)) throw new Error(`${label} should not include ${item}`);
  }
}

async function runAuthBoundaryChecks(baseUrl: string, password: string): Promise<void> {
  await request(baseUrl, 'GET', '/health');
  await request(baseUrl, 'GET', '/me', undefined, 401);
  await request(baseUrl, 'GET', '/mobile/bootstrap', undefined, 401);
  await request(baseUrl, 'POST', '/auth/login', {
    email: 'karen.opazo@goldfields.com',
    password: 'invalid-password',
  }, 401);

  const inspectorLogin = await loginWithSession(baseUrl, 'karen.opazo@goldfields.com', password);
  accessToken = inspectorLogin.token;

  const me = asObject<JsonObject>(await request(baseUrl, 'GET', '/me'), 'me');
  if (me.email !== 'karen.opazo@goldfields.com') throw new Error('/me did not return the authenticated user');

  const refreshed = asObject<LoginSmokeResponse>(
    await request(baseUrl, 'POST', '/auth/refresh', { refreshToken: inspectorLogin.refreshToken }),
    'refresh response',
  );
  if (typeof refreshed.token !== 'string' || refreshed.token.length === 0) {
    throw new Error('refresh did not return a token');
  }
  if (typeof refreshed.refreshToken !== 'string' || refreshed.refreshToken.length === 0) {
    throw new Error('refresh did not return a refresh token');
  }

  await request(baseUrl, 'POST', '/auth/refresh', { refreshToken: inspectorLogin.refreshToken }, 401);

  accessToken = refreshed.token;
  await request(baseUrl, 'GET', '/me');

  await request(baseUrl, 'POST', '/auth/logout', undefined, 204);
  accessToken = null;
  await request(baseUrl, 'POST', '/auth/refresh', { refreshToken: refreshed.refreshToken }, 401);

  const inspectorLoginAfterLogout = await loginWithSession(baseUrl, 'karen.opazo@goldfields.com', password);
  accessToken = inspectorLoginAfterLogout.token;
  await request(baseUrl, 'POST', '/auth/logout-all', undefined, 204);
  accessToken = null;
  await request(baseUrl, 'POST', '/auth/refresh', { refreshToken: inspectorLoginAfterLogout.refreshToken }, 401);

  accessToken = (await loginWithSession(baseUrl, 'karen.opazo@goldfields.com', password)).token;
  const inspectorPermissions = ensureStringArray(me.permissions, 'inspector permissions');
  assertIncludesAll(
    inspectorPermissions,
    ['mobile:read', 'mobile:sync', 'inspections:write', 'incidents:write', 'spr:submit', 'evidences:write', 'comments:write'],
    'inspector permissions',
  );
  assertExcludesAll(inspectorPermissions, ['*', 'users:read', 'roles:read', 'permissions:read', 'spr:approve'], 'inspector permissions');

  await request(baseUrl, 'GET', '/mobile/bootstrap');
  await request(baseUrl, 'GET', '/mobile/sync');
  await request(baseUrl, 'GET', '/organization/areas');
  await request(baseUrl, 'GET', '/inspections/types');
  await request(baseUrl, 'GET', '/incidents/types');
  await request(baseUrl, 'GET', '/spr/groups');
  await request(baseUrl, 'GET', '/users', undefined, 403);
  await request(baseUrl, 'GET', '/roles', undefined, 403);
  await request(baseUrl, 'GET', '/permissions', undefined, 403);

  accessToken = (await loginWithSession(baseUrl, 'carlos.aguirre@goldfields.com', password)).token;
  const adminMe = asObject<JsonObject>(await request(baseUrl, 'GET', '/me'), 'admin me');
  const adminPermissions = ensureStringArray(adminMe.permissions, 'admin permissions');
  if (adminPermissions.includes('*')) throw new Error('admin token should not include wildcard permissions');
  assertIncludesAll(
    adminPermissions,
    ['users:read', 'organization:read', 'roles:read', 'permissions:read', 'inspections:write', 'incidents:write', 'spr:approve', 'evidences:validate'],
    'admin permissions',
  );

  await request(baseUrl, 'GET', '/users');
  await request(baseUrl, 'GET', '/organization/areas');
  await request(baseUrl, 'GET', '/roles');
  await request(baseUrl, 'GET', '/permissions');
}

async function runInspectionFlow(baseUrl: string): Promise<void> {
  await request(baseUrl, 'GET', '/inspections/types');
  const templates = asArray<InspectionTemplate>(await request(baseUrl, 'GET', '/inspections/templates'), 'inspection templates');
  const template = templates[0];
  if (!template?.id || !template.inspectionTypeId) throw new Error('inspection template seed is missing');
  const checklistItemId = template.sections?.[0]?.items?.[0]?.id;
  if (!checklistItemId) throw new Error('inspection checklist item seed is missing');

  const unique = Date.now();
  const inspection = asObject<JsonObject>(
    await request(baseUrl, 'POST', '/inspections', {
      inspectionTypeId: template.inspectionTypeId,
      templateId: template.id,
      title: `Smoke inspection ${unique}`,
      description: 'Smoke test inspection flow',
    }, 201),
    'create inspection',
  );
  const inspectionId = ensureId(inspection, 'create inspection');

  await request(baseUrl, 'GET', '/inspections');
  await request(baseUrl, 'GET', `/inspections/${inspectionId}`);
  await request(baseUrl, 'PATCH', `/inspections/${inspectionId}/status`, { status: 'in_progress', comment: 'Smoke start' });
  await request(baseUrl, 'POST', `/inspections/${inspectionId}/answers`, {
    checklistItemId,
    answerValue: 'compliant',
    notes: 'Smoke answer',
  }, 201);

  const finding = asObject<JsonObject>(
    await request(baseUrl, 'POST', `/inspections/${inspectionId}/findings`, {
      checklistItemId,
      title: `Smoke finding ${unique}`,
      description: 'Smoke finding description',
      severity: 'low',
    }, 201),
    'create inspection finding',
  );
  const findingId = ensureId(finding, 'create inspection finding');

  await request(baseUrl, 'GET', `/inspections/${inspectionId}/findings`);
  await request(baseUrl, 'POST', `/inspections/findings/${findingId}/followups`, {
    status: 'completed',
    description: 'Smoke followup completed',
    performedAt: new Date().toISOString(),
  }, 201);
  await request(baseUrl, 'PATCH', `/inspections/findings/${findingId}`, {
    status: 'closed',
    reason: 'Smoke finding closed',
  });
  await request(baseUrl, 'POST', `/inspections/${inspectionId}/comments`, {
    body: 'Smoke inspection comment',
    isInternal: false,
  }, 201);
  await request(baseUrl, 'GET', `/inspections/${inspectionId}/comments`);
  await request(baseUrl, 'GET', `/inspections/${inspectionId}/evidences`);
  await request(baseUrl, 'GET', `/inspections/${inspectionId}/export`);
  await request(baseUrl, 'GET', `/inspections/${inspectionId}/export/pdf`);
  await request(baseUrl, 'POST', `/inspections/${inspectionId}/close`, { reason: 'Smoke close' }, 201);
  await request(baseUrl, 'GET', '/inspections/dashboard/summary');
}

async function runIncidentFlow(baseUrl: string): Promise<void> {
  const types = asArray<CatalogRow>(await request(baseUrl, 'GET', '/incidents/types'), 'incident types');
  const levels = asArray<CatalogRow>(await request(baseUrl, 'GET', '/incidents/levels'), 'incident levels');
  const incidentTypeId = types[0]?.id;
  const incidentLevelId = levels[0]?.id;
  if (!incidentTypeId || !incidentLevelId) throw new Error('incident catalog seed is missing');

  const unique = Date.now();
  const incident = asObject<JsonObject>(
    await request(baseUrl, 'POST', '/incidents', {
      incidentTypeId,
      incidentLevelId,
      title: `Smoke incident ${unique}`,
      description: 'Smoke test incident flow',
      occurredAt: new Date().toISOString(),
      immediateResponseSummary: 'Smoke immediate response',
      environmentalImpactSummary: 'Smoke impact summary',
    }, 201),
    'create incident',
  );
  const incidentId = ensureId(incident, 'create incident');

  await request(baseUrl, 'GET', '/incidents');
  await request(baseUrl, 'GET', `/incidents/${incidentId}`);
  await request(baseUrl, 'PATCH', `/incidents/${incidentId}/status`, { status: 'under_review', comment: 'Smoke review' });
  await request(baseUrl, 'POST', `/incidents/${incidentId}/flash-report`, {
    summary: 'Smoke flash report summary',
    immediateCauses: 'Smoke immediate causes',
    affectedComponents: 'Smoke affected components',
    potentialImpact: 'Smoke potential impact',
    reporterName: 'Smoke tester',
  }, 201);
  await request(baseUrl, 'GET', `/incidents/${incidentId}/flash-report`);

  const incidentEvidence = asObject<JsonObject>(
    await request(baseUrl, 'POST', '/evidences', {
      title: `Smoke incident evidence ${unique}`,
      description: 'Smoke evidence linked to incident',
      evidenceType: 'photo',
      capturedAt: new Date().toISOString(),
    }, 201),
    'create incident evidence',
  );
  const incidentEvidenceId = ensureId(incidentEvidence, 'create incident evidence');
  await request(baseUrl, 'POST', `/incidents/${incidentId}/evidences/${incidentEvidenceId}/link`, { relationType: 'smoke_evidence' }, 201);
  await request(baseUrl, 'GET', `/incidents/${incidentId}/evidences`);
  await request(baseUrl, 'POST', `/incidents/${incidentId}/comments`, {
    body: 'Smoke incident comment',
    isInternal: false,
  }, 201);
  await request(baseUrl, 'GET', `/incidents/${incidentId}/comments`);
  await request(baseUrl, 'GET', `/incidents/${incidentId}/export`);
  await request(baseUrl, 'GET', `/incidents/${incidentId}/export/pdf`);

  const immediateAction = asObject<JsonObject>(
    await request(baseUrl, 'POST', `/incidents/${incidentId}/immediate-actions`, {
      description: 'Smoke immediate action',
      status: 'completed',
      performedAt: new Date().toISOString(),
    }, 201),
    'create immediate action',
  );
  const immediateActionId = ensureId(immediateAction, 'create immediate action');
  await request(baseUrl, 'GET', `/incidents/${incidentId}/immediate-actions`);
  await request(baseUrl, 'PATCH', `/incidents/immediate-actions/${immediateActionId}`, { status: 'completed' });

  const investigation = asObject<JsonObject>(
    await request(baseUrl, 'POST', `/incidents/${incidentId}/investigations`, {
      method: 'five_why',
      title: 'Smoke investigation',
      summary: 'Smoke investigation summary',
      startedAt: new Date().toISOString(),
    }, 201),
    'create investigation',
  );
  const investigationId = ensureId(investigation, 'create investigation');
  await request(baseUrl, 'GET', `/incidents/${incidentId}/investigations`);
  await request(baseUrl, 'POST', `/incidents/investigations/${investigationId}/five-why`, {
    problemStatement: 'Smoke problem statement',
    why1: 'Smoke why 1',
    why2: 'Smoke why 2',
    rootCause: 'Smoke root cause',
  }, 201);
  await request(baseUrl, 'POST', `/incidents/investigations/${investigationId}/peepo`, {
    people: 'Smoke people',
    environment: 'Smoke environment',
    equipment: 'Smoke equipment',
    procedures: 'Smoke procedures',
    organization: 'Smoke organization',
  }, 201);

  const actionPlan = asObject<JsonObject>(
    await request(baseUrl, 'POST', `/incidents/${incidentId}/action-plans`, {
      investigationId,
      title: 'Smoke action plan',
      description: 'Smoke action plan description',
      dueAt: new Date(Date.now() + 86_400_000).toISOString(),
      status: 'open',
    }, 201),
    'create action plan',
  );
  const actionPlanId = ensureId(actionPlan, 'create action plan');
  await request(baseUrl, 'GET', `/incidents/${incidentId}/action-plans`);
  await request(baseUrl, 'POST', `/incidents/${incidentId}/close`, { comment: 'Should fail with open action plan' }, 400);
  await request(baseUrl, 'PATCH', `/incidents/action-plans/${actionPlanId}`, {
    status: 'completed',
    completedAt: new Date().toISOString(),
  });
  await request(baseUrl, 'POST', `/incidents/${incidentId}/close`, { comment: 'Smoke incident closed' }, 201);
  await request(baseUrl, 'GET', '/incidents/dashboard/summary');
}

async function createSprRecord(
  baseUrl: string,
  parameterId: string,
  periodYear: number,
  periodMonth: number,
  label: string,
): Promise<string> {
  const record = asObject<JsonObject>(
    await request(baseUrl, 'POST', '/spr/monthly-records', {
      parameterId,
      periodYear,
      periodMonth,
      numericValue: 123.45,
      notes: label,
    }, 201),
    'create SPR monthly record',
  );
  return ensureId(record, 'create SPR monthly record');
}

async function createAndLinkSprEvidence(baseUrl: string, recordId: string, unique: number): Promise<void> {
  const evidence = asObject<JsonObject>(
    await request(baseUrl, 'POST', '/evidences', {
      title: `Smoke SPR evidence ${unique}`,
      description: 'Smoke evidence linked to SPR record',
      evidenceType: 'supporting_document',
      capturedAt: new Date().toISOString(),
    }, 201),
    'create SPR evidence',
  );
  const evidenceId = ensureId(evidence, 'create SPR evidence');
  await request(baseUrl, 'POST', `/spr/monthly-records/${recordId}/evidences/${evidenceId}/link`, { relationType: 'sox_support' }, 201);
}

async function runSprFlow(baseUrl: string): Promise<void> {
  await request(baseUrl, 'GET', '/spr/groups');
  await request(baseUrl, 'GET', '/spr/measure-groups');
  await request(baseUrl, 'GET', '/spr/units');
  const parameters = asArray<SprParameterRow>(await request(baseUrl, 'GET', '/spr/parameters'), 'SPR parameters');
  await request(baseUrl, 'GET', '/spr/assignments');

  const parameter = parameters.find((row) => row.isSox || row.requiresEvidence) ?? parameters[0];
  const parameterId = parameter?.id;
  if (!parameterId) throw new Error('SPR parameter seed is missing');

  const uniqueSeed = parseInt(randomUUID().replaceAll('-', '').slice(0, 8), 16);
  const unique = Date.now();
  const periodYear = 2090 + (uniqueSeed % 11);
  const periodMonth = 1 + (Math.floor(uniqueSeed / 11) % 11);

  const recordId = await createSprRecord(baseUrl, parameterId, periodYear, periodMonth, 'Smoke SPR monthly record');

  await request(baseUrl, 'GET', `/spr/monthly-records?periodYear=${periodYear}&periodMonth=${periodMonth}`);
  await request(baseUrl, 'GET', `/spr/monthly-records/${recordId}`);
  await request(baseUrl, 'PATCH', `/spr/monthly-records/${recordId}`, {
    numericValue: 150.75,
    notes: 'Smoke SPR update',
  });

  if (parameter.isSox || parameter.requiresEvidence) {
    await request(baseUrl, 'POST', `/spr/monthly-records/${recordId}/submit`, { notes: 'Should fail without evidence' }, 400);
  }

  await createAndLinkSprEvidence(baseUrl, recordId, unique);
  await request(baseUrl, 'GET', `/spr/monthly-records/${recordId}/evidences`);
  await request(baseUrl, 'POST', `/spr/monthly-records/${recordId}/comments`, {
    body: 'Smoke SPR comment',
    isInternal: false,
  }, 201);
  await request(baseUrl, 'GET', `/spr/monthly-records/${recordId}/comments`);
  await request(baseUrl, 'POST', `/spr/monthly-records/${recordId}/submit`, {
    notes: 'Smoke SPR submitted',
    comments: 'Smoke pending approval',
  });
  await request(baseUrl, 'GET', `/spr/monthly-records/${recordId}/approvals`);
  await request(baseUrl, 'POST', `/spr/monthly-records/${recordId}/approve`, {
    comments: 'Smoke SPR approved',
  });
  await request(baseUrl, 'GET', `/spr/monthly-records/${recordId}/approvals`);

  const rejectedRecordId = await createSprRecord(baseUrl, parameterId, periodYear, periodMonth + 1, 'Smoke SPR rejected record');
  await createAndLinkSprEvidence(baseUrl, rejectedRecordId, unique + 1);
  await request(baseUrl, 'POST', `/spr/monthly-records/${rejectedRecordId}/submit`, { notes: 'Smoke submit before reject' });
  await request(baseUrl, 'POST', `/spr/monthly-records/${rejectedRecordId}/reject`, { comments: 'Smoke SPR rejected' });
}

async function main(): Promise<void> {
  const smokePassword = configureSmokeAuthEnv();
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.setGlobalPrefix('api');
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
  await ensureSecurityPermissionMatrix(dataSource);
  await ensureDemoUserCredentialHashes(dataSource, smokePassword);
  await app.listen(0);

  const address = app.getHttpServer().address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    await runAuthBoundaryChecks(baseUrl, smokePassword);
    await runInspectionFlow(baseUrl);
    await runIncidentFlow(baseUrl);
    await runSprFlow(baseUrl);
    console.log('api smoke tests passed');
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
