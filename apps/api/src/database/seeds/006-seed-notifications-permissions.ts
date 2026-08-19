import 'reflect-metadata';
import { config } from 'dotenv';
import type { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';

config();

const notificationReaderRoles = [
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

export async function runNotificationsPermissionsSeed(ds: DataSource): Promise<void> {
  const qr = ds.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    await qr.query(
      `INSERT INTO permissions (code, name, module, action)
       VALUES
         ('notifications:read', 'Ver notificaciones', 'notifications', 'read'),
         ('notifications:write', 'Crear notificaciones', 'notifications', 'write')
       ON CONFLICT (code) DO NOTHING`,
    );

    await qr.query(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT r.id, p.id
       FROM roles r, permissions p
       WHERE r.code = 'ADMIN'
         AND p.code IN ('notifications:read', 'notifications:write')
       ON CONFLICT DO NOTHING`,
    );

    await qr.query(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT r.id, p.id
       FROM roles r, permissions p
       WHERE r.code = ANY($1::text[])
         AND r.is_active = true
         AND p.code = 'notifications:read'
       ON CONFLICT DO NOTHING`,
      [notificationReaderRoles],
    );

    await qr.commitTransaction();
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
    await runNotificationsPermissionsSeed(ds);
    console.log('Notification permissions seed applied.');
  } finally {
    await ds.destroy();
  }
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error('Notification permissions seed failed:', error);
    process.exit(1);
  });
}
