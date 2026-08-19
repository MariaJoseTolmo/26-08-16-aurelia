import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase4AInspectionsDataModel1719300000000 implements MigrationInterface {
  name = 'Phase4AInspectionsDataModel1719300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "inspection_status" AS ENUM ('draft', 'scheduled', 'in_progress', 'submitted', 'under_review', 'returned', 'closed', 'cancelled')`);
    await queryRunner.query(`CREATE TYPE "inspection_item_response_type" AS ENUM ('yes_no_na', 'compliance', 'numeric', 'text', 'date')`);
    await queryRunner.query(`CREATE TYPE "inspection_answer_value" AS ENUM ('compliant', 'not_compliant', 'partial', 'not_applicable', 'not_observed')`);
    await queryRunner.query(`CREATE TYPE "inspection_finding_status" AS ENUM ('open', 'in_progress', 'closed', 'cancelled')`);
    await queryRunner.query(`CREATE TYPE "inspection_finding_severity" AS ENUM ('low', 'medium', 'high', 'critical')`);
    await queryRunner.query(`CREATE TYPE "inspection_followup_status" AS ENUM ('pending', 'completed', 'rejected')`);

    await queryRunner.query(`
      CREATE TABLE "inspection_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" varchar(80) NOT NULL,
        "name" varchar(200) NOT NULL,
        "description" text,
        "status" record_status NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_inspection_types" PRIMARY KEY ("id"),
        CONSTRAINT "uq_inspection_types_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "inspection_checklist_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "inspection_type_id" uuid NOT NULL,
        "code" varchar(100) NOT NULL,
        "name" varchar(200) NOT NULL,
        "description" text,
        "version" integer NOT NULL DEFAULT 1,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_inspection_checklist_templates" PRIMARY KEY ("id"),
        CONSTRAINT "uq_inspection_checklist_templates_code" UNIQUE ("code"),
        CONSTRAINT "fk_ict_type" FOREIGN KEY ("inspection_type_id") REFERENCES "inspection_types" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_inspection_templates_type" ON "inspection_checklist_templates" ("inspection_type_id")`);

    await queryRunner.query(`
      CREATE TABLE "inspection_checklist_sections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "template_id" uuid NOT NULL,
        "code" varchar(100) NOT NULL,
        "title" varchar(200) NOT NULL,
        "description" text,
        "sort_order" integer NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_inspection_checklist_sections" PRIMARY KEY ("id"),
        CONSTRAINT "uq_ics_template_code" UNIQUE ("template_id", "code"),
        CONSTRAINT "uq_ics_template_order" UNIQUE ("template_id", "sort_order"),
        CONSTRAINT "fk_ics_template" FOREIGN KEY ("template_id") REFERENCES "inspection_checklist_templates" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "inspection_checklist_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "section_id" uuid NOT NULL,
        "code" varchar(100) NOT NULL,
        "question" varchar(500) NOT NULL,
        "guidance" text,
        "response_type" inspection_item_response_type NOT NULL,
        "is_required" boolean NOT NULL DEFAULT true,
        "requires_evidence_on_not_compliant" boolean NOT NULL DEFAULT false,
        "sort_order" integer NOT NULL,
        "weight" numeric(5,2),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_inspection_checklist_items" PRIMARY KEY ("id"),
        CONSTRAINT "uq_ici_section_code" UNIQUE ("section_id", "code"),
        CONSTRAINT "uq_ici_section_order" UNIQUE ("section_id", "sort_order"),
        CONSTRAINT "fk_ici_section" FOREIGN KEY ("section_id") REFERENCES "inspection_checklist_sections" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "inspections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "inspection_type_id" uuid NOT NULL,
        "template_id" uuid,
        "company_id" uuid,
        "area_id" uuid,
        "sector_id" uuid,
        "location_id" uuid,
        "inspector_user_id" uuid,
        "title" varchar(180) NOT NULL,
        "description" text,
        "status" inspection_status NOT NULL DEFAULT 'draft',
        "scheduled_at" timestamptz,
        "started_at" timestamptz,
        "completed_at" timestamptz,
        "closed_at" timestamptz,
        "latitude" numeric(10,7),
        "longitude" numeric(10,7),
        "score" numeric(5,2),
        "findings_count" integer NOT NULL DEFAULT 0,
        "open_findings_count" integer NOT NULL DEFAULT 0,
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_inspections" PRIMARY KEY ("id"),
        CONSTRAINT "fk_inspections_type" FOREIGN KEY ("inspection_type_id") REFERENCES "inspection_types" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_inspections_template" FOREIGN KEY ("template_id") REFERENCES "inspection_checklist_templates" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_inspections_company" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_inspections_area" FOREIGN KEY ("area_id") REFERENCES "areas" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_inspections_sector" FOREIGN KEY ("sector_id") REFERENCES "sectors" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_inspections_location" FOREIGN KEY ("location_id") REFERENCES "locations" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_inspections_inspector" FOREIGN KEY ("inspector_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_inspections_type" ON "inspections" ("inspection_type_id")`);
    await queryRunner.query(`CREATE INDEX "idx_inspections_template" ON "inspections" ("template_id")`);
    await queryRunner.query(`CREATE INDEX "idx_inspections_company" ON "inspections" ("company_id")`);
    await queryRunner.query(`CREATE INDEX "idx_inspections_area" ON "inspections" ("area_id")`);
    await queryRunner.query(`CREATE INDEX "idx_inspections_status" ON "inspections" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_inspections_inspector" ON "inspections" ("inspector_user_id")`);

    await queryRunner.query(`
      CREATE TABLE "inspection_checklist_answers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "inspection_id" uuid NOT NULL,
        "checklist_item_id" uuid NOT NULL,
        "answer_value" varchar(80),
        "answer_text" text,
        "numeric_value" numeric(18,6),
        "answered_by_user_id" uuid,
        "answered_at" timestamptz,
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_inspection_checklist_answers" PRIMARY KEY ("id"),
        CONSTRAINT "uq_ica_inspection_item" UNIQUE ("inspection_id", "checklist_item_id"),
        CONSTRAINT "fk_ica_inspection" FOREIGN KEY ("inspection_id") REFERENCES "inspections" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_ica_item" FOREIGN KEY ("checklist_item_id") REFERENCES "inspection_checklist_items" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_ica_user" FOREIGN KEY ("answered_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "inspection_findings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "inspection_id" uuid NOT NULL,
        "checklist_item_id" uuid,
        "title" varchar(200) NOT NULL,
        "description" text,
        "severity" inspection_finding_severity NOT NULL,
        "status" inspection_finding_status NOT NULL DEFAULT 'open',
        "owner_user_id" uuid,
        "created_by_user_id" uuid,
        "due_at" timestamptz,
        "closed_at" timestamptz,
        "closed_by_user_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_inspection_findings" PRIMARY KEY ("id"),
        CONSTRAINT "fk_if_inspection" FOREIGN KEY ("inspection_id") REFERENCES "inspections" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_if_item" FOREIGN KEY ("checklist_item_id") REFERENCES "inspection_checklist_items" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_if_owner" FOREIGN KEY ("owner_user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_if_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_if_closed_by" FOREIGN KEY ("closed_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "inspection_followups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "finding_id" uuid NOT NULL,
        "sequence_number" integer NOT NULL,
        "status" inspection_followup_status NOT NULL DEFAULT 'pending',
        "description" text NOT NULL,
        "performed_by_user_id" uuid,
        "performed_at" timestamptz,
        "next_due_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_inspection_followups" PRIMARY KEY ("id"),
        CONSTRAINT "uq_ifu_finding_sequence" UNIQUE ("finding_id", "sequence_number"),
        CONSTRAINT "chk_ifu_sequence" CHECK ("sequence_number" BETWEEN 1 AND 3),
        CONSTRAINT "fk_ifu_finding" FOREIGN KEY ("finding_id") REFERENCES "inspection_findings" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_ifu_user" FOREIGN KEY ("performed_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "inspection_status_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "inspection_id" uuid NOT NULL,
        "from_status" varchar(80),
        "to_status" varchar(80) NOT NULL,
        "changed_by_user_id" uuid,
        "reason" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_inspection_status_history" PRIMARY KEY ("id"),
        CONSTRAINT "fk_ish_inspection" FOREIGN KEY ("inspection_id") REFERENCES "inspections" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_ish_user" FOREIGN KEY ("changed_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "inspection_status_history"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inspection_followups"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inspection_findings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inspection_checklist_answers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inspections"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inspection_checklist_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inspection_checklist_sections"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inspection_checklist_templates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inspection_types"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "inspection_followup_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "inspection_finding_severity"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "inspection_finding_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "inspection_answer_value"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "inspection_item_response_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "inspection_status"`);
  }
}
