import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserSessions1782480000000 implements MigrationInterface {
  name = 'CreateUserSessions1782480000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "session_key_hash" varchar(128) NOT NULL,
        "user_agent" text,
        "ip_address" varchar(64),
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        "rotated_at" timestamptz,
        "replaced_by_session_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_user_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "uq_user_sessions_key_hash" UNIQUE ("session_key_hash"),
        CONSTRAINT "fk_user_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_user_sessions_user" ON "user_sessions" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_user_sessions_expires_at" ON "user_sessions" ("expires_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_user_sessions_revoked_at" ON "user_sessions" ("revoked_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_sessions_revoked_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_sessions_expires_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_sessions_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_sessions"`);
  }
}
