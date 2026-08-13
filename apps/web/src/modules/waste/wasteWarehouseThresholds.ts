import {
  resolveWasteAccumulationDeviation,
  type WarehouseControlLotStatus,
  type WasteAccumulationTone,
} from '@aurelia/contracts';
import type { WasteAlertSeverity } from '../../shared/services/waste-dashboard.service';

/**
 * Colores de la vista "Control de bodega".
 *
 * Los hex salen del nodo Figma `3686:24644`: `teal/600_cta` (#00b398), #e8720c y
 * `red/500_cta` (#bd3b5b) para el relleno de las barras.
 *
 * OJO con el nodo como referencia de TONO: sus tres barras están en 55%, 70% y
 * 86%, pintadas teal / ámbar / rojo, y eso ya NO se puede leer como el mapeo de
 * la regla. El tono depende de la barra de día del mes, que en ese diseño estaba
 * en 52%. El nodo sirve para los colores, no para decidir cuál va en cada caso.
 *
 * La CONDICIÓN vive en `resolveWasteAccumulationTone` de `@aurelia/contracts`,
 * porque el PDF que genera la API tiene que aplicar exactamente la misma.
 */

interface AccumulationToneStyle {
  /** Color del relleno de la barra. */
  bar: string;
  /** Fondo de la pastilla de desvío. */
  badgeBackground: string;
  /** Color del texto de la pastilla de desvío. */
  badgeText: string;
}

/**
 * Valores exactos del nodo. Fondos de pastilla `teal/100`, `#fff0e6` y
 * `red/100_surf`; textos `teal/900_txt`, `#6b3a1f` y `red/900_txt`.
 */
export const ACCUMULATION_TONE_STYLES: Record<WasteAccumulationTone, AccumulationToneStyle> = {
  safe: { bar: '#00b398', badgeBackground: '#c5fff6', badgeText: '#006153' },
  warning: { bar: '#e8720c', badgeBackground: '#fff0e6', badgeText: '#6b3a1f' },
  critical: { bar: '#bd3b5b', badgeBackground: '#ffd0db', badgeText: '#570b1d' },
};

/**
 * Palabra de la pastilla de desvío, según el nodo `3686:24644`, que trae
 * "Adelantado +18pp", "Crítico +34pp" y "Normal +2pp".
 *
 * La copy vive acá y no en `@aurelia/contracts` porque ese paquete no lleva
 * texto de interfaz. La API no la necesita: el PDF y el Excel reciben la
 * etiqueta ya armada dentro del payload de exportación.
 */
const ACCUMULATION_DEVIATION_WORDS: Record<WasteAccumulationTone, string> = {
  safe: 'Normal',
  warning: 'Adelantado',
  critical: 'Crítico',
};

/**
 * Etiqueta de desvío de una barra, p. ej. "Adelantado +18pp".
 *
 * Se CALCULA a partir de la distancia hasta la barra de día del mes. Antes era
 * texto fijo en los datos, lo que permitía que una pastilla dijera "Normal"
 * mientras se pintaba de ámbar. Ahora la palabra y el color salen del mismo
 * tono, así que no pueden contradecirse.
 *
 * Los desvíos negativos ya traen su signo; solo hay que anteponer el "+".
 */
export function formatAccumulationDeviation(percentage: number, monthElapsedPercentage: number): string {
  const { tone, deltaPercentagePoints } = resolveWasteAccumulationDeviation(percentage, monthElapsedPercentage);
  const sign = deltaPercentagePoints > 0 ? '+' : '';

  return `${ACCUMULATION_DEVIATION_WORDS[tone]} ${sign}${deltaPercentagePoints}pp`;
}

/**
 * Los DOS pares superficie/tinta de aviso del archivo, en un solo lugar.
 *
 * El mismo par aparece en "Próximos vencimientos" (`3686:25797` / `3686:25788`) y
 * en "Alertas activas" del dashboard (`3086:13901` / `3530:610`), y en la tabla de
 * lotes como fondo de pastilla. Estaban repetidos como hex sueltos en cada mapa, y
 * repetir un color es dejar que se separen: alcanza con que alguien retoque uno.
 */
const WARNING_SURFACE = { background: '#fff0e6', ink: '#e8720c' } as const;
const CRITICAL_SURFACE = { background: '#ffd0db', ink: '#bd3b5b' } as const;

/**
 * Gravedad de alerta → color (nodo `3086:13898`).
 *
 * La gravedad la decide el SERVIDOR —el tipo vive en `waste-dashboard.service`—
 * y acá solo se traduce a color: las dos primeras alertas del nodo van con la
 * superficie ámbar y la tercera con la roja.
 */
export const WASTE_ALERT_SEVERITY_STYLES: Record<
  WasteAlertSeverity,
  { badgeBackground: string; iconColor: string }
> = {
  WARNING: { badgeBackground: WARNING_SURFACE.background, iconColor: WARNING_SURFACE.ink },
  CRITICAL: { badgeBackground: CRITICAL_SURFACE.background, iconColor: CRITICAL_SURFACE.ink },
};

export type ExpirationKind = 'overdue' | 'due_soon';

/**
 * Regla de negocio de las cards de vencimientos: alerta si el lote ya está
 * vencido, reloj ámbar si todavía no lo está.
 */
export function resolveExpirationKind(isOverdue: boolean): ExpirationKind {
  return isOverdue ? 'overdue' : 'due_soon';
}

interface ExpirationKindStyle {
  /** Fondo del contenedor de 30px del icono. */
  badgeBackground: string;
  /** Color del glifo. */
  iconColor: string;
}

export const EXPIRATION_KIND_STYLES: Record<ExpirationKind, ExpirationKindStyle> = {
  overdue: { badgeBackground: CRITICAL_SURFACE.background, iconColor: CRITICAL_SURFACE.ink },
  due_soon: { badgeBackground: WARNING_SURFACE.background, iconColor: WARNING_SURFACE.ink },
};

/**
 * Estado de almacenamiento de un lote, usado por la columna "Estado" y por el
 * color de "Tiempo en bodega" en la tabla (nodo `3765:42711`).
 *
 * Mismos tres estados que las cards de "Próximos vencimientos", pero con su
 * propia representación: acá la fila normal NO lleva pastilla.
 *
 * La unión NO se declara acá: viene de `@aurelia/contracts`, porque la
 * exportación a PDF/Excel la manda al backend y ambos lados tienen que coincidir.
 */
export type LotStorageStatus = WarehouseControlLotStatus;

export const LOT_STORAGE_STATUS_LABELS: Record<LotStorageStatus, string> = {
  overdue: 'Vencido',
  near_limit: 'Cerca del límite',
  normal: 'Normal',
};

interface LotStorageStatusStyle {
  /** Fondo de la pastilla. `null` cuando el diseño no usa pastilla. */
  badgeBackground: string | null;
  /** Color del texto de la pastilla o, sin pastilla, del texto plano. */
  badgeText: string;
  /** Clases del texto de "Tiempo en bodega" para ese estado. */
  elapsedClassName: string;
}

/**
 * Valores exactos del nodo:
 *
 *   Vencido           pastilla #ffd0db · texto #570b1d 10px · tiempo Bold 12px #570b1d
 *   Cerca del límite  pastilla #fff0e6 · texto #6b3a1f 10px · tiempo Bold 12px #6b3a1f
 *   Normal            sin pastilla     · texto #646464 11.5px · tiempo Regular 11.5px #646464
 */
export const LOT_STORAGE_STATUS_STYLES: Record<LotStorageStatus, LotStorageStatusStyle> = {
  overdue: {
    badgeBackground: '#ffd0db',
    badgeText: '#570b1d',
    elapsedClassName: "font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#570b1d]",
  },
  near_limit: {
    badgeBackground: '#fff0e6',
    badgeText: '#6b3a1f',
    elapsedClassName: "font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#6b3a1f]",
  },
  normal: {
    badgeBackground: null,
    badgeText: '#646464',
    elapsedClassName: "font-['Inter:Regular',sans-serif] text-[11.5px] font-normal text-[#646464]",
  },
};

/** Porcentaje acotado a 0-100 para no desbordar el track de la barra. */
export function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
