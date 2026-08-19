import 'reflect-metadata';
import { pbkdf2, randomBytes } from 'crypto';
import { config } from 'dotenv';
import { promisify } from 'util';
import { DataSource } from 'typeorm';
import { readApiEnv } from '../../config/env';
import { AppDataSource } from '../data-source';

config();

const deriveKey = promisify(pbkdf2);
const FORMAT = 'pbkdf2_sha256';
const ITERATIONS = 210000;
const KEY_LENGTH = 32;

async function createPasswordHash(secret: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await deriveKey(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  return `${FORMAT}$${ITERATIONS}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function runPhase1Seed(ds: DataSource): Promise<void> {
  const demoPassword = readApiEnv().auth.demoUserPassword;
  const demoPasswordHash = await createPasswordHash(demoPassword);
  const qr = ds.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    // Default company (owner org)
    await qr.query(
      `INSERT INTO companies (code, name, is_contractor, status)
       VALUES ($1, $2, false, 'active')
       ON CONFLICT (code) DO NOTHING`,
      ['CORP', 'Empresa Principal'],
    );

    // Default business unit
    await qr.query(
      `INSERT INTO business_units (code, name, status)
       VALUES ($1, $2, 'active')
       ON CONFLICT (code) DO NOTHING`,
      ['BU-001', 'Unidad de Negocio Principal'],
    );

    // Default admin user
    await qr.query(
      `INSERT INTO users (email, first_name, last_name, is_active, password_hash, password_changed_at, failed_login_attempts, locked_until)
       VALUES ($1, $2, $3, true, $4, NOW(), 0, NULL)
       ON CONFLICT (email) DO NOTHING`,
      ['admin@aurelia.local', 'Admin', 'Sistema', demoPasswordHash],
    );

    await qr.query(
      `UPDATE users
       SET password_hash = $2,
           password_changed_at = NOW(),
           failed_login_attempts = 0,
           locked_until = NULL
       WHERE email = $1`,
      ['admin@aurelia.local', demoPasswordHash],
    );

    // Assign ADMIN role to default admin user
    await qr.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT u.id, r.id
       FROM users u, roles r
       WHERE u.email = 'admin@aurelia.local'
         AND r.code  = 'ADMIN'
       ON CONFLICT DO NOTHING`,
    );

    // Entity reference type catalog (Phase 2)
    const entityRefTypes = [
      { code: 'inspection',                description: 'Inspección' },
      { code: 'inspection_finding',        description: 'Hallazgo de inspección' },
      { code: 'inspection_followup',       description: 'Seguimiento de hallazgo' },
      { code: 'incident',                  description: 'Incidente ambiental' },
      { code: 'incident_flash_report',     description: 'Flash report de incidente' },
      { code: 'incident_investigation',    description: 'Investigación de incidente' },
      { code: 'incident_action_plan',      description: 'Plan de acción de incidente' },
      { code: 'mue',                       description: 'Evento no deseado mayor' },
      { code: 'critical_control',          description: 'Control crítico' },
      { code: 'control_assessment',        description: 'Autoevaluación de control crítico' },
      { code: 'control_assessment_answer', description: 'Respuesta de autoevaluación' },
      { code: 'spr_record',                description: 'Registro mensual SPR' },
      { code: 'emission_source',           description: 'Fuente de emisión fija' },
      { code: 'emission_activity_level',   description: 'Nivel de actividad de emisión mensual' },
    ];

    for (const ert of entityRefTypes) {
      await qr.query(
        `INSERT INTO entity_reference_types (code, description)
         VALUES ($1, $2)
         ON CONFLICT (code) DO NOTHING`,
        [ert.code, ert.description],
      );
    }

    // Seed workflow definitions: inspection and incident validation flows
    await qr.query(
      `INSERT INTO workflow_definitions (code, name, description, entity_type, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (code) DO NOTHING`,
      ['WF-INSPECTION-VALIDATION', 'Validación de Inspección',
       'Flujo de revisión y aprobación de inspecciones', 'inspection'],
    );
    await qr.query(
      `INSERT INTO workflow_definitions (code, name, description, entity_type, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (code) DO NOTHING`,
      ['WF-INCIDENT-VALIDATION', 'Validación de Incidente',
       'Flujo de revisión y aprobación de incidentes', 'incident'],
    );

    // Steps for WF-INSPECTION-VALIDATION
    await qr.query(
      `INSERT INTO workflow_definition_steps (workflow_definition_id, step_order, code, name, required_role_id, sla_hours)
      SELECT wd.id, 1, 'CLOSURE_VERIFIER_REVIEW', 'Revisión verificador de cierre', role.id, 48
       FROM workflow_definitions wd
      INNER JOIN roles role ON role.code = 'INSPECTION_CLOSURE_VERIFIER' AND role.is_active = true
       WHERE wd.code = 'WF-INSPECTION-VALIDATION'
       ON CONFLICT (workflow_definition_id, step_order) DO NOTHING`,
    );
    await qr.query(
      `INSERT INTO workflow_definition_steps (workflow_definition_id, step_order, code, name, required_role_id, sla_hours)
      SELECT wd.id, 2, 'CLOSURE_VERIFIER_FINAL', 'Aprobación final verificador de cierre', role.id, 24
       FROM workflow_definitions wd
      INNER JOIN roles role ON role.code = 'INSPECTION_CLOSURE_VERIFIER' AND role.is_active = true
       WHERE wd.code = 'WF-INSPECTION-VALIDATION'
       ON CONFLICT (workflow_definition_id, step_order) DO NOTHING`,
    );

    // Steps for WF-INCIDENT-VALIDATION
    await qr.query(
      `INSERT INTO workflow_definition_steps (workflow_definition_id, step_order, code, name, required_role_id, sla_hours)
      SELECT wd.id, 1, 'INCIDENT_SUPERINTENDENT_REVIEW', 'Revisión superintendente ambiental', role.id, 24
       FROM workflow_definitions wd
      INNER JOIN roles role ON role.code = 'INCIDENT_SUPERINTENDENT' AND role.is_active = true
       WHERE wd.code = 'WF-INCIDENT-VALIDATION'
       ON CONFLICT (workflow_definition_id, step_order) DO NOTHING`,
    );
    await qr.query(
      `INSERT INTO workflow_definition_steps (workflow_definition_id, step_order, code, name, required_role_id, sla_hours)
      SELECT wd.id, 2, 'INCIDENT_ENV_VALIDATOR_APPROVAL', 'Aprobación validador ambiental', role.id, 12
       FROM workflow_definitions wd
      INNER JOIN roles role ON role.code = 'INCIDENT_ENV_VALIDATOR' AND role.is_active = true
       WHERE wd.code = 'WF-INCIDENT-VALIDATION'
       ON CONFLICT (workflow_definition_id, step_order) DO NOTHING`,
    );

    await qr.commitTransaction();
    console.log('Seed completed successfully.');
  } catch (err) {
    await qr.rollbackTransaction();
    throw err;
  } finally {
    await qr.release();
  }
}

async function main(): Promise<void> {
  const ds = await AppDataSource.initialize();
  try {
    await runPhase1Seed(ds);
  } finally {
    await ds.destroy();
  }
}

if (require.main === module) {
  void main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
