import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase6ASprCatalogSeed1719501000000 implements MigrationInterface {
  name = 'Phase6ASprCatalogSeed1719501000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO spr_units (code, name, symbol, status)
      VALUES
        ('unit', 'Unidad', 'un', 'active'),
        ('count', 'Cantidad', null, 'active'),
        ('percent', 'Porcentaje', '%', 'active'),
        ('m3', 'Metro cúbico', 'm³', 'active'),
        ('kg', 'Kilogramo', 'kg', 'active'),
        ('ton', 'Tonelada', 't', 'active'),
        ('kwh', 'Kilowatt hora', 'kWh', 'active'),
        ('clp', 'Peso chileno', 'CLP', 'active')
      ON CONFLICT (code) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO spr_measure_groups (code, name, description, sort_order, status)
      VALUES
        ('water', 'Agua', 'Parámetros mensuales asociados a consumo, captación o descarga de agua', 1, 'active'),
        ('waste', 'Residuos', 'Parámetros mensuales asociados a residuos peligrosos y no peligrosos', 2, 'active'),
        ('energy', 'Energía', 'Parámetros mensuales asociados a consumo energético', 3, 'active'),
        ('emissions', 'Emisiones', 'Parámetros mensuales asociados a emisiones y reportabilidad ambiental', 4, 'active'),
        ('compliance', 'Cumplimiento', 'Parámetros mensuales asociados a compromisos, permisos y cumplimiento', 5, 'active')
      ON CONFLICT (code) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO spr_parameters
        (measure_group_id, unit_id, code, name, description, is_sox, requires_evidence, value_type, sort_order, status)
      SELECT g.id, u.id, 'WATER-CONSUMPTION-M3', 'Consumo mensual de agua', 'Consumo mensual de agua reportado para SPR', true, true, 'numeric', 1, 'active'
      FROM spr_measure_groups g
      JOIN spr_units u ON u.code = 'm3'
      WHERE g.code = 'water'
      ON CONFLICT (code) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO spr_parameters
        (measure_group_id, unit_id, code, name, description, is_sox, requires_evidence, value_type, sort_order, status)
      SELECT g.id, u.id, 'WASTE-HAZARDOUS-TON', 'Residuos peligrosos generados', 'Toneladas mensuales de residuos peligrosos generados', true, true, 'numeric', 1, 'active'
      FROM spr_measure_groups g
      JOIN spr_units u ON u.code = 'ton'
      WHERE g.code = 'waste'
      ON CONFLICT (code) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO spr_parameters
        (measure_group_id, unit_id, code, name, description, is_sox, requires_evidence, value_type, sort_order, status)
      SELECT g.id, u.id, 'ENERGY-CONSUMPTION-KWH', 'Consumo mensual de energía', 'Consumo mensual de energía eléctrica', false, false, 'numeric', 1, 'active'
      FROM spr_measure_groups g
      JOIN spr_units u ON u.code = 'kwh'
      WHERE g.code = 'energy'
      ON CONFLICT (code) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO spr_consolidation_rules (parameter_id, code, name, method, config, status)
      SELECT p.id, p.code || '-SUM', 'Consolidación mensual por suma', 'sum', '{"groupBy":["periodYear","periodMonth"]}'::jsonb, 'active'
      FROM spr_parameters p
      WHERE p.code IN ('WATER-CONSUMPTION-M3', 'WASTE-HAZARDOUS-TON', 'ENERGY-CONSUMPTION-KWH')
      ON CONFLICT (code) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM spr_consolidation_rules WHERE code IN ('WATER-CONSUMPTION-M3-SUM', 'WASTE-HAZARDOUS-TON-SUM', 'ENERGY-CONSUMPTION-KWH-SUM')`);
    await queryRunner.query(`DELETE FROM spr_parameters WHERE code IN ('WATER-CONSUMPTION-M3', 'WASTE-HAZARDOUS-TON', 'ENERGY-CONSUMPTION-KWH')`);
    await queryRunner.query(`DELETE FROM spr_measure_groups WHERE code IN ('water', 'waste', 'energy', 'emissions', 'compliance')`);
    await queryRunner.query(`DELETE FROM spr_units WHERE code IN ('unit', 'count', 'percent', 'm3', 'kg', 'ton', 'kwh', 'clp')`);
  }
}
