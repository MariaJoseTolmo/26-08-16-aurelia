import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase5AIncidentsDataModel1719400000000 implements MigrationInterface {
  name = 'Phase5AIncidentsDataModel1719400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "incident_status" AS ENUM ('draft', 'reported', 'under_review', 'validated', 'under_investigation', 'action_plan', 'closed', 'cancelled')`);
    await queryRunner.query(`CREATE TYPE "incident_level_code" AS ENUM ('level_0', 'level_1', 'level_2', 'level_3', 'level_4', 'level_5')`);
    await queryRunner.query(`CREATE TYPE "incident_action_plan_status" AS ENUM ('open', 'in_progress', 'completed', 'rejected', 'cancelled')`);
    await queryRunner.query(`CREATE TYPE "incident_investigation_method" AS ENUM ('icam', 'five_why', 'peepo')`);

    await queryRunner.query(`
      CREATE TABLE "incident_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" varchar(80) NOT NULL,
        "name" varchar(200) NOT NULL,
        "description" text,
        "status" record_status NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_incident_types" PRIMARY KEY ("id"),
        CONSTRAINT "uq_incident_types_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "incident_levels" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" incident_level_code NOT NULL,
        "level_number" integer NOT NULL,
        "name" varchar(120) NOT NULL,
        "sla_hours" integer NOT NULL,
        "requires_investigation" boolean NOT NULL DEFAULT false,
        "description" text,
        "status" record_status NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_incident_levels" PRIMARY KEY ("id"),
        CONSTRAINT "uq_incident_levels_code" UNIQUE ("code"),
        CONSTRAINT "uq_incident_levels_number" UNIQUE ("level_number")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "incidents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "incident_type_id" uuid NOT NULL,
        "incident_level_id" uuid NOT NULL,
        "company_id" uuid,
        "area_id" uuid,
        "sector_id" uuid,
        "location_id" uuid,
        "reported_by_user_id" uuid,
        "title" varchar(180) NOT NULL,
        "description" text NOT NULL,
        "status" incident_status NOT NULL DEFAULT 'reported',
        "occurred_at" timestamptz NOT NULL,
        "reported_at" timestamptz NOT NULL DEFAULT now(),
        "latitude" numeric(10,7),
        "longitude" numeric(10,7),
        "immediate_response_summary" text,
        "environmental_impact_summary" text,
        "sla_due_at" timestamptz,
        "closed_at" timestamptz,
        "closed_by_user_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_incidents" PRIMARY KEY ("id"),
        CONSTRAINT "fk_incidents_type" FOREIGN KEY ("incident_type_id") REFERENCES "incident_types" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_incidents_level" FOREIGN KEY ("incident_level_id") REFERENCES "incident_levels" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_incidents_company" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_incidents_area" FOREIGN KEY ("area_id") REFERENCES "areas" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_incidents_sector" FOREIGN KEY ("sector_id") REFERENCES "sectors" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_incidents_location" FOREIGN KEY ("location_id") REFERENCES "locations" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_incidents_reported_by" FOREIGN KEY ("reported_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_incidents_closed_by" FOREIGN KEY ("closed_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_incidents_type" ON "incidents" ("incident_type_id")`);
    await queryRunner.query(`CREATE INDEX "idx_incidents_level" ON "incidents" ("incident_level_id")`);
    await queryRunner.query(`CREATE INDEX "idx_incidents_status" ON "incidents" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_incidents_area" ON "incidents" ("area_id")`);
    await queryRunner.query(`CREATE INDEX "idx_incidents_reported_at" ON "incidents" ("reported_at")`);

    await queryRunner.query(`
      CREATE TABLE "incident_involved_people" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "incident_id" uuid NOT NULL,
        "full_name" varchar(180) NOT NULL,
        "role" varchar(120),
        "company" varchar(180),
        "contact" varchar(160),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_incident_involved_people" PRIMARY KEY ("id"),
        CONSTRAINT "fk_iip_incident" FOREIGN KEY ("incident_id") REFERENCES "incidents" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "incident_immediate_actions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "incident_id" uuid NOT NULL,
        "description" text NOT NULL,
        "status" incident_action_plan_status NOT NULL DEFAULT 'open',
        "performed_by_user_id" uuid,
        "performed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_incident_immediate_actions" PRIMARY KEY ("id"),
        CONSTRAINT "fk_iia_incident" FOREIGN KEY ("incident_id") REFERENCES "incidents" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_iia_user" FOREIGN KEY ("performed_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "incident_flash_reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "incident_id" uuid NOT NULL,
        "summary" text NOT NULL,
        "immediate_causes" text,
        "affected_components" text,
        "potential_impact" text,
        "reporter_name" varchar(180),
        "generated_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_incident_flash_reports" PRIMARY KEY ("id"),
        CONSTRAINT "uq_incident_flash_reports_incident" UNIQUE ("incident_id"),
        CONSTRAINT "fk_ifr_incident" FOREIGN KEY ("incident_id") REFERENCES "incidents" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "incident_validations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "incident_id" uuid NOT NULL,
        "status" varchar(80) NOT NULL,
        "validator_user_id" uuid,
        "comments" text,
        "validated_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_incident_validations" PRIMARY KEY ("id"),
        CONSTRAINT "fk_iv_incident" FOREIGN KEY ("incident_id") REFERENCES "incidents" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_iv_user" FOREIGN KEY ("validator_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "incident_investigations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "incident_id" uuid NOT NULL,
        "method" incident_investigation_method NOT NULL,
        "title" varchar(200) NOT NULL,
        "summary" text,
        "status" varchar(80) NOT NULL DEFAULT 'open',
        "lead_user_id" uuid,
        "started_at" timestamptz,
        "completed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_incident_investigations" PRIMARY KEY ("id"),
        CONSTRAINT "fk_ii_incident" FOREIGN KEY ("incident_id") REFERENCES "incidents" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_ii_lead_user" FOREIGN KEY ("lead_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "incident_investigation_team" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "investigation_id" uuid NOT NULL,
        "user_id" uuid,
        "role" varchar(120) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_incident_investigation_team" PRIMARY KEY ("id"),
        CONSTRAINT "fk_iit_investigation" FOREIGN KEY ("investigation_id") REFERENCES "incident_investigations" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_iit_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "incident_peepo_analysis" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "investigation_id" uuid NOT NULL,
        "people" text,
        "environment" text,
        "equipment" text,
        "procedures" text,
        "organization" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_incident_peepo_analysis" PRIMARY KEY ("id"),
        CONSTRAINT "uq_incident_peepo_analysis_investigation" UNIQUE ("investigation_id"),
        CONSTRAINT "fk_ipa_investigation" FOREIGN KEY ("investigation_id") REFERENCES "incident_investigations" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "incident_timeline_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "incident_id" uuid NOT NULL,
        "occurred_at" timestamptz NOT NULL,
        "title" varchar(180) NOT NULL,
        "description" text,
        "sort_order" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_incident_timeline_events" PRIMARY KEY ("id"),
        CONSTRAINT "fk_ite_incident" FOREIGN KEY ("incident_id") REFERENCES "incidents" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "incident_five_why_analysis" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "investigation_id" uuid NOT NULL,
        "problem_statement" text NOT NULL,
        "why1" text,
        "why2" text,
        "why3" text,
        "why4" text,
        "why5" text,
        "root_cause" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_incident_five_why_analysis" PRIMARY KEY ("id"),
        CONSTRAINT "uq_incident_five_why_analysis_investigation" UNIQUE ("investigation_id"),
        CONSTRAINT "fk_ifwa_investigation" FOREIGN KEY ("investigation_id") REFERENCES "incident_investigations" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "incident_action_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "incident_id" uuid NOT NULL,
        "investigation_id" uuid,
        "title" varchar(200) NOT NULL,
        "description" text NOT NULL,
        "owner_user_id" uuid,
        "due_at" timestamptz,
        "status" incident_action_plan_status NOT NULL DEFAULT 'open',
        "completed_at" timestamptz,
        "closed_by_user_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_incident_action_plans" PRIMARY KEY ("id"),
        CONSTRAINT "fk_iap_incident" FOREIGN KEY ("incident_id") REFERENCES "incidents" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_iap_investigation" FOREIGN KEY ("investigation_id") REFERENCES "incident_investigations" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_iap_owner" FOREIGN KEY ("owner_user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_iap_closed_by" FOREIGN KEY ("closed_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "incident_action_evidences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "action_plan_id" uuid NOT NULL,
        "evidence_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_incident_action_evidences" PRIMARY KEY ("id"),
        CONSTRAINT "uq_iae_action_evidence" UNIQUE ("action_plan_id", "evidence_id"),
        CONSTRAINT "fk_iae_action" FOREIGN KEY ("action_plan_id") REFERENCES "incident_action_plans" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_iae_evidence" FOREIGN KEY ("evidence_id") REFERENCES "evidences" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "incident_status_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "incident_id" uuid NOT NULL,
        "from_status" varchar(80),
        "to_status" varchar(80) NOT NULL,
        "changed_by_user_id" uuid,
        "reason" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_incident_status_history" PRIMARY KEY ("id"),
        CONSTRAINT "fk_ish_incident" FOREIGN KEY ("incident_id") REFERENCES "incidents" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_ish_user" FOREIGN KEY ("changed_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "incident_disseminations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "incident_id" uuid NOT NULL,
        "audience" varchar(200) NOT NULL,
        "delivered_by_user_id" uuid,
        "delivered_at" timestamptz,
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_incident_disseminations" PRIMARY KEY ("id"),
        CONSTRAINT "fk_id_incident" FOREIGN KEY ("incident_id") REFERENCES "incidents" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_id_user" FOREIGN KEY ("delivered_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "incident_disseminations"`);
    await queryRunner.query(`DROP TABLE "incident_status_history"`);
    await queryRunner.query(`DROP TABLE "incident_action_evidences"`);
    await queryRunner.query(`DROP TABLE "incident_action_plans"`);
    await queryRunner.query(`DROP TABLE "incident_five_why_analysis"`);
    await queryRunner.query(`DROP TABLE "incident_timeline_events"`);
    await queryRunner.query(`DROP TABLE "incident_peepo_analysis"`);
    await queryRunner.query(`DROP TABLE "incident_investigation_team"`);
    await queryRunner.query(`DROP TABLE "incident_investigations"`);
    await queryRunner.query(`DROP TABLE "incident_validations"`);
    await queryRunner.query(`DROP TABLE "incident_flash_reports"`);
    await queryRunner.query(`DROP TABLE "incident_immediate_actions"`);
    await queryRunner.query(`DROP TABLE "incident_involved_people"`);
    await queryRunner.query(`DROP INDEX "idx_incidents_reported_at"`);
    await queryRunner.query(`DROP INDEX "idx_incidents_area"`);
    await queryRunner.query(`DROP INDEX "idx_incidents_status"`);
    await queryRunner.query(`DROP INDEX "idx_incidents_level"`);
    await queryRunner.query(`DROP INDEX "idx_incidents_type"`);
    await queryRunner.query(`DROP TABLE "incidents"`);
    await queryRunner.query(`DROP TABLE "incident_levels"`);
    await queryRunner.query(`DROP TABLE "incident_types"`);
    await queryRunner.query(`DROP TYPE "incident_investigation_method"`);
    await queryRunner.query(`DROP TYPE "incident_action_plan_status"`);
    await queryRunner.query(`DROP TYPE "incident_level_code"`);
    await queryRunner.query(`DROP TYPE "incident_status"`);
  }
}
