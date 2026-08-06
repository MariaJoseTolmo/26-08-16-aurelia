import type { WarehouseControlLotStatus } from '@aurelia/contracts';

/**
 * Umbrales visuales de la vista "Control de bodega".
 *
 * Los colores salen del nodo Figma `3686:24644`, donde las tres barras del
 * acumulado mensual traen anchos que confirman el mapeo:
 *
 *   55%  →  284.094 / 516.539  →  #00b398  (teal/600_cta)
 *   70%  →  361.570 / 516.539  →  #e8720c
 *   86%  →  444.219 / 516.539  →  #bd3b5b  (red/500_cta)
 */

export type AccumulationTone = 'safe' | 'warning' | 'critical';

/**
 * Regla de negocio de las barras: verde hasta 55%, ámbar entre 56% y 70%,
 * rojo por encima de 70%.
 *
 * El límite inferior se evalúa como `<= 55` y no `< 55`: el diseño pinta la
 * barra de 55% en verde, así que 55 pertenece al tramo seguro.
 */
export function resolveAccumulationTone(percentage: number): AccumulationTone {
  if (percentage > 70) return 'critical';
  if (percentage > 55) return 'warning';
  return 'safe';
}

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
export const ACCUMULATION_TONE_STYLES: Record<AccumulationTone, AccumulationToneStyle> = {
  safe: { bar: '#00b398', badgeBackground: '#c5fff6', badgeText: '#006153' },
  warning: { bar: '#e8720c', badgeBackground: '#fff0e6', badgeText: '#6b3a1f' },
  critical: { bar: '#bd3b5b', badgeBackground: '#ffd0db', badgeText: '#570b1d' },
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
  overdue: { badgeBackground: '#ffd0db', iconColor: '#bd3b5b' },
  due_soon: { badgeBackground: '#fff0e6', iconColor: '#e8720c' },
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
