import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInspectionFindingHallazgoMetadata1782960000000 implements MigrationInterface {
  name = 'AddInspectionFindingHallazgoMetadata1782960000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "inspection_findings"
      ADD COLUMN IF NOT EXISTS "finding_type_id" uuid,
      ADD COLUMN IF NOT EXISTS "severity_id" uuid,
      ADD COLUMN IF NOT EXISTS "responsible_company_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "inspection_findings"
      ADD CONSTRAINT "fk_inspection_findings_type" FOREIGN KEY ("finding_type_id") REFERENCES "inspection_finding_types" ("id") ON DELETE SET NULL
    `).catch(() => undefined);
    await queryRunner.query(`
      ALTER TABLE "inspection_findings"
      ADD CONSTRAINT "fk_inspection_findings_severity_catalog" FOREIGN KEY ("severity_id") REFERENCES "inspection_finding_severities" ("id") ON DELETE SET NULL
    `).catch(() => undefined);
    await queryRunner.query(`
      ALTER TABLE "inspection_findings"
      ADD CONSTRAINT "fk_inspection_findings_responsible_company" FOREIGN KEY ("responsible_company_id") REFERENCES "companies" ("id") ON DELETE SET NULL
    `).catch(() => undefined);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inspection_finding_responsibles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "finding_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_inspection_finding_responsibles" PRIMARY KEY ("id"),
        CONSTRAINT "uq_inspection_finding_responsibles_finding_user" UNIQUE ("finding_id", "user_id"),
        CONSTRAINT "fk_ifr_finding" FOREIGN KEY ("finding_id") REFERENCES "inspection_findings" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_ifr_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_inspection_findings_type" ON "inspection_findings" ("finding_type_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_inspection_findings_severity_catalog" ON "inspection_findings" ("severity_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_inspection_findings_responsible_company" ON "inspection_findings" ("responsible_company_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_inspection_finding_responsibles_finding" ON "inspection_finding_responsibles" ("finding_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inspection_finding_responsibles_finding"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inspection_findings_responsible_company"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inspection_findings_severity_catalog"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inspection_findings_type"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inspection_finding_responsibles"`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" DROP COLUMN IF EXISTS "responsible_company_id"`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" DROP COLUMN IF EXISTS "severity_id"`);
    await queryRunner.query(`ALTER TABLE "inspection_findings" DROP COLUMN IF EXISTS "finding_type_id"`);
  }
}