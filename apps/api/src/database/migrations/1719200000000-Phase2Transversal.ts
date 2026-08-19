import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase2Transversal1719200000000 implements MigrationInterface {
  name = 'Phase2Transversal1719200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ENUMs
    await queryRunner.query(`
      CREATE TYPE "file_storage_provider" AS ENUM ('azure_blob', 'local', 'external_url')
    `);
    await queryRunner.query(`
      CREATE TYPE "evidence_status" AS ENUM ('uploaded', 'pending_validation', 'validated', 'rejected')
    `);
    await queryRunner.query(`
      CREATE TYPE "workflow_instance_status" AS ENUM ('running', 'completed', 'cancelled')
    `);
    await queryRunner.query(`
      CREATE TYPE "workflow_step_status" AS ENUM ('pending', 'in_progress', 'approved', 'returned', 'rejected', 'skipped')
    `);

    // Polymorphic entity catalog
    await queryRunner.query(`
      CREATE TABLE "entity_reference_types" (
        "code"        varchar(80)  NOT NULL,
        "description" text         NOT NULL,
        "created_at"  timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "pk_entity_reference_types" PRIMARY KEY ("code")
      )
    `);

    // Files
    await queryRunner.query(`
      CREATE TABLE "files" (
        "id"                  uuid                   NOT NULL DEFAULT uuid_generate_v4(),
        "storage_provider"    file_storage_provider  NOT NULL DEFAULT 'local',
        "container_name"      varchar(160),
        "blob_path"           text,
        "external_url"        text,
        "original_filename"   varchar(255)           NOT NULL,
        "mime_type"           varchar(120),
        "size_bytes"          bigint,
        "checksum_sha256"     varchar(128),
        "uploaded_by_user_id" uuid,
        "uploaded_at"         timestamptz            NOT NULL DEFAULT now(),
        "created_at"          timestamptz            NOT NULL DEFAULT now(),
        "updated_at"          timestamptz            NOT NULL DEFAULT now(),
        CONSTRAINT "pk_files" PRIMARY KEY ("id"),
        CONSTRAINT "fk_files_uploaded_by"
          FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_files_uploaded_by" ON "files" ("uploaded_by_user_id")`);

    // Evidences
    await queryRunner.query(`
      CREATE TABLE "evidences" (
        "id"                    uuid             NOT NULL DEFAULT uuid_generate_v4(),
        "file_id"               uuid,
        "title"                 varchar(250),
        "description"           text,
        "evidence_type"         varchar(80),
        "status"                evidence_status  NOT NULL DEFAULT 'uploaded',
        "captured_at"           timestamptz,
        "latitude"              numeric(10,7),
        "longitude"             numeric(10,7),
        "created_by_user_id"    uuid,
        "validated_by_user_id"  uuid,
        "validated_at"          timestamptz,
        "validation_notes"      text,
        "created_at"            timestamptz      NOT NULL DEFAULT now(),
        "updated_at"            timestamptz      NOT NULL DEFAULT now(),
        CONSTRAINT "pk_evidences" PRIMARY KEY ("id"),
        CONSTRAINT "fk_evidences_file"
          FOREIGN KEY ("file_id") REFERENCES "files" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_evidences_created_by"
          FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_evidences_validated_by"
          FOREIGN KEY ("validated_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_evidences_file"       ON "evidences" ("file_id")`);
    await queryRunner.query(`CREATE INDEX "idx_evidences_created_by" ON "evidences" ("created_by_user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_evidences_status"     ON "evidences" ("status")`);

    // Evidence links (polymorphic)
    await queryRunner.query(`
      CREATE TABLE "evidence_links" (
        "id"            uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "evidence_id"   uuid         NOT NULL,
        "entity_type"   varchar(80)  NOT NULL,
        "entity_id"     uuid         NOT NULL,
        "relation_type" varchar(80)  NOT NULL DEFAULT 'supporting_evidence',
        "created_at"    timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "pk_evidence_links" PRIMARY KEY ("id"),
        CONSTRAINT "uq_evidence_links"
          UNIQUE ("evidence_id", "entity_type", "entity_id", "relation_type"),
        CONSTRAINT "fk_evidence_links_evidence"
          FOREIGN KEY ("evidence_id") REFERENCES "evidences" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_evidence_links_entity_type"
          FOREIGN KEY ("entity_type") REFERENCES "entity_reference_types" ("code")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_evidence_links_entity" ON "evidence_links" ("entity_type", "entity_id")`);

    // Comments (polymorphic, soft-delete)
    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id"             uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "entity_type"    varchar(80)  NOT NULL,
        "entity_id"      uuid         NOT NULL,
        "author_user_id" uuid,
        "body"           text         NOT NULL,
        "is_internal"    boolean      NOT NULL DEFAULT false,
        "is_deleted"     boolean      NOT NULL DEFAULT false,
        "created_at"     timestamptz  NOT NULL DEFAULT now(),
        "updated_at"     timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "pk_comments" PRIMARY KEY ("id"),
        CONSTRAINT "fk_comments_author"
          FOREIGN KEY ("author_user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_comments_entity_type"
          FOREIGN KEY ("entity_type") REFERENCES "entity_reference_types" ("code")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_comments_entity" ON "comments" ("entity_type", "entity_id")`);
    await queryRunner.query(`CREATE INDEX "idx_comments_author"  ON "comments" ("author_user_id")`);

    // Audit logs (append-only)
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id"            uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "entity_type"   varchar(80),
        "entity_id"     uuid,
        "actor_user_id" uuid,
        "action"        varchar(120) NOT NULL,
        "old_value"     jsonb,
        "new_value"     jsonb,
        "metadata"      jsonb,
        "ip_address"    inet,
        "user_agent"    text,
        "created_at"    timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "pk_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "fk_audit_logs_actor"
          FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_audit_logs_entity_type"
          FOREIGN KEY ("entity_type") REFERENCES "entity_reference_types" ("code")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_audit_logs_entity"     ON "audit_logs" ("entity_type", "entity_id")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_logs_actor"      ON "audit_logs" ("actor_user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" ("created_at")`);

    // Workflow definitions
    await queryRunner.query(`
      CREATE TABLE "workflow_definitions" (
        "id"          uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "code"        varchar(100) NOT NULL,
        "name"        varchar(200) NOT NULL,
        "description" text,
        "entity_type" varchar(80)  NOT NULL,
        "is_active"   boolean      NOT NULL DEFAULT true,
        "created_at"  timestamptz  NOT NULL DEFAULT now(),
        "updated_at"  timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "uq_workflow_definitions_code" UNIQUE ("code"),
        CONSTRAINT "pk_workflow_definitions"      PRIMARY KEY ("id"),
        CONSTRAINT "fk_workflow_definitions_entity_type"
          FOREIGN KEY ("entity_type") REFERENCES "entity_reference_types" ("code")
      )
    `);

    // Workflow definition steps
    await queryRunner.query(`
      CREATE TABLE "workflow_definition_steps" (
        "id"                    uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "workflow_definition_id" uuid        NOT NULL,
        "step_order"            integer      NOT NULL,
        "code"                  varchar(100) NOT NULL,
        "name"                  varchar(200) NOT NULL,
        "required_role_id"      uuid,
        "sla_hours"             integer,
        "created_at"            timestamptz  NOT NULL DEFAULT now(),
        "updated_at"            timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "pk_workflow_definition_steps" PRIMARY KEY ("id"),
        CONSTRAINT "uq_wds_definition_order" UNIQUE ("workflow_definition_id", "step_order"),
        CONSTRAINT "uq_wds_definition_code"  UNIQUE ("workflow_definition_id", "code"),
        CONSTRAINT "fk_wds_definition"
          FOREIGN KEY ("workflow_definition_id") REFERENCES "workflow_definitions" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_wds_role"
          FOREIGN KEY ("required_role_id") REFERENCES "roles" ("id") ON DELETE SET NULL
      )
    `);

    // Workflow instances
    await queryRunner.query(`
      CREATE TABLE "workflow_instances" (
        "id"                    uuid                    NOT NULL DEFAULT uuid_generate_v4(),
        "workflow_definition_id" uuid,
        "entity_type"           varchar(80)             NOT NULL,
        "entity_id"             uuid                    NOT NULL,
        "status"                workflow_instance_status NOT NULL DEFAULT 'running',
        "started_by_user_id"    uuid,
        "started_at"            timestamptz             NOT NULL DEFAULT now(),
        "completed_at"          timestamptz,
        "created_at"            timestamptz             NOT NULL DEFAULT now(),
        "updated_at"            timestamptz             NOT NULL DEFAULT now(),
        CONSTRAINT "pk_workflow_instances" PRIMARY KEY ("id"),
        CONSTRAINT "fk_wi_definition"
          FOREIGN KEY ("workflow_definition_id") REFERENCES "workflow_definitions" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_wi_started_by"
          FOREIGN KEY ("started_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_wi_entity_type"
          FOREIGN KEY ("entity_type") REFERENCES "entity_reference_types" ("code")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_wi_entity"      ON "workflow_instances" ("entity_type", "entity_id")`);
    await queryRunner.query(`CREATE INDEX "idx_wi_status"      ON "workflow_instances" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_wi_started_by"  ON "workflow_instances" ("started_by_user_id")`);

    // Workflow instance steps
    await queryRunner.query(`
      CREATE TABLE "workflow_instance_steps" (
        "id"                           uuid                  NOT NULL DEFAULT uuid_generate_v4(),
        "workflow_instance_id"         uuid                  NOT NULL,
        "workflow_definition_step_id"  uuid,
        "step_order"                   integer               NOT NULL,
        "code"                         varchar(100)          NOT NULL,
        "name"                         varchar(200)          NOT NULL,
        "status"                       workflow_step_status  NOT NULL DEFAULT 'pending',
        "assigned_to_user_id"          uuid,
        "assigned_role_id"             uuid,
        "due_at"                       timestamptz,
        "completed_by_user_id"         uuid,
        "completed_at"                 timestamptz,
        "notes"                        text,
        "created_at"                   timestamptz           NOT NULL DEFAULT now(),
        "updated_at"                   timestamptz           NOT NULL DEFAULT now(),
        CONSTRAINT "pk_workflow_instance_steps" PRIMARY KEY ("id"),
        CONSTRAINT "fk_wis_instance"
          FOREIGN KEY ("workflow_instance_id") REFERENCES "workflow_instances" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_wis_definition_step"
          FOREIGN KEY ("workflow_definition_step_id") REFERENCES "workflow_definition_steps" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_wis_assigned_to"
          FOREIGN KEY ("assigned_to_user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_wis_assigned_role"
          FOREIGN KEY ("assigned_role_id") REFERENCES "roles" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_wis_completed_by"
          FOREIGN KEY ("completed_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_wis_instance" ON "workflow_instance_steps" ("workflow_instance_id")`);
    await queryRunner.query(`CREATE INDEX "idx_wis_status"   ON "workflow_instance_steps" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "workflow_instance_steps"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workflow_instances"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workflow_definition_steps"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workflow_definitions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "comments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "evidence_links"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "evidences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "files"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "entity_reference_types"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "workflow_step_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "workflow_instance_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "evidence_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "file_storage_provider"`);
  }
}
