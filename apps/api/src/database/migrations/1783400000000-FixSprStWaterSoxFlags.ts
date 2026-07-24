import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Corrige is_sox / requires_evidence en los 3 parámetros de agua de Servicios Técnicos.
 * SeedSprManualCatalog los insertó con false,false por default blanket;
 * son parte de los 11 indicadores SOX (resto del catálogo pendiente de Alexis).
 */
export class FixSprStWaterSoxFlags1783400000000 implements MigrationInterface {
  name = 'FixSprStWaterSoxFlags1783400000000';

  private readonly parameterCodes = [
    'GROUNDWATER-FRESHWATER',
    'VOLUME-RECYCLED-WATER',
    'VOLUME-REUSED-WATER',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      UPDATE spr_parameters
      SET is_sox = true,
          requires_evidence = true,
          updated_at = NOW()
      WHERE code = ANY($1::text[])
      `,
      [this.parameterCodes],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      UPDATE spr_parameters
      SET is_sox = false,
          requires_evidence = false,
          updated_at = NOW()
      WHERE code = ANY($1::text[])
      `,
      [this.parameterCodes],
    );
  }
}
