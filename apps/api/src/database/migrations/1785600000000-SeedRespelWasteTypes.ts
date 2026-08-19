import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Siembra el catálogo RESPEL en `waste_types`.
 *
 * La tabla estaba VACÍA: `CreateWasteModuleFoundation` sembró unidades,
 * categorías operativas y permisos, pero ningún tipo de residuo, así que el
 * selector "Residuo específico" no tenía de dónde sacar alternativas.
 *
 * Los 39 tipos cuelgan de la categoría que ya existe, `HAZARDOUS`
 * ("Residuos peligrosos", `default_hazardous = true`). RESPEL es la sigla
 * habitual de esa misma categoría en la normativa chilena, no una categoría
 * nueva: crear una segunda partiría el catálogo en dos con el mismo significado.
 *
 * VALORES QUE SE FIJAN Y POR QUÉ:
 *
 * - `is_hazardous = true` — son todos RESPEL, por definición de la categoría.
 * - `requires_sidrep = true` — la descripción de la categoría ya lo dice:
 *   "Residuos sujetos al flujo de aprobación y folio SIDREP".
 * - `storage_limit_days = 180` — los 6 meses de almacenamiento transitorio del
 *   D.S. 148 que la vista "Control de bodega" ya enuncia en su bajada. Con el
 *   `warning_before_days` por defecto (30) el aviso cae a los 150 días, que son
 *   exactamente los "5 meses" del KPI "Cerca del límite". Los dos números del
 *   diseño se explican solos con este par.
 *
 * `default_unit_id` queda en NULL a propósito: asignar tambor, unidad o metro
 * cúbico a cada residuo es una decisión operativa de la faena, no un dato que se
 * pueda deducir del nombre.
 */

/** Plazo de almacenamiento transitorio de residuos peligrosos: 6 meses. */
const RESPEL_STORAGE_LIMIT_DAYS = 180;

/**
 * Códigos estables y legibles. No se derivan del nombre en runtime porque el
 * `code` es la clave de negocio: si mañana se corrige una tilde del nombre, el
 * código no puede moverse ni romper las referencias.
 */
const RESPEL_WASTE_TYPES: Array<{ code: string; name: string }> = [
  { code: 'RESPEL_ACEITE_MINERAL_USADO', name: 'Aceite usado / Aceites minerales usados' },
  { code: 'RESPEL_ACEITE_TRANSMISION_USADO', name: 'Aceite de transmisión usado' },
  { code: 'RESPEL_LUBRICANTES_USADOS', name: 'Lubricantes usados' },
  { code: 'RESPEL_AGUA_CONT_HIDROCARBUROS', name: 'Agua contaminada con hidrocarburos' },
  { code: 'RESPEL_SOLIDOS_CONT_HIDROCARBUROS', name: 'Sólidos contaminados con hidrocarburos' },
  { code: 'RESPEL_TAMBORES_CONT_HIDROCARBUROS', name: 'Tambores contaminados con hidrocarburos' },
  { code: 'RESPEL_MEZCLA_ACEITE_AGUA', name: 'Mezcla y emulsiones de aceite y agua / hidrocarburo y agua' },
  { code: 'RESPEL_FILTROS_ACEITE', name: 'Filtros de aceite' },
  { code: 'RESPEL_FLUIDO_HIDRAULICO', name: 'Fluido hidráulico' },
  { code: 'RESPEL_ANODOS_PLOMO', name: 'Ánodos de plomo' },
  { code: 'RESPEL_BATERIAS_PLOMO', name: 'Baterías de plomo' },
  { code: 'RESPEL_BATERIAS_PILAS_DESECHADAS', name: 'Baterías y pilas desechadas (NiCd, Ni/MH)' },
  { code: 'RESPEL_BORRAS_PLOMADAS', name: 'Borras plomadas' },
  { code: 'RESPEL_BORRAS_CONT_HIDROCARBUROS_INFL', name: 'Borras contaminadas con hidrocarburos inflamables' },
  { code: 'RESPEL_BORRAS_CORROSIVAS_ALCALINAS', name: 'Borras de sustancias corrosivas alcalinas' },
  { code: 'RESPEL_CHATARRA_ELECTRICA_ELECTRONICA', name: 'Chatarra eléctrica y electrónica' },
  { code: 'RESPEL_TIERRA_CONT_CORROSIVAS_ACIDAS', name: 'Tierra o arena contaminada con sustancias corrosivas ácidas' },
  { code: 'RESPEL_TIERRA_CONT_HIDROCARBUROS', name: 'Tierra o arena contaminada con hidrocarburos/aceites/grasas' },
  { code: 'RESPEL_ENVASES_CONT_HIDROCARBUROS', name: 'Envases contaminados con hidrocarburos/aceites/grasas' },
  { code: 'RESPEL_ENVASES_CONT_INFLAMABLES', name: 'Envases contaminados con sustancias inflamables' },
  { code: 'RESPEL_CONTENEDORES_METALICOS_CONT', name: 'Contenedores metálicos contaminados' },
  { code: 'RESPEL_CONTENEDORES_PLASTICOS_CONT', name: 'Contenedores plásticos contaminados' },
  { code: 'RESPEL_PLASTICOS_CONTAMINADOS', name: 'Plásticos contaminados' },
  { code: 'RESPEL_TUBOS_FLUORESCENTES_LFC', name: 'Tubos fluorescentes, ampolletas Na-Hg y LFC' },
  { code: 'RESPEL_REFRIGERANTE_USADO', name: 'Refrigerante usado' },
  { code: 'RESPEL_CORROSIVOS_ACIDOS', name: 'Residuos corrosivos ácidos' },
  { code: 'RESPEL_CORROSIVOS_ALCALINOS', name: 'Residuos corrosivos alcalinos' },
  { code: 'RESPEL_SOLVENTES_HALOGENADOS', name: 'Residuos de solventes halogenados y no halogenados' },
  { code: 'RESPEL_TOXICOS_SOLIDOS', name: 'Residuos de sustancias tóxicas sólidas' },
  { code: 'RESPEL_MINERALES_SUELOS_CONTAMINADOS', name: 'Restos de minerales procesados / Suelos contaminados' },
  { code: 'RESPEL_TONER_CARTUCHOS', name: 'Tóner y cartuchos de tinta de impresión' },
  { code: 'RESPEL_MAXISACO_CIANURO_SODIO', name: 'Maxisaco contaminado con cianuro de sodio' },
  { code: 'RESPEL_SOLIDOS_CONT_CIANURO', name: 'Sólidos contaminados con cianuro' },
  { code: 'RESPEL_MADERAS_CIANURO_SODIO', name: 'Maderas contaminadas con cianuro de sodio' },
  { code: 'RESPEL_MAXISACO_COBRE', name: 'Maxisaco con residuo de cobre' },
  { code: 'RESPEL_MAXISACO_ZINC', name: 'Maxisaco con residuo de zinc' },
  { code: 'RESPEL_MAXISACO_METABISULFITO_SODIO', name: 'Maxisaco con residuo de metabisulfito de sodio' },
  { code: 'RESPEL_MERCURIO', name: 'Residuos de mercurio' },
  { code: 'RESPEL_HOSPITALARIOS', name: 'Residuos hospitalarios' },
];

/** Comilla simple duplicada, el escape de literales de SQL. */
function sqlText(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export class SeedRespelWasteTypes1785600000000 implements MigrationInterface {
  name = 'SeedRespelWasteTypes1785600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // La categoría se resuelve por `code` dentro del mismo INSERT: su `id` es un
    // uuid generado, así que no se puede escribir literal en la migración.
    const values = RESPEL_WASTE_TYPES.map(
      ({ code, name }) => `(
        (SELECT "id" FROM "waste_operational_categories" WHERE "code" = 'HAZARDOUS'),
        ${sqlText(code)},
        ${sqlText(name)},
        true,
        true,
        ${RESPEL_STORAGE_LIMIT_DAYS}
      )`,
    ).join(',\n');

    await queryRunner.query(`
      INSERT INTO "waste_types"
        ("operational_category_id", "code", "name", "is_hazardous", "requires_sidrep", "storage_limit_days")
      VALUES
${values}
      ON CONFLICT ("code") DO NOTHING
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Borrado por lista explícita y no por `LIKE 'RESPEL%'`: si alguien agregó
    // después otro tipo con ese prefijo, no es de esta migración y no se toca.
    // `ON DELETE RESTRICT` en `waste_lots`/`waste_receipts` protege igual a los
    // tipos que ya tengan movimientos: la reversión falla en vez de borrarlos.
    const codes = RESPEL_WASTE_TYPES.map(({ code }) => sqlText(code)).join(', ');
    await queryRunner.query(`DELETE FROM "waste_types" WHERE "code" IN (${codes})`);
  }
}
