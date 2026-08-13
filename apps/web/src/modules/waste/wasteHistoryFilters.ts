import {
  distinctOptions,
  isActiveFilterValue,
  matchesNumericMinimum,
  matchesSearch,
  WASTE_HAZARD_OPTIONS,
  type WasteHazardFilterValue,
  type WasteOption,
} from './wasteFilterPrimitives';
import { formatIsoMonthLabel, isoDateInMonth } from './wasteMonthFilter';
import {
  WASTE_HISTORY_STATUS_LABELS,
  type WasteHistoryRow,
  type WasteHistoryStatus,
} from './wasteHistoryRows';

/**
 * Estado y reglas de filtrado de "Histórico de retiros" — barra `3813:48473` y
 * columnas de la tabla `3785:47830`.
 *
 * Mismo contrato que `wasteWithdrawalFilters.ts`, `wasteIntakeFilters.ts` y
 * `wasteWarehouseFilters.ts`: un objeto plano donde `null` significa "sin
 * filtrar", la página es la dueña del estado y las pastillas se derivan de él.
 * Que la barra de filtros activos y la fila de filtros de la tabla lean del
 * MISMO objeto es lo que impide que se contradigan.
 *
 * Dieciocho de las diecinueve columnas traen control; "Respaldo" (`3816:49843`)
 * es la excepción: su celda de filtro está VACÍA en el nodo, y filtrar por un
 * enlace no significaría nada.
 *
 * Todos los filtros son de CLIENTE en esta iteración, sobre el set completo de
 * filas. Cuando la vista consuma la API se reemplazan por parámetros del
 * endpoint.
 */

export interface WasteHistoryFilters {
  /** ISO `yyyy-mm` del selector de meses de la primera columna. */
  period: string | null;
  hazard: WasteHazardFilterValue | null;
  category: string | null;
  wasteType: string | null;
  quantity: string | null;
  unit: string | null;
  carrier: string | null;
  sector: string | null;
  recipient: string | null;
  sidrepFolio: string | null;
  declaredWeight: string | null;
  receivedWeight: string | null;
  weightDiffKg: string | null;
  weightDiffPercent: string | null;
  daysOpen: string | null;
  environmentOwnerOpen: string | null;
  environmentOwnerClose: string | null;
  status: WasteHistoryStatus | null;
}

export type WasteHistoryFilterKey = keyof WasteHistoryFilters;

export type WasteHistorySelectFilterKey =
  | 'hazard'
  | 'category'
  | 'wasteType'
  | 'unit'
  | 'carrier'
  | 'sector'
  | 'recipient'
  | 'environmentOwnerOpen'
  | 'environmentOwnerClose'
  | 'status';

export type WasteHistoryNumberFilterKey =
  | 'quantity'
  | 'declaredWeight'
  | 'receivedWeight'
  | 'weightDiffKg'
  | 'weightDiffPercent'
  | 'daysOpen';

export type WasteHistoryFilterOptions = Record<WasteHistorySelectFilterKey, WasteOption[]>;

export interface WasteHistoryFilterChip {
  key: WasteHistoryFilterKey;
  label: string;
}

export const EMPTY_WASTE_HISTORY_FILTERS: WasteHistoryFilters = {
  period: null,
  hazard: null,
  category: null,
  wasteType: null,
  quantity: null,
  unit: null,
  carrier: null,
  sector: null,
  recipient: null,
  sidrepFolio: null,
  declaredWeight: null,
  receivedWeight: null,
  weightDiffKg: null,
  weightDiffPercent: null,
  daysOpen: null,
  environmentOwnerOpen: null,
  environmentOwnerClose: null,
  status: null,
};

const STATUS_OPTIONS: WasteOption[] = (
  Object.keys(WASTE_HISTORY_STATUS_LABELS) as WasteHistoryStatus[]
).map((value) => ({ value, label: WASTE_HISTORY_STATUS_LABELS[value] }));

/**
 * Alternativas de cada selector, derivadas del set COMPLETO de filas.
 *
 * Peligrosidad y estado son cerrados —salen del enum— y el resto se deriva de
 * los datos, igual que en las otras tres tablas del módulo.
 */
export function buildHistoryFilterOptions(rows: WasteHistoryRow[]): WasteHistoryFilterOptions {
  return {
    hazard: WASTE_HAZARD_OPTIONS,
    status: STATUS_OPTIONS,
    category: distinctOptions(rows.map((row) => row.category)),
    wasteType: distinctOptions(rows.map((row) => row.wasteType)),
    unit: distinctOptions(rows.map((row) => row.unit)),
    carrier: distinctOptions(rows.map((row) => row.carrier)),
    sector: distinctOptions(rows.map((row) => row.sector)),
    recipient: distinctOptions(rows.map((row) => row.recipient)),
    environmentOwnerOpen: distinctOptions(rows.map((row) => row.environmentOwnerOpen)),
    environmentOwnerClose: distinctOptions(rows.map((row) => row.environmentOwnerClose)),
  };
}

export function filterHistoryRows(
  rows: WasteHistoryRow[],
  filters: WasteHistoryFilters,
): WasteHistoryRow[] {
  return rows.filter((row) => {
    if (filters.period && !isoDateInMonth(row.withdrawalDate, filters.period)) return false;
    if (filters.hazard && (filters.hazard === 'hazardous') !== row.isHazardous) return false;
    if (filters.category && row.category !== filters.category) return false;
    if (filters.wasteType && row.wasteType !== filters.wasteType) return false;
    if (filters.unit && row.unit !== filters.unit) return false;
    if (filters.carrier && row.carrier !== filters.carrier) return false;
    if (filters.sector && row.sector !== filters.sector) return false;
    if (filters.recipient && row.recipient !== filters.recipient) return false;
    if (filters.environmentOwnerOpen && row.environmentOwnerOpen !== filters.environmentOwnerOpen) {
      return false;
    }
    if (filters.environmentOwnerClose && row.environmentOwnerClose !== filters.environmentOwnerClose) {
      return false;
    }
    if (filters.status && row.status !== filters.status) return false;

    if (!matchesNumericMinimum(row.quantity, filters.quantity)) return false;
    if (!matchesNumericMinimum(row.declaredWeight, filters.declaredWeight)) return false;
    if (!matchesNumericMinimum(row.receivedWeight, filters.receivedWeight)) return false;
    if (!matchesNumericMinimum(row.weightDiffKg, filters.weightDiffKg)) return false;
    if (!matchesNumericMinimum(row.weightDiffPercent, filters.weightDiffPercent)) return false;
    if (!matchesNumericMinimum(row.daysOpen, filters.daysOpen)) return false;

    /*
     * El folio busca sobre el texto y NO sobre "No aplica": esa etiqueta es una
     * decisión de presentación, no un dato, y dejar que la búsqueda la
     * encontrara devolvería los no peligrosos al escribir "no".
     */
    if (isActiveFilterValue(filters.sidrepFolio)) {
      if (!row.sidrepFolio) return false;
      if (!matchesSearch(row.sidrepFolio, filters.sidrepFolio ?? '')) return false;
    }

    return true;
  });
}

/**
 * Pastillas de "Filtros activos".
 *
 * El nodo `3813:48479` dibuja una sola, "Mes actual [Nombre del mes]", que es la
 * del período cuando coincide con el mes en curso. El mismo criterio que en
 * "Solicitud de retiro": con otro mes la pastilla dice "Período: …".
 */
export function buildHistoryFilterChips(
  filters: WasteHistoryFilters,
  options: WasteHistoryFilterOptions,
  currentIsoMonth: string,
): WasteHistoryFilterChip[] {
  const chips: WasteHistoryFilterChip[] = [];

  if (filters.period) {
    const label = formatIsoMonthLabel(filters.period) ?? filters.period;
    chips.push({
      key: 'period',
      label: filters.period === currentIsoMonth ? `Mes actual ${label}` : `Período: ${label}`,
    });
  }

  const labelled: { key: WasteHistorySelectFilterKey; prefix: string }[] = [
    { key: 'hazard', prefix: 'Tipo' },
    { key: 'category', prefix: 'Categoría' },
    { key: 'wasteType', prefix: 'Residuo' },
    { key: 'unit', prefix: 'Unidad' },
    { key: 'carrier', prefix: 'Transportista' },
    { key: 'sector', prefix: 'Sector' },
    { key: 'recipient', prefix: 'Destinatario' },
    { key: 'environmentOwnerOpen', prefix: 'Responsable MA apertura' },
    { key: 'environmentOwnerClose', prefix: 'Responsable MA cierre' },
    { key: 'status', prefix: 'Estado' },
  ];

  for (const { key, prefix } of labelled) {
    const value = filters[key];
    if (!isActiveFilterValue(value)) continue;
    const option = options[key].find((candidate) => candidate.value === value);
    chips.push({ key, label: `${prefix}: ${option?.label ?? value}` });
  }

  if (isActiveFilterValue(filters.sidrepFolio)) {
    chips.push({ key: 'sidrepFolio', label: `Folio: ${filters.sidrepFolio}` });
  }

  return chips;
}
