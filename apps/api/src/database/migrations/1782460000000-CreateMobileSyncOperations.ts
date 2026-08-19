import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMobileSyncOperations1782460000000 implements MigrationInterface {
  name = 'CreateMobileSyncOperations1782460000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mobile_sync_operations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "batch_id" character varying(120) NOT NULL,
        "local_id" character varying(160) NOT NULL,
        "idempotency_key" character varying(220) NOT NULL,
        "device_id" character varying(160) NOT NULL,
        "device_session_id" character varying(160) NOT NULL,
        "operation_type" character varying(80) NOT NULL,
        "entity_type" character varying(80) NOT NULL,
        "status" character varying(40) NOT NULL,
        "remote_id" character varying(160),
        "error_code" character varying(120),
        "error_message" text,
        "payload" jsonb,
        "synced_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mobile_sync_operations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_mobile_sync_operations_idempotency_key" UNIQUE ("idempotency_key")
      )
    `);
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_mobile_sync_operations_device_local" ON "mobile_sync_operations" ("device_id", "local_id")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_mobile_sync_operations_batch" ON "mobile_sync_operations" ("batch_id")');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_mobile_sync_operations_batch"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_mobile_sync_operations_device_local"');
    await queryRunner.query('DROP TABLE IF EXISTS "mobile_sync_operations"');
  }
}
