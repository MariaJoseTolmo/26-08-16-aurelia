import 'reflect-metadata';
import { config } from 'dotenv';
import type { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import masterData from '../../modules/inspection-legacy-import/config/inspection-master-data.json';

config();

type MasterArea = (typeof masterData.areas)[number];
type MasterSector = (typeof masterData.sectors)[number];
type MasterCompany = (typeof masterData.companies)[number];
type MasterUser = (typeof masterData.users)[number];

export async function runInspectionsMasterDataSeed(ds: DataSource): Promise<void> {
  const qr = ds.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    for (const area of masterData.areas as MasterArea[]) {
      await qr.query(
        `INSERT INTO areas (code, name, description, status)
         VALUES ($1, $2, $3, 'active')
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           status = 'active',
           updated_at = NOW()`,
        [area.code, area.name, area.description ?? null],
      );
    }

    for (const sector of masterData.sectors as MasterSector[]) {
      const result = await qr.query(
        `INSERT INTO sectors (area_id, code, name, description, status)
         SELECT a.id, $1, $2, $3, 'active'
         FROM areas a
         WHERE a.code = $4
         ON CONFLICT (code) DO UPDATE SET
           area_id = EXCLUDED.area_id,
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           status = 'active',
           updated_at = NOW()
         RETURNING id`,
        [
          sector.code,
          sector.name,
          'Sector operacional incorporado desde el registro real de inspecciones ambientales.',
          sector.areaCode,
        ],
      );
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error(`No existe el área ${sector.areaCode} requerida por el sector ${sector.code}`);
      }
    }

    for (const company of masterData.companies as MasterCompany[]) {
      await qr.query(
        `INSERT INTO companies (code, name, is_contractor, status)
         VALUES ($1, $2, $3, 'active')
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           is_contractor = EXCLUDED.is_contractor,
           status = 'active',
           updated_at = NOW()`,
        [company.code, company.name, company.isContractor],
      );
    }

    const inspectorRoles = await qr.query(
      `SELECT id FROM roles WHERE code = 'INSPECTOR' LIMIT 1`,
    ) as Array<{ id: string }>;
    if (inspectorRoles.length === 0) {
      throw new Error('El seed maestro de inspecciones requiere ejecutar primero el seed phase1 para crear el rol INSPECTOR');
    }

    for (const user of masterData.users as MasterUser[]) {
      await qr.query(
        `INSERT INTO users (
           email,
           first_name,
           last_name,
           position,
           company_id,
           is_active,
           failed_login_attempts,
           locked_until
         )
         SELECT $1, $2, $3, $4, c.id, true, 0, NULL
         FROM companies c
         WHERE c.code = $5
         ON CONFLICT (email) DO UPDATE SET
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           position = EXCLUDED.position,
           company_id = EXCLUDED.company_id,
           is_active = true,
           updated_at = NOW()`,
        [user.email, user.firstName, user.lastName, user.position, user.companyCode],
      );

      await qr.query(
        `INSERT INTO user_companies (user_id, company_id)
         SELECT u.id, c.id
         FROM users u
         JOIN companies c ON c.code = $2
         WHERE u.email = $1
         ON CONFLICT DO NOTHING`,
        [user.email, user.companyCode],
      );

      await qr.query(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT u.id, r.id
         FROM users u
         JOIN roles r ON r.code = $2
         WHERE u.email = $1
         ON CONFLICT DO NOTHING`,
        [user.email, user.roleCode],
      );
    }

    await qr.commitTransaction();
    console.log('Inspection master data seed completed successfully.');
    console.log(`  → ${masterData.areas.length} áreas activas`);
    console.log(`  → ${masterData.sectors.length} sectores activos por área`);
    console.log(`  → ${masterData.companies.length} empresas activas`);
    console.log(`  → ${masterData.users.length} inspectores vinculados a Gold Fields`);
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
    await runInspectionsMasterDataSeed(ds);
  } finally {
    await ds.destroy();
  }
}

if (require.main === module) {
  void main().catch((error) => {
    console.error('Inspection master data seed failed:', error);
    process.exit(1);
  });
}
