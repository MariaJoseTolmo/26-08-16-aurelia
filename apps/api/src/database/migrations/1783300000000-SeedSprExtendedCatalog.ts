import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Catálogo SPR extendido:
 * - Manuales faltantes (SO + compartidos Planta/Mina)
 * - Medio Ambiente automático (Incidentes 16 + Residuos 7)
 * - Sustentabilidad automático (4)
 *
 * Fuentes (producto Alexis, no columnas BD):
 * - Incidentes → Módulo Incidentes · AurelIA (automático)
 * - Residuos MA → Módulo Residuos · AurelIA (automático)
 * - Sustentabilidad → SAP Financiero · Bot RPA (automático)
 */
export class SeedSprExtendedCatalog1783300000000 implements MigrationInterface {
  name = 'SeedSprExtendedCatalog1783300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO areas (code, name, status)
      VALUES ('AREA-SUSTENTABILIDAD', 'Sustentabilidad', 'active')
      ON CONFLICT (code) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO spr_units (code, name, symbol, status)
      VALUES ('ea', 'Each / unidad', 'EA', 'active')
      ON CONFLICT (code) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO spr_measure_groups (code, name, description, sort_order, status)
      VALUES
        ('incidents', 'Incidentes ambientales', 'Conteos por nivel de incidente ambiental', 80, 'active'),
        ('waste_materials', 'Residuos y materiales', 'Residuos pesados, químicos, hidrocarburos y brine', 90, 'active'),
        ('sustainability_opex', 'Gasto operacional sustentabilidad', 'OPEX de prevención, auditorías y estudios', 100, 'active')
      ON CONFLICT (code) DO NOTHING
    `);

    const parameters: Array<{
      code: string;
      name: string;
      description: string;
      group: string;
      unit: string;
      sort: number;
    }> = [
      // Manuales faltantes / compartidos
      {
        code: 'CHEMICALS',
        name: 'Chemicals (packaging/expired)',
        description: 'Químicos (envases/vencidos) — Planta / SSOO / MA Residuos',
        group: 'waste_materials',
        unit: 'ton',
        sort: 200,
      },
      {
        code: 'HYDROCARBONS',
        name: 'Hydrocarbons (oil, grease)',
        description: 'Hidrocarburos — Mina / SSOO / MA Residuos',
        group: 'waste_materials',
        unit: 'ton',
        sort: 210,
      },
      {
        code: 'BRINE-PRECIPITATE',
        name: 'Brine Precipitate',
        description: 'Brine precipitate — SSOO / MA Residuos',
        group: 'waste_materials',
        unit: 'ton',
        sort: 220,
      },
      {
        code: 'LONG-HAUL-FLIGHTS',
        name: 'Long Haul Flights',
        description: 'Vuelos long haul — Servicios Operacionales',
        group: 'transport',
        unit: 'km',
        sort: 230,
      },
      {
        code: 'GENERAL-LANDFILL',
        name: 'Weighed: General Landfill',
        description: 'Relleno sanitario pesado — SSOO / MA Residuos',
        group: 'waste_materials',
        unit: 'ton',
        sort: 240,
      },
      {
        code: 'OTHER-WASTE',
        name: 'Other (Brine, packaging, sludge)',
        description: 'Otros residuos — Servicios Operacionales',
        group: 'waste_materials',
        unit: 'ton',
        sort: 250,
      },

      // MA Incidentes (fuente producto: Módulo Incidentes · AurelIA)
      {
        code: 'INCIDENT-LEVEL-0',
        name: 'Level 0',
        description: 'Incidentes Level 0 — Módulo Incidentes · AurelIA (automático)',
        group: 'incidents',
        unit: 'ea',
        sort: 300,
      },
      {
        code: 'INCIDENT-L1-RELEASE-AIR',
        name: 'Level 1 — Release to air',
        description: 'Incidentes L1 Release to air — Módulo Incidentes · AurelIA (automático)',
        group: 'incidents',
        unit: 'ea',
        sort: 310,
      },
      {
        code: 'INCIDENT-L1-LOSS-CONTAINMENT',
        name: 'Level 1 — Loss of containment',
        description: 'Incidentes L1 Loss of containment — Módulo Incidentes · AurelIA (automático)',
        group: 'incidents',
        unit: 'ea',
        sort: 320,
      },
      {
        code: 'INCIDENT-L1-LAND-DISTURBANCE',
        name: 'Level 1 — Land disturbance',
        description: 'Incidentes L1 Land disturbance — Módulo Incidentes · AurelIA (automático)',
        group: 'incidents',
        unit: 'ea',
        sort: 330,
      },
      {
        code: 'INCIDENT-L1-FAUNA-FLORA',
        name: 'Level 1 — Impact on fauna and flora',
        description: 'Incidentes L1 Fauna/flora — Módulo Incidentes · AurelIA (automático)',
        group: 'incidents',
        unit: 'ea',
        sort: 340,
      },
      {
        code: 'INCIDENT-L1-WASTE-MGMT',
        name: 'Level 1 — Waste management or disposal',
        description: 'Incidentes L1 Waste management — Módulo Incidentes · AurelIA (automático)',
        group: 'incidents',
        unit: 'ea',
        sort: 350,
      },
      {
        code: 'INCIDENT-L1-BLASTING-VIBRATION',
        name: 'Level 1 — Blasting and vibration',
        description: 'Incidentes L1 Blasting/vibration — Módulo Incidentes · AurelIA (automático)',
        group: 'incidents',
        unit: 'ea',
        sort: 360,
      },
      {
        code: 'INCIDENT-L2-RELEASE-AIR',
        name: 'Level 2 — Release to air',
        description: 'Incidentes L2 Release to air — Módulo Incidentes · AurelIA (automático)',
        group: 'incidents',
        unit: 'ea',
        sort: 370,
      },
      {
        code: 'INCIDENT-L2-LOSS-CONTAINMENT',
        name: 'Level 2 — Loss of containment',
        description: 'Incidentes L2 Loss of containment — Módulo Incidentes · AurelIA (automático)',
        group: 'incidents',
        unit: 'ea',
        sort: 380,
      },
      {
        code: 'INCIDENT-L2-LAND-DISTURBANCE',
        name: 'Level 2 — Land disturbance',
        description: 'Incidentes L2 Land disturbance — Módulo Incidentes · AurelIA (automático)',
        group: 'incidents',
        unit: 'ea',
        sort: 390,
      },
      {
        code: 'INCIDENT-L2-FAUNA-FLORA',
        name: 'Level 2 — Impact on fauna and flora',
        description: 'Incidentes L2 Fauna/flora — Módulo Incidentes · AurelIA (automático)',
        group: 'incidents',
        unit: 'ea',
        sort: 400,
      },
      {
        code: 'INCIDENT-L2-WASTE-MGMT',
        name: 'Level 2 — Waste management or disposal',
        description: 'Incidentes L2 Waste management — Módulo Incidentes · AurelIA (automático)',
        group: 'incidents',
        unit: 'ea',
        sort: 410,
      },
      {
        code: 'INCIDENT-L2-BLASTING-VIBRATION',
        name: 'Level 2 — Blasting and vibration',
        description: 'Incidentes L2 Blasting/vibration — Módulo Incidentes · AurelIA (automático)',
        group: 'incidents',
        unit: 'ea',
        sort: 420,
      },
      {
        code: 'INCIDENT-LEVEL-3',
        name: 'Level 3',
        description: 'Incidentes Level 3 — Módulo Incidentes · AurelIA (automático)',
        group: 'incidents',
        unit: 'ea',
        sort: 430,
      },
      {
        code: 'INCIDENT-LEVEL-4',
        name: 'Level 4',
        description: 'Incidentes Level 4 — Módulo Incidentes · AurelIA (automático)',
        group: 'incidents',
        unit: 'ea',
        sort: 440,
      },
      {
        code: 'INCIDENT-LEVEL-5',
        name: 'Level 5',
        description: 'Incidentes Level 5 — Módulo Incidentes · AurelIA (automático)',
        group: 'incidents',
        unit: 'ea',
        sort: 450,
      },

      // MA Residuos exclusivos (fuente: Módulo Residuos · AurelIA)
      {
        code: 'WEIGHED-METAL',
        name: 'Weighed: Metal',
        description: 'Metal pesado — Módulo Residuos · AurelIA (automático)',
        group: 'waste_materials',
        unit: 'ton',
        sort: 460,
      },
      {
        code: 'WEIGHED-PLASTIC',
        name: 'Weighed: Plastic',
        description: 'Plástico pesado — Módulo Residuos · AurelIA (automático)',
        group: 'waste_materials',
        unit: 'ton',
        sort: 470,
      },
      {
        code: 'BATTERIES',
        name: 'Batteries',
        description: 'Baterías — Módulo Residuos · AurelIA (automático)',
        group: 'waste_materials',
        unit: 'ton',
        sort: 480,
      },

      // Sustentabilidad (fuente: SAP Financiero · Bot RPA)
      {
        code: 'POLLUTION-PREVENTION',
        name: 'Pollution prevention',
        description: 'Prevención de contaminación — SAP Financiero · Bot RPA (automático)',
        group: 'sustainability_opex',
        unit: 'usd',
        sort: 500,
      },
      {
        code: 'AUDITS',
        name: 'Audits',
        description: 'Auditorías — SAP Financiero · Bot RPA (automático)',
        group: 'sustainability_opex',
        unit: 'usd',
        sort: 510,
      },
      {
        code: 'SPECIALIST-STUDIES-EIAS',
        name: 'Specialist Studies and EIAs',
        description: 'Estudios especializados y EIAs — SAP Financiero · Bot RPA (automático)',
        group: 'sustainability_opex',
        unit: 'usd',
        sort: 520,
      },
      {
        code: 'OTHER-OPEX',
        name: 'Other Operational Expenditure',
        description: 'Otro gasto operacional — SAP Financiero · Bot RPA (automático)',
        group: 'sustainability_opex',
        unit: 'usd',
        sort: 530,
      },
    ];

    for (const parameter of parameters) {
      await queryRunner.query(
        `
        INSERT INTO spr_parameters
          (measure_group_id, unit_id, code, name, description, is_sox, requires_evidence, value_type, sort_order, status)
        SELECT g.id, u.id, $1, $2, $3, false, false, 'numeric', $4, 'active'
        FROM spr_measure_groups g
        JOIN spr_units u ON u.code = $5
        WHERE g.code = $6
        ON CONFLICT (code) DO NOTHING
        `,
        [parameter.code, parameter.name, parameter.description, parameter.sort, parameter.unit, parameter.group],
      );
    }

    const assignments: Array<{ parameterCode: string; areaCode: string }> = [
      // Manuales / compartidos
      { parameterCode: 'CHEMICALS', areaCode: 'AREA-PLANTA' },
      { parameterCode: 'CHEMICALS', areaCode: 'AREA-SOPERACIONALES' },
      { parameterCode: 'HYDROCARBONS', areaCode: 'AREA-MINA' },
      { parameterCode: 'HYDROCARBONS', areaCode: 'AREA-SOPERACIONALES' },
      { parameterCode: 'BRINE-PRECIPITATE', areaCode: 'AREA-SOPERACIONALES' },
      { parameterCode: 'LONG-HAUL-FLIGHTS', areaCode: 'AREA-SOPERACIONALES' },
      { parameterCode: 'GENERAL-LANDFILL', areaCode: 'AREA-SOPERACIONALES' },
      { parameterCode: 'OTHER-WASTE', areaCode: 'AREA-SOPERACIONALES' },

      // MA Incidentes (16)
      { parameterCode: 'INCIDENT-LEVEL-0', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'INCIDENT-L1-RELEASE-AIR', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'INCIDENT-L1-LOSS-CONTAINMENT', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'INCIDENT-L1-LAND-DISTURBANCE', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'INCIDENT-L1-FAUNA-FLORA', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'INCIDENT-L1-WASTE-MGMT', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'INCIDENT-L1-BLASTING-VIBRATION', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'INCIDENT-L2-RELEASE-AIR', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'INCIDENT-L2-LOSS-CONTAINMENT', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'INCIDENT-L2-LAND-DISTURBANCE', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'INCIDENT-L2-FAUNA-FLORA', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'INCIDENT-L2-WASTE-MGMT', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'INCIDENT-L2-BLASTING-VIBRATION', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'INCIDENT-LEVEL-3', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'INCIDENT-LEVEL-4', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'INCIDENT-LEVEL-5', areaCode: 'AREA-MAMBIENTE' },

      // MA Residuos (7 = 3 exclusivos + 4 compartidos)
      { parameterCode: 'WEIGHED-METAL', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'WEIGHED-PLASTIC', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'HYDROCARBONS', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'GENERAL-LANDFILL', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'CHEMICALS', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'BATTERIES', areaCode: 'AREA-MAMBIENTE' },
      { parameterCode: 'BRINE-PRECIPITATE', areaCode: 'AREA-MAMBIENTE' },

      // Sustentabilidad (4)
      { parameterCode: 'POLLUTION-PREVENTION', areaCode: 'AREA-SUSTENTABILIDAD' },
      { parameterCode: 'AUDITS', areaCode: 'AREA-SUSTENTABILIDAD' },
      { parameterCode: 'SPECIALIST-STUDIES-EIAS', areaCode: 'AREA-SUSTENTABILIDAD' },
      { parameterCode: 'OTHER-OPEX', areaCode: 'AREA-SUSTENTABILIDAD' },
    ];

    for (const assignment of assignments) {
      await queryRunner.query(
        `
        INSERT INTO spr_parameter_area_assignments (parameter_id, area_id, status)
        SELECT p.id, a.id, 'active'
        FROM spr_parameters p
        JOIN areas a ON a.code = $2
        WHERE p.code = $1
        ON CONFLICT ON CONSTRAINT uq_spr_assignment_parameter_area DO NOTHING
        `,
        [assignment.parameterCode, assignment.areaCode],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const parameterCodes = [
      'CHEMICALS',
      'HYDROCARBONS',
      'BRINE-PRECIPITATE',
      'LONG-HAUL-FLIGHTS',
      'GENERAL-LANDFILL',
      'OTHER-WASTE',
      'INCIDENT-LEVEL-0',
      'INCIDENT-L1-RELEASE-AIR',
      'INCIDENT-L1-LOSS-CONTAINMENT',
      'INCIDENT-L1-LAND-DISTURBANCE',
      'INCIDENT-L1-FAUNA-FLORA',
      'INCIDENT-L1-WASTE-MGMT',
      'INCIDENT-L1-BLASTING-VIBRATION',
      'INCIDENT-L2-RELEASE-AIR',
      'INCIDENT-L2-LOSS-CONTAINMENT',
      'INCIDENT-L2-LAND-DISTURBANCE',
      'INCIDENT-L2-FAUNA-FLORA',
      'INCIDENT-L2-WASTE-MGMT',
      'INCIDENT-L2-BLASTING-VIBRATION',
      'INCIDENT-LEVEL-3',
      'INCIDENT-LEVEL-4',
      'INCIDENT-LEVEL-5',
      'WEIGHED-METAL',
      'WEIGHED-PLASTIC',
      'BATTERIES',
      'POLLUTION-PREVENTION',
      'AUDITS',
      'SPECIALIST-STUDIES-EIAS',
      'OTHER-OPEX',
    ];

    await queryRunner.query(
      `
      DELETE FROM spr_parameter_area_assignments
      WHERE parameter_id IN (SELECT id FROM spr_parameters WHERE code = ANY($1::text[]))
      `,
      [parameterCodes],
    );

    await queryRunner.query(`DELETE FROM spr_parameters WHERE code = ANY($1::text[])`, [parameterCodes]);

    await queryRunner.query(`
      DELETE FROM spr_measure_groups
      WHERE code IN ('incidents', 'waste_materials', 'sustainability_opex')
    `);

    await queryRunner.query(`DELETE FROM spr_units WHERE code = 'ea'`);
  }
}
