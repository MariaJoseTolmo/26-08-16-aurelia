import type { WarehouseControlLotStatus, WasteAccumulationTone } from '@aurelia/contracts';

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

/**
 * Colores de las barras del acumulado.
 *
 * La CONDICIÓN que elige el tono no está acá: es
 * `resolveWasteAccumulationTone` de `@aurelia/contracts`, la misma que evalúa la
 * pantalla. El `Record<WasteAccumulationTone, …>` fuerza a que este mapa cubra
 * todos los tonos del contrato: si mañana se agrega uno, esto no compila.
 */
export const WAREHOUSE_EXPORT_TONES: Record<
  WasteAccumulationTone,
  { fill: string; badgeBackground: string; badgeText: string }
> = {
  safe: { fill: '#00b398', badgeBackground: '#c5fff6', badgeText: '#006153' },
  warning: { fill: '#e8720c', badgeBackground: '#fff0e6', badgeText: '#6b3a1f' },
  critical: { fill: '#bd3b5b', badgeBackground: '#ffd0db', badgeText: '#570b1d' },
};

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

/**
 * Columnas de "Ingresos a bodega" (nodo `3729:27632`). Comparten archivo con las
 * de "Control de bodega" —y la paleta de `WAREHOUSE_EXPORT_HAZARD`— para que las
 * dos exportaciones del módulo digan "Peligroso" igual y con el mismo color.
 *
 * `weight` no aplica acá: esta vista se exporta solo a Excel, así que no hay un
 * ancho de A4 que repartir. Los anchos en caracteres salen de la proporción del
 * nodo (153.5 · 180.5 · 163.5 · 171.5 · 158 · 215.5 · 180.5 · 215 · 125.5 px).
 */
export const WASTE_INTAKE_EXPORT_COLUMNS: Array<{ header: string; excelWidth: number }> = [
  { header: 'Fecha de ingreso', excelWidth: 16 },
  { header: 'Categoría operativa', excelWidth: 26 },
  { header: 'Residuo específico', excelWidth: 28 },
  { header: 'Cantidad ingresada', excelWidth: 18 },
  { header: 'Unidad de medida', excelWidth: 18 },
  { header: 'Lugar/sector proveniente', excelWidth: 30 },
  { header: 'Patente del vehículo', excelWidth: 18 },
  { header: 'Conductor', excelWidth: 24 },
  { header: 'Peligrosidad', excelWidth: 16 },
];

export const WASTE_INTAKE_EXPORT_SUBJECT = 'Ingresos a bodega de residuos';

/** `residuos-ingresos-bodega-2026-08-06`. */
export function wasteIntakeExportBaseFilename(generatedAt: Date): string {
  return `residuos-ingresos-bodega-${generatedAt.toISOString().slice(0, 10)}`;
}

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
