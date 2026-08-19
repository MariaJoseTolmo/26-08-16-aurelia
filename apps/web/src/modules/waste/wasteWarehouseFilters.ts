import { WASTE_CATEGORY_OPTIONS, WASTE_TYPE_OPTIONS, WASTE_UNIT_OPTIONS } from './wasteCatalogs';
import {
  WASTE_HAZARD_OPTIONS,
  isActiveFilterValue,
  matchesNumericMinimum,
  type WasteHazardFilterValue,
  type WasteOption,
} from './wasteFilterPrimitives';
import type { WarehouseLotRow } from './wasteWarehouseLotRows';
import { LOT_STORAGE_STATUS_LABELS, type LotStorageStatus } from './wasteWarehouseThresholds';

/**
 * Filtros de columna de la tabla "Detalle de lotes en bodega" (nodo `3765:42711`).
 *
 * Mismo contrato que `wasteIntakeFilters.ts` en "Ingresos a bodega": un objeto
 * plano donde `null` significa "sin filtrar", derivación de opciones a partir de
 * las filas, y el filtrado como función pura. La página es la dueña del estado.
 *
 * Los dos controles `#` del diseño ("Cantidad en bodega" y "Tiempo en bodega")
 * filtran por MÍNIMO. El criterio no se decide acá: está en
 * `matchesNumericMinimum`, compartido con la tabla de ingresos, para que el mismo
 * control no se comporte distinto según la vista.
 *
 * El diseño solo trae `#` como placeholder, sin operador visible, así que el
 * criterio se comunica por el nombre accesible del campo ("mínima" / "mínimo").
 */

export type { WasteHazardFilterValue };

export interface WasteWarehouseFilters {
  hazard: WasteHazardFilterValue | null;
  category: string | null;
  wasteType: string | null;
  unit: string | null;
  status: LotStorageStatus | null;
  /** Cantidad mínima. Se guarda como texto: es lo que emite el input. */
  quantityMin: string | null;
  /** Meses mínimos en bodega. */
  elapsedMin: string | null;
}

/** Columnas con selector de alternativas. */
export type WasteWarehouseSelectFilterKey = 'hazard' | 'category' | 'wasteType' | 'unit' | 'status';
/** Columnas con input numérico. */
export type WasteWarehouseNumberFilterKey = 'quantityMin' | 'elapsedMin';
export type WasteWarehouseFilterKey = WasteWarehouseSelectFilterKey | WasteWarehouseNumberFilterKey;

export const EMPTY_WASTE_WAREHOUSE_FILTERS: WasteWarehouseFilters = {
  hazard: null,
  category: null,
  wasteType: null,
  unit: null,
  status: null,
  quantityMin: null,
  elapsedMin: null,
};

/** Solo las columnas con selector tienen alternativas que ofrecer. */
export type WasteWarehouseFilterOptions = Record<WasteWarehouseSelectFilterKey, WasteOption[]>;

const STATUS_ORDER: LotStorageStatus[] = ['overdue', 'near_limit', 'normal'];

/**
 * Alternativas de cada selector.
 *
 * NINGUNA se deriva de las filas de esta tabla. Categoría, residuo y unidad son
 * catálogos de dominio compartidos con "Ingresos a bodega": derivarlos de las
 * filas hacía que una categoría con ingresos pero sin lotes apareciera en un
 * filtro y faltara en el otro. Peligrosidad y estado son conjuntos cerrados, y
 * derivarlos escondería "Vencido" justo cuando no hay lotes vencidos, que es
 * la lectura que confirma que no hay ninguno.
 */
export function buildWarehouseFilterOptions(): WasteWarehouseFilterOptions {
  return {
    hazard: WASTE_HAZARD_OPTIONS,
    category: WASTE_CATEGORY_OPTIONS,
    wasteType: WASTE_TYPE_OPTIONS,
    unit: WASTE_UNIT_OPTIONS,
    status: STATUS_ORDER.map((status) => ({ value: status, label: LOT_STORAGE_STATUS_LABELS[status] })),
  };
}

/** Filas que pasan todos los filtros activos. Los `null` no filtran. */
export function filterWarehouseLotRows(
  rows: WarehouseLotRow[],
  filters: WasteWarehouseFilters,
): WarehouseLotRow[] {
  return rows.filter((row) => {
    if (filters.hazard !== null && row.isHazardous !== (filters.hazard === 'hazardous')) return false;
    if (filters.category !== null && row.category !== filters.category) return false;
    if (filters.wasteType !== null && row.wasteType !== filters.wasteType) return false;
    if (filters.unit !== null && row.unit !== filters.unit) return false;
    if (filters.status !== null && row.status !== filters.status) return false;
    if (!matchesNumericMinimum(row.quantityValue, filters.quantityMin)) return false;
    if (!matchesNumericMinimum(row.elapsedMonths, filters.elapsedMin)) return false;
    return true;
  });
}

/**
 * Cantidad de filtros aplicados, para el contador de "Filtros activos".
 *
 * Un input numérico en blanco vale `''`, no `null`, así que descartar solo los
 * `null` lo contaría como filtro activo sin estar filtrando nada.
 */
export function countActiveWarehouseFilters(filters: WasteWarehouseFilters): number {
  return Object.values(filters).filter(isActiveFilterValue).length;
}
