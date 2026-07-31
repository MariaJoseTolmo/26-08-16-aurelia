import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fase 3 — tabla spr_cycle_signatures.
 * Sin seed de filas: Mayo/Junio quedan sin firmas (GET → []).
 * Orden de negocio: specialist → environment_manager; ciclo → signing / validating.
 */
export class CreateSprCycleSignatures1783800000000 implements MigrationInterface {
  name = 'CreateSprCycleSignatures1783800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "spr_cycle_signature_status" AS ENUM (
        'pending',
        'signed',
        'revoked'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "spr_cycle_signature_level" AS ENUM (
        'specialist',
        'environment_manager'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "spr_cycle_signatures" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "cycle_id" uuid NOT NULL,
        "level" spr_cycle_signature_level NOT NULL,
        "status" spr_cycle_signature_status NOT NULL DEFAULT 'signed',
        "signer_user_id" uuid,
        "signed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_spr_cycle_signatures" PRIMARY KEY ("id"),
        CONSTRAINT "uq_spr_cycle_signatures_cycle_level" UNIQUE ("cycle_id", "level"),
        CONSTRAINT "fk_spr_signatures_cycle" FOREIGN KEY ("cycle_id") REFERENCES "spr_cycles"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_spr_signatures_signer" FOREIGN KEY ("signer_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_spr_signatures_cycle" ON "spr_cycle_signatures" ("cycle_id")`);
    await queryRunner.query(`CREATE INDEX "idx_spr_signatures_status" ON "spr_cycle_signatures" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "spr_cycle_signatures"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "spr_cycle_signature_level"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "spr_cycle_signature_status"`);
  }
}
