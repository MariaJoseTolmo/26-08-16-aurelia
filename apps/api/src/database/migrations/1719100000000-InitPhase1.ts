import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitPhase11719100000000 implements MigrationInterface {
  name = 'InitPhase11719100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        BEGIN
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;

        CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
        RETURNS uuid
        LANGUAGE sql
        VOLATILE
        AS $fn$
          SELECT (
            lpad(to_hex((random() * 4294967295)::bigint), 8, '0') || '-' ||
            lpad(to_hex((random() * 65535)::bigint), 4, '0') || '-' ||
            '4' || substr(lpad(to_hex((random() * 4095)::bigint), 3, '0'), 1, 3) || '-' ||
            substr('89ab', floor(random() * 4)::int + 1, 1) ||
            substr(lpad(to_hex((random() * 4095)::bigint), 3, '0'), 1, 3) || '-' ||
            lpad(to_hex((random() * 281474976710655)::bigint), 12, '0')
          )::uuid;
        $fn$;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        BEGIN
          CREATE EXTENSION IF NOT EXISTS "citext";
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;

        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'citext'
        ) THEN
          CREATE DOMAIN public.citext AS text;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TYPE "record_status" AS ENUM ('active', 'inactive', 'archived')
    `);

    await queryRunner.query(`
      CREATE TABLE "business_units" (
        "id"          uuid            NOT NULL DEFAULT uuid_generate_v4(),
        "code"        varchar(50)     NOT NULL,
        "name"        varchar(200)    NOT NULL,
        "description" text,
        "status"      record_status   NOT NULL DEFAULT 'active',
        "created_at"  timestamptz     NOT NULL DEFAULT now(),
        "updated_at"  timestamptz     NOT NULL DEFAULT now(),
        CONSTRAINT "uq_business_units_code"  UNIQUE ("code"),
        CONSTRAINT "pk_business_units"       PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "gerencias" (
        "id"               uuid            NOT NULL DEFAULT uuid_generate_v4(),
        "business_unit_id" uuid,
        "code"             varchar(50)     NOT NULL,
        "name"             varchar(200)    NOT NULL,
        "description"      text,
        "status"           record_status   NOT NULL DEFAULT 'active',
        "created_at"       timestamptz     NOT NULL DEFAULT now(),
        "updated_at"       timestamptz     NOT NULL DEFAULT now(),
        CONSTRAINT "uq_gerencias_code"  UNIQUE ("code"),
        CONSTRAINT "pk_gerencias"       PRIMARY KEY ("id"),
        CONSTRAINT "fk_gerencias_business_unit"
          FOREIGN KEY ("business_unit_id") REFERENCES "business_units" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_gerencias_business_unit" ON "gerencias" ("business_unit_id")`);

    await queryRunner.query(`
      CREATE TABLE "areas" (
        "id"           uuid            NOT NULL DEFAULT uuid_generate_v4(),
        "gerencia_id"  uuid,
        "code"         varchar(50)     NOT NULL,
        "name"         varchar(200)    NOT NULL,
        "description"  text,
        "status"       record_status   NOT NULL DEFAULT 'active',
        "created_at"   timestamptz     NOT NULL DEFAULT now(),
        "updated_at"   timestamptz     NOT NULL DEFAULT now(),
        CONSTRAINT "uq_areas_code"  UNIQUE ("code"),
        CONSTRAINT "pk_areas"       PRIMARY KEY ("id"),
        CONSTRAINT "fk_areas_gerencia"
          FOREIGN KEY ("gerencia_id") REFERENCES "gerencias" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_areas_gerencia" ON "areas" ("gerencia_id")`);

    await queryRunner.query(`
      CREATE TABLE "sectors" (
        "id"          uuid            NOT NULL DEFAULT uuid_generate_v4(),
        "area_id"     uuid,
        "code"        varchar(50)     NOT NULL,
        "name"        varchar(200)    NOT NULL,
        "description" text,
        "status"      record_status   NOT NULL DEFAULT 'active',
        "created_at"  timestamptz     NOT NULL DEFAULT now(),
        "updated_at"  timestamptz     NOT NULL DEFAULT now(),
        CONSTRAINT "uq_sectors_code"  UNIQUE ("code"),
        CONSTRAINT "pk_sectors"       PRIMARY KEY ("id"),
        CONSTRAINT "fk_sectors_area"
          FOREIGN KEY ("area_id") REFERENCES "areas" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_sectors_area" ON "sectors" ("area_id")`);

    await queryRunner.query(`
      CREATE TABLE "locations" (
        "id"          uuid             NOT NULL DEFAULT uuid_generate_v4(),
        "sector_id"   uuid,
        "code"        varchar(50),
        "name"        varchar(200)     NOT NULL,
        "description" text,
        "latitude"    numeric(10, 7),
        "longitude"   numeric(10, 7),
        "altitude_m"  numeric(10, 2),
        "macrozone"   varchar(100),
        "status"      record_status    NOT NULL DEFAULT 'active',
        "created_at"  timestamptz      NOT NULL DEFAULT now(),
        "updated_at"  timestamptz      NOT NULL DEFAULT now(),
        CONSTRAINT "uq_locations_sector_name"  UNIQUE ("sector_id", "name"),
        CONSTRAINT "pk_locations"              PRIMARY KEY ("id"),
        CONSTRAINT "fk_locations_sector"
          FOREIGN KEY ("sector_id") REFERENCES "sectors" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_locations_sector" ON "locations" ("sector_id")`);

    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id"           uuid            NOT NULL DEFAULT uuid_generate_v4(),
        "code"         varchar(50),
        "name"         varchar(250)    NOT NULL,
        "tax_id"       varchar(50),
        "company_type" varchar(80),
        "is_contractor" boolean        NOT NULL DEFAULT true,
        "status"       record_status   NOT NULL DEFAULT 'active',
        "created_at"   timestamptz     NOT NULL DEFAULT now(),
        "updated_at"   timestamptz     NOT NULL DEFAULT now(),
        CONSTRAINT "uq_companies_code"  UNIQUE ("code"),
        CONSTRAINT "pk_companies"       PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id"          uuid            NOT NULL DEFAULT uuid_generate_v4(),
        "code"        varchar(80)     NOT NULL,
        "name"        varchar(160)    NOT NULL,
        "description" text,
        "is_system"   boolean         NOT NULL DEFAULT false,
        "is_active"   boolean         NOT NULL DEFAULT true,
        "created_at"  timestamptz     NOT NULL DEFAULT now(),
        "updated_at"  timestamptz     NOT NULL DEFAULT now(),
        CONSTRAINT "uq_roles_code"  UNIQUE ("code"),
        CONSTRAINT "pk_roles"       PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id"          uuid            NOT NULL DEFAULT uuid_generate_v4(),
        "code"        varchar(120)    NOT NULL,
        "name"        varchar(160)    NOT NULL,
        "module"      varchar(80)     NOT NULL,
        "action"      varchar(80)     NOT NULL,
        "description" text,
        "created_at"  timestamptz     NOT NULL DEFAULT now(),
        "updated_at"  timestamptz     NOT NULL DEFAULT now(),
        CONSTRAINT "uq_permissions_code"  UNIQUE ("code"),
        CONSTRAINT "pk_permissions"       PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            uuid            NOT NULL DEFAULT uuid_generate_v4(),
        "email"         citext          NOT NULL,
        "first_name"    varchar(120)    NOT NULL,
        "last_name"     varchar(120)    NOT NULL,
        "position"      varchar(160),
        "phone"         varchar(50),
        "company_id"    uuid,
        "area_id"       uuid,
        "is_active"     boolean         NOT NULL DEFAULT true,
        "last_login_at" timestamptz,
        "created_at"    timestamptz     NOT NULL DEFAULT now(),
        "updated_at"    timestamptz     NOT NULL DEFAULT now(),
        CONSTRAINT "uq_users_email"  UNIQUE ("email"),
        CONSTRAINT "pk_users"        PRIMARY KEY ("id"),
        CONSTRAINT "fk_users_company"
          FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_users_area"
          FOREIGN KEY ("area_id") REFERENCES "areas" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_users_company" ON "users" ("company_id")`);
    await queryRunner.query(`CREATE INDEX "idx_users_area"    ON "users" ("area_id")`);

    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "id"            uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "role_id"       uuid        NOT NULL,
        "permission_id" uuid        NOT NULL,
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_role_permissions_role_permission"  UNIQUE ("role_id", "permission_id"),
        CONSTRAINT "pk_role_permissions"                  PRIMARY KEY ("id"),
        CONSTRAINT "fk_role_permissions_role"
          FOREIGN KEY ("role_id")       REFERENCES "roles"       ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_role_permissions_permission"
          FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "id"         uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"    uuid        NOT NULL,
        "role_id"    uuid        NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_user_roles_user_role"  UNIQUE ("user_id", "role_id"),
        CONSTRAINT "pk_user_roles"            PRIMARY KEY ("id"),
        CONSTRAINT "fk_user_roles_user"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_roles_role"
          FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_companies" (
        "id"         uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"    uuid        NOT NULL,
        "company_id" uuid        NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_user_companies_user_company"  UNIQUE ("user_id", "company_id"),
        CONSTRAINT "pk_user_companies"               PRIMARY KEY ("id"),
        CONSTRAINT "fk_user_companies_user"
          FOREIGN KEY ("user_id")    REFERENCES "users"     ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_companies_company"
          FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_areas" (
        "id"         uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"    uuid        NOT NULL,
        "area_id"    uuid        NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_user_areas_user_area"  UNIQUE ("user_id", "area_id"),
        CONSTRAINT "pk_user_areas"            PRIMARY KEY ("id"),
        CONSTRAINT "fk_user_areas_user"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_areas_area"
          FOREIGN KEY ("area_id") REFERENCES "areas" ("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_areas"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_companies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "companies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "locations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sectors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "areas"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "gerencias"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "business_units"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "record_status"`);
  }
}
