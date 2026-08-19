import { WASTE_CATEGORY_OPTIONS, WASTE_TYPE_OPTIONS, WASTE_UNIT_OPTIONS } from './wasteCatalogs';
import {
  WASTE_HAZARD_OPTIONS,
  distinctOptions,
  matchesNumericMinimum,
  matchesSearch,
  type WasteHazardFilterValue,
  type WasteOption,
} from './wasteFilterPrimitives';
import type { WarehouseIntakeRow } from './wasteIntakeRows';

/**
 * Estado y reglas de filtrado de "Ingresos a bodega".
 *
 * Las fechas viajan en ISO (`yyyy-mm-dd`) porque es el formato que consume
 * `<input type="date">` y el que ordena bien como string. El formato chileno
 * `dd-mm-aaaa` del diseño es SOLO presentación.
 *
 * Todos los filtros son de CLIENTE en esta iteración, sobre el set completo de
 * filas. Cuando la vista consuma la API, `filterIntakeRows` se reemplaza por los
 * parámetros del endpoint y `buildIntakeFilterOptions` por los catálogos que ya
 * viven en la base (`waste_operational_categories`, `waste_types`, `waste_units`,
 * `sectors`).
 */

export interface WasteIntakeFilters {
  /** Fecha de ingreso en ISO `yyyy-mm-dd`. `null` = sin filtro. */
  entryDate: string | null;
  category: string | null;
  wasteType: string | null;
  /** Cantidad exacta, como la tipeó el usuario. Se compara numérica, no textual. */
  quantity: string | null;
  unit: string | null;
  origin: string | null;
  /** Búsqueda parcial de patente. */
  plate: string | null;
  /** Búsqueda parcial de conductor. */
  driver: string | null;
  /** `'hazardous'` / `'non_hazardous'`, para no filtrar por la etiqueta visible. */
  hazard: WasteHazardFilterValue | null;
}

export type { WasteHazardFilterValue };

export type WasteIntakeFilterKey = keyof WasteIntakeFilters;

/** Claves que se resuelven con un selector de alternativas. */
export type WasteIntakeSelectFilterKey = 'category' | 'wasteType' | 'unit' | 'origin' | 'hazard';

/** Claves de búsqueda libre por texto. */
export type WasteIntakeSearchFilterKey = 'plate' | 'driver';

/**
 * Alias del tipo compartido. Se mantiene el nombre para no tocar los imports de
 * la vista; la definición es una sola, en `wasteFilterPrimitives`.
 */
export type WasteIntakeOption = WasteOption;

export type WasteIntakeFilterOptions = Record<WasteIntakeSelectFilterKey, WasteOption[]>;

export interface WasteIntakeFilterChip {
  key: WasteIntakeFilterKey;
  label: string;
}

export const EMPTY_WASTE_INTAKE_FILTERS: WasteIntakeFilters = {
  entryDate: null,
  category: null,
  wasteType: null,
  quantity: null,
  unit: null,
  origin: null,
  plate: null,
  driver: null,
  hazard: null,
};

/** Fecha local en ISO. `toISOString()` no sirve: convierte a UTC y corre el día. */
export function toIsoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** `2026-08-06` → `06-08-2026`. Devuelve la entrada intacta si no es ISO. */
export function formatIsoAsDdMmYyyy(iso: string): string {
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return iso;
  return `${day}-${month}-${year}`;
}

export function hazardValueOf(row: WarehouseIntakeRow): WasteHazardFilterValue {
  return row.isHazardous ? 'hazardous' : 'non_hazardous';
}

/**
 * Comparación numérica de la cantidad: coincidencia EXACTA.
 *
 * Es lo que significa un campo `#` suelto en esta app — cuando `InspectionsManagementView`
 * quiere un rango usa dos campos con placeholder "Min" y "Max", y reserva el `#`
 * para el filtro de valor puntual. Si más adelante se prefiere "cantidad ≥ X",
 * el cambio es el operador de esta única función.
 *
 * Mientras lo tipeado no sea un número válido (`""`, `"-"`, `"1e"`) no se filtra
 * nada: filtrar con basura vaciaría la tabla mientras el usuario escribe.
 */
/**
 * Alternativas de cada selector.
 *
 * Categoría, residuo y unidad salen de `wasteCatalogs`, la misma fuente que usa
 * "Detalle de lotes en bodega". Antes se derivaban de las filas de ESTA tabla, y
 * entonces una categoría con lotes en bodega pero sin ingresos aparecía en un
 * filtro y faltaba en el otro.
 *
 * `origin` sí se sigue derivando: los sectores son propios de los ingresos y la
 * otra tabla no tiene esa columna.
 */
export function buildIntakeFilterOptions(rows: WarehouseIntakeRow[]): WasteIntakeFilterOptions {
  return {
    category: WASTE_CATEGORY_OPTIONS,
    wasteType: WASTE_TYPE_OPTIONS,
    unit: WASTE_UNIT_OPTIONS,
    origin: distinctOptions(rows.map((row) => row.origin)),
    hazard: WASTE_HAZARD_OPTIONS,
  };
}

export function filterIntakeRows(rows: WarehouseIntakeRow[], filters: WasteIntakeFilters): WarehouseIntakeRow[] {
  return rows.filter((row) => {
    if (filters.entryDate && row.entryDate !== filters.entryDate) return false;
    if (filters.category && row.category !== filters.category) return false;
    if (filters.wasteType && row.wasteType !== filters.wasteType) return false;
    if (!matchesNumericMinimum(row.quantity, filters.quantity)) return false;
    if (filters.unit && row.unit !== filters.unit) return false;
    if (filters.origin && row.origin !== filters.origin) return false;
    if (filters.plate && !matchesSearch(row.plate, filters.plate)) return false;
    if (filters.driver && !matchesSearch(row.driver, filters.driver)) return false;
    if (filters.hazard && hazardValueOf(row) !== filters.hazard) return false;
    return true;
  });
}

/**
 * Pastillas de la barra "Filtros activos".
 *
 * La de fecha va sin prefijo, como en el nodo `3817:57808`
 * ("[dd-mm-aaaa día de hoy]": la fecha, más la aclaración cuando cae en el día en
 * curso). Las demás llevan prefijo porque conviven varias y sin él no se sabe a
 * qué columna pertenece cada una — es la convención de `buildActiveFilters` en
 * `InspectionsManagementView`.
 */
export function buildIntakeFilterChips(filters: WasteIntakeFilters, todayIso: string): WasteIntakeFilterChip[] {
  const chips: WasteIntakeFilterChip[] = [];

  if (filters.entryDate) {
    const suffix = filters.entryDate === todayIso ? ' día de hoy' : '';
    chips.push({ key: 'entryDate', label: `${formatIsoAsDdMmYyyy(filters.entryDate)}${suffix}` });
  }
  if (filters.category) chips.push({ key: 'category', label: `Categoría: ${filters.category}` });
  if (filters.wasteType) chips.push({ key: 'wasteType', label: `Residuo: ${filters.wasteType}` });
  if (filters.quantity) chips.push({ key: 'quantity', label: `Cantidad: ${filters.quantity}` });
  if (filters.unit) chips.push({ key: 'unit', label: `Unidad: ${filters.unit}` });
  if (filters.origin) chips.push({ key: 'origin', label: `Lugar: ${filters.origin}` });
  if (filters.plate) chips.push({ key: 'plate', label: `Patente: ${filters.plate}` });
  if (filters.driver) chips.push({ key: 'driver', label: `Conductor: ${filters.driver}` });
  if (filters.hazard) {
    const label = WASTE_HAZARD_OPTIONS.find((option) => option.value === filters.hazard)?.label ?? filters.hazard;
    chips.push({ key: 'hazard', label: `Peligrosidad: ${label}` });
  }

  return chips;
}
