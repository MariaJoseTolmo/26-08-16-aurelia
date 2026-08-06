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

export type WasteHazardFilterValue = 'hazardous' | 'non_hazardous';

export type WasteIntakeFilterKey = keyof WasteIntakeFilters;

/** Claves que se resuelven con un selector de alternativas. */
export type WasteIntakeSelectFilterKey = 'category' | 'wasteType' | 'unit' | 'origin' | 'hazard';

/** Claves de búsqueda libre por texto. */
export type WasteIntakeSearchFilterKey = 'plate' | 'driver';

export interface WasteIntakeOption {
  value: string;
  label: string;
}

export type WasteIntakeFilterOptions = Record<WasteIntakeSelectFilterKey, WasteIntakeOption[]>;

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

const HAZARD_OPTIONS: WasteIntakeOption[] = [
  { value: 'hazardous', label: 'Peligroso' },
  { value: 'non_hazardous', label: 'No peligroso' },
];

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
 * Cantidad para mostrar: los decimales van con coma, como en es-CL y como ya lo
 * hace "Control de bodega" ("6,1 meses"). El dato se guarda como string numérico
 * porque así lo devuelve la API —las columnas `numeric` de Postgres llegan como
 * texto, sin transformer en TypeORM—.
 */
export function formatQuantity(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(parsed);
}

/** Minúsculas y sin tildes, para que "Diaz" encuentre "Díaz". */
function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('es-CL')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function matchesSearch(cellValue: string, query: string): boolean {
  const normalizedQuery = normalizeSearch(query);
  if (normalizedQuery === '') return true;
  return normalizeSearch(cellValue).includes(normalizedQuery);
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
function matchesQuantity(cellValue: string, query: string): boolean {
  const target = Number(query);
  if (query.trim() === '' || !Number.isFinite(target)) return true;

  const actual = Number(cellValue);
  if (!Number.isFinite(actual)) return false;

  return actual === target;
}

/**
 * Alternativas de cada selector, derivadas de los datos. Se ordenan con
 * `localeCompare` en es-CL para que las tildes queden donde corresponde.
 */
export function buildIntakeFilterOptions(rows: WarehouseIntakeRow[]): WasteIntakeFilterOptions {
  return {
    category: distinctOptions(rows.map((row) => row.category)),
    wasteType: distinctOptions(rows.map((row) => row.wasteType)),
    unit: distinctOptions(rows.map((row) => row.unit)),
    origin: distinctOptions(rows.map((row) => row.origin)),
    hazard: HAZARD_OPTIONS,
  };
}

function distinctOptions(values: string[]): WasteIntakeOption[] {
  return [...new Set(values)]
    .sort((left, right) => left.localeCompare(right, 'es-CL'))
    .map((value) => ({ value, label: value }));
}

export function filterIntakeRows(rows: WarehouseIntakeRow[], filters: WasteIntakeFilters): WarehouseIntakeRow[] {
  return rows.filter((row) => {
    if (filters.entryDate && row.entryDate !== filters.entryDate) return false;
    if (filters.category && row.category !== filters.category) return false;
    if (filters.wasteType && row.wasteType !== filters.wasteType) return false;
    if (filters.quantity && !matchesQuantity(row.quantity, filters.quantity)) return false;
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
    const label = HAZARD_OPTIONS.find((option) => option.value === filters.hazard)?.label ?? filters.hazard;
    chips.push({ key: 'hazard', label: `Peligrosidad: ${label}` });
  }

  return chips;
}
