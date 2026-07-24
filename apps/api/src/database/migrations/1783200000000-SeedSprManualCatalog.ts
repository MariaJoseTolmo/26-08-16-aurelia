import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Catálogo SPR — 6 áreas MANUALES (Excel SPR_2026_05 + HCl confirmado por Alexis).
 * No incluye MA/Sustentabilidad ni params SO extras (Long Haul, Hydrocarbons, etc.).
 */
export class SeedSprManualCatalog1783200000000 implements MigrationInterface {
  name = 'SeedSprManualCatalog1783200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Áreas nuevas (idempotente; Mina/Planta/ST/MA ya existen en seed demo).
    await queryRunner.query(`
      INSERT INTO areas (code, name, status)
      VALUES
        ('AREA-OPTACTIVOS', 'Optimización de Activos', 'active'),
        ('AREA-FINANZAS', 'Finanzas', 'active'),
        ('AREA-SOPERACIONALES', 'Servicios Operacionales', 'active')
      ON CONFLICT (code) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO spr_units (code, name, symbol, status)
      VALUES
        ('klt', 'Kilolitro', 'KLT', 'active'),
        ('mwh', 'Megawatt hora', 'MWh', 'active'),
        ('usd', 'Dólar estadounidense', 'USD', 'active'),
        ('mlt', 'Megalitro', 'MLT', 'active'),
        ('km', 'Kilómetro', 'km', 'active')
      ON CONFLICT (code) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO spr_measure_groups (code, name, description, sort_order, status)
      VALUES
        ('reagents', 'Reactivos y gases de proceso', 'Cianuro, ácidos, cal, soda, acetileno, LPG', 10, 'active'),
        ('explosives', 'Explosivos', 'Agentes de voladura', 20, 'active'),
        ('fuel', 'Combustibles diesel', 'Consumo diesel por uso', 30, 'active'),
        ('electricity', 'Electricidad generada', 'Generación eléctrica asociada a diesel', 40, 'active'),
        ('energy_costs', 'Costos de energía', 'Costos en USD de diesel y electricidad', 50, 'active'),
        ('transport', 'Transporte', 'Kilometraje terrestre y vuelos', 60, 'active'),
        ('mining_materials', 'Materiales mineros', 'Relaves y waste rock', 70, 'active')
      ON CONFLICT (code) DO NOTHING
    `);

    // water / ton / kg ya existen en Phase6ASprCatalogSeed.

    const parameters: Array<{
      code: string;
      name: string;
      description: string;
      group: string;
      unit: string;
      sort: number;
      isSox?: boolean;
      requiresEvidence?: boolean;
    }> = [
      {
        code: 'CYANIDE',
        name: 'Cyanide',
        description: 'Cianuro — reporte Planta (SPR_2026_05)',
        group: 'reagents',
        unit: 'ton',
        sort: 10,
      },
      {
        code: 'BLASTING-AGENTS',
        name: 'Blasting agents',
        description: 'Explosivos — reporte Mina (SPR_2026_05)',
        group: 'explosives',
        unit: 'ton',
        sort: 20,
      },
      {
        code: 'LIME',
        name: 'Lime',
        description: 'Cal / Lime — solo Planta (SPR_2026_05; SSOO:0 no asigna)',
        group: 'reagents',
        unit: 'ton',
        sort: 30,
      },
      {
        code: 'CAUSTIC-SODA',
        name: 'Caustic soda',
        description: 'Soda cáustica — reporte Planta (SPR_2026_05)',
        group: 'reagents',
        unit: 'ton',
        sort: 40,
      },
      {
        code: 'HCL',
        name: 'HCl',
        description: 'Ácido clorhídrico — Planta (confirmado Alexis; sin valor May-2026 en Excel)',
        group: 'reagents',
        unit: 'ton',
        sort: 50,
      },
      {
        code: 'DIESEL-HAULAGE-OTHER',
        name: 'Diesel: Haulage and Other',
        description: 'Diesel haulage y otros — Optimización de Activos (SPR_2026_05)',
        group: 'fuel',
        unit: 'klt',
        sort: 60,
      },
      {
        code: 'DIESEL-POWER-GENERATION',
        name: 'Diesel: Power Generation',
        description: 'Diesel generación eléctrica — Optimización de Activos (SPR_2026_05)',
        group: 'fuel',
        unit: 'klt',
        sort: 70,
      },
      {
        code: 'LPG-PROCESS',
        name: 'Gas for Process (LPG)',
        description: 'LPG de proceso — compartido Mina / Servicios Operacionales (SPR_2026_05)',
        group: 'reagents',
        unit: 'kg',
        sort: 80,
      },
      {
        code: 'ACETYLENE',
        name: 'Acetylene',
        description: 'Acetileno — compartido Planta / Mina (SPR_2026_05)',
        group: 'reagents',
        unit: 'kg',
        sort: 90,
      },
      {
        code: 'DIESEL-PLANTS-ELECTRICITY',
        name: 'Diesel Plants Electricity Generated',
        description: 'Electricidad generada plantas diesel — Optimización de Activos (SPR_2026_05)',
        group: 'electricity',
        unit: 'mwh',
        sort: 100,
      },
      {
        code: 'ENERGY-COST-DIESEL-USD',
        name: 'Energy Costs: Diesel in USD',
        description: 'Costo energía diesel USD — Finanzas (SPR_2026_05)',
        group: 'energy_costs',
        unit: 'usd',
        sort: 110,
      },
      {
        code: 'ENERGY-COST-ELECTRICITY-USD',
        name: 'Energy Costs: Electricity in USD',
        description: 'Costo energía eléctrica USD — Finanzas (SPR_2026_05)',
        group: 'energy_costs',
        unit: 'usd',
        sort: 120,
      },
      // 3 de agua ST = parte de los 11 indicadores SOX (resto del catálogo pendiente de Alexis).
      {
        code: 'GROUNDWATER-FRESHWATER',
        name: 'Ground Water: Freshwater (<5000) High quality',
        description: 'Agua dulce alta calidad — Servicios Técnicos (SPR_2026_05)',
        group: 'water',
        unit: 'mlt',
        sort: 130,
        isSox: true,
        requiresEvidence: true,
      },
      {
        code: 'VOLUME-RECYCLED-WATER',
        name: 'Total Volume: Recycled Water (ML)',
        description: 'Volumen agua reciclada — Servicios Técnicos (SPR_2026_05)',
        group: 'water',
        unit: 'mlt',
        sort: 140,
        isSox: true,
        requiresEvidence: true,
      },
      {
        code: 'VOLUME-REUSED-WATER',
        name: 'Total Volume: Reused Water (ML)',
        description: 'Volumen agua reutilizada — Servicios Técnicos (SPR_2026_05)',
        group: 'water',
        unit: 'mlt',
        sort: 150,
        isSox: true,
        requiresEvidence: true,
      },
      {
        code: 'ROAD-TRAVEL-INPUT',
        name: 'Road Travel Input',
        description: 'Kilometraje terrestre — Servicios Operacionales (SPR_2026_05)',
        group: 'transport',
        unit: 'km',
        sort: 160,
      },
      {
        code: 'SHORT-HAUL-FLIGHTS',
        name: 'Short Haul Flights Input (<3700 km)',
        description: 'Vuelos short haul — Servicios Operacionales (SPR_2026_05)',
        group: 'transport',
        unit: 'km',
        sort: 170,
      },
      {
        code: 'TAILINGS-TO-DAMS',
        name: 'Tailings to dams - Calculated',
        description: 'Relaves a tranque (calculado) — Planta (SPR_2026_05)',
        group: 'mining_materials',
        unit: 'ton',
        sort: 180,
      },
      {
        code: 'WASTE-ROCK-TO-DUMP',
        name: 'Waste rock to dump - Weighed',
        description: 'Waste rock a botadero (pesado) — Mina (SPR_2026_05)',
        group: 'mining_materials',
        unit: 'ton',
        sort: 190,
      },
    ];

    for (const parameter of parameters) {
      const isSox = parameter.isSox === true;
      const requiresEvidence = parameter.requiresEvidence === true;
      await queryRunner.query(
        `
        INSERT INTO spr_parameters
          (measure_group_id, unit_id, code, name, description, is_sox, requires_evidence, value_type, sort_order, status)
        SELECT g.id, u.id, $1, $2, $3, $4, $5, 'numeric', $6, 'active'
        FROM spr_measure_groups g
        JOIN spr_units u ON u.code = $7
        WHERE g.code = $8
        ON CONFLICT (code) DO NOTHING
        `,
        [
          parameter.code,
          parameter.name,
          parameter.description,
          isSox,
          requiresEvidence,
          parameter.sort,
          parameter.unit,
          parameter.group,
        ],
      );
    }

    // Assignments: 1 fila por área; compartidos LPG y Acetylene = 2 filas.
    const assignments: Array<{ parameterCode: string; areaCode: string }> = [
      { parameterCode: 'CYANIDE', areaCode: 'AREA-PLANTA' },
      { parameterCode: 'HCL', areaCode: 'AREA-PLANTA' },
      { parameterCode: 'LIME', areaCode: 'AREA-PLANTA' },
      { parameterCode: 'CAUSTIC-SODA', areaCode: 'AREA-PLANTA' },
      { parameterCode: 'ACETYLENE', areaCode: 'AREA-PLANTA' },
      { parameterCode: 'TAILINGS-TO-DAMS', areaCode: 'AREA-PLANTA' },

      { parameterCode: 'BLASTING-AGENTS', areaCode: 'AREA-MINA' },
      { parameterCode: 'LPG-PROCESS', areaCode: 'AREA-MINA' },
      { parameterCode: 'ACETYLENE', areaCode: 'AREA-MINA' },
      { parameterCode: 'WASTE-ROCK-TO-DUMP', areaCode: 'AREA-MINA' },

      { parameterCode: 'DIESEL-HAULAGE-OTHER', areaCode: 'AREA-OPTACTIVOS' },
      { parameterCode: 'DIESEL-POWER-GENERATION', areaCode: 'AREA-OPTACTIVOS' },
      { parameterCode: 'DIESEL-PLANTS-ELECTRICITY', areaCode: 'AREA-OPTACTIVOS' },

      { parameterCode: 'ENERGY-COST-DIESEL-USD', areaCode: 'AREA-FINANZAS' },
      { parameterCode: 'ENERGY-COST-ELECTRICITY-USD', areaCode: 'AREA-FINANZAS' },

      { parameterCode: 'GROUNDWATER-FRESHWATER', areaCode: 'AREA-STECNICOS' },
      { parameterCode: 'VOLUME-RECYCLED-WATER', areaCode: 'AREA-STECNICOS' },
      { parameterCode: 'VOLUME-REUSED-WATER', areaCode: 'AREA-STECNICOS' },

      { parameterCode: 'LPG-PROCESS', areaCode: 'AREA-SOPERACIONALES' },
      { parameterCode: 'ROAD-TRAVEL-INPUT', areaCode: 'AREA-SOPERACIONALES' },
      { parameterCode: 'SHORT-HAUL-FLIGHTS', areaCode: 'AREA-SOPERACIONALES' },
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
      'CYANIDE',
      'BLASTING-AGENTS',
      'LIME',
      'CAUSTIC-SODA',
      'HCL',
      'DIESEL-HAULAGE-OTHER',
      'DIESEL-POWER-GENERATION',
      'LPG-PROCESS',
      'ACETYLENE',
      'DIESEL-PLANTS-ELECTRICITY',
      'ENERGY-COST-DIESEL-USD',
      'ENERGY-COST-ELECTRICITY-USD',
      'GROUNDWATER-FRESHWATER',
      'VOLUME-RECYCLED-WATER',
      'VOLUME-REUSED-WATER',
      'ROAD-TRAVEL-INPUT',
      'SHORT-HAUL-FLIGHTS',
      'TAILINGS-TO-DAMS',
      'WASTE-ROCK-TO-DUMP',
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
      WHERE code IN ('reagents', 'explosives', 'fuel', 'electricity', 'energy_costs', 'transport', 'mining_materials')
    `);

    await queryRunner.query(`
      DELETE FROM spr_units WHERE code IN ('klt', 'mwh', 'usd', 'mlt', 'km')
    `);

    // No borramos áreas nuevas: pueden tener sectores/usuarios en entornos demo.
  }
}
