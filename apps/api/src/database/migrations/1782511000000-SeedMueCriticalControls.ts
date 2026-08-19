import { MigrationInterface, QueryRunner } from 'typeorm';

const mues = [
  ['MUE1', 'Pérdida de contención', 'Preventivo / Mitigador', 'Procedimientos de contención, registros de inspecciones, reportes de incidentes, mantenimiento de tanques'],
  ['MUE2', 'Voladuras no controladas', 'Preventivo', 'Registros de planificación de tronaduras, monitoreo de vibraciones, reportes de emisiones, medidas de supresión'],
  ['MUE3', 'Impactos sobre la flora y fauna', 'Preventivo / Mitigador', 'Registros de monitoreo biológico, reportes de fauna/flora, medidas de rescate o exclusión'],
  ['MUE4', 'Uso insostenible del agua', 'Preventivo', 'Balances hídricos, registros de captación/descarga, informes de laboratorio, control de bombeo'],
  ['MUE5', 'Emisiones no controladas', 'Preventivo / Mitigador', 'CEMS, PM10/PM2.5, registros de mantenimiento, inspecciones, reportes de control de polvo'],
  ['MUE6', 'Incumplimiento normativo', 'Mitigador / Sistémico', 'Matriz de cumplimiento, auditorías, informes regulatorios, RCA, compromisos ambientales'],
] as const;

const controls = [
  ['MUE1', 'MUE1-CC01', 'Design and Structural Integrity of Containment Systems (incl. Secondary Containment)', 'CCP'],
  ['MUE1', 'MUE1-CC02', 'Engineering Safety Devices in Transfer and Storage Systems', 'CCP'],
  ['MUE1', 'MUE1-CC03', 'Pre-Operational Safety and Integrity Inspections (Frontline Engineering Checks)', 'CCP'],
  ['MUE1', 'MUE1-CC04', 'Critical Asset Preventive Maintenance and Inspections Program', 'CCP'],
  ['MUE1', 'MUE1-CC05', 'Secondary Containment Systems', 'CCM'],
  ['MUE1', 'MUE1-CC06', 'Spill Emergency Kits and Response Plan', 'CCM'],
  ['MUE2', 'MUE2-CC01', 'Engineered Blast Design with Regulatory and Proximity Compliance', 'CCP'],
  ['MUE2', 'MUE2-CC02', 'Daily Functional Test of Blasting Equipment (Initiation Systems, Detonators, Cables)', 'CCP'],
  ['MUE2', 'MUE2-CC03', 'Vibration Sensors Monitoring and Adaptive Blast Adjustment', 'CCP'],
  ['MUE2', 'MUE2-CC04', 'Risk-Based Blasting Authorization Considering Environmental and Third-Party Exposure', 'CCP'],
  ['MUE2', 'MUE2-CC05', 'Emergency Response Plan for Over-Blasting', 'CCM'],
  ['MUE2', 'MUE2-CC06', 'Ecological Monitoring and Rehabilitation After Event', 'CCM'],
  ['MUE2', 'MUE2-CC07', 'Structural Damage Assessment and Repair Fund', 'CCM'],
  ['MUE2', 'MUE2-CC08', 'Escalated Communication with Authorities and Technical Experts', 'CCM'],
  ['MUE3', 'MUE3-CC01', 'Land Clearing Authorizations and Habitat Protection Permits', 'CCP'],
  ['MUE3', 'MUE3-CC02', 'Ecological Monitoring with Automatic Action Response', 'CCP'],
  ['MUE3', 'MUE3-CC03', 'Containment and Control of Hazardous Runoff and ARD', 'CCP'],
  ['MUE3', 'MUE3-CC04', 'Biodiversity Exclusion Zones and Buffer Areas', 'CCP'],
  ['MUE3', 'MUE3-CC05', 'Emergency Fauna Rescue and Recovery Plan', 'CCM'],
  ['MUE3', 'MUE3-CC06', 'Habitat Restoration and Revegetation Program', 'CCM'],
  ['MUE3', 'MUE3-CC07', 'Progressive Rehabilitation and Erosion Control Measures', 'CCM'],
  ['MUE3', 'MUE3-CC08', 'Environmental Incident Investigation and Corrective Actions', 'CCM'],
  ['MUE4', 'MUE4-CC01', 'Water Abstraction Limits with Automated Metering and Shut-Off', 'CCP'],
  ['MUE4', 'MUE4-CC02', 'Closed-Loop Water Recycling and Reuse System', 'CCP'],
  ['MUE4', 'MUE4-CC03', 'Site-Wide Water Balance and Real-Time Monitoring', 'CCP'],
  ['MUE4', 'MUE4-CC04', 'Leak Detection and Prompt Repair Program', 'CCP'],
  ['MUE4', 'MUE4-CC05', 'Emergency Water Supply and Demand Reduction Plan', 'CCM'],
  ['MUE4', 'MUE4-CC06', 'Environmental Flow and Aquifer Recovery Program', 'CCM'],
  ['MUE4', 'MUE4-CC07', 'Community and Regulator Water Stewardship Engagement', 'CCM'],
  ['MUE4', 'MUE4-CC08', 'Trigger Action Response Plan for Water Thresholds', 'CCM'],
  ['MUE5', 'MUE5-CC01', 'Design and Operation of Air Pollution Control Systems', 'CCP'],
  ['MUE5', 'MUE5-CC02', 'Enclosures and Dust Control for Material Handling and Roads', 'CCP'],
  ['MUE5', 'MUE5-CC03', 'Preventive Maintenance and Inspection of Emission Systems', 'CCP'],
  ['MUE5', 'MUE5-CC04', 'Real-Time Emission Monitoring and Trigger Alerts', 'CCP'],
  ['MUE5', 'MUE5-CC05', 'Emergency Dust Suppression and Shutdown Response', 'CCM'],
  ['MUE5', 'MUE5-CC06', 'Environmental Monitoring and Community Complaint Response', 'CCM'],
  ['MUE6', 'MUE6-CC01', 'Environmental Permit and EIA Commitment Tracking System', 'CCP'],
  ['MUE6', 'MUE6-CC02', 'External Regulatory Engagement and Change Management Procedure', 'CCP'],
  ['MUE6', 'MUE6-CC03', 'Environmental and Social Incident Management with Root Cause Analysis', 'CCM'],
  ['MUE6', 'MUE6-CC04', 'Emergency Environmental and Community Response Plan', 'CCM'],
  ['MUE6', 'MUE6-CC05', 'Compliance Assurance Audits and Corrective Action Tracking', 'CCP'],
  ['MUE6', 'MUE6-CC06', 'Legal Obligation Register and Evidence Management', 'CCP'],
  ['MUE6', 'MUE6-CC07', 'Management Review and Escalation of Compliance Deviations', 'CCM'],
] as const;

const items = [
  ['MUE1-CC01', 'MUE1-CC01-VI01', 'As-built design drawings available and approved.', 'Doc', 'Sealed engineering design reports.'],
  ['MUE2-CC01', 'MUE2-CC01-VI01', 'Signed design includes vibration/noise thresholds and GIS proximity review.', 'Field/System', 'Blast plan document.'],
  ['MUE3-CC01', 'MUE3-CC01-VI01', 'Land clearing only occurs with valid permit and within approved boundaries.', 'Field/System', 'Authorization permit.'],
  ['MUE4-CC01', 'MUE4-CC01-VI01', 'Water abstraction is within approved permits and metered limits.', 'Field/System', 'Metering records and abstraction reports.'],
  ['MUE5-CC01', 'MUE5-CC01-VI01', 'Air pollution control systems are operating within design criteria.', 'Field/System', 'CEMS or inspection records.'],
  ['MUE6-CC01', 'MUE6-CC01-VI01', 'Environmental permit obligations are registered, assigned and monitored.', 'System', 'Permit register and compliance evidence.'],
] as const;

const assignments = [
  ['MUE1', 'Gcia Planta - Superintendencia Procesos', 'Walter Williams / Angélica Castillo'],
  ['MUE1', 'Gcia Planta - Superintendencia Aguas y Relaves', 'Nestor Vargas / Miguel Montecinos'],
  ['MUE2', 'Gcia Mina - Perforación y Tronadura', 'Miguel Montaño / Ricardo Paredes'],
  ['MUE3', 'Gcia Medio Ambiente', 'Luis Ortega / Pablo Fernandois'],
  ['MUE4', 'Gcia Servicios Técnicos - Superintendencia de Aguas', 'Felipe Nuñez'],
  ['MUE5', 'Gcia Planta - Superintendencia Aguas y Relaves', 'Walter Williams / Miguel Pizarro'],
  ['MUE5', 'Gcia Medio Ambiente', 'Luis Ortega / Pablo Fernandois'],
  ['MUE6', 'Gcia Sustentabilidad - Cumplimiento Ambiental', 'Jacqueline Moraga'],
  ['MUE6', 'Gcia Sustentabilidad - Permisos', 'David Gueicha'],
  ['MUE6', 'Gcia Legal', 'Jose Luis'],
  ['MUE6', 'Gcia Medio Ambiente', 'Luis Ortega / Pablo Fernandois'],
] as const;

export class SeedMueCriticalControls1782511000000 implements MigrationInterface {
  name = 'SeedMueCriticalControls1782511000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO permissions (code, name, module, action)
      VALUES
        ('critical-controls:read', 'Ver controles críticos', 'critical-controls', 'read'),
        ('critical-controls:write', 'Editar controles críticos', 'critical-controls', 'write'),
        ('critical-controls:submit', 'Enviar autoevaluaciones de controles críticos', 'critical-controls', 'submit'),
        ('critical-controls:approve', 'Validar autoevaluaciones de controles críticos', 'critical-controls', 'approve')
      ON CONFLICT (code) DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.code = 'ADMIN' AND p.code LIKE 'critical-controls:%'
      ON CONFLICT DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.code IN ('SUPERVISOR', 'INSPECTOR', 'APPROVER', 'VIEWER') AND p.code = 'critical-controls:read'
      ON CONFLICT DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.code IN ('SUPERVISOR', 'INSPECTOR') AND p.code IN ('critical-controls:write', 'critical-controls:submit')
      ON CONFLICT DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.code = 'APPROVER' AND p.code = 'critical-controls:approve'
      ON CONFLICT DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO entity_reference_types (code, description)
      VALUES
        ('mue', 'Material Unwanted Event'),
        ('critical_control', 'Control crítico ambiental'),
        ('control_self_assessment', 'Autoevaluación de control crítico'),
        ('control_self_assessment_answer', 'Respuesta de autoevaluación de control crítico')
      ON CONFLICT (code) DO NOTHING
    `);

    for (const [code, name, controlType, evidence] of mues) {
      await queryRunner.query(
        `INSERT INTO mues (code, name, description, predominant_control_type, expected_main_evidence, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, predominant_control_type = EXCLUDED.predominant_control_type, expected_main_evidence = EXCLUDED.expected_main_evidence, is_active = true, updated_at = now()`,
        [code, name, name, controlType, evidence],
      );
    }

    for (const [mueCode, code, name, controlType] of controls) {
      await queryRunner.query(
        `INSERT INTO critical_controls (mue_id, code, name, control_type, is_active)
         SELECT m.id, $2, $3, $4, true FROM mues m WHERE m.code = $1
         ON CONFLICT (mue_id, code) DO UPDATE SET name = EXCLUDED.name, control_type = EXCLUDED.control_type, is_active = true, updated_at = now()`,
        [mueCode, code, name, controlType],
      );
    }

    for (const [controlCode, code, question, evidenceType, evidence] of items) {
      await queryRunner.query(
        `INSERT INTO control_verification_items (critical_control_id, code, question, evidence_type, expected_evidence, sort_order, is_required, is_active)
         SELECT c.id, $2, $3, $4, $5, 1, true, true FROM critical_controls c WHERE c.code = $1
         ON CONFLICT (critical_control_id, code) DO UPDATE SET question = EXCLUDED.question, evidence_type = EXCLUDED.evidence_type, expected_evidence = EXCLUDED.expected_evidence, is_active = true, updated_at = now()`,
        [controlCode, code, question, evidenceType, evidence],
      );
    }

    for (const [mueCode, areaName, responsibleName] of assignments) {
      await queryRunner.query(
        `INSERT INTO control_area_assignments (mue_id, area_name_snapshot, responsible_name_snapshot, is_primary)
         SELECT m.id, $2, $3, true FROM mues m WHERE m.code = $1`,
        [mueCode, areaName, responsibleName],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM control_area_assignments WHERE responsible_name_snapshot IS NOT NULL`);
    await queryRunner.query(`DELETE FROM control_verification_items WHERE code LIKE 'MUE%-CC%-VI%'`);
    await queryRunner.query(`DELETE FROM critical_controls WHERE code LIKE 'MUE%-CC%'`);
    await queryRunner.query(`DELETE FROM mues WHERE code IN ('MUE1', 'MUE2', 'MUE3', 'MUE4', 'MUE5', 'MUE6')`);
    await queryRunner.query(`DELETE FROM entity_reference_types WHERE code IN ('mue', 'critical_control', 'control_self_assessment', 'control_self_assessment_answer')`);
    await queryRunner.query(`DELETE FROM role_permissions WHERE permission_id IN (SELECT id FROM permissions WHERE code LIKE 'critical-controls:%')`);
    await queryRunner.query(`DELETE FROM permissions WHERE code LIKE 'critical-controls:%'`);
  }
}
