import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Demo Opción B — Planta en estado "En consolidado":
 * 7 records Mayo 2026 submitted por Sofía Reyes, sin approvals de Gerente.
 * No toca Servicios Técnicos (Completa).
 */
export class SeedSprPlantaSubmittedRecords1783500000000 implements MigrationInterface {
  name = 'SeedSprPlantaSubmittedRecords1783500000000';

  private readonly parameterValues: Array<{ code: string; value: string }> = [
    { code: 'CYANIDE', value: '12.450000' },
    { code: 'HCL', value: '8.200000' },
    { code: 'LIME', value: '95.000000' },
    { code: 'CAUSTIC-SODA', value: '21.300000' },
    { code: 'ACETYLENE', value: '340.000000' },
    { code: 'TAILINGS-TO-DAMS', value: '1180000.000000' },
    { code: 'CHEMICALS', value: '4.750000' },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vincular assignments de Planta a Sofía (responsable) y Miguel (aprobador).
    await queryRunner.query(
      `
      UPDATE spr_parameter_area_assignments paa
      SET responsible_user_id = sofia.id,
          approver_user_id = miguel.id,
          updated_at = NOW()
      FROM areas a,
           users sofia,
           users miguel
      WHERE paa.area_id = a.id
        AND a.code = 'AREA-PLANTA'
        AND sofia.email = 'sofia.reyes@goldfields.com'
        AND miguel.email = 'miguel.castro@goldfields.com'
      `,
    );

    for (const parameter of this.parameterValues) {
      await queryRunner.query(
        `
        INSERT INTO spr_monthly_records (
          parameter_id,
          area_id,
          assignment_id,
          period_year,
          period_month,
          numeric_value,
          status,
          submitted_by_user_id,
          submitted_at,
          notes
        )
        SELECT
          p.id,
          a.id,
          paa.id,
          2026,
          5,
          $2::numeric,
          'submitted',
          sofia.id,
          TIMESTAMPTZ '2026-06-04 16:33:00-04',
          'Demo: formulario Planta enviado · pendiente de Gerente'
        FROM spr_parameters p
        JOIN areas a ON a.code = 'AREA-PLANTA'
        JOIN spr_parameter_area_assignments paa
          ON paa.parameter_id = p.id AND paa.area_id = a.id AND paa.status = 'active'
        JOIN users sofia ON sofia.email = 'sofia.reyes@goldfields.com'
        WHERE p.code = $1
        ON CONFLICT ON CONSTRAINT uq_spr_record_period DO NOTHING
        `,
        [parameter.code, parameter.value],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = this.parameterValues.map((parameter) => parameter.code);
    await queryRunner.query(
      `
      DELETE FROM spr_monthly_records r
      USING spr_parameters p, areas a
      WHERE r.parameter_id = p.id
        AND r.area_id = a.id
        AND a.code = 'AREA-PLANTA'
        AND r.period_year = 2026
        AND r.period_month = 5
        AND p.code = ANY($1::text[])
      `,
      [codes],
    );

    await queryRunner.query(
      `
      UPDATE spr_parameter_area_assignments paa
      SET responsible_user_id = NULL,
          approver_user_id = NULL,
          updated_at = NOW()
      FROM areas a
      WHERE paa.area_id = a.id
        AND a.code = 'AREA-PLANTA'
      `,
    );
  }
}
