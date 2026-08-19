import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedNotificationPermissions1782501000000 implements MigrationInterface {
  name = 'SeedNotificationPermissions1782501000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO permissions (code, name, module, action)
      VALUES
        ('notifications:read', 'Ver notificaciones', 'notifications', 'read'),
        ('notifications:write', 'Crear notificaciones', 'notifications', 'write')
      ON CONFLICT (code) DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.code = 'ADMIN'
        AND p.code IN ('notifications:read', 'notifications:write')
      ON CONFLICT DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.code IN ('SUPERVISOR', 'INSPECTOR', 'APPROVER', 'VIEWER')
        AND p.code = 'notifications:read'
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM role_permissions
      WHERE permission_id IN (
        SELECT id FROM permissions WHERE code IN ('notifications:read', 'notifications:write')
      )
    `);
    await queryRunner.query(`DELETE FROM permissions WHERE code IN ('notifications:read', 'notifications:write')`);
  }
}
