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

/**
 * Bodega (Plataforma 18).
 *
 * LOS DOS SECTORES ABREN TARJETAS DISTINTAS, y esa es la diferencia de fondo entre
 * ellos: la bodega ELIGE un lote ya recepcionado del modal `3765:40585` (nodo
 * `4218:7583`), mientras que Truckshop lo DESCRIBE contra los catálogos (nodo
 * `4223:9770`). Tiene sentido: lo que sale de bodega pasó por una recepción y tiene
 * saldo; lo que sale del taller, no.
 */
export const WASTE_WITHDRAWAL_WAREHOUSE_SECTOR = 'warehouse-platform-18';

export const WASTE_WITHDRAWAL_SECTOR_OPTIONS: WasteOption[] = [
  { value: WASTE_WITHDRAWAL_WAREHOUSE_SECTOR, label: 'Bodega (Plataforma 18)' },
  { value: WASTE_WITHDRAWAL_TRUCKSHOP_SECTOR, label: 'Truckshop' },
];

/** Rótulo del sector elegido. Mismo criterio que `resolveDisposalSiteLabel`. */
export function resolveWasteWithdrawalSectorLabel(value: string | null): string {
  if (!value) return '—';
  return WASTE_WITHDRAWAL_SECTOR_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
