import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase5AIncidentCatalogSeed1719401000000 implements MigrationInterface {
  name = 'Phase5AIncidentCatalogSeed1719401000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO incident_types (code, name, description, status)
      VALUES
        ('spill', 'Derrame / pérdida de contención', 'Evento asociado a pérdida de contención de sustancias o residuos', 'active'),
        ('emission', 'Emisión ambiental', 'Evento asociado a emisiones atmosféricas, ruido u olores', 'active'),
        ('waste', 'Gestión de residuos', 'Evento asociado a manejo, segregación o disposición de residuos', 'active'),
        ('water', 'Agua', 'Evento asociado a captación, descarga, escorrentía o calidad de agua', 'active'),
        ('flora_fauna', 'Flora y fauna', 'Evento asociado a afectación de flora, fauna o hábitat', 'active'),
        ('other', 'Otro incidente ambiental', 'Otro evento ambiental no clasificado', 'active')
      ON CONFLICT (code) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO incident_levels (code, level_number, name, sla_hours, requires_investigation, description, status)
      VALUES
        ('level_0', 0, 'Nivel 0', 24, false, 'Evento menor o desviación sin impacto ambiental relevante', 'active'),
        ('level_1', 1, 'Nivel 1', 24, false, 'Evento menor con control inmediato', 'active'),
        ('level_2', 2, 'Nivel 2', 12, false, 'Evento moderado que requiere seguimiento operacional', 'active'),
        ('level_3', 3, 'Nivel 3', 12, true, 'Evento significativo con investigación obligatoria', 'active'),
        ('level_4', 4, 'Nivel 4', 6, true, 'Evento severo con investigación obligatoria y alta prioridad', 'active'),
        ('level_5', 5, 'Nivel 5', 2, true, 'Evento crítico con atención inmediata', 'active')
      ON CONFLICT (code) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM incident_levels WHERE code IN ('level_0', 'level_1', 'level_2', 'level_3', 'level_4', 'level_5')`);
    await queryRunner.query(`DELETE FROM incident_types WHERE code IN ('spill', 'emission', 'waste', 'water', 'flora_fauna', 'other')`);
  }
}
