import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase6ASprDataModel1719500000000 implements MigrationInterface {
  name = 'Phase6ASprDataModel1719500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "spr_record_status" AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'closed')`);
    await queryRunner.query(`CREATE TYPE "spr_approval_status" AS ENUM ('pending', 'approved', 'rejected', 'returned')`);
    await queryRunner.query(`CREATE TYPE "spr_consolidation_method" AS ENUM ('sum', 'average', 'latest', 'manual')`);

    await queryRunner.query(`
      CREATE TABLE "spr_measure_groups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" varchar(80) NOT NULL,
        "name" varchar(200) NOT NULL,
        "description" text,
        "sort_order" integer NOT NULL DEFAULT 0,
        "status" record_status NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_spr_measure_groups" PRIMARY KEY ("id"),
        CONSTRAINT "uq_spr_measure_groups_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "spr_units" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" varchar(40) NOT NULL,
        "name" varchar(160) NOT NULL,
        "symbol" varchar(40),
        "status" record_status NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_spr_units" PRIMARY KEY ("id"),
        CONSTRAINT "uq_spr_units_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "spr_parameters" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "measure_group_id" uuid NOT NULL,
        "unit_id" uuid,
        "code" varchar(100) NOT NULL,
        "name" varchar(240) NOT NULL,
        "description" text,
        "is_sox" boolean NOT NULL DEFAULT false,
        "requires_evidence" boolean NOT NULL DEFAULT false,
        "value_type" varchar(40) NOT NULL DEFAULT 'numeric',
        "sort_order" integer NOT NULL DEFAULT 0,
        "status" record_status NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_spr_parameters" PRIMARY KEY ("id"),
        CONSTRAINT "uq_spr_parameters_code" UNIQUE ("code"),
        CONSTRAINT "fk_spr_parameters_group" FOREIGN KEY ("measure_group_id") REFERENCES "spr_measure_groups" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_spr_parameters_unit" FOREIGN KEY ("unit_id") REFERENCES "spr_units" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_spr_parameters_group" ON "spr_parameters" ("measure_group_id")`);
    await queryRunner.query(`CREATE INDEX "idx_spr_parameters_unit" ON "spr_parameters" ("unit_id")`);

    await queryRunner.query(`
      CREATE TABLE "spr_parameter_area_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "parameter_id" uuid NOT NULL,
        "area_id" uuid,
        "responsible_user_id" uuid,
        "approver_user_id" uuid,
        "status" record_status NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_spr_parameter_area_assignments" PRIMARY KEY ("id"),
        CONSTRAINT "uq_spr_assignment_parameter_area" UNIQUE ("parameter_id", "area_id"),
        CONSTRAINT "fk_spr_assignment_parameter" FOREIGN KEY ("parameter_id") REFERENCES "spr_parameters" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_spr_assignment_area" FOREIGN KEY ("area_id") REFERENCES "areas" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_spr_assignment_responsible" FOREIGN KEY ("responsible_user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_spr_assignment_approver" FOREIGN KEY ("approver_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_spr_assignments_parameter" ON "spr_parameter_area_assignments" ("parameter_id")`);
    await queryRunner.query(`CREATE INDEX "idx_spr_assignments_area" ON "spr_parameter_area_assignments" ("area_id")`);

    await queryRunner.query(`
      CREATE TABLE "spr_monthly_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "parameter_id" uuid NOT NULL,
        "area_id" uuid,
        "assignment_id" uuid,
        "period_year" integer NOT NULL,
        "period_month" integer NOT NULL,
        "numeric_value" numeric(18,6),
        "text_value" text,
        "boolean_value" boolean,
        "status" spr_record_status NOT NULL DEFAULT 'draft',
        "submitted_by_user_id" uuid,
        "submitted_at" timestamptz,
        "approved_by_user_id" uuid,
        "approved_at" timestamptz,
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_spr_monthly_records" PRIMARY KEY ("id"),
        CONSTRAINT "uq_spr_record_period" UNIQUE ("parameter_id", "area_id", "period_year", "period_month"),
        CONSTRAINT "chk_spr_record_month" CHECK ("period_month" BETWEEN 1 AND 12),
        CONSTRAINT "chk_spr_record_year" CHECK ("period_year" BETWEEN 2000 AND 2100),
        CONSTRAINT "fk_spr_record_parameter" FOREIGN KEY ("parameter_id") REFERENCES "spr_parameters" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_spr_record_area" FOREIGN KEY ("area_id") REFERENCES "areas" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_spr_record_assignment" FOREIGN KEY ("assignment_id") REFERENCES "spr_parameter_area_assignments" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_spr_record_submitted_by" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_spr_record_approved_by" FOREIGN KEY ("approved_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_spr_records_period" ON "spr_monthly_records" ("period_year", "period_month")`);
    await queryRunner.query(`CREATE INDEX "idx_spr_records_status" ON "spr_monthly_records" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_spr_records_parameter" ON "spr_monthly_records" ("parameter_id")`);

    await queryRunner.query(`
      CREATE TABLE "spr_record_approvals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "record_id" uuid NOT NULL,
        "approver_user_id" uuid,
        "status" spr_approval_status NOT NULL DEFAULT 'pending',
        "comments" text,
        "decided_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_spr_record_approvals" PRIMARY KEY ("id"),
        CONSTRAINT "fk_spr_approval_record" FOREIGN KEY ("record_id") REFERENCES "spr_monthly_records" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_spr_approval_user" FOREIGN KEY ("approver_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_spr_approvals_record" ON "spr_record_approvals" ("record_id")`);

    await queryRunner.query(`
      CREATE TABLE "spr_consolidation_rules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "parameter_id" uuid NOT NULL,
        "code" varchar(100) NOT NULL,
        "name" varchar(200) NOT NULL,
        "method" spr_consolidation_method NOT NULL,
        "config" jsonb,
        "status" record_status NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_spr_consolidation_rules" PRIMARY KEY ("id"),
        CONSTRAINT "uq_spr_consolidation_rules_code" UNIQUE ("code"),
        CONSTRAINT "fk_spr_consolidation_parameter" FOREIGN KEY ("parameter_id") REFERENCES "spr_parameters" ("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "spr_consolidation_rules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "spr_record_approvals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "spr_monthly_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "spr_parameter_area_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "spr_parameters"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "spr_units"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "spr_measure_groups"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "spr_consolidation_method"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "spr_approval_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "spr_record_status"`);
  }
}
