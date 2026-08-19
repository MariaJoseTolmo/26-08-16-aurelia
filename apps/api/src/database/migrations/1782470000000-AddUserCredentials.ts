import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserCredentials1782470000000 implements MigrationInterface {
  name = 'AddUserCredentials1782470000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" varchar(255)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_changed_at" timestamptz`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failed_login_attempts" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locked_until" timestamptz`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_users_locked_until" ON "users" ("locked_until")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_locked_until"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "locked_until"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "failed_login_attempts"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "password_changed_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "password_hash"`);
  }
}
