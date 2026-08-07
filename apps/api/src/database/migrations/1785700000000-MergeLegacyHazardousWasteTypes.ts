import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fusiona los tipos peligrosos heredados contra su equivalente del catálogo
 * RESPEL y los elimina.
 *
 * DE DÓNDE SALEN ESOS TIPOS: de un seed de datos demo que se creó y se revirtió
 * sin llegar a commitearse. Ningún archivo del repo los produce, así que existen
 * solo en las bases donde ese seed alcanzó a correr —entornos locales y, según
 * el caso, el dev compartido—. Tras `SeedRespelWasteTypes` quedaban conviviendo
 * con su equivalente RESPEL y el selector "Residuo específico" mostraba las dos
 * versiones del mismo residuo.
 *
 * La migración es IDEMPOTENTE y no-op donde esos tipos nunca existieron: cada
 * sentencia se ancla por `code`, y si no hay fila el `WHERE` no encuentra nada.
 *
 * NO se toca `HUAIPE_CONTAMINADO`. Es el único heredado que no duplica a nadie:
 * "Huaipe contaminado" no figura en el catálogo RESPEL entregado —lo más cercano
 * sería "Sólidos contaminados con hidrocarburos", que no es lo mismo— así que
 * borrarlo perdería un residuo real. Queda pendiente de confirmación.
 */

/**
 * Cada heredado y el RESPEL que lo reemplaza.
 *
 * `ENVASES_CONTAMINADOS` es el único mapeo opinado: el nombre heredado es
 * genérico y el catálogo RESPEL separa los envases por contaminante
 * (hidrocarburos/aceites/grasas vs. sustancias inflamables). Se elige el de
 * hidrocarburos por ser el caso habitual en faena.
 */
const TYPE_MERGES: Array<{ legacyCode: string; respelCode: string }> = [
  { legacyCode: 'ACEITE_USADO', respelCode: 'RESPEL_ACEITE_MINERAL_USADO' },
  { legacyCode: 'BATERIAS_PLOMO', respelCode: 'RESPEL_BATERIAS_PLOMO' },
  { legacyCode: 'ENVASES_CONTAMINADOS', respelCode: 'RESPEL_ENVASES_CONT_HIDROCARBUROS' },
  { legacyCode: 'SOLVENTES_HALOGENADOS', respelCode: 'RESPEL_SOLVENTES_HALOGENADOS' },
];

/** Tablas que apuntan a `waste_types`, todas con `ON DELETE RESTRICT`. */
const REFERENCING_TABLES = ['waste_lots', 'waste_sinader_period_lines'];

export class MergeLegacyHazardousWasteTypes1785700000000 implements MigrationInterface {
  name = 'MergeLegacyHazardousWasteTypes1785700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const { legacyCode, respelCode } of TYPE_MERGES) {
      for (const table of REFERENCING_TABLES) {
        /*
         * El `EXISTS` sobre el destino no es defensa de más: sin él, si el
         * catálogo RESPEL no estuviera sembrado, el subselect devolvería NULL y
         * el UPDATE reventaría contra el NOT NULL de la columna —o peor, dejaría
         * lotes huérfanos si algún día admitiera nulos—.
         */
        await queryRunner.query(`
          UPDATE "${table}"
          SET "waste_type_id" = (SELECT "id" FROM "waste_types" WHERE "code" = $1)
          WHERE "waste_type_id" = (SELECT "id" FROM "waste_types" WHERE "code" = $2)
            AND EXISTS (SELECT 1 FROM "waste_types" WHERE "code" = $1)
        `, [respelCode, legacyCode]);
      }
    }

    // Con las referencias ya movidas, el RESTRICT de las FK deja borrar. Si algo
    // quedó apuntando, la migración falla acá en vez de dejar datos colgando.
    const legacyCodes = TYPE_MERGES.map(({ legacyCode }) => legacyCode);
    await queryRunner.query(`DELETE FROM "waste_types" WHERE "code" = ANY($1)`, [legacyCodes]);
  }

  async down(): Promise<void> {
    // Sin vuelta atrás posible ni deseable: estos tipos no los creó ninguna
    // migración —venían de un seed revertido—, así que no hay estado anterior
    // que reconstruir, y los `id` que referenciaban los lotes ya no existen.
  }
}
