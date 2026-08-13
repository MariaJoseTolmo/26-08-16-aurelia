import type { WasteOption } from './wasteFilterPrimitives';

/**
 * Sectores de procedencia de un retiro — nodos `4218:7537` y `4218:7538`.
 *
 * Son los dos que dibuja el diseño y no hay más: no es un catálogo que venga de
 * la API, es la bifurcación de origen del retiro. Van como `WasteOption` porque
 * es la forma que ya usa el módulo para sus listas de alternativas —ver
 * `WASTE_DISPOSAL_SITE_OPTIONS`—, así que el día que esto sí venga del backend
 * el consumidor no cambia.
 */
/**
 * Truckshop, el único sector que hoy abre la tarjeta "Lote seleccionado" (nodo
 * `4223:9770`). Se exporta como constante para que la pantalla no compare contra
 * un string suelto.
 */
export const WASTE_WITHDRAWAL_TRUCKSHOP_SECTOR = 'truckshop';

export const WASTE_WITHDRAWAL_SECTOR_OPTIONS: WasteOption[] = [
  { value: 'warehouse-platform-18', label: 'Bodega (Plataforma 18)' },
  { value: WASTE_WITHDRAWAL_TRUCKSHOP_SECTOR, label: 'Truckshop' },
];

/** Rótulo del sector elegido. Mismo criterio que `resolveDisposalSiteLabel`. */
export function resolveWasteWithdrawalSectorLabel(value: string | null): string {
  if (!value) return '—';
  return WASTE_WITHDRAWAL_SECTOR_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
