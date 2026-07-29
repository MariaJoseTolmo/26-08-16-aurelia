import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInspectionLegacyHistory1785120000000 implements MigrationInterface {
  name = 'CreateInspectionLegacyHistory1785120000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "inspection_legacy_imports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "inspection_id" uuid NOT NULL,
        "source_system" varchar(100) NOT NULL,
        "source_file_name" varchar(255) NOT NULL,
        "source_sheet" varchar(100) NOT NULL,
        "source_row" integer NOT NULL,
        "legacy_year" integer NOT NULL,
        "legacy_number" integer NOT NULL,
        "legacy_mode" varchar(30) NOT NULL,
        "legacy_inspector_name" varchar(255),
        "legacy_area_name" varchar(255),
        "legacy_company_name" varchar(255),
        "legacy_sector_name" text,
        "legacy_detail" text,
        "raw_payload" jsonb NOT NULL,
        "import_warnings" jsonb,
        "imported_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_inspection_legacy_imports" PRIMARY KEY ("id"),
        CONSTRAINT "uq_inspection_legacy_import_inspection" UNIQUE ("inspection_id"),
        CONSTRAINT "uq_inspection_legacy_source" UNIQUE ("source_system", "legacy_year", "legacy_number"),
        CONSTRAINT "chk_inspection_legacy_mode" CHECK ("legacy_mode" IN ('finding', 'checklist')),
        CONSTRAINT "chk_inspection_legacy_source_row" CHECK ("source_row" > 0),
        CONSTRAINT "chk_inspection_legacy_year_number" CHECK ("legacy_year" > 0 AND "legacy_number" > 0),
        CONSTRAINT "fk_ili_inspection" FOREIGN KEY ("inspection_id") REFERENCES "inspections" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "inspection_legacy_milestones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "legacy_import_id" uuid NOT NULL,
        "sequence_number" integer NOT NULL,
        "occurred_at" date NOT NULL,
        "closed_increment" integer NOT NULL DEFAULT 0,
        "pending_after" integer NOT NULL DEFAULT 0,
        "closed_percentage" numeric(5,2),
        "pending_percentage" numeric(5,2),
        "raw_payload" jsonb,
        CONSTRAINT "pk_inspection_legacy_milestones" PRIMARY KEY ("id"),
        CONSTRAINT "uq_inspection_legacy_milestone_sequence" UNIQUE ("legacy_import_id", "sequence_number"),
        CONSTRAINT "chk_inspection_legacy_milestone_sequence" CHECK ("sequence_number" BETWEEN 1 AND 3),
        CONSTRAINT "chk_inspection_legacy_milestone_counts" CHECK ("closed_increment" >= 0 AND "pending_after" >= 0),
        CONSTRAINT "chk_inspection_legacy_milestone_percentages" CHECK (
          ("closed_percentage" IS NULL OR "closed_percentage" BETWEEN 0 AND 100)
          AND ("pending_percentage" IS NULL OR "pending_percentage" BETWEEN 0 AND 100)
        ),
        CONSTRAINT "fk_ilm_legacy_import" FOREIGN KEY ("legacy_import_id") REFERENCES "inspection_legacy_imports" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_inspection_legacy_year_number" ON "inspection_legacy_imports" ("legacy_year", "legacy_number")`);
    await queryRunner.query(`CREATE INDEX "idx_inspection_legacy_mode" ON "inspection_legacy_imports" ("legacy_mode")`);
    await queryRunner.query(`CREATE INDEX "idx_inspection_legacy_inspector_name" ON "inspection_legacy_imports" (lower("legacy_inspector_name"))`);
    await queryRunner.query(`CREATE INDEX "idx_inspection_legacy_company_name" ON "inspection_legacy_imports" (lower("legacy_company_name"))`);
    await queryRunner.query(`CREATE INDEX "idx_inspection_legacy_area_name" ON "inspection_legacy_imports" (lower("legacy_area_name"))`);
    await queryRunner.query(`CREATE INDEX "idx_inspection_legacy_milestones_import" ON "inspection_legacy_milestones" ("legacy_import_id")`);
    await queryRunner.query(`CREATE INDEX "idx_inspection_legacy_milestones_occurred_at" ON "inspection_legacy_milestones" ("occurred_at")`);

    await queryRunner.query(`
      UPDATE "companies"
      SET "is_contractor" = false,
          "updated_at" = now()
      WHERE "id" = '3252bece-a2df-4471-a270-da9ca8decd9d'
        AND "code" = 'CORP'
        AND lower(trim("name")) = 'gold fields'
        AND "is_contractor" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "companies"
      SET "is_contractor" = true,
          "updated_at" = now()
      WHERE "id" = '3252bece-a2df-4471-a270-da9ca8decd9d'
        AND "code" = 'CORP'
        AND lower(trim("name")) = 'gold fields'
        AND "is_contractor" = false
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inspection_legacy_milestones_occurred_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inspection_legacy_milestones_import"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inspection_legacy_area_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inspection_legacy_company_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inspection_legacy_inspector_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inspection_legacy_mode"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inspection_legacy_year_number"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inspection_legacy_milestones"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inspection_legacy_imports"`);
  }
}
