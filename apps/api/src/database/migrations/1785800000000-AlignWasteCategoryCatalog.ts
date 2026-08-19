import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Alinea `waste_operational_categories` y `waste_types` con el catálogo de
 * negocio: 8 categorías operativas y un residuo no peligroso por cada una de las
 * siete que no son RESPEL.
 *
 * DE DÓNDE VIENE LA BRECHA: `CreateWasteModuleFoundation` sembró 4 categorías con
 * nombres descriptivos y `SeedRespelWasteTypes` los 39 tipos peligrosos. El
 * catálogo real tiene 8 categorías, se nombra por SIGLA donde existe, y cada
 * categoría no peligrosa tiene su residuo. Sin esto, el selector "Categoría
 * operativa" del formulario de ingreso —que lee `GET /waste/categories`— muestra
 * "Residuos peligrosos / Industriales no peligrosos / Domésticos / Lodos" en vez
 * del vocabulario de faena.
 *
 * EL RÓTULO COMPLETO VA EN `name`, NO EN `code`. Es lo que se muestra: el front
 * rotula las alternativas con `name`, así que ahí va `SIGLA + espacio + nombre`
 * ("RESPEL Residuos peligrosos"). El `code` no se toca —es la clave de negocio y
 * ya hay 39 tipos colgando de `HAZARDOUS`—, así que renombrar es un UPDATE del
 * rótulo, no una migración de datos.
 *
 * TRES VAN CON SIGLA Y CINCO NO. RESPEL, RSINP y RSD son como se nombran en
 * faena y en los informes reglamentarios; Lodos, Grasas, Madera, Escombros y
 * Chatarra nunca tuvieron sigla. El desparejo del desplegable es el vocabulario
 * real, no un descuido.
 *
 * IDEMPOTENTE: los renombres se anclan por `code` y los INSERT llevan
 * `ON CONFLICT DO NOTHING`, así que correrla dos veces no duplica nada.
 */

/**
 * Categorías que ya existen y solo cambian de rótulo.
 *
 * El formato es `SIGLA + espacio + nombre`, sin paréntesis ni guion: la sigla es
 * como se nombra la categoría en faena, y el nombre atrás la deja legible para
 * quien no se la sabe de memoria.
 */
const CATEGORY_RENAMES: Array<{ code: string; name: string }> = [
  { code: 'HAZARDOUS', name: 'RESPEL Residuos peligrosos' },
  { code: 'INDUSTRIAL_NON_HAZARDOUS', name: 'RSINP Residuos sólidos industriales no peligrosos' },
  { code: 'DOMESTIC', name: 'RSD Residuos sólidos domésticos' },
  // SLUDGE ya se llama "Lodos", que es el nombre de negocio. No se toca.
];

/**
 * Categorías que faltan.
 *
 * `code` en inglés y mayúsculas, la convención que ya usan las cuatro sembradas.
 * `sort_order` sigue la serie de 10 en 10 desde SLUDGE (40): así el orden de la
 * API queda estable y las nuevas caen después de las existentes.
 */
const NEW_CATEGORIES: Array<{ code: string; name: string; description: string; sortOrder: number }> = [
  { code: 'GREASE', name: 'Grasas', description: 'Mezclas de grasas y aceites separadas de aguas residuales.', sortOrder: 50 },
  { code: 'WOOD', name: 'Madera', description: 'Madera no contaminada retirada de faena.', sortOrder: 60 },
  { code: 'RUBBLE', name: 'Escombros', description: 'Escombros y residuos de construcción y demolición.', sortOrder: 70 },
  { code: 'SCRAP_METAL', name: 'Chatarra', description: 'Chatarra metálica no peligrosa.', sortOrder: 80 },
];

/**
 * Un residuo por categoría no peligrosa.
 *
 * `categoryCode` es el de la BASE, no la sigla: la sigla vive en `name` y el
 * `code` sigue siendo `INDUSTRIAL_NON_HAZARDOUS` / `DOMESTIC` / `SLUDGE`.
 *
 * El `code` del tipo sí arranca con la sigla —o con el nombre cuando no hay—,
 * igual que los 39 `RESPEL_*`. `LODOS_TRATAMIENTO_AGUAS_URBANAS` es deliberadamente
 * largo: `LODOS_PTAS` es un código plausible del seed demo revertido que todavía
 * vive en algunas bases locales, y un choque ahí sería un `DO NOTHING` silencioso
 * que dejaría la categoría sin residuo.
 *
 * `storage_limit_days` queda en NULL: los 6 meses del D.S. 148 son de residuos
 * peligrosos. `requires_sinader` queda en su default y NO se fuerza acá aunque la
 * descripción de `INDUSTRIAL_NON_HAZARDOUS` mencione SINADER — a qué declaración
 * entra cada residuo es una definición reglamentaria que hay que confirmar, no
 * deducir del texto de una categoría.
 */
const NON_HAZARDOUS_TYPES: Array<{ categoryCode: string; code: string; name: string }> = [
  { categoryCode: 'INDUSTRIAL_NON_HAZARDOUS', code: 'RSINP_OTRAS_FRACCIONES', name: 'Otras fracciones industriales no especificadas' },
  { categoryCode: 'DOMESTIC', code: 'RSD_MEZCLAS_MUNICIPALES', name: 'Mezclas de residuos municipales (domésticos)' },
  { categoryCode: 'SLUDGE', code: 'LODOS_TRATAMIENTO_AGUAS_URBANAS', name: 'Lodos del tratamiento de aguas residuales urbanas / PTAS' },
  { categoryCode: 'GREASE', code: 'GRASAS_MEZCLAS_ACEITES', name: 'Mezclas de grasas y aceites (separación agua/sustancias aceitosas)' },
  { categoryCode: 'WOOD', code: 'MADERA_NO_CONTAMINADA', name: 'Madera no contaminada' },
  { categoryCode: 'RUBBLE', code: 'ESCOMBROS_CONSTRUCCION', name: 'Escombros de construcción' },
  { categoryCode: 'SCRAP_METAL', code: 'CHATARRA_HIERRO_ACERO', name: 'Chatarra (hierro y acero no galvanizados)' },
];

/** Rótulos anteriores, para que `down()` deje la base como estaba. */
const PREVIOUS_CATEGORY_NAMES: Record<string, string> = {
  HAZARDOUS: 'Residuos peligrosos',
  INDUSTRIAL_NON_HAZARDOUS: 'Industriales no peligrosos',
  DOMESTIC: 'Domésticos',
};

/** Comilla simple duplicada, el escape de literales de SQL. */
function sqlText(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export class AlignWasteCategoryCatalog1785800000000 implements MigrationInterface {
  name = 'AlignWasteCategoryCatalog1785800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const { code, name } of CATEGORY_RENAMES) {
      await queryRunner.query(
        `UPDATE "waste_operational_categories" SET "name" = $1 WHERE "code" = $2`,
        [name, code],
      );
    }

    const categoryValues = NEW_CATEGORIES.map(
      ({ code, name, description, sortOrder }) =>
        `(${sqlText(code)}, ${sqlText(name)}, ${sqlText(description)}, false, ${sortOrder})`,
    ).join(',\n        ');

    await queryRunner.query(`
      INSERT INTO "waste_operational_categories"
        ("code", "name", "description", "default_hazardous", "sort_order")
      VALUES
        ${categoryValues}
      ON CONFLICT ("code") DO NOTHING
    `);

    /*
     * La categoría se resuelve por `code` dentro del mismo INSERT: su `id` es un
     * uuid generado, así que no se puede escribir literal. Mismo patrón que
     * `SeedRespelWasteTypes`.
     */
    const typeValues = NON_HAZARDOUS_TYPES.map(
      ({ categoryCode, code, name }) => `(
        (SELECT "id" FROM "waste_operational_categories" WHERE "code" = ${sqlText(categoryCode)}),
        ${sqlText(code)},
        ${sqlText(name)},
        false,
        false
      )`,
    ).join(',\n');

    await queryRunner.query(`
      INSERT INTO "waste_types"
        ("operational_category_id", "code", "name", "is_hazardous", "requires_sidrep")
      VALUES
${typeValues}
      ON CONFLICT ("code") DO NOTHING
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    /*
     * Los tipos se borran ANTES que las categorías: `waste_types` referencia
     * `waste_operational_categories` con `ON DELETE RESTRICT`, así que al revés
     * la reversión fallaría contra su propia siembra.
     *
     * Borrado por lista explícita y no por prefijo: si alguien agregó después
     * otro tipo con el mismo arranque, no es de esta migración. El RESTRICT de
     * `waste_lots` protege igual a los que ya tengan movimientos — la reversión
     * falla en vez de borrarlos.
     */
    const typeCodes = NON_HAZARDOUS_TYPES.map(({ code }) => sqlText(code)).join(', ');
    await queryRunner.query(`DELETE FROM "waste_types" WHERE "code" IN (${typeCodes})`);

    const categoryCodes = NEW_CATEGORIES.map(({ code }) => sqlText(code)).join(', ');
    await queryRunner.query(
      `DELETE FROM "waste_operational_categories" WHERE "code" IN (${categoryCodes})`,
    );

    for (const [code, name] of Object.entries(PREVIOUS_CATEGORY_NAMES)) {
      await queryRunner.query(
        `UPDATE "waste_operational_categories" SET "name" = $1 WHERE "code" = $2`,
        [name, code],
      );
    }
  }
}
