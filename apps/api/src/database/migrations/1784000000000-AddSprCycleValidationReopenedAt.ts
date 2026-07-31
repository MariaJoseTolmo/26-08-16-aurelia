import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fase 5.1 — timestamp de reapertura SOX para countdown "En corrección · N días"
 * en consolidado (Figma 1760:24680 / 1760:25200).
 */
export class AddSprCycleValidationReopenedAt1784000000000 implements MigrationInterface {
  name = 'AddSprCycleValidationReopenedAt1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "spr_cycle_validations"
      ADD COLUMN IF NOT EXISTS "reopened_at" timestamptz
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "spr_cycle_validations"
      DROP COLUMN IF EXISTS "reopened_at"
    `);
  }
}
