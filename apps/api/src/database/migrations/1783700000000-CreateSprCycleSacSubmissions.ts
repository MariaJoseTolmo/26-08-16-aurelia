import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fase 2 — tabla spr_cycle_sac_submissions.
 * Sin seed de filas: Mayo/Junio quedan sin submission (GET → 404),
 * alineado a spr_cycles.status = day9_elapsed (no fingir report_ready).
 */
export class CreateSprCycleSacSubmissions1783700000000 implements MigrationInterface {
  name = 'CreateSprCycleSacSubmissions1783700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "spr_cycle_sac_submission_status" AS ENUM (
        'pending',
        'preparing',
        'sent',
        'report_ready',
        'failed'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "spr_cycle_sac_submissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "cycle_id" uuid NOT NULL,
        "status" spr_cycle_sac_submission_status NOT NULL DEFAULT 'pending',
        "sent_at" timestamptz,
        "report_ready_at" timestamptz,
        "external_ref" varchar(120),
        "payload_snapshot" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_spr_cycle_sac_submissions" PRIMARY KEY ("id"),
        CONSTRAINT "uq_spr_cycle_sac_submissions_cycle" UNIQUE ("cycle_id"),
        CONSTRAINT "fk_spr_sac_cycle" FOREIGN KEY ("cycle_id") REFERENCES "spr_cycles"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_spr_sac_cycle" ON "spr_cycle_sac_submissions" ("cycle_id")`);
    await queryRunner.query(`CREATE INDEX "idx_spr_sac_status" ON "spr_cycle_sac_submissions" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "spr_cycle_sac_submissions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "spr_cycle_sac_submission_status"`);
  }
}
