import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase4AInspectionCatalogSeed1719301000000 implements MigrationInterface {
  name = 'Phase4AInspectionCatalogSeed1719301000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO inspection_types (code, name, description, status)
      VALUES
        ('planned', 'Inspección planificada', 'Inspección programada', 'active'),
        ('routine', 'Inspección rutinaria', 'Inspección periódica', 'active'),
        ('preventive', 'Inspección preventiva', 'Inspección preventiva', 'active'),
        ('regulatory', 'Inspección normativa', 'Inspección regulatoria', 'active'),
        ('critical_control', 'Inspección de control crítico', 'Verificación de control crítico', 'active'),
        ('environmental', 'Inspección ambiental', 'Inspección ambiental general', 'active')
      ON CONFLICT (code) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO inspection_checklist_templates (inspection_type_id, code, name, description, version, is_active)
      SELECT it.id, 'TPL-ENV-GENERAL-001', 'Checklist ambiental general', 'Template base para inspecciones ambientales generales', 1, true
      FROM inspection_types it
      WHERE it.code = 'environmental'
      ON CONFLICT (code) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO inspection_checklist_sections (template_id, code, title, description, sort_order, is_active)
      SELECT t.id, 'GENERAL', 'Condiciones generales', 'Revisión base de condiciones ambientales observables', 1, true
      FROM inspection_checklist_templates t
      WHERE t.code = 'TPL-ENV-GENERAL-001'
      ON CONFLICT (template_id, code) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO inspection_checklist_items
        (section_id, code, question, response_type, is_required, requires_evidence_on_not_compliant, sort_order, weight, is_active)
      SELECT s.id, 'ORDEN-LIMPIEZA', '¿El área se encuentra limpia, ordenada y sin residuos fuera de lugar?', 'compliance', true, true, 1, '1.00', true
      FROM inspection_checklist_sections s
      JOIN inspection_checklist_templates t ON t.id = s.template_id
      WHERE t.code = 'TPL-ENV-GENERAL-001' AND s.code = 'GENERAL'
      ON CONFLICT (section_id, code) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO inspection_checklist_items
        (section_id, code, question, response_type, is_required, requires_evidence_on_not_compliant, sort_order, weight, is_active)
      SELECT s.id, 'SEGREGACION', '¿Los residuos se encuentran segregados de acuerdo con el estándar aplicable?', 'compliance', true, true, 2, '1.00', true
      FROM inspection_checklist_sections s
      JOIN inspection_checklist_templates t ON t.id = s.template_id
      WHERE t.code = 'TPL-ENV-GENERAL-001' AND s.code = 'GENERAL'
      ON CONFLICT (section_id, code) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO inspection_checklist_items
        (section_id, code, question, response_type, is_required, requires_evidence_on_not_compliant, sort_order, weight, is_active)
      SELECT s.id, 'DERRAMES', '¿El área se encuentra libre de señales de pérdida de contención?', 'yes_no_na', true, true, 3, '1.00', true
      FROM inspection_checklist_sections s
      JOIN inspection_checklist_templates t ON t.id = s.template_id
      WHERE t.code = 'TPL-ENV-GENERAL-001' AND s.code = 'GENERAL'
      ON CONFLICT (section_id, code) DO NOTHING
    `);
  }

  public async down(): Promise<void> {}
}
