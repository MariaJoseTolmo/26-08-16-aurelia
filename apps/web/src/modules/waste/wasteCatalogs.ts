import { distinctOptions, type WasteOption } from './wasteFilterPrimitives';

/**
 * Catálogos de dominio del módulo de residuos: categoría operativa, residuo
 * específico y unidad de medida.
 *
 * FUENTE ÚNICA para las dos tablas. Antes cada una derivaba sus alternativas de
 * SUS PROPIAS filas, así que una categoría con ingresos pero sin lotes en bodega
 * aparecía en un filtro y faltaba en el otro —el mismo campo comportándose
 * distinto según la vista—.
 *
 * ESTE ARCHIVO ES UN ESPEJO, NO LA FUENTE DE VERDAD. La fuente son
 * `waste_operational_categories` y `waste_types` en la base. El formulario
 * "Registrar ingreso a Bodega" ya lee los endpoints reales
 * (`shared/hooks/useWasteCatalogs`); estas dos tablas todavía no, y migrarlas es
 * lo que hace desaparecer este archivo.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OJO — HOY EL ESPEJO VA ADELANTE DE LA BASE
 *
 * El catálogo de negocio son las 8 categorías de abajo. La base tiene 4, y de
 * esas, tres con otro nombre:
 *
 *   code                      name (en la base)            name de negocio
 *   HAZARDOUS                 Residuos peligrosos          RESPEL Residuos peligrosos                          ⚠️ renombrar
 *   INDUSTRIAL_NON_HAZARDOUS  Industriales no peligrosos   RSINP Residuos sólidos industriales no peligrosos   ⚠️ renombrar
 *   DOMESTIC                  Domésticos                   RSD Residuos sólidos domésticos                     ⚠️ renombrar
 *   SLUDGE                    Lodos                        Lodos                                               ✅ coincide
 *   —                         —                            Grasas                                              ❌ crear
 *   —                         —                            Madera                                              ❌ crear
 *   —                         —                            Escombros                                           ❌ crear
 *   —                         —                            Chatarra                                            ❌ crear
 *
 * Y en `waste_types` solo están sembrados los 39 RESPEL
 * (`1785600000000-SeedRespelWasteTypes`): los 7 residuos no peligrosos de abajo
 * no existen todavía.
 *
 * Consecuencia práctica: hasta que corra la migración que cierra esa brecha, el
 * formulario —que lee la API— va a ofrecer MENOS alternativas que estas dos
 * tablas, que leen este archivo. La discrepancia es del dato, no del código.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Las 8 categorías operativas del negocio, con el rótulo que se muestra.
 *
 * TRES VAN CON SIGLA Y CINCO NO. Es decisión del negocio, no un descuido: RESPEL,
 * RSINP y RSD son como se nombran en faena y en los informes reglamentarios, y
 * las otras cinco nunca tuvieron sigla. El desparejo del desplegable es el
 * vocabulario real.
 *
 * El rótulo de las tres con sigla es `SIGLA + espacio + nombre` —sin paréntesis
 * ni guion—, así que se lee entero en el desplegable sin tener que saberse la
 * sigla de memoria.
 *
 * Esto es el `name` de `waste_operational_categories`, no el `code`:
 * `toCategoryOptions` en `warehouseIntakeForm.ts` rotula con `name`, así que para
 * que el espejo y la API digan lo mismo, el rótulo completo tiene que estar en el
 * `name`. Hoy la base guarda "Residuos peligrosos" ahí — ver la nota de arriba.
 */
export const WASTE_CATEGORY_NAMES = [
  'Chatarra',
  'Escombros',
  'Grasas',
  'Lodos',
  'Madera',
  'RESPEL Residuos peligrosos',
  'RSD Residuos sólidos domésticos',
  'RSINP Residuos sólidos industriales no peligrosos',
] as const;

export const WASTE_UNIT_NAMES = [
  'Contenedor',
  'Kilogramo',
  'Metro cúbico',
  'Tambor',
  'Tonelada',
  'Unidad',
] as const;

export interface WasteTypeCatalogEntry {
  name: string;
  category: string;
  /** Espejo de `waste_types.is_hazardous`. */
  hazardous: boolean;
}

/**
 * Los 46 residuos específicos: 39 peligrosos bajo RESPEL y uno por cada una de
 * las otras siete categorías.
 *
 * La peligrosidad es propiedad del RESIDUO, no de la fila. Modelarla acá evita
 * que un dato de muestra diga "Aceite usado / no peligroso", que en la base es
 * imposible.
 *
 * Los 39 peligrosos están transcritos de `1785600000000-SeedRespelWasteTypes`,
 * no del pedido en prosa: la migración es la que va a escribir esos nombres en
 * la base, así que es la que manda si alguna tilde difiere.
 */
export const WASTE_TYPE_CATALOG: WasteTypeCatalogEntry[] = [
  // ── RESPEL — Residuos peligrosos ────────────────────────────────────────
  { name: 'Aceite usado / Aceites minerales usados', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Aceite de transmisión usado', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Lubricantes usados', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Agua contaminada con hidrocarburos', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Sólidos contaminados con hidrocarburos', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Tambores contaminados con hidrocarburos', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Mezcla y emulsiones de aceite y agua / hidrocarburo y agua', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Filtros de aceite', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Fluido hidráulico', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Ánodos de plomo', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Baterías de plomo', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Baterías y pilas desechadas (NiCd, Ni/MH)', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Borras plomadas', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Borras contaminadas con hidrocarburos inflamables', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Borras de sustancias corrosivas alcalinas', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Chatarra eléctrica y electrónica', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Tierra o arena contaminada con sustancias corrosivas ácidas', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Tierra o arena contaminada con hidrocarburos/aceites/grasas', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Envases contaminados con hidrocarburos/aceites/grasas', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Envases contaminados con sustancias inflamables', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Contenedores metálicos contaminados', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Contenedores plásticos contaminados', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Plásticos contaminados', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Tubos fluorescentes, ampolletas Na-Hg y LFC', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Refrigerante usado', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Residuos corrosivos ácidos', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Residuos corrosivos alcalinos', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Residuos de solventes halogenados y no halogenados', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Residuos de sustancias tóxicas sólidas', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Restos de minerales procesados / Suelos contaminados', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Tóner y cartuchos de tinta de impresión', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Maxisaco contaminado con cianuro de sodio', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Sólidos contaminados con cianuro', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Maderas contaminadas con cianuro de sodio', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Maxisaco con residuo de cobre', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Maxisaco con residuo de zinc', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Maxisaco con residuo de metabisulfito de sodio', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Residuos de mercurio', category: 'RESPEL Residuos peligrosos', hazardous: true },
  { name: 'Residuos hospitalarios', category: 'RESPEL Residuos peligrosos', hazardous: true },

  // ── No peligrosos — una categoría, un residuo ───────────────────────────
  { name: 'Otras fracciones industriales no especificadas', category: 'RSINP Residuos sólidos industriales no peligrosos', hazardous: false },
  { name: 'Mezclas de residuos municipales (domésticos)', category: 'RSD Residuos sólidos domésticos', hazardous: false },
  { name: 'Lodos del tratamiento de aguas residuales urbanas / PTAS', category: 'Lodos', hazardous: false },
  { name: 'Mezclas de grasas y aceites (separación agua/sustancias aceitosas)', category: 'Grasas', hazardous: false },
  { name: 'Madera no contaminada', category: 'Madera', hazardous: false },
  { name: 'Escombros de construcción', category: 'Escombros', hazardous: false },
  { name: 'Chatarra (hierro y acero no galvanizados)', category: 'Chatarra', hazardous: false },
];

/**
 * `distinctOptions` ordena alfabético con reglas del español. La base ordena las
 * categorías por `sort_order` y los residuos por nombre dentro de su categoría,
 * así que el orden del espejo y el de la API coinciden en los residuos y pueden
 * diferir en las categorías. Se acepta: es un espejo con fecha de vencimiento.
 */
/**
 * Categoría del catálogo a la que pertenece un residuo, o `null` si el nombre no
 * está en el maestro.
 *
 * Existe para no repetir la relación residuo→categoría en ningún otro lado: en el
 * catálogo la categoría cuelga del residuo, así que derivarla es más seguro que
 * guardarla dos veces y arriesgar que se desalineen.
 */
export function resolveWasteTypeCategory(wasteTypeName: string): string | null {
  return WASTE_TYPE_CATALOG.find((entry) => entry.name === wasteTypeName)?.category ?? null;
}

export const WASTE_CATEGORY_OPTIONS: WasteOption[] = distinctOptions([...WASTE_CATEGORY_NAMES]);
export const WASTE_UNIT_OPTIONS: WasteOption[] = distinctOptions([...WASTE_UNIT_NAMES]);
export const WASTE_TYPE_OPTIONS: WasteOption[] = distinctOptions(
  WASTE_TYPE_CATALOG.map((entry) => entry.name),
);
