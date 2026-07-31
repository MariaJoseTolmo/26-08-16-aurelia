import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fase 5 — spr_cycle_validations + status ciclo validation_approved.
 * Sin seed de filas: Mayo/Junio → GET [].
 * Solo áreas SOX (enforced en servicio): AREA-STECNICOS, AREA-OPTACTIVOS.
 * Ambas approved → ciclo validation_approved (no closed).
 */
export class CreateSprCycleValidations1783900000000 implements MigrationInterface {
  name = 'CreateSprCycleValidations1783900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "spr_cycle_status" ADD VALUE IF NOT EXISTS 'validation_approved'
    `);

    await queryRunner.query(`
      CREATE TYPE "spr_cycle_validation_status" AS ENUM (
        'approved',
        'discrepancy_reported',
        'reopened'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "spr_cycle_validations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "cycle_id" uuid NOT NULL,
        "area_id" uuid NOT NULL,
        "status" spr_cycle_validation_status NOT NULL,
        "actor_user_id" uuid,
        "comments" text,
        "decided_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_spr_cycle_validations" PRIMARY KEY ("id"),
        CONSTRAINT "uq_spr_cycle_validations_cycle_area" UNIQUE ("cycle_id", "area_id"),
        CONSTRAINT "fk_spr_validations_cycle" FOREIGN KEY ("cycle_id") REFERENCES "spr_cycles"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_spr_validations_area" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_spr_validations_actor" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_spr_validations_cycle" ON "spr_cycle_validations" ("cycle_id")`);
    await queryRunner.query(`CREATE INDEX "idx_spr_validations_status" ON "spr_cycle_validations" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_spr_validations_area" ON "spr_cycle_validations" ("area_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "spr_cycle_validations"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "spr_cycle_validation_status"`);
    // PG no permite quitar un valor de enum de forma portable; se deja validation_approved.
  }
}
