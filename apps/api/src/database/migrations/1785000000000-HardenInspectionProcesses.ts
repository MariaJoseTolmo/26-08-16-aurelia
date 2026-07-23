import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardenInspectionProcesses1785000000000 implements MigrationInterface {
  name = 'HardenInspectionProcesses1785000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE inspection_process_request_type AS ENUM ('extension', 'dispute', 'evidence_resubmission');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE inspection_process_request_status AS ENUM ('pending', 'approved', 'rejected', 'ratified', 'reassigned', 'completed', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE inspection_sla_event_type AS ENUM ('first_reminder', 'second_reminder', 'overdue', 'escalated');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE notification_delivery_status AS ENUM ('pending', 'sent', 'failed', 'bounced', 'retrying');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE inspection_ai_assessment_kind AS ENUM ('pre_validation', 'duplicate');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE inspection_ai_decision AS ENUM ('pending', 'accepted', 'overridden', 'rejected');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS inspection_process_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        finding_id uuid NOT NULL REFERENCES inspection_findings(id) ON DELETE CASCADE,
        type inspection_process_request_type NOT NULL,
        status inspection_process_request_status NOT NULL DEFAULT 'pending',
        reason text NOT NULL,
        requested_due_at timestamptz NULL,
        resolved_due_at timestamptz NULL,
        iteration integer NULL,
        requested_by_user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
        resolved_by_user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
        resolution_reason text NULL,
        metadata jsonb NULL,
        resolved_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_inspection_process_requests_finding_type ON inspection_process_requests (finding_id, type)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_inspection_process_requests_status ON inspection_process_requests (status)`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_inspection_process_request_pending
      ON inspection_process_requests (finding_id, type)
      WHERE status = 'pending'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS inspection_sla_policies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        severity inspection_finding_severity NOT NULL UNIQUE,
        first_reminder_hours_before integer NOT NULL DEFAULT 72 CHECK (first_reminder_hours_before >= 0),
        second_reminder_hours_before integer NOT NULL DEFAULT 24 CHECK (second_reminder_hours_before >= 0),
        escalation_hours_after integer NOT NULL DEFAULT 24 CHECK (escalation_hours_after >= 0),
        is_active boolean NOT NULL DEFAULT true,
        updated_by_user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      INSERT INTO inspection_sla_policies (severity, first_reminder_hours_before, second_reminder_hours_before, escalation_hours_after)
      VALUES
        ('low', 72, 24, 48),
        ('medium', 96, 48, 24),
        ('high', 120, 72, 12),
        ('critical', 168, 96, 4)
      ON CONFLICT (severity) DO NOTHING
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS inspection_sla_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        finding_id uuid NOT NULL REFERENCES inspection_findings(id) ON DELETE CASCADE,
        policy_id uuid NULL REFERENCES inspection_sla_policies(id) ON DELETE SET NULL,
        type inspection_sla_event_type NOT NULL,
        event_key varchar(180) NOT NULL UNIQUE,
        due_at timestamptz NULL,
        occurred_at timestamptz NOT NULL,
        metadata jsonb NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_inspection_sla_events_finding ON inspection_sla_events (finding_id)`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_deliveries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
        channel varchar(30) NOT NULL DEFAULT 'in_app',
        destination varchar(320) NULL,
        status notification_delivery_status NOT NULL DEFAULT 'pending',
        attempt_count integer NOT NULL DEFAULT 0,
        max_attempts integer NOT NULL DEFAULT 3,
        last_error text NULL,
        next_retry_at timestamptz NULL,
        sent_at timestamptz NULL,
        failed_at timestamptz NULL,
        metadata jsonb NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON notification_deliveries (status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification ON notification_deliveries (notification_id)`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS inspection_ai_assessments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        inspection_id uuid NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
        finding_id uuid NULL REFERENCES inspection_findings(id) ON DELETE CASCADE,
        kind inspection_ai_assessment_kind NOT NULL,
        confidence numeric(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
        recommendation text NOT NULL,
        explanation jsonb NOT NULL,
        duplicate_finding_id uuid NULL REFERENCES inspection_findings(id) ON DELETE SET NULL,
        suggested_data jsonb NULL,
        decision inspection_ai_decision NOT NULL DEFAULT 'pending',
        decision_reason text NULL,
        decided_by_user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
        decided_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_inspection_ai_assessments_inspection ON inspection_ai_assessments (inspection_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_inspection_ai_assessments_finding ON inspection_ai_assessments (finding_id)`);

    await queryRunner.query(`
      INSERT INTO permissions (code, name, module, action)
      VALUES
        ('inspections:create', 'Crear inspecciones', 'inspections', 'create'),
        ('inspections:execute', 'Ejecutar inspecciones y hallazgos', 'inspections', 'execute'),
        ('inspections:review', 'Aprobar o rechazar hallazgos', 'inspections', 'review'),
        ('inspections:reassign', 'Reasignar responsables y SLA', 'inspections', 'reassign'),
        ('inspections:admin', 'Administrar configuración de inspecciones', 'inspections', 'admin')
      ON CONFLICT (code) DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT role.id, permission.id
      FROM roles role
      CROSS JOIN permissions permission
      WHERE role.code = 'ADMIN'
        AND permission.code IN ('inspections:read', 'inspections:create', 'inspections:execute', 'inspections:review', 'inspections:reassign', 'inspections:admin')
      ON CONFLICT DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT role.id, permission.id
      FROM roles role
      CROSS JOIN permissions permission
      WHERE (role.code = 'INSPECTOR' AND permission.code IN ('inspections:read', 'inspections:create', 'inspections:execute'))
         OR (role.code = 'INSPECTION_RESPONSIBLE' AND permission.code IN ('inspections:read', 'inspections:execute'))
         OR (role.code = 'INSPECTION_CLOSURE_VERIFIER' AND permission.code IN ('inspections:read', 'inspections:review', 'inspections:reassign'))
         OR (role.code = 'VIEWER' AND permission.code = 'inspections:read')
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM role_permissions WHERE permission_id IN (SELECT id FROM permissions WHERE code IN ('inspections:create', 'inspections:execute', 'inspections:review', 'inspections:reassign', 'inspections:admin'))`);
    await queryRunner.query(`DELETE FROM permissions WHERE code IN ('inspections:create', 'inspections:execute', 'inspections:review', 'inspections:reassign', 'inspections:admin')`);
    await queryRunner.query(`DROP TABLE IF EXISTS inspection_ai_assessments`);
    await queryRunner.query(`DROP TABLE IF EXISTS notification_deliveries`);
    await queryRunner.query(`DROP TABLE IF EXISTS inspection_sla_events`);
    await queryRunner.query(`DROP TABLE IF EXISTS inspection_sla_policies`);
    await queryRunner.query(`DROP TABLE IF EXISTS inspection_process_requests`);
    await queryRunner.query(`DROP TYPE IF EXISTS inspection_ai_decision`);
    await queryRunner.query(`DROP TYPE IF EXISTS inspection_ai_assessment_kind`);
    await queryRunner.query(`DROP TYPE IF EXISTS notification_delivery_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS inspection_sla_event_type`);
    await queryRunner.query(`DROP TYPE IF EXISTS inspection_process_request_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS inspection_process_request_type`);
  }
}
