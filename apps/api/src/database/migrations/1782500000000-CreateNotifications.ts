import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1782500000000 implements MigrationInterface {
  name = 'CreateNotifications1782500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" varchar(140) NOT NULL,
        "body" text NULL,
        "category" varchar(80) NOT NULL DEFAULT 'general',
        "entity_type" varchar(80) NULL,
        "entity_id" uuid NULL,
        "triggered_by_user_id" uuid NULL,
        "metadata" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_notifications" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_recipients" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "notification_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "read_at" timestamptz NULL,
        "dismissed_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_notification_recipients" PRIMARY KEY ("id"),
        CONSTRAINT "uq_notification_recipients_notification_user" UNIQUE ("notification_id", "user_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_notifications_category" ON "notifications" ("category")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_notifications_entity" ON "notifications" ("entity_type", "entity_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_notification_recipients_notification" ON "notification_recipients" ("notification_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_notification_recipients_user" ON "notification_recipients" ("user_id")`);
    await queryRunner.query(`
      ALTER TABLE "notification_recipients"
      ADD CONSTRAINT "fk_notification_recipients_notification"
      FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "notification_recipients"
      ADD CONSTRAINT "fk_notification_recipients_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notification_recipients" DROP CONSTRAINT IF EXISTS "fk_notification_recipients_user"`);
    await queryRunner.query(`ALTER TABLE "notification_recipients" DROP CONSTRAINT IF EXISTS "fk_notification_recipients_notification"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notification_recipients_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notification_recipients_notification"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_entity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_category"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_recipients"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
  }
}
