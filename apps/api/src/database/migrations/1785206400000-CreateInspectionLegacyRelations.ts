import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInspectionLegacyRelations1785206400000 implements MigrationInterface {
  name = 'CreateInspectionLegacyRelations1785206400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "inspection_legacy_participants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "legacy_import_id" uuid NOT NULL,
        "user_id" uuid,
        "source_name" varchar(255) NOT NULL,
        "sequence_number" integer NOT NULL,
        "is_primary" boolean NOT NULL DEFAULT false,
        CONSTRAINT "pk_inspection_legacy_participants" PRIMARY KEY ("id"),
        CONSTRAINT "uq_inspection_legacy_participant_sequence" UNIQUE ("legacy_import_id", "sequence_number"),
        CONSTRAINT "chk_inspection_legacy_participant_sequence" CHECK ("sequence_number" > 0),
        CONSTRAINT "fk_ilp_legacy_import" FOREIGN KEY ("legacy_import_id") REFERENCES "inspection_legacy_imports" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_ilp_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "inspection_legacy_sector_links" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "legacy_import_id" uuid NOT NULL,
        "sector_id" uuid,
        "source_name" varchar(255) NOT NULL,
        "sequence_number" integer NOT NULL,
        "is_primary" boolean NOT NULL DEFAULT false,
        CONSTRAINT "pk_inspection_legacy_sector_links" PRIMARY KEY ("id"),
        CONSTRAINT "uq_inspection_legacy_sector_sequence" UNIQUE ("legacy_import_id", "sequence_number"),
        CONSTRAINT "chk_inspection_legacy_sector_sequence" CHECK ("sequence_number" > 0),
        CONSTRAINT "fk_ilsl_legacy_import" FOREIGN KEY ("legacy_import_id") REFERENCES "inspection_legacy_imports" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_ilsl_sector" FOREIGN KEY ("sector_id") REFERENCES "sectors" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_inspection_legacy_participant_import" ON "inspection_legacy_participants" ("legacy_import_id")`);
    await queryRunner.query(`CREATE INDEX "idx_inspection_legacy_participant_user" ON "inspection_legacy_participants" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_inspection_legacy_sector_import" ON "inspection_legacy_sector_links" ("legacy_import_id")`);
    await queryRunner.query(`CREATE INDEX "idx_inspection_legacy_sector_sector" ON "inspection_legacy_sector_links" ("sector_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inspection_legacy_sector_sector"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inspection_legacy_sector_import"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inspection_legacy_participant_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inspection_legacy_participant_import"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inspection_legacy_sector_links"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inspection_legacy_participants"`);
  }
}
