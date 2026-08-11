import { WASTE_CATEGORY_OPTIONS, WASTE_TYPE_OPTIONS, WASTE_UNIT_OPTIONS } from './wasteCatalogs';
import {
  distinctOptions,
  isActiveFilterValue,
  matchesNumericMinimum,
  matchesSearch,
  type WasteOption,
} from './wasteFilterPrimitives';
import { formatIsoMonthLabel, isoDateInMonth } from './wasteMonthFilter';
import {
  WASTE_WITHDRAWAL_STATUS_LABELS,
  type WasteWithdrawalRow,
  type WasteWithdrawalStatus,
} from './wasteWithdrawalRows';

/**
 * Estado y reglas de filtrado de "Solicitud de retiro" — barra de acciones
 * `3817:55645` y columnas de la tabla `3817:55312`.
 *
 * Mismo contrato que `wasteIntakeFilters.ts` y `wasteWarehouseFilters.ts`: un
 * objeto plano donde `null` significa "sin filtrar", la página es la dueña del
 * estado y las pastillas se derivan de él. Que la barra de filtros activos y la
 * fila de filtros de la tabla lean del MISMO objeto es lo que impide que se
 * contradigan: en el diseño son la misma cosa vista desde dos lugares.
 *
 * Todos los filtros son de CLIENTE en esta iteración, sobre el set completo de
 * filas. Cuando la vista consuma la API, `filterWithdrawalRows` se reemplaza por
 * los parámetros del endpoint y las alternativas por los catálogos reales.
 */

export interface WasteWithdrawalFilters {
  /**
   * Período en mes ISO `yyyy-mm`. Es la columna "PERIODO" de la tabla y la
   * pastilla del nodo `3817:55651`, que son el mismo filtro.
   */
  period: string | null;
  category: string | null;
  wasteType: string | null;
  /** Cantidad retirada MÍNIMA, como la tecleó el usuario. */
  quantity: string | null;
  unit: string | null;
  recipient: string | null;
  /** Búsqueda parcial de folio SIDREP. */
  sidrepFolio: string | null;
  status: WasteWithdrawalStatus | null;
}

export type WasteWithdrawalFilterKey = keyof WasteWithdrawalFilters;

/** Columnas que se resuelven con un selector de alternativas. */
export type WasteWithdrawalSelectFilterKey = 'category' | 'wasteType' | 'unit' | 'recipient' | 'status';

export type WasteWithdrawalFilterOptions = Record<WasteWithdrawalSelectFilterKey, WasteOption[]>;

export interface WasteWithdrawalFilterChip {
  key: WasteWithdrawalFilterKey;
  label: string;
}

export const EMPTY_WASTE_WITHDRAWAL_FILTERS: WasteWithdrawalFilters = {
  period: null,
  category: null,
  wasteType: null,
  quantity: null,
  unit: null,
  recipient: null,
  sidrepFolio: null,
  status: null,
};

/** Orden de los estados en el selector: el informativo primero, como en el nodo. */
const STATUS_ORDER: WasteWithdrawalStatus[] = ['informational', 'closed'];

/**
 * `2026-07-15` → `15-07-26`. Devuelve la entrada intacta si no es ISO.
 *
 * DOS DÍGITOS DE AÑO, a diferencia de `formatIsoAsDdMmYyyy` en "Ingresos a
 * bodega". No es un descuido: el nodo `3817:55330` escribe "XX-07-26" en las diez
 * celdas, y su columna mide 121.5px contra los 153.5px de la columna de fecha de
 * ingresos —es más angosta justamente porque el formato es más corto—.
 */
export function formatIsoAsDdMmYy(iso: string): string {
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return iso;
  return `${day}-${month}-${year.slice(-2)}`;
}

/**
 * Alternativas de cada selector.
 *
 * Categoría, residuo y unidad salen de `wasteCatalogs`, la misma fuente que usan
 * las otras dos tablas: derivarlas de las filas de ESTA vista haría que una
 * categoría con ingresos pero sin retiros apareciera en un filtro y faltara en
 * otro.
 *
 * `recipient` sí se deriva de las filas —los destinatarios son propios de los
 * retiros y no hay catálogo que espejar todavía—, y `status` es un conjunto
 * cerrado: derivarlo escondería "Cerrado" justo cuando no hay ninguno cerrado,
 * que es la lectura que confirma que no hay ninguno.
 */
export function buildWithdrawalFilterOptions(rows: WasteWithdrawalRow[]): WasteWithdrawalFilterOptions {
  return {
    category: WASTE_CATEGORY_OPTIONS,
    wasteType: WASTE_TYPE_OPTIONS,
    unit: WASTE_UNIT_OPTIONS,
    recipient: distinctOptions(rows.map((row) => row.recipient)),
    status: STATUS_ORDER.map((status) => ({ value: status, label: WASTE_WITHDRAWAL_STATUS_LABELS[status] })),
  };
}

/** Filas que pasan todos los filtros activos. Los `null` no filtran. */
export function filterWithdrawalRows(
  rows: WasteWithdrawalRow[],
  filters: WasteWithdrawalFilters,
): WasteWithdrawalRow[] {
  return rows.filter((row) => {
    if (filters.period && !isoDateInMonth(row.withdrawalDate, filters.period)) return false;
    if (filters.category && row.category !== filters.category) return false;
    if (filters.wasteType && row.wasteType !== filters.wasteType) return false;
    if (!matchesNumericMinimum(row.quantity, filters.quantity)) return false;
    if (filters.unit && row.unit !== filters.unit) return false;
    if (filters.recipient && row.recipient !== filters.recipient) return false;
    if (filters.status && row.status !== filters.status) return false;
    if (isActiveFilterValue(filters.sidrepFolio)) {
      /*
       * Un retiro sin folio NO pasa la búsqueda de folio. Es lo correcto: quien
       * escribe en ese campo está buscando un folio concreto, y las filas
       * "No aplica" no tienen ninguno que pueda coincidir.
       */
      if (!row.sidrepFolio) return false;
      if (!matchesSearch(row.sidrepFolio, filters.sidrepFolio as string)) return false;
    }
    return true;
  });
}

/**
 * Pastillas de la barra "Filtros activos".
 *
 * El nodo `3817:55652` trae el placeholder "Mes actual [Nombre del mes]": el
 * prefijo NO es parte del nombre del mes, es la aclaración de que el filtro está
 * en el período en curso. Por eso solo aparece cuando `period` es efectivamente
 * el mes de hoy; con cualquier otro mes se usa el prefijo por columna
 * ("Período: Mayo 2026"), que es la convención de `buildIntakeFilterChips` y de
 * `buildActiveFilters` en `InspectionsManagementView`.
 *
 * Es el mismo criterio que la pastilla de fecha de "Ingresos a bodega", que
 * agrega "día de hoy" solo cuando la fecha aplicada es la del día.
 */
export function buildWithdrawalFilterChips(
  filters: WasteWithdrawalFilters,
  currentIsoMonth: string,
): WasteWithdrawalFilterChip[] {
  const chips: WasteWithdrawalFilterChip[] = [];

  if (filters.period) {
    // `formatIsoMonthLabel` devuelve `null` si el valor no es un `yyyy-mm`
    // válido; en ese caso se muestra el valor crudo antes que una pastilla vacía.
    const label = formatIsoMonthLabel(filters.period) ?? filters.period;
    const isCurrentMonth = filters.period === currentIsoMonth;
    chips.push({ key: 'period', label: isCurrentMonth ? `Mes actual ${label}` : `Período: ${label}` });
  }
  if (filters.category) chips.push({ key: 'category', label: `Categoría: ${filters.category}` });
  if (filters.wasteType) chips.push({ key: 'wasteType', label: `Residuo: ${filters.wasteType}` });
  if (filters.quantity) chips.push({ key: 'quantity', label: `Cantidad: ${filters.quantity}` });
  if (filters.unit) chips.push({ key: 'unit', label: `Unidad: ${filters.unit}` });
  if (filters.recipient) chips.push({ key: 'recipient', label: `Destinatario: ${filters.recipient}` });
  if (filters.sidrepFolio) chips.push({ key: 'sidrepFolio', label: `Folio: ${filters.sidrepFolio}` });
  if (filters.status) {
    chips.push({ key: 'status', label: `Estado: ${WASTE_WITHDRAWAL_STATUS_LABELS[filters.status]}` });
  }

  return chips;
}
