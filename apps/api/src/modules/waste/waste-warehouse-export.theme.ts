import type { WarehouseControlLotStatus } from '@aurelia/contracts';

/**
 * Paleta y etiquetas de la exportación de "Control de bodega".
 *
 * Vive en un módulo aparte porque el PDF y el Excel DEBEN coincidir: si cada
 * renderer declarara sus propios colores y encabezados, "la misma información"
 * dependería de que nadie se olvide de actualizar los dos.
 *
 * Los hex salen del nodo Figma `3686:24644`, los mismos que usa
 * `apps/web/src/modules/waste/wasteWarehouseThresholds.ts`.
 */

export const WAREHOUSE_EXPORT_COLORS = {
  ink: '#131313',
  muted: '#646464',
  border: '#e3e3e3',
  navy: '#001e39',
  navyRule: '#122e47',
  filterBand: '#f0f4f8',
  track: '#f7f7f7',
  gold: '#c8a064',
  separator: '#acacac',
  white: '#ffffff',
} as const;

/** Tono de las barras del acumulado: verde ≤55%, ámbar 56-70%, rojo >70%. */
export const WAREHOUSE_EXPORT_TONES = {
  safe: { fill: '#00b398', badgeBackground: '#c5fff6', badgeText: '#006153' },
  warning: { fill: '#e8720c', badgeBackground: '#fff0e6', badgeText: '#6b3a1f' },
  critical: { fill: '#bd3b5b', badgeBackground: '#ffd0db', badgeText: '#570b1d' },
} as const;

export type WarehouseExportTone = keyof typeof WAREHOUSE_EXPORT_TONES;

export function resolveAccumulationTone(percentage: number): WarehouseExportTone {
  if (percentage > 70) return 'critical';
  if (percentage > 55) return 'warning';
  return 'safe';
}

export const WAREHOUSE_EXPORT_LOT_STATUS: Record<
  WarehouseControlLotStatus,
  { label: string; background: string | null; text: string }
> = {
  overdue: { label: 'Vencido', background: '#ffd0db', text: '#570b1d' },
  near_limit: { label: 'Cerca del límite', background: '#fff0e6', text: '#6b3a1f' },
  normal: { label: 'Normal', background: null, text: '#646464' },
};

export const WAREHOUSE_EXPORT_HAZARD = {
  hazardous: { label: 'Peligroso', background: '#ffd0db', text: '#570b1d' },
  nonHazardous: { label: 'No peligroso', background: '#e6f3ff', text: '#0d3862' },
} as const;

/**
 * Columnas de la tabla de lotes. `weight` es la proporción del nodo Figma
 * (125.5 · 180.5 · 180.5 · 172.5 · 152.5 · 155.5 · 117.46 px sobre 1084.46), que
 * el PDF reparte sobre el ancho útil de la A4 y el Excel traduce a caracteres.
 */
export interface WarehouseExportColumn {
  header: string;
  weight: number;
  /** Ancho en caracteres para Excel. */
  excelWidth: number;
  align: 'left' | 'center';
}

export const WAREHOUSE_EXPORT_COLUMNS: WarehouseExportColumn[] = [
  { header: 'Peligrosidad', weight: 11.573, excelWidth: 16, align: 'center' },
  { header: 'Categoría operativa', weight: 16.644, excelWidth: 26, align: 'left' },
  { header: 'Residuo específico', weight: 16.644, excelWidth: 26, align: 'left' },
  { header: 'Cantidad en bodega', weight: 15.906, excelWidth: 20, align: 'left' },
  { header: 'Unidad de medida', weight: 14.062, excelWidth: 20, align: 'left' },
  { header: 'Tiempo en bodega', weight: 14.339, excelWidth: 18, align: 'left' },
  { header: 'Estado', weight: 10.831, excelWidth: 18, align: 'center' },
];

export const WAREHOUSE_EXPORT_SECTIONS = {
  kpis: 'Resumen de bodega',
  bars: 'Acumulado mensual vs. umbral RCA',
  expirations: 'Próximos vencimientos',
  lots: 'Detalle de lotes en bodega',
} as const;

export const WAREHOUSE_EXPORT_SUBJECT = 'Control de bodega de residuos';

/** `residuos-control-bodega-2026-08-06`. */
export function warehouseExportBaseFilename(generatedAt: Date): string {
  return `residuos-control-bodega-${generatedAt.toISOString().slice(0, 10)}`;
}
