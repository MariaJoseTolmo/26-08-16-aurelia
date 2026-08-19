import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRateLimitBuckets1782490000000 implements MigrationInterface {
  name = 'CreateRateLimitBuckets1782490000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
        "key" varchar(300) NOT NULL,
        "count" integer NOT NULL DEFAULT 0,
        "reset_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_rate_limit_buckets" PRIMARY KEY ("key")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_rate_limit_buckets_reset_at" ON "rate_limit_buckets" ("reset_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_rate_limit_buckets_reset_at"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rate_limit_buckets"`);
  }
}
