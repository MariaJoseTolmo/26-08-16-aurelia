import 'reflect-metadata';
import { pbkdf2, randomBytes } from 'crypto';
import { config } from 'dotenv';
import { promisify } from 'util';
import type { DataSource, QueryRunner } from 'typeorm';
import { AppDataSource } from '../data-source';

config();

const deriveKey = promisify(pbkdf2);
const FORMAT = 'pbkdf2_sha256';
const ITERATIONS = 210000;
const KEY_LENGTH = 32;
const TEST_EECC_COMPANY_CODE = 'EECC-TEST';
const TEST_EECC_COMPANY_NAME = 'EECC Testing';
const DEMO_PASSWORD = 'AureliaDemo123!';

async function createPasswordHash(secret: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await deriveKey(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  return `${FORMAT}$${ITERATIONS}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

async function assignRoles(queryRunner: QueryRunner, email: string, roleCodes: readonly string[]): Promise<void> {
  await queryRunner.query(
    `INSERT INTO user_roles (user_id, role_id)
     SELECT u.id, r.id
     FROM users u
     INNER JOIN roles r ON r.code = ANY($2::text[]) AND r.is_active = true
     WHERE u.email = $1
     ON CONFLICT DO NOTHING`,
    [email, roleCodes],
  );
}

async function upsertUserCompany(queryRunner: QueryRunner, email: string, companyCode: string): Promise<void> {
  await queryRunner.query(
    `INSERT INTO user_companies (user_id, company_id)
     SELECT u.id, c.id
     FROM users u, companies c
     WHERE u.email = $1 AND c.code = $2
     ON CONFLICT DO NOTHING`,
    [email, companyCode],
  );
}

async function upsertPrimaryCompany(queryRunner: QueryRunner, email: string, companyCode: string): Promise<void> {
  await queryRunner.query(
    `UPDATE users u
     SET company_id = c.id
     FROM companies c
     WHERE u.email = $1 AND c.code = $2`,
    [email, companyCode],
  );
}

async function upsertUserArea(queryRunner: QueryRunner, email: string, areaCode: string | null): Promise<void> {
  if (!areaCode) return;
  await queryRunner.query(
    `UPDATE users u
     SET area_id = a.id
     FROM areas a
     WHERE u.email = $1 AND a.code = $2`,
    [email, areaCode],
  );
}

type DemoProfile = {
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  companyCode: string;
  areaCode: string | null;
  roleCodes: readonly string[];
};

const demoProfiles: DemoProfile[] = [
  {
    email: 'inspector.goldfields@aurelia.local',
    firstName: 'Inspector',
    lastName: 'Gold Fields',
    position: 'Inspector Gold Fields',
    companyCode: 'CORP',
    areaCode: 'AREA-MAMBIENTE',
    roleCodes: ['INSPECTOR', 'INSPECTION_CLOSURE_VERIFIER', 'SPR_RESPONSIBLE', 'INCIDENT_GENERATOR', 'CONTROL_VERIFIER'],
  },
  {
    email: 'inspector.eecc@aurelia.local',
    firstName: 'Inspector',
    lastName: 'EECC',
    position: 'Inspector Contratista',
    companyCode: TEST_EECC_COMPANY_CODE,
    areaCode: null,
    roleCodes: ['INSPECTOR', 'INSPECTION_RESPONSIBLE', 'SPR_RESPONSIBLE', 'INCIDENT_GENERATOR', 'CONTROL_VERIFIER'],
  },
  {
    email: 'supervisor@aurelia.local',
    firstName: 'Supervisor',
    lastName: 'EECC',
    position: 'Supervisor Contratista',
    companyCode: TEST_EECC_COMPANY_CODE,
    areaCode: null,
    roleCodes: ['SUPERVISOR', 'INSPECTION_RESPONSIBLE', 'SPR_RESPONSIBLE', 'INCIDENT_GENERATOR', 'CONTROL_OWNER'],
  },
];

export async function runDemoInspectionProfilesSeed(ds: DataSource): Promise<void> {
  const demoPasswordHash = await createPasswordHash(DEMO_PASSWORD);
  const qr = ds.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    await qr.query(
      `INSERT INTO companies (code, name, is_contractor, status)
       VALUES ($1, $2, true, 'active')
       ON CONFLICT (code) DO UPDATE SET
         name = EXCLUDED.name,
         is_contractor = EXCLUDED.is_contractor,
         status = 'active',
         updated_at = NOW()`,
      [TEST_EECC_COMPANY_CODE, TEST_EECC_COMPANY_NAME],
    );

    for (const profile of demoProfiles) {
      await qr.query(
        `INSERT INTO users (email, first_name, last_name, position, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (email) DO UPDATE SET
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           position = EXCLUDED.position,
           is_active = true,
           updated_at = NOW()`,
        [profile.email, profile.firstName, profile.lastName, profile.position],
      );

      await qr.query(
        `UPDATE users
         SET password_hash = $2,
             password_changed_at = NOW(),
             failed_login_attempts = 0,
             locked_until = NULL
         WHERE email = $1`,
        [profile.email, demoPasswordHash],
      );

      await upsertUserArea(qr, profile.email, profile.areaCode);
      await upsertPrimaryCompany(qr, profile.email, profile.companyCode);
      await assignRoles(qr, profile.email, profile.roleCodes);
      await upsertUserCompany(qr, profile.email, profile.companyCode);
    }

    await qr.commitTransaction();
    console.log('Demo inspection profiles seed completed successfully.');
    console.log(`  → ${demoProfiles.length} usuarios demo creados/actualizados`);
  } catch (error) {
    await qr.rollbackTransaction();
    throw error;
  } finally {
    await qr.release();
  }
}

async function main(): Promise<void> {
  const ds = await AppDataSource.initialize();
  try {
    await runDemoInspectionProfilesSeed(ds);
  } finally {
    await ds.destroy();
  }
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error('Demo inspection profiles seed failed:', error);
    process.exit(1);
  });
}
