import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInspectionRiskCatalogs1782890000000 implements MigrationInterface {
  name = 'CreateInspectionRiskCatalogs1782890000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS inspection_risk_probabilities (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        code varchar(80) NOT NULL,
        name varchar(120) NOT NULL,
        description text NOT NULL,
        score integer NOT NULL,
        sort_order integer NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT pk_inspection_risk_probabilities PRIMARY KEY (id),
        CONSTRAINT uq_inspection_risk_probabilities_code UNIQUE (code)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS inspection_risk_consequences (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        code varchar(80) NOT NULL,
        name varchar(120) NOT NULL,
        description text NOT NULL,
        score integer NOT NULL,
        sort_order integer NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT pk_inspection_risk_consequences PRIMARY KEY (id),
        CONSTRAINT uq_inspection_risk_consequences_code UNIQUE (code)
      )
    `);
    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_inspection_risk_probabilities_active_sort ON inspection_risk_probabilities (is_active, sort_order)');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_inspection_risk_consequences_active_sort ON inspection_risk_consequences (is_active, sort_order)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_inspection_risk_consequences_active_sort');
    await queryRunner.query('DROP INDEX IF EXISTS idx_inspection_risk_probabilities_active_sort');
    await queryRunner.query('DROP TABLE IF EXISTS inspection_risk_consequences');
    await queryRunner.query('DROP TABLE IF EXISTS inspection_risk_probabilities');
  }
}
