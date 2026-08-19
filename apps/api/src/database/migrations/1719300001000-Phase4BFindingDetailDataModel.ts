import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase4BFindingDetailDataModel1719300001000 implements MigrationInterface {
  name = 'Phase4BFindingDetailDataModel1719300001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "inspection_finding_status" ADD VALUE IF NOT EXISTS 'rejected'`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" ADD COLUMN IF NOT EXISTS "detected_condition" text`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" ADD COLUMN IF NOT EXISTS "proposed_corrective_action" text`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" ADD COLUMN IF NOT EXISTS "executed_action_description" text`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" ADD COLUMN IF NOT EXISTS "rejection_reason" text`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" ADD COLUMN IF NOT EXISTS "executed_at" timestamptz`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" ADD COLUMN IF NOT EXISTS "executed_by_user_id" uuid`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" ADD COLUMN IF NOT EXISTS "rejected_at" timestamptz`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" ADD COLUMN IF NOT EXISTS "rejected_by_user_id" uuid`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_if_executed_by') THEN
          ALTER TABLE "inspection_findings" ADD CONSTRAINT "fk_if_executed_by" FOREIGN KEY ("executed_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_if_rejected_by') THEN
          ALTER TABLE "inspection_findings" ADD CONSTRAINT "fk_if_rejected_by" FOREIGN KEY ("rejected_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inspection_findings" DROP CONSTRAINT IF EXISTS "fk_if_rejected_by"`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" DROP CONSTRAINT IF EXISTS "fk_if_executed_by"`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" DROP COLUMN IF EXISTS "rejected_by_user_id"`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" DROP COLUMN IF EXISTS "rejected_at"`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" DROP COLUMN IF EXISTS "executed_by_user_id"`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" DROP COLUMN IF EXISTS "executed_at"`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" DROP COLUMN IF EXISTS "rejection_reason"`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" DROP COLUMN IF EXISTS "executed_action_description"`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" DROP COLUMN IF EXISTS "proposed_corrective_action"`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" DROP COLUMN IF EXISTS "detected_condition"`);
    await queryRunner.query(`UPDATE "inspection_findings" SET "status" = 'open' WHERE "status"::text = 'rejected'`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(`ALTER TYPE "inspection_finding_status" RENAME TO "inspection_finding_status_old"`);
    await queryRunner.query(`CREATE TYPE "inspection_finding_status" AS ENUM ('open', 'in_progress', 'closed', 'cancelled')`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" ALTER COLUMN "status" TYPE "inspection_finding_status" USING "status"::text::"inspection_finding_status"`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" ALTER COLUMN "status" SET DEFAULT 'open'`);
    await queryRunner.query(`DROP TYPE "inspection_finding_status_old"`);
  }
}
