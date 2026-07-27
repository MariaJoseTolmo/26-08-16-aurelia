import 'reflect-metadata';
import { pbkdf2, randomBytes } from 'crypto';
import { config } from 'dotenv';
import { promisify } from 'util';
import { DataSource, QueryRunner } from 'typeorm';
import { readApiEnv } from '../../config/env';
import { AppDataSource } from '../data-source';

config();

const deriveKey = promisify(pbkdf2);
const FORMAT = 'pbkdf2_sha256';
const ITERATIONS = 210000;
const KEY_LENGTH = 32;

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

export async function runDemoSeed(ds: DataSource): Promise<void> {
  const demoPassword = readApiEnv().auth.demoUserPassword;
  const demoPasswordHash = await createPasswordHash(demoPassword);
  const qr = ds.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    await qr.query(
      `INSERT INTO gerencias (code, name, status)
       VALUES ('GER-OPS', 'Gerencia de Operaciones', 'active')
       ON CONFLICT (code) DO NOTHING`,
    );

    const areas = [
      { code: 'AREA-MINA', name: 'Mina' },
      { code: 'AREA-PLANTA', name: 'Planta Procesos' },
      { code: 'AREA-EXPLORACION', name: 'Exploraciones' },
      { code: 'AREA-MANTENCION', name: 'Mantención' },
      { code: 'AREA-SERVICIOS', name: 'Servicios Generales' },
      { code: 'AREA-STECNICOS', name: 'Servicios Técnicos' },
      { code: 'AREA-SUSTAINING', name: 'Sustaining' },
      { code: 'AREA-MAMBIENTE', name: 'Medio Ambiente' },
    ];

    for (const area of areas) {
      await qr.query(
        `INSERT INTO areas (code, name, status)
         VALUES ($1, $2, 'active')
         ON CONFLICT (code) DO NOTHING`,
        [area.code, area.name],
      );
    }

    const sectors: { areaCode: string; code: string; name: string }[] = [
      { areaCode: 'AREA-MINA', code: 'SECT-MN-NORTE', name: 'Sector Norte' },
      { areaCode: 'AREA-MINA', code: 'SECT-MN-PLAT2', name: 'Plataforma 2' },
      { areaCode: 'AREA-MINA', code: 'SECT-MN-SUR', name: 'Sector Sur' },
      { areaCode: 'AREA-MINA', code: 'SECT-MN-ACCESO', name: 'Acceso principal' },
      { areaCode: 'AREA-PLANTA', code: 'SECT-PL-MODC', name: 'Módulo C' },
      { areaCode: 'AREA-PLANTA', code: 'SECT-PL-MODA', name: 'Módulo A' },
      { areaCode: 'AREA-PLANTA', code: 'SECT-PL-LIX', name: 'Lixiviación' },
      { areaCode: 'AREA-PLANTA', code: 'SECT-PL-PTAS', name: 'PTAS' },
      { areaCode: 'AREA-EXPLORACION', code: 'SECT-EXP-NORTE', name: 'Campaña Norte' },
      { areaCode: 'AREA-EXPLORACION', code: 'SECT-EXP-ESTE', name: 'Campaña Este' },
      { areaCode: 'AREA-MANTENCION', code: 'SECT-MNT-TALL', name: 'Talleres' },
      { areaCode: 'AREA-MANTENCION', code: 'SECT-MNT-BODEGA', name: 'Bodega repuestos' },
      { areaCode: 'AREA-SERVICIOS', code: 'SECT-SRV-CAMP', name: 'Campamento Antiguo' },
      { areaCode: 'AREA-SERVICIOS', code: 'SECT-SRV-COMED', name: 'Comedor' },
      { areaCode: 'AREA-SERVICIOS', code: 'SECT-SRV-ACCESO', name: 'Acceso faena' },
      { areaCode: 'AREA-SUSTAINING', code: 'SECT-SUS-SECTOR', name: 'Sector Sustaining' },
      { areaCode: 'AREA-MAMBIENTE', code: 'SECT-MA-PTAS', name: 'PTAS' },
      { areaCode: 'AREA-MAMBIENTE', code: 'SECT-MA-RELAVES', name: 'Depósito relaves' },
    ];

    for (const sector of sectors) {
      await qr.query(
        `INSERT INTO sectors (area_id, code, name, status)
         SELECT a.id, $1, $2, 'active'
         FROM areas a WHERE a.code = $3
         ON CONFLICT (code) DO NOTHING`,
        [sector.code, sector.name, sector.areaCode],
      );
    }

    const eecc = [
      { code: 'SOMACOR', name: 'SOMACOR' },
      { code: 'STRACON', name: 'STRACON' },
      { code: 'GARDECORPS', name: 'GARDE CORPS' },
      { code: 'AGGREKO', name: 'AGGREKO' },
      { code: 'RESITER', name: 'RESITER' },
      { code: 'ATLASCOPCO', name: 'ATLAS COPCO' },
      { code: 'NEWREST', name: 'NEWREST' },
      { code: 'ENAEX', name: 'ENAEX' },
    ];

    for (const company of eecc) {
      await qr.query(
        `INSERT INTO companies (code, name, is_contractor, status)
         VALUES ($1, $2, true, 'active')
         ON CONFLICT (code) DO NOTHING`,
        [company.code, company.name],
      );
    }

    const gfUsers: {
      email: string;
      first: string;
      last: string;
      pos: string;
      areaCode: string | null;
      roles: readonly string[];
    }[] = [
      {
        email: 'karen.opazo@goldfields.com', first: 'Karen', last: 'Opazo', pos: 'Inspector Medio Ambiente',
        areaCode: 'AREA-MAMBIENTE',
        roles: ['INSPECTOR', 'INSPECTION_CLOSURE_VERIFIER', 'SPR_RESPONSIBLE', 'INCIDENT_GENERATOR', 'CONTROL_VERIFIER'],
      },
      {
        email: 'pedro.silva@goldfields.com', first: 'Pedro', last: 'Silva', pos: 'Supervisor Medio Ambiente',
        areaCode: 'AREA-STECNICOS',
        roles: ['INSPECTOR', 'INSPECTION_CLOSURE_VERIFIER', 'SPR_AREA_MANAGER', 'INCIDENT_SUPERINTENDENT', 'CONTROL_SUPERINTENDENT'],
      },
      {
        email: 'laura.mendez@goldfields.com',
        first: 'Laura',
        last: 'Méndez',
        pos: 'Responsable SPR Servicios Técnicos',
        areaCode: 'AREA-STECNICOS',
        roles: ['SPR_RESPONSIBLE'],
      },
      {
        email: 'carlos.aguirre@goldfields.com', first: 'Carlos', last: 'Aguirre', pos: 'Administrador Sistema',
        areaCode: null,
        roles: ['ADMIN'],
      },
    ];

    for (const user of gfUsers) {
      await qr.query(
        `INSERT INTO users (email, first_name, last_name, position, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (email) DO NOTHING`,
        [user.email, user.first, user.last, user.pos],
      );
      await qr.query(
        `UPDATE users
         SET password_hash = $2,
             password_changed_at = NOW(),
             failed_login_attempts = 0,
             locked_until = NULL
         WHERE email = $1`,
        [user.email, demoPasswordHash],
      );
      if (user.areaCode) {
        await qr.query(
          `UPDATE users u
           SET area_id = a.id
           FROM areas a
           WHERE u.email = $1 AND a.code = $2`,
          [user.email, user.areaCode],
        );
      }
      await assignRoles(qr, user.email, user.roles);
      await qr.query(
        `INSERT INTO user_companies (user_id, company_id)
         SELECT u.id, c.id FROM users u, companies c
         WHERE u.email = $1 AND c.code = 'CORP'
         ON CONFLICT DO NOTHING`,
        [user.email],
      );
    }

    type DemoEeccUser = {
      email: string;
      first: string;
      last: string;
      position: string;
      companyCode: string;
      roles: readonly string[];
    };

    const responsibleRoles = ['INSPECTOR', 'INSPECTION_RESPONSIBLE', 'SPR_RESPONSIBLE', 'INCIDENT_GENERATOR', 'CONTROL_VERIFIER'];
    const supervisorRoles = ['INSPECTOR', 'INSPECTION_RESPONSIBLE', 'SPR_RESPONSIBLE', 'INCIDENT_GENERATOR', 'CONTROL_OWNER'];
    const eeccUsers: DemoEeccUser[] = [
      { email: 'miguel.pizarro@somacor.com', first: 'Miguel', last: 'Pizarro', position: 'Supervisor Mina', companyCode: 'SOMACOR', roles: supervisorRoles },
      { email: 'roberto.gonzalez@somacor.com', first: 'Roberto', last: 'González', position: 'Técnico Mina', companyCode: 'SOMACOR', roles: responsibleRoles },
      { email: 'carlos.lopez@somacor.com', first: 'Carlos', last: 'López', position: 'Operador', companyCode: 'SOMACOR', roles: responsibleRoles },
      { email: 'patricia.soto@somacor.com', first: 'Patricia', last: 'Soto', position: 'Técnico HSE', companyCode: 'SOMACOR', roles: responsibleRoles },
      { email: 'jorge.rojas@stracon.com', first: 'Jorge', last: 'Rojas', position: 'Supervisor', companyCode: 'STRACON', roles: supervisorRoles },
      { email: 'ana.morales@stracon.com', first: 'Ana', last: 'Morales', position: 'Técnico', companyCode: 'STRACON', roles: responsibleRoles },
      { email: 'rodrigo.mendez@gardecorps.com', first: 'Rodrigo', last: 'Méndez', position: 'Supervisor', companyCode: 'GARDECORPS', roles: supervisorRoles },
      { email: 'luis.vargas@gardecorps.com', first: 'Luis', last: 'Vargas', position: 'Operador', companyCode: 'GARDECORPS', roles: responsibleRoles },
      { email: 'carlos.rojas@aggreko.com', first: 'Carlos', last: 'Rojas', position: 'Técnico', companyCode: 'AGGREKO', roles: responsibleRoles },
      { email: 'maria.fuentes@aggreko.com', first: 'María', last: 'Fuentes', position: 'HSE', companyCode: 'AGGREKO', roles: responsibleRoles },
      { email: 'diego.perez@resiter.com', first: 'Diego', last: 'Pérez', position: 'Supervisor', companyCode: 'RESITER', roles: supervisorRoles },
      { email: 'veronica.luna@resiter.com', first: 'Verónica', last: 'Luna', position: 'Operadora', companyCode: 'RESITER', roles: responsibleRoles },
    ];

    for (const user of eeccUsers) {
      await qr.query(
        `INSERT INTO users (email, first_name, last_name, position, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (email) DO NOTHING`,
        [user.email, user.first, user.last, user.position],
      );
      await qr.query(
        `UPDATE users
         SET password_hash = $2,
             password_changed_at = NOW(),
             failed_login_attempts = 0,
             locked_until = NULL
         WHERE email = $1`,
        [user.email, demoPasswordHash],
      );
      await assignRoles(qr, user.email, user.roles);
      await qr.query(
        `INSERT INTO user_companies (user_id, company_id)
         SELECT u.id, c.id FROM users u, companies c
         WHERE u.email = $1 AND c.code = $2
         ON CONFLICT DO NOTHING`,
        [user.email, user.companyCode],
      );
    }

    await qr.commitTransaction();
    console.log('Demo seed completed successfully.');
    console.log('  → 8 áreas, 18 sectores');
    console.log('  → 8 empresas contratistas (EECC)');
    console.log('  → 16 usuarios demo con roles funcionales');
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
    await runDemoSeed(ds);
  } finally {
    await ds.destroy();
  }
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error('Demo seed failed:', error);
    process.exit(1);
  });
}
