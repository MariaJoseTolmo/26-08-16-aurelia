import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMueCriticalControls1782510000000 implements MigrationInterface {
  name = 'CreateMueCriticalControls1782510000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "mue" CASCADE`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mues" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" varchar(20) NOT NULL,
        "name" varchar(200) NOT NULL,
        "description" text NULL,
        "predominant_control_type" varchar(80) NULL,
        "expected_main_evidence" text NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mues" PRIMARY KEY ("id"),
        CONSTRAINT "uq_mues_code" UNIQUE ("code")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "critical_controls" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "mue_id" uuid NOT NULL,
        "code" varchar(40) NOT NULL,
        "name" varchar(240) NOT NULL,
        "description" text NULL,
        "control_type" varchar(20) NOT NULL,
        "objective" text NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_critical_controls" PRIMARY KEY ("id"),
        CONSTRAINT "uq_critical_controls_mue_code" UNIQUE ("mue_id", "code"),
        CONSTRAINT "fk_critical_controls_mue" FOREIGN KEY ("mue_id") REFERENCES "mues"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "control_verification_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "critical_control_id" uuid NOT NULL,
        "code" varchar(60) NOT NULL,
        "question" text NULL,
        "requirement_text" text NULL,
        "evidence_type" varchar(80) NULL,
        "expected_evidence" text NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_required" boolean NOT NULL DEFAULT true,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_control_verification_items" PRIMARY KEY ("id"),
        CONSTRAINT "uq_control_verification_items_control_code" UNIQUE ("critical_control_id", "code"),
        CONSTRAINT "fk_control_verification_items_control" FOREIGN KEY ("critical_control_id") REFERENCES "critical_controls"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "control_area_assignments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "mue_id" uuid NOT NULL,
        "critical_control_id" uuid NULL,
        "area_id" uuid NULL,
        "gerencia_id" uuid NULL,
        "company_id" uuid NULL,
        "responsible_user_id" uuid NULL,
        "area_name_snapshot" varchar(240) NULL,
        "responsible_name_snapshot" varchar(240) NULL,
        "responsible_role" varchar(160) NULL,
        "is_primary" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_control_area_assignments" PRIMARY KEY ("id"),
        CONSTRAINT "fk_control_area_assignments_mue" FOREIGN KEY ("mue_id") REFERENCES "mues"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_control_area_assignments_control" FOREIGN KEY ("critical_control_id") REFERENCES "critical_controls"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_control_area_assignments_area" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_control_area_assignments_gerencia" FOREIGN KEY ("gerencia_id") REFERENCES "gerencias"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_control_area_assignments_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_control_area_assignments_user" FOREIGN KEY ("responsible_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "control_self_assessments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "mue_id" uuid NOT NULL,
        "critical_control_id" uuid NULL,
        "area_id" uuid NULL,
        "gerencia_id" uuid NULL,
        "company_id" uuid NULL,
        "period_year" integer NOT NULL,
        "period_month" integer NOT NULL,
        "status" varchar(40) NOT NULL DEFAULT 'draft',
        "compliance_score" numeric(5,2) NULL,
        "created_by_user_id" uuid NULL,
        "submitted_by_user_id" uuid NULL,
        "validated_by_user_id" uuid NULL,
        "submitted_at" timestamptz NULL,
        "validated_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_control_self_assessments" PRIMARY KEY ("id"),
        CONSTRAINT "fk_control_self_assessments_mue" FOREIGN KEY ("mue_id") REFERENCES "mues"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_control_self_assessments_control" FOREIGN KEY ("critical_control_id") REFERENCES "critical_controls"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_control_self_assessments_area" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_control_self_assessments_gerencia" FOREIGN KEY ("gerencia_id") REFERENCES "gerencias"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_control_self_assessments_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_control_self_assessments_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_control_self_assessments_submitted_by" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_control_self_assessments_validated_by" FOREIGN KEY ("validated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "control_self_assessment_answers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "assessment_id" uuid NOT NULL,
        "verification_item_id" uuid NOT NULL,
        "answer" varchar(40) NOT NULL,
        "comment" text NULL,
        "risk_level" varchar(40) NULL,
        "action_required" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_control_self_assessment_answers" PRIMARY KEY ("id"),
        CONSTRAINT "uq_control_self_assessment_answers_item" UNIQUE ("assessment_id", "verification_item_id"),
        CONSTRAINT "fk_control_self_assessment_answers_assessment" FOREIGN KEY ("assessment_id") REFERENCES "control_self_assessments"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_control_self_assessment_answers_item" FOREIGN KEY ("verification_item_id") REFERENCES "control_verification_items"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "control_evidences" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "answer_id" uuid NOT NULL,
        "evidence_id" uuid NOT NULL,
        "relation_type" varchar(80) NOT NULL DEFAULT 'control_assessment',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_control_evidences" PRIMARY KEY ("id"),
        CONSTRAINT "uq_control_evidences_answer_evidence" UNIQUE ("answer_id", "evidence_id"),
        CONSTRAINT "fk_control_evidences_answer" FOREIGN KEY ("answer_id") REFERENCES "control_self_assessment_answers"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_control_evidences_evidence" FOREIGN KEY ("evidence_id") REFERENCES "evidences"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_critical_controls_mue" ON "critical_controls" ("mue_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_control_verification_items_control" ON "control_verification_items" ("critical_control_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_control_area_assignments_mue" ON "control_area_assignments" ("mue_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_control_area_assignments_control" ON "control_area_assignments" ("critical_control_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_control_self_assessments_mue" ON "control_self_assessments" ("mue_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_control_self_assessments_period" ON "control_self_assessments" ("period_year", "period_month")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_control_self_assessments_status" ON "control_self_assessments" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_control_self_assessment_answers_assessment" ON "control_self_assessment_answers" ("assessment_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_control_evidences_answer" ON "control_evidences" ("answer_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "control_evidences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "control_self_assessment_answers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "control_self_assessments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "control_area_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "control_verification_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "critical_controls"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mues"`);
  }
}
