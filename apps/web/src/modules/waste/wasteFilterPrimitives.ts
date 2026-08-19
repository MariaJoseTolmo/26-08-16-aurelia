/**
 * Piezas de filtrado que comparten las tablas del módulo de residuos
 * ("Detalle de lotes en bodega" e "Ingresos a bodega").
 *
 * Antes cada tabla tenía su copia y ya habían divergido: el filtro de cantidad
 * comparaba por IGUALDAD en ingresos y por MÍNIMO en bodega, con el mismo
 * placeholder `#` en las dos. Para el usuario era el mismo control con dos
 * comportamientos.
 */

/** Alternativa de un selector de filtro. */
export interface WasteOption {
  value: string;
  label: string;
}

export type WasteHazardFilterValue = 'hazardous' | 'non_hazardous';

export const WASTE_HAZARD_OPTIONS: WasteOption[] = [
  { value: 'hazardous', label: 'Peligroso' },
  { value: 'non_hazardous', label: 'No peligroso' },
];

/**
 * Valores distintos, ordenados con las reglas del español.
 *
 * El locale va explícito y es uno solo (`es-CL`): las dos tablas usaban locales
 * distintos —`es` y `es-CL`— y el mismo catálogo podía ordenarse diferente en
 * cada una.
 */
export function distinctOptions(values: string[]): WasteOption[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))]
    .sort((left, right) => left.localeCompare(right, 'es-CL'))
    .map((value) => ({ value, label: value }));
}

/**
 * Umbral numérico tecleado, o `null` si todavía no es un número usable.
 *
 * Un input numérico pasa por estados intermedios que no son números —cadena
 * vacía al borrar, un "-" suelto, "1e" mientras se escribe notación
 * científica—. Tratarlos como 0 dejaría la tabla vacía o completa de golpe
 * mientras el usuario tipea; `null` deja el filtro inactivo hasta que el valor
 * sirva.
 */
export function parseNumericThreshold(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Criterio ÚNICO de los filtros numéricos de columna: el valor de la fila tiene
 * que llegar al mínimo tecleado.
 *
 * Es mínimo y no igualdad por dos razones. Las magnitudes son decimales —meses
 * con un decimal, cantidades con coma—, así que una comparación exacta casi
 * nunca encuentra nada: habría que teclear "6.1" clavado. Y es la pregunta que
 * resuelven estas vistas: qué lotes llevan DEMASIADO tiempo o acumulan
 * DEMASIADA cantidad, no cuáles valen un número puntual.
 *
 * `actual` puede venir como string porque la API devuelve los `numeric` de
 * Postgres en texto. Si no parsea, la fila no pasa: un dato ilegible no puede
 * afirmar que cumple el umbral.
 */
export function matchesNumericMinimum(actual: number | string, query: string | null): boolean {
  const minimum = parseNumericThreshold(query);
  if (minimum === null) return true;

  const value = typeof actual === 'number' ? actual : Number(actual);
  if (!Number.isFinite(value)) return false;

  return value >= minimum;
}

/**
 * Cantidad para mostrar: los decimales van con coma, como en es-CL y como ya lo
 * hace "Control de bodega" ("6,1 meses"). El dato se guarda como string numérico
 * porque así lo devuelve la API —las columnas `numeric` de Postgres llegan como
 * texto, sin transformer en TypeORM—.
 *
 * Vive acá y no en `wasteIntakeFilters` desde que "Solicitud de retiro" también
 * muestra una cantidad: es un formateador de es-CL, no algo propio de una vista.
 */
export function formatQuantity(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(parsed);
}

/**
 * Minúsculas y sin tildes, para que "Diaz" encuentre "Díaz".
 *
 * Estaba escrita idéntica en `wasteIntakeFilters` y en `wasteWithdrawalFilters`, y
 * el modal de selección de lotes necesitaba una tercera copia. Vive una sola vez.
 */
export function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('es-CL')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * `true` si el texto contiene la consulta, ignorando tildes y mayúsculas. Una
 * consulta vacía no filtra.
 */
export function matchesSearch(value: string, query: string): boolean {
  const normalizedQuery = normalizeSearch(query);
  if (normalizedQuery === '') return true;
  return normalizeSearch(value).includes(normalizedQuery);
}

/** Un filtro cuenta como activo solo si tiene un valor con contenido. */
export function isActiveFilterValue(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}
