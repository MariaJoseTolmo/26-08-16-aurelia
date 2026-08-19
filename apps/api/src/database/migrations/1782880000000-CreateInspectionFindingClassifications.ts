import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInspectionFindingClassifications1782880000000 implements MigrationInterface {
  name = 'CreateInspectionFindingClassifications1782880000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS inspection_finding_types (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        code varchar(120) NOT NULL,
        name varchar(260) NOT NULL,
        sort_order integer NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT pk_inspection_finding_types PRIMARY KEY (id),
        CONSTRAINT uq_inspection_finding_types_code UNIQUE (code)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS inspection_finding_severities (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        code varchar(80) NOT NULL,
        name varchar(120) NOT NULL,
        description text NOT NULL,
        closure_time_label varchar(160) NOT NULL,
        sort_order integer NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT pk_inspection_finding_severities PRIMARY KEY (id),
        CONSTRAINT uq_inspection_finding_severities_code UNIQUE (code)
      )
    `);
    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_inspection_finding_types_active_sort ON inspection_finding_types (is_active, sort_order)');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_inspection_finding_severities_active_sort ON inspection_finding_severities (is_active, sort_order)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_inspection_finding_severities_active_sort');
    await queryRunner.query('DROP INDEX IF EXISTS idx_inspection_finding_types_active_sort');
    await queryRunner.query('DROP TABLE IF EXISTS inspection_finding_severities');
    await queryRunner.query('DROP TABLE IF EXISTS inspection_finding_types');
  }
}
