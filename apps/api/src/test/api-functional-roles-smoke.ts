import 'reflect-metadata';
import { AppDataSource } from '../database/data-source';

const expectedActiveRoles = [
  'ADMIN',
  'VIEWER',
  'INSPECTOR',
  'INSPECTION_RESPONSIBLE',
  'INSPECTION_CLOSURE_VERIFIER',
  'SPR_RESPONSIBLE',
  'SPR_AREA_MANAGER',
  'SPR_SUSTAINABILITY_SPECIALIST',
  'SPR_ENVIRONMENT_MANAGER',
  'INCIDENT_GENERATOR',
  'INCIDENT_ENV_VALIDATOR',
  'INCIDENT_ENV_COORDINATOR',
  'INCIDENT_SUPERINTENDENT',
  'INCIDENT_ICAM_LEAD',
  'CONTROL_VERIFIER',
  'CONTROL_OWNER',
  'CONTROL_SUPERINTENDENT',
  'CONTROL_MANAGER',
  'CONTROL_CORPORATE_APPROVER',
] as const;

const expectedInspectionCapabilities: Record<string, string[]> = {
  VIEWER: ['inspections:read'],
  INSPECTOR: ['inspections:read', 'inspections:create', 'inspections:execute'],
  INSPECTION_RESPONSIBLE: ['inspections:read', 'inspections:execute'],
  INSPECTION_CLOSURE_VERIFIER: ['inspections:read', 'inspections:review', 'inspections:reassign'],
};

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const dataSource = await AppDataSource.initialize();

  try {
    const activeRows = await dataSource.query(
      `SELECT code FROM roles WHERE is_active = true ORDER BY code`,
    ) as Array<{ code: string }>;
    const activeCodes = new Set(activeRows.map((row) => row.code));

    for (const code of expectedActiveRoles) {
      assert(activeCodes.has(code), `Active role ${code} is missing`);
    }

    const legacyRows = await dataSource.query(
      `SELECT code, is_active FROM roles WHERE code IN ('SUPERVISOR', 'APPROVER') ORDER BY code`,
    ) as Array<{ code: string; is_active: boolean }>;
    assert(legacyRows.length === 2, 'Legacy roles were not preserved for compatibility');
    assert(legacyRows.every((row) => row.is_active === false), 'Legacy roles must be inactive');

    const legacyAssignments = await dataSource.query(
      `SELECT COUNT(*)::int AS count
       FROM user_roles ur
       INNER JOIN roles r ON r.id = ur.role_id
       WHERE r.code IN ('SUPERVISOR', 'APPROVER')`,
    ) as Array<{ count: number }>;
    assert((legacyAssignments[0]?.count ?? 0) === 0, 'Legacy user role assignments still exist');

    const usersWithoutRole = await dataSource.query(
      `SELECT u.email
       FROM users u
       WHERE u.is_active = true
         AND NOT EXISTS (
           SELECT 1
           FROM user_roles ur
           INNER JOIN roles r ON r.id = ur.role_id
           WHERE ur.user_id = u.id
             AND r.is_active = true
         )`,
    ) as Array<{ email: string }>;
    assert(usersWithoutRole.length === 0, `Active users without active roles: ${usersWithoutRole.map((row) => row.email).join(', ')}`);

    const invalidClosureVerifiers = await dataSource.query(
      `SELECT DISTINCT u.email
       FROM users u
       INNER JOIN user_roles ur ON ur.user_id = u.id
       INNER JOIN roles r ON r.id = ur.role_id
       WHERE r.code = 'INSPECTION_CLOSURE_VERIFIER'
         AND NOT (
           lower(u.email) LIKE '%@goldfields.com'
           OR EXISTS (
             SELECT 1 FROM companies c
             WHERE c.id = u.company_id
               AND (c.code = 'CORP' OR c.is_contractor = false OR lower(c.name) LIKE '%gold field%')
           )
           OR EXISTS (
             SELECT 1
             FROM user_companies uc
             INNER JOIN companies c ON c.id = uc.company_id
             WHERE uc.user_id = u.id
               AND (c.code = 'CORP' OR c.is_contractor = false OR lower(c.name) LIKE '%gold field%')
           )
         )`,
    ) as Array<{ email: string }>;
    assert(invalidClosureVerifiers.length === 0, `Non-principal closure verifiers: ${invalidClosureVerifiers.map((row) => row.email).join(', ')}`);

    const rows = await dataSource.query(
      `SELECT r.code AS role_code, p.code AS permission_code
       FROM role_permissions rp
       INNER JOIN roles r ON r.id = rp.role_id
       INNER JOIN permissions p ON p.id = rp.permission_id
       WHERE p.module = 'inspections'
       ORDER BY r.code, p.code`,
    ) as Array<{ role_code: string; permission_code: string }>;
    const permissionsByRole = new Map<string, Set<string>>();
    rows.forEach((row) => {
      const current = permissionsByRole.get(row.role_code) ?? new Set<string>();
      current.add(row.permission_code);
      permissionsByRole.set(row.role_code, current);
    });

    Object.entries(expectedInspectionCapabilities).forEach(([role, expected]) => {
      const actual = permissionsByRole.get(role) ?? new Set<string>();
      expected.forEach((permission) => {
        assert(actual.has(permission), `${role} is missing ${permission}`);
      });
    });

    const inspectorPermissions = permissionsByRole.get('INSPECTOR') ?? new Set<string>();
    assert(!inspectorPermissions.has('inspections:review'), 'Inspector must not review findings');
    assert(!inspectorPermissions.has('inspections:reassign'), 'Inspector must not reassign findings');
    assert(!inspectorPermissions.has('inspections:admin'), 'Inspector must not administer inspections');

    const responsiblePermissions = permissionsByRole.get('INSPECTION_RESPONSIBLE') ?? new Set<string>();
    assert(!responsiblePermissions.has('inspections:create'), 'Inspection responsible must not create inspections');
    assert(!responsiblePermissions.has('inspections:review'), 'Inspection responsible must not review findings');
    assert(!responsiblePermissions.has('inspections:reassign'), 'Inspection responsible must not reassign findings');

    const verifierPermissions = permissionsByRole.get('INSPECTION_CLOSURE_VERIFIER') ?? new Set<string>();
    assert(!verifierPermissions.has('inspections:execute'), 'Closure verifier must not execute contractor actions');
    assert(!verifierPermissions.has('inspections:admin'), 'Closure verifier must not administer inspections');

    const adminPermissions = permissionsByRole.get('ADMIN') ?? new Set<string>();
    ['inspections:read', 'inspections:create', 'inspections:execute', 'inspections:review', 'inspections:reassign', 'inspections:admin']
      .forEach((permission) => assert(adminPermissions.has(permission), `ADMIN is missing ${permission}`));

    console.log('Functional roles smoke test passed.');
  } finally {
    await dataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error('Functional roles smoke test failed:', error);
  process.exit(1);
});
