/**
 * Payload de exportación de la vista "Control de bodega" (módulo Residuos).
 *
 * Es un DOCUMENTO, no una consulta: describe exactamente lo que el usuario está
 * viendo en pantalla. Por eso los valores viajan ya formateados como texto
 * ("6,1 meses", "98 / 140 ton (70%)") en vez de números crudos: garantiza que el
 * PDF, el Excel y la pantalla digan lo mismo por construcción y no por
 * coincidencia entre dos formateadores distintos.
 *
 * `percentage` es la única excepción numérica, porque el PDF necesita el valor
 * real para dibujar el ancho de la barra.
 */

/** Estado de almacenamiento de un lote. Deriva del tiempo en bodega vs. el plazo de 6 meses. */
export type WarehouseControlLotStatus = 'overdue' | 'near_limit' | 'normal';

export interface WarehouseControlExportKpi {
  label: string;
  value: string;
  /** Segundo valor, para la tarjeta "Ingresos vs. retiros (mes)": 9 / 7. */
  secondaryValue?: string;
  note?: string;
}

export interface WarehouseControlExportBar {
  label: string;
  /** Porcentaje consumido del umbral RCA, 0-100. Define el color de la barra. */
  percentage: number;
  deviationLabel: string;
  valueLabel: string;
}

export interface WarehouseControlExportExpiration {
  wasteName: string;
  intakeDate: string;
  detail: string;
  overdue: boolean;
}

export interface WarehouseControlExportLot {
  hazardous: boolean;
  category: string;
  wasteType: string;
  quantity: string;
  unit: string;
  elapsedLabel: string;
  status: WarehouseControlLotStatus;
}

export interface WarehouseControlExportRequest {
  /** Título del header de la vista, p. ej. "Bodega de acopio - Plataforma 18". */
  title: string;
  description: string;
  /** Línea de avance del mes, p. ej. "Hoy es el día 16 de 31 del mes (52% transcurrido)." */
  monthProgressLabel: string;
  kpis: WarehouseControlExportKpi[];
  bars: WarehouseControlExportBar[];
  expirations: WarehouseControlExportExpiration[];
  lots: WarehouseControlExportLot[];
}
