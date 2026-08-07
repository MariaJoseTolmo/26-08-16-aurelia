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
 * Los nombres salen de las tablas de la base (`waste_operational_categories`,
 * `waste_types` con su `is_hazardous`, `waste_units`), así que las alternativas
 * que se despliegan son las que va a devolver la API. Cuando la vista se
 * conecte, este archivo se reemplaza por `GET /waste/categories`, `/types` y
 * `/units`, y ninguna tabla se toca.
 */

export const WASTE_CATEGORY_NAMES = [
  'Domésticos',
  'Industriales no peligrosos',
  'Lodos',
  'Residuos peligrosos',
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
 * La peligrosidad es propiedad del RESIDUO, no de la fila. Modelarla acá evita
 * que un dato de muestra diga "Aceite usado / no peligroso", que en la base es
 * imposible.
 */
export const WASTE_TYPE_CATALOG: WasteTypeCatalogEntry[] = [
  { name: 'Aceite usado', category: 'Residuos peligrosos', hazardous: true },
  { name: 'Baterías de plomo ácido', category: 'Residuos peligrosos', hazardous: true },
  { name: 'Chatarra metálica', category: 'Industriales no peligrosos', hazardous: false },
  { name: 'Huaipe contaminado', category: 'Residuos peligrosos', hazardous: true },
  { name: 'Lodos de planta de tratamiento', category: 'Lodos', hazardous: false },
  { name: 'Residuos domiciliarios', category: 'Domésticos', hazardous: false },
];

export const WASTE_CATEGORY_OPTIONS: WasteOption[] = distinctOptions([...WASTE_CATEGORY_NAMES]);
export const WASTE_UNIT_OPTIONS: WasteOption[] = distinctOptions([...WASTE_UNIT_NAMES]);
export const WASTE_TYPE_OPTIONS: WasteOption[] = distinctOptions(
  WASTE_TYPE_CATALOG.map((entry) => entry.name),
);
