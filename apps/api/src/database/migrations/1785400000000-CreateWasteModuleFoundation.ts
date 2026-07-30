import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWasteModuleFoundation1785400000000 implements MigrationInterface {
  name = 'CreateWasteModuleFoundation1785400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "waste_lot_status" AS ENUM ('available', 'partially_reserved', 'fully_reserved', 'partially_withdrawn', 'depleted', 'blocked', 'cancelled')`);
    await queryRunner.query(`CREATE TYPE "waste_movement_type" AS ENUM ('receipt', 'reservation', 'reservation_release', 'withdrawal', 'adjustment_in', 'adjustment_out', 'return', 'cancellation')`);
    await queryRunner.query(`CREATE TYPE "waste_withdrawal_status" AS ENUM ('draft', 'submitted', 'open', 'withdrawal_registered', 'closed', 'cancelled')`);
    await queryRunner.query(`CREATE TYPE "waste_approval_status" AS ENUM ('not_required', 'pending', 'approved', 'rejected')`);
    await queryRunner.query(`CREATE TYPE "waste_sidrep_status" AS ENUM ('awaiting_approval', 'open', 'closed', 'rejected', 'cancelled')`);
    await queryRunner.query(`CREATE TYPE "waste_sinader_period_status" AS ENUM ('in_progress', 'pending_declaration', 'declared')`);

    await queryRunner.query(`
      CREATE TABLE "waste_units" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" varchar(40) NOT NULL,
        "name" varchar(120) NOT NULL,
        "symbol" varchar(30),
        "conversion_to_kg" numeric(18,6),
        "status" record_status NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_waste_units" PRIMARY KEY ("id"),
        CONSTRAINT "uq_waste_units_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "waste_operational_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" varchar(80) NOT NULL,
        "name" varchar(180) NOT NULL,
        "description" text,
        "default_hazardous" boolean NOT NULL DEFAULT false,
        "sort_order" integer NOT NULL DEFAULT 0,
        "status" record_status NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_waste_operational_categories" PRIMARY KEY ("id"),
        CONSTRAINT "uq_waste_operational_categories_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "waste_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "operational_category_id" uuid NOT NULL,
        "default_unit_id" uuid,
        "code" varchar(100) NOT NULL,
        "name" varchar(220) NOT NULL,
        "description" text,
        "is_hazardous" boolean NOT NULL DEFAULT false,
        "sidrep_code" varchar(100),
        "sinader_code" varchar(100),
        "storage_limit_days" integer,
        "warning_before_days" integer NOT NULL DEFAULT 30,
        "requires_sidrep" boolean NOT NULL DEFAULT false,
        "requires_sinader" boolean NOT NULL DEFAULT false,
        "requires_hds" boolean NOT NULL DEFAULT false,
        "requires_vehicle_photos" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "status" record_status NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_waste_types" PRIMARY KEY ("id"),
        CONSTRAINT "uq_waste_types_code" UNIQUE ("code"),
        CONSTRAINT "chk_waste_types_storage_limit" CHECK ("storage_limit_days" IS NULL OR "storage_limit_days" > 0),
        CONSTRAINT "chk_waste_types_warning_days" CHECK ("warning_before_days" >= 0),
        CONSTRAINT "fk_waste_types_category" FOREIGN KEY ("operational_category_id") REFERENCES "waste_operational_categories" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_waste_types_default_unit" FOREIGN KEY ("default_unit_id") REFERENCES "waste_units" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_waste_types_category" ON "waste_types" ("operational_category_id")`);
    await queryRunner.query(`CREATE INDEX "idx_waste_types_default_unit" ON "waste_types" ("default_unit_id")`);

    await queryRunner.query(`
      CREATE TABLE "waste_warehouses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" varchar(80) NOT NULL,
        "name" varchar(200) NOT NULL,
        "business_unit_id" uuid,
        "area_id" uuid,
        "sector_id" uuid,
        "location_id" uuid,
        "responsible_user_id" uuid,
        "is_active" boolean NOT NULL DEFAULT true,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_waste_warehouses" PRIMARY KEY ("id"),
        CONSTRAINT "uq_waste_warehouses_code" UNIQUE ("code"),
        CONSTRAINT "fk_waste_warehouses_business_unit" FOREIGN KEY ("business_unit_id") REFERENCES "business_units" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_waste_warehouses_area" FOREIGN KEY ("area_id") REFERENCES "areas" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_waste_warehouses_sector" FOREIGN KEY ("sector_id") REFERENCES "sectors" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_waste_warehouses_location" FOREIGN KEY ("location_id") REFERENCES "locations" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_waste_warehouses_responsible" FOREIGN KEY ("responsible_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_waste_warehouses_business_unit" ON "waste_warehouses" ("business_unit_id")`);
    await queryRunner.query(`CREATE INDEX "idx_waste_warehouses_area" ON "waste_warehouses" ("area_id")`);
    await queryRunner.query(`CREATE INDEX "idx_waste_warehouses_sector" ON "waste_warehouses" ("sector_id")`);
    await queryRunner.query(`CREATE INDEX "idx_waste_warehouses_location" ON "waste_warehouses" ("location_id")`);

    await queryRunner.query(`
      CREATE TABLE "waste_receipts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "receipt_number" varchar(80) NOT NULL,
        "warehouse_id" uuid NOT NULL,
        "received_at" timestamptz NOT NULL,
        "origin_area_id" uuid,
        "origin_sector_id" uuid,
        "origin_location_text" varchar(240),
        "vehicle_plate" varchar(30),
        "driver_name" varchar(180),
        "registered_by_user_id" uuid,
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_waste_receipts" PRIMARY KEY ("id"),
        CONSTRAINT "uq_waste_receipts_number" UNIQUE ("receipt_number"),
        CONSTRAINT "fk_waste_receipts_warehouse" FOREIGN KEY ("warehouse_id") REFERENCES "waste_warehouses" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_waste_receipts_origin_area" FOREIGN KEY ("origin_area_id") REFERENCES "areas" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_waste_receipts_origin_sector" FOREIGN KEY ("origin_sector_id") REFERENCES "sectors" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_waste_receipts_registered_by" FOREIGN KEY ("registered_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_waste_receipts_warehouse" ON "waste_receipts" ("warehouse_id")`);
    await queryRunner.query(`CREATE INDEX "idx_waste_receipts_received_at" ON "waste_receipts" ("received_at")`);

    await queryRunner.query(`
      CREATE TABLE "waste_lots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "lot_number" varchar(80) NOT NULL,
        "receipt_id" uuid NOT NULL,
        "warehouse_id" uuid NOT NULL,
        "waste_type_id" uuid NOT NULL,
        "unit_id" uuid NOT NULL,
        "original_quantity" numeric(18,6) NOT NULL,
        "current_quantity" numeric(18,6) NOT NULL,
        "reserved_quantity" numeric(18,6) NOT NULL DEFAULT 0,
        "net_weight_kg" numeric(18,3),
        "received_at" timestamptz NOT NULL,
        "storage_due_at" timestamptz,
        "status" waste_lot_status NOT NULL DEFAULT 'available',
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_waste_lots" PRIMARY KEY ("id"),
        CONSTRAINT "uq_waste_lots_number" UNIQUE ("lot_number"),
        CONSTRAINT "chk_waste_lots_quantities" CHECK ("original_quantity" >= 0 AND "current_quantity" >= 0 AND "reserved_quantity" >= 0 AND "reserved_quantity" <= "current_quantity"),
        CONSTRAINT "fk_waste_lots_receipt" FOREIGN KEY ("receipt_id") REFERENCES "waste_receipts" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_waste_lots_warehouse" FOREIGN KEY ("warehouse_id") REFERENCES "waste_warehouses" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_waste_lots_type" FOREIGN KEY ("waste_type_id") REFERENCES "waste_types" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_waste_lots_unit" FOREIGN KEY ("unit_id") REFERENCES "waste_units" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_waste_lots_receipt" ON "waste_lots" ("receipt_id")`);
    await queryRunner.query(`CREATE INDEX "idx_waste_lots_warehouse" ON "waste_lots" ("warehouse_id")`);
    await queryRunner.query(`CREATE INDEX "idx_waste_lots_type" ON "waste_lots" ("waste_type_id")`);
    await queryRunner.query(`CREATE INDEX "idx_waste_lots_status" ON "waste_lots" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_waste_lots_storage_due_at" ON "waste_lots" ("storage_due_at")`);

    await queryRunner.query(`
      CREATE TABLE "waste_withdrawal_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "request_number" varchar(80) NOT NULL,
        "warehouse_id" uuid NOT NULL,
        "is_hazardous" boolean NOT NULL,
        "status" waste_withdrawal_status NOT NULL DEFAULT 'draft',
        "approval_status" waste_approval_status NOT NULL DEFAULT 'not_required',
        "requested_by_user_id" uuid,
        "requested_at" timestamptz NOT NULL DEFAULT now(),
        "transport_company_id" uuid,
        "destination_company_id" uuid,
        "destination_location_id" uuid,
        "vehicle_plate" varchar(30),
        "driver_name" varchar(180),
        "gross_weight_kg" numeric(18,3),
        "tare_weight_kg" numeric(18,3),
        "net_weight_kg" numeric(18,3),
        "submitted_at" timestamptz,
        "approved_at" timestamptz,
        "approved_by_user_id" uuid,
        "rejected_at" timestamptz,
        "rejected_by_user_id" uuid,
        "rejection_reason" text,
        "registered_at" timestamptz,
        "closed_at" timestamptz,
        "closed_by_user_id" uuid,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_waste_withdrawal_requests" PRIMARY KEY ("id"),
        CONSTRAINT "uq_waste_withdrawal_requests_number" UNIQUE ("request_number"),
        CONSTRAINT "chk_waste_withdrawal_weights" CHECK (("gross_weight_kg" IS NULL OR "gross_weight_kg" >= 0) AND ("tare_weight_kg" IS NULL OR "tare_weight_kg" >= 0) AND ("net_weight_kg" IS NULL OR "net_weight_kg" >= 0)),
        CONSTRAINT "fk_waste_withdrawals_warehouse" FOREIGN KEY ("warehouse_id") REFERENCES "waste_warehouses" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_waste_withdrawals_requested_by" FOREIGN KEY ("requested_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_waste_withdrawals_transport_company" FOREIGN KEY ("transport_company_id") REFERENCES "companies" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_waste_withdrawals_destination_company" FOREIGN KEY ("destination_company_id") REFERENCES "companies" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_waste_withdrawals_destination_location" FOREIGN KEY ("destination_location_id") REFERENCES "locations" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_waste_withdrawals_approved_by" FOREIGN KEY ("approved_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_waste_withdrawals_rejected_by" FOREIGN KEY ("rejected_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_waste_withdrawals_closed_by" FOREIGN KEY ("closed_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_waste_withdrawals_warehouse" ON "waste_withdrawal_requests" ("warehouse_id")`);
    await queryRunner.query(`CREATE INDEX "idx_waste_withdrawals_status" ON "waste_withdrawal_requests" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_waste_withdrawals_requested_at" ON "waste_withdrawal_requests" ("requested_at")`);

    await queryRunner.query(`
      CREATE TABLE "waste_withdrawal_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "withdrawal_request_id" uuid NOT NULL,
        "lot_id" uuid NOT NULL,
        "unit_id" uuid NOT NULL,
        "requested_quantity" numeric(18,6) NOT NULL,
        "approved_quantity" numeric(18,6),
        "withdrawn_quantity" numeric(18,6),
        "available_quantity_snapshot" numeric(18,6) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_waste_withdrawal_items" PRIMARY KEY ("id"),
        CONSTRAINT "uq_waste_withdrawal_items_request_lot" UNIQUE ("withdrawal_request_id", "lot_id"),
        CONSTRAINT "chk_waste_withdrawal_item_quantities" CHECK ("requested_quantity" > 0 AND "available_quantity_snapshot" >= 0 AND ("approved_quantity" IS NULL OR "approved_quantity" >= 0) AND ("withdrawn_quantity" IS NULL OR "withdrawn_quantity" >= 0)),
        CONSTRAINT "fk_waste_withdrawal_items_request" FOREIGN KEY ("withdrawal_request_id") REFERENCES "waste_withdrawal_requests" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_waste_withdrawal_items_lot" FOREIGN KEY ("lot_id") REFERENCES "waste_lots" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_waste_withdrawal_items_unit" FOREIGN KEY ("unit_id") REFERENCES "waste_units" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_waste_withdrawal_items_request" ON "waste_withdrawal_items" ("withdrawal_request_id")`);
    await queryRunner.query(`CREATE INDEX "idx_waste_withdrawal_items_lot" ON "waste_withdrawal_items" ("lot_id")`);

    await queryRunner.query(`
      CREATE TABLE "waste_inventory_movements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "lot_id" uuid NOT NULL,
        "movement_type" waste_movement_type NOT NULL,
        "quantity" numeric(18,6) NOT NULL,
        "unit_id" uuid NOT NULL,
        "previous_quantity" numeric(18,6) NOT NULL,
        "resulting_quantity" numeric(18,6) NOT NULL,
        "withdrawal_request_id" uuid,
        "performed_by_user_id" uuid,
        "occurred_at" timestamptz NOT NULL DEFAULT now(),
        "reason" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_waste_inventory_movements" PRIMARY KEY ("id"),
        CONSTRAINT "chk_waste_inventory_movement_quantities" CHECK ("quantity" > 0 AND "previous_quantity" >= 0 AND "resulting_quantity" >= 0),
        CONSTRAINT "fk_waste_inventory_movements_lot" FOREIGN KEY ("lot_id") REFERENCES "waste_lots" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_waste_inventory_movements_unit" FOREIGN KEY ("unit_id") REFERENCES "waste_units" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_waste_inventory_movements_withdrawal" FOREIGN KEY ("withdrawal_request_id") REFERENCES "waste_withdrawal_requests" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_waste_inventory_movements_performed_by" FOREIGN KEY ("performed_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_waste_inventory_movements_lot" ON "waste_inventory_movements" ("lot_id")`);
    await queryRunner.query(`CREATE INDEX "idx_waste_inventory_movements_type" ON "waste_inventory_movements" ("movement_type")`);
    await queryRunner.query(`CREATE INDEX "idx_waste_inventory_movements_occurred_at" ON "waste_inventory_movements" ("occurred_at")`);

    await queryRunner.query(`
      CREATE TABLE "waste_sidrep_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "withdrawal_request_id" uuid NOT NULL,
        "status" waste_sidrep_status NOT NULL DEFAULT 'awaiting_approval',
        "external_folio" varchar(100),
        "generated_at" timestamptz,
        "registered_by_user_id" uuid,
        "approval_deadline_at" timestamptz,
        "opened_at" timestamptz,
        "final_disposal_at" timestamptz,
        "dispatched_net_weight_kg" numeric(18,3),
        "received_weight_kg" numeric(18,3),
        "weight_difference_kg" numeric(18,3),
        "difference_reason" text,
        "destination_receipt_number" varchar(120),
        "closed_at" timestamptz,
        "closed_by_user_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_waste_sidrep_records" PRIMARY KEY ("id"),
        CONSTRAINT "uq_waste_sidrep_request" UNIQUE ("withdrawal_request_id"),
        CONSTRAINT "uq_waste_sidrep_external_folio" UNIQUE ("external_folio"),
        CONSTRAINT "fk_waste_sidrep_request" FOREIGN KEY ("withdrawal_request_id") REFERENCES "waste_withdrawal_requests" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_waste_sidrep_registered_by" FOREIGN KEY ("registered_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_waste_sidrep_closed_by" FOREIGN KEY ("closed_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_waste_sidrep_status" ON "waste_sidrep_records" ("status")`);

    await queryRunner.query(`
      CREATE TABLE "waste_sinader_periods" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "business_unit_id" uuid NOT NULL,
        "period_year" integer NOT NULL,
        "period_month" integer NOT NULL,
        "status" waste_sinader_period_status NOT NULL DEFAULT 'in_progress',
        "total_quantity_kg" numeric(18,3) NOT NULL DEFAULT 0,
        "movement_count" integer NOT NULL DEFAULT 0,
        "category_count" integer NOT NULL DEFAULT 0,
        "declared_folio" varchar(120),
        "declared_at" timestamptz,
        "declared_by_user_id" uuid,
        "source_snapshot" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_waste_sinader_periods" PRIMARY KEY ("id"),
        CONSTRAINT "uq_waste_sinader_period_business_unit" UNIQUE ("business_unit_id", "period_year", "period_month"),
        CONSTRAINT "uq_waste_sinader_declared_folio" UNIQUE ("declared_folio"),
        CONSTRAINT "chk_waste_sinader_period_month" CHECK ("period_month" BETWEEN 1 AND 12),
        CONSTRAINT "chk_waste_sinader_period_year" CHECK ("period_year" BETWEEN 2000 AND 2100),
        CONSTRAINT "fk_waste_sinader_periods_business_unit" FOREIGN KEY ("business_unit_id") REFERENCES "business_units" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_waste_sinader_periods_declared_by" FOREIGN KEY ("declared_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_waste_sinader_periods_business_unit" ON "waste_sinader_periods" ("business_unit_id")`);
    await queryRunner.query(`CREATE INDEX "idx_waste_sinader_periods_status" ON "waste_sinader_periods" ("status")`);

    await queryRunner.query(`
      CREATE TABLE "waste_sinader_period_lines" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sinader_period_id" uuid NOT NULL,
        "waste_type_id" uuid NOT NULL,
        "unit_id" uuid NOT NULL,
        "quantity" numeric(18,6) NOT NULL,
        "treatment_type" varchar(120),
        "destination_company_id" uuid,
        "destination_location_id" uuid,
        "transport_company_id" uuid,
        "movement_count" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_waste_sinader_period_lines" PRIMARY KEY ("id"),
        CONSTRAINT "uq_waste_sinader_line_dimensions" UNIQUE ("sinader_period_id", "waste_type_id", "transport_company_id", "destination_company_id"),
        CONSTRAINT "chk_waste_sinader_line_quantity" CHECK ("quantity" >= 0),
        CONSTRAINT "fk_waste_sinader_lines_period" FOREIGN KEY ("sinader_period_id") REFERENCES "waste_sinader_periods" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_waste_sinader_lines_type" FOREIGN KEY ("waste_type_id") REFERENCES "waste_types" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_waste_sinader_lines_unit" FOREIGN KEY ("unit_id") REFERENCES "waste_units" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_waste_sinader_lines_destination_company" FOREIGN KEY ("destination_company_id") REFERENCES "companies" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_waste_sinader_lines_destination_location" FOREIGN KEY ("destination_location_id") REFERENCES "locations" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_waste_sinader_lines_transport_company" FOREIGN KEY ("transport_company_id") REFERENCES "companies" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_waste_sinader_lines_period" ON "waste_sinader_period_lines" ("sinader_period_id")`);
    await queryRunner.query(`CREATE INDEX "idx_waste_sinader_lines_type" ON "waste_sinader_period_lines" ("waste_type_id")`);

    await queryRunner.query(`
      INSERT INTO "waste_units" ("code", "name", "symbol", "conversion_to_kg") VALUES
        ('KG', 'Kilogramo', 'kg', 1),
        ('TON', 'Tonelada', 't', 1000),
        ('M3', 'Metro cúbico', 'm³', NULL),
        ('UNIT', 'Unidad', 'un', NULL),
        ('DRUM', 'Tambor', 'tambor', NULL),
        ('CONTAINER', 'Contenedor', 'contenedor', NULL)
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "waste_operational_categories" ("code", "name", "description", "default_hazardous", "sort_order") VALUES
        ('HAZARDOUS', 'Residuos peligrosos', 'Residuos sujetos al flujo de aprobación y folio SIDREP.', true, 10),
        ('INDUSTRIAL_NON_HAZARDOUS', 'Industriales no peligrosos', 'Residuos industriales no peligrosos informados en SINADER.', false, 20),
        ('DOMESTIC', 'Domésticos', 'Residuos domésticos o asimilables a domiciliarios.', false, 30),
        ('SLUDGE', 'Lodos', 'Lodos gestionados operacionalmente por el módulo.', false, 40)
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "permissions" ("id", "code", "name", "module", "action", "description") VALUES
        (uuid_generate_v4(), 'waste:read', 'Consultar residuos', 'waste', 'read', 'Permite consultar catálogos, bodega, retiros y reportes de residuos.'),
        (uuid_generate_v4(), 'waste:write', 'Gestionar residuos', 'waste', 'write', 'Permite registrar ingresos, lotes, movimientos y solicitudes de retiro.'),
        (uuid_generate_v4(), 'waste:approve', 'Aprobar retiros peligrosos', 'waste', 'approve', 'Permite aprobar o rechazar retiros de residuos peligrosos.'),
        (uuid_generate_v4(), 'waste:close', 'Cerrar retiros y declaraciones', 'waste', 'close', 'Permite cerrar folios SIDREP y períodos SINADER.'),
        (uuid_generate_v4(), 'waste:configure', 'Configurar residuos', 'waste', 'configure', 'Permite administrar catálogos y reglas del módulo de residuos.'),
        (uuid_generate_v4(), 'waste:export', 'Exportar residuos', 'waste', 'export', 'Permite exportar reportes del módulo de residuos.')
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("id", "role_id", "permission_id")
      SELECT uuid_generate_v4(), role_row."id", permission_row."id"
      FROM "roles" role_row
      CROSS JOIN "permissions" permission_row
      WHERE role_row."code" = 'ADMIN'
        AND permission_row."module" = 'waste'
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "entity_reference_types" ("code", "description") VALUES
        ('waste_receipt', 'Ingreso de residuos a bodega'),
        ('waste_lot', 'Lote de residuos almacenado en bodega'),
        ('waste_withdrawal_request', 'Solicitud de retiro de residuos'),
        ('waste_sidrep_record', 'Registro y cierre de folio SIDREP'),
        ('waste_sinader_period', 'Período consolidado SINADER')
      ON CONFLICT ("code") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "role_permissions" WHERE "permission_id" IN (SELECT "id" FROM "permissions" WHERE "module" = 'waste')`);
    await queryRunner.query(`DELETE FROM "permissions" WHERE "module" = 'waste'`);
    await queryRunner.query(`DELETE FROM "entity_reference_types" WHERE "code" IN ('waste_receipt', 'waste_lot', 'waste_withdrawal_request', 'waste_sidrep_record', 'waste_sinader_period')`);
    await queryRunner.query(`DROP TABLE IF EXISTS "waste_sinader_period_lines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "waste_sinader_periods"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "waste_sidrep_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "waste_inventory_movements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "waste_withdrawal_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "waste_withdrawal_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "waste_lots"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "waste_receipts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "waste_warehouses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "waste_types"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "waste_operational_categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "waste_units"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "waste_sinader_period_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "waste_sidrep_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "waste_approval_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "waste_withdrawal_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "waste_movement_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "waste_lot_status"`);
  }
}
