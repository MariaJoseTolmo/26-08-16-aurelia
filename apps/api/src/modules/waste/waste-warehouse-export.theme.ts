import type {
  WarehouseControlLotStatus,
  WasteAccumulationTone,
  WasteSinaderExportStatus,
} from '@aurelia/contracts';

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

/**
 * Columnas del consolidado SINADER (nodo `3830:65642`). `weight` es la proporción
 * del nodo —437 · 86 · 157 · 242 · 122 px sobre 1044—, la misma que la web usa
 * como porcentaje en su `<colgroup>`.
 *
 * Comparten archivo con las otras dos exportaciones del módulo por el motivo del
 * encabezado: el PDF y el Excel de una misma vista tienen que decir lo mismo, y
 * las tres vistas tienen que llamar igual a las mismas cosas.
 */
export const WASTE_SINADER_EXPORT_COLUMNS: WarehouseExportColumn[] = [
  { header: 'Residuo (código SINADER)', weight: 41.858, excelWidth: 42, align: 'left' },
  { header: 'Cantidad', weight: 8.238, excelWidth: 14, align: 'left' },
  { header: 'Tipo de tratamiento', weight: 15.038, excelWidth: 22, align: 'left' },
  { header: 'Destino', weight: 23.18, excelWidth: 30, align: 'left' },
  { header: 'Transportista', weight: 11.686, excelWidth: 22, align: 'left' },
];

/**
 * La categoría del residuo NO es una columna del nodo: en pantalla es una pastilla
 * DENTRO de la primera celda, arriba del nombre. El PDF la dibuja igual —pastilla
 * sobre el texto—, pero el Excel no puede apilar dos cosas en una celda sin perder
 * la capacidad de filtrar por categoría, que es la razón de abrir el archivo en
 * Excel. Ahí va como columna propia, adelante.
 */
export const WASTE_SINADER_EXPORT_CATEGORY_COLUMN = { header: 'Categoría', excelWidth: 24 } as const;

/** Pastilla de categoría de la primera columna. Mismo azul que "No peligroso". */
export const WASTE_SINADER_EXPORT_CATEGORY_BADGE = {
  background: '#e6f3ff',
  text: '#0d3862',
} as const;

/**
 * El PDF del Reporte SINADER está dibujado en CSS px a 96dpi —A4 es 794 × 1123—
 * y pdfkit trabaja en PUNTOS a 72dpi, donde A4 es 595.28 × 841.89.
 *
 * La razón es exacta: 72/96 = 0.75, y 794 × 0.75 = 595.5 ≈ 595.28. Así que TODA
 * medida leída del nodo se multiplica por este factor y no se traduce a ojo.
 */
export const PDF_PX_TO_PT = 0.75;

/** Convierte una medida del nodo (px a 96dpi) a puntos de pdfkit. */
export function pdfPt(px: number): number {
  return px * PDF_PX_TO_PT;
}

/**
 * Tonos del encabezado del documento, por estado del período.
 *
 * `badge` es la píldora bajo el subtítulo y `notice` el recuadro de contexto. En
 * los períodos cerrados los dos comparten paleta, pero EN CURSO NO: su píldora es
 * azul (`4319:33871`) y su recuadro es gris (`4319:33875`). Se respeta como está
 * dibujado; conviene confirmarlo con diseño, porque parece que ese recuadro se
 * dibujó antes que los otros dos.
 */
export const WASTE_SINADER_EXPORT_TONES: Record<
  WasteSinaderExportStatus,
  {
    badge: { background: string; text: string };
    notice: { background: string; border: string; text: string };
  }
> = {
  in_progress: {
    badge: { background: '#e6f3ff', text: '#0d3862' },
    notice: { background: '#f7f7f7', border: '#e3e3e3', text: '#646464' },
  },
  pending_declaration: {
    badge: { background: '#fff0e6', text: '#6b3a1f' },
    notice: { background: '#e6f3ff', border: '#c5d8f0', text: '#0d3862' },
  },
  declared: {
    badge: { background: '#e0ffd3', text: '#2a5c16' },
    notice: { background: '#e0ffd3', border: '#a8dfa8', text: '#2a5c16' },
  },
};

/**
 * Texto legal del pie, por estado.
 *
 * Vive acá y no en el request porque es boilerplate del DOCUMENTO, no un dato de
 * la vista: cambia con el estado, no con el período. Mismo criterio que
 * `EMAIL_SHELL_FOOTER_LINES`.
 *
 * El período abierto y el pendiente comparten texto —los dos avisan que esto no es
 * la declaración oficial y que el estado puede cambiar—; el declarado pierde esa
 * última frase porque ya no cambia.
 */
const SINADER_DISCLAIMER_OPEN =
  'Este documento fue generado automáticamente por AurelIA a partir de los registros de residuos no peligrosos ingresados hasta la fecha indicada. Documento de trabajo — no constituye la declaración oficial ante el Ministerio del Medio Ambiente. Estado sujeto a cambios hasta el cierre del período.';

const SINADER_DISCLAIMER_DECLARED =
  'Este documento fue generado automáticamente por AurelIA a partir de los registros de residuos no peligrosos del período. Respaldo interno — no constituye la declaración oficial ante el Ministerio del Medio Ambiente.';

export const WASTE_SINADER_EXPORT_DISCLAIMER: Record<WasteSinaderExportStatus, string> = {
  in_progress: SINADER_DISCLAIMER_OPEN,
  pending_declaration: SINADER_DISCLAIMER_OPEN,
  declared: SINADER_DISCLAIMER_DECLARED,
};

/** Rótulos fijos del membrete y del pie — nodos `4319:33865`, `4319:33975` y `4319:33977`. */
export const WASTE_SINADER_EXPORT_CHROME = {
  headerSubject: 'Módulo Residuos · Reporte SINADER',
  footerLeft: 'Generado por AurelIA SGA · Gold Fields Salares Norte · aurelia.goldfields.cl',
  footerRight: 'Confidencial · Uso Interno',
  signatureDeclaredByLabel: 'Declarado por',
  signatureFolioLabel: 'Fecha y N° Folio SINADER',
} as const;

/**
 * Anchos de las columnas del PDF, en px del nodo: 183 · 75 · 135 · 184 · 105 = 682.
 *
 * NO coinciden con los de la pantalla (`WASTE_SINADER_EXPORT_COLUMNS`), y es
 * deliberado del diseño: el documento reparte más ancho a "destino" y menos a
 * "residuo" porque en A4 el nombre del residuo se envuelve en dos líneas sin
 * problema, mientras que un destino cortado deja de identificar el lugar.
 */
export const WASTE_SINADER_PDF_COLUMN_WIDTHS_PX = [183, 75, 135, 184, 105] as const;

export const WASTE_SINADER_EXPORT_SECTIONS = {
  kpis: 'Resumen del período',
  rows: 'Consolidado de movimientos no peligrosos',
} as const;

export const WASTE_SINADER_EXPORT_SUBJECT = 'Reporte SINADER de residuos';

/** `residuos-reporte-sinader-2026-08-14`. */
export function wasteSinaderExportBaseFilename(generatedAt: Date): string {
  return `residuos-reporte-sinader-${generatedAt.toISOString().slice(0, 10)}`;
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
