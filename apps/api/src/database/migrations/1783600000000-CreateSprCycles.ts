import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fase 1 — tabla spr_cycles + seed Mayo/Junio 2026 (status day9_elapsed).
 * No incluye envío SAC / firmas / validación (fases posteriores).
 */
export class CreateSprCycles1783600000000 implements MigrationInterface {
  name = 'CreateSprCycles1783600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "spr_cycle_status" AS ENUM (
        'en_curso',
        'day9_elapsed',
        'sac_preparing',
        'sac_available',
        'signing',
        'validating',
        'closed'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "spr_cycles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "period_year" integer NOT NULL,
        "period_month" integer NOT NULL,
        "label" varchar(80) NOT NULL,
        "status" spr_cycle_status NOT NULL DEFAULT 'en_curso',
        "day9_at" date NOT NULL,
        "closed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_spr_cycles" PRIMARY KEY ("id"),
        CONSTRAINT "uq_spr_cycles_period" UNIQUE ("period_year", "period_month"),
        CONSTRAINT "chk_spr_cycles_month" CHECK ("period_month" BETWEEN 1 AND 12),
        CONSTRAINT "chk_spr_cycles_year" CHECK ("period_year" BETWEEN 2000 AND 2100)
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_spr_cycles_status" ON "spr_cycles" ("status")`);

    await queryRunner.query(`
      INSERT INTO "spr_cycles" ("period_year", "period_month", "label", "status", "day9_at")
      VALUES
        (2026, 5, 'Mayo 2026', 'day9_elapsed', '2026-06-09'),
        (2026, 6, 'Junio 2026', 'day9_elapsed', '2026-07-09')
      ON CONFLICT ON CONSTRAINT "uq_spr_cycles_period" DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "spr_cycles"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "spr_cycle_status"`);
  }
}
