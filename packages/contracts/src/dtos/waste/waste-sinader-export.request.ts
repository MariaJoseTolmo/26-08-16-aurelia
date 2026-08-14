/**
 * Payload de exportación de la vista "Reporte SINADER" (módulo Residuos).
 *
 * Mismo criterio que `WarehouseControlExportRequest`: es un DOCUMENTO, no una
 * consulta. Describe exactamente lo que el usuario está viendo, y por eso los
 * valores viajan ya formateados como texto ("2.290 kg", "1.240 kg") en vez de
 * números crudos. Eso garantiza que la pantalla, el PDF y el Excel digan lo mismo
 * POR CONSTRUCCIÓN, y no porque dos formateadores distintos —el de la web en
 * `es-CL` y el del servidor— casualmente coincidan.
 *
 * Acá pesa más que en las otras exportaciones del módulo: este consolidado es el
 * insumo de una declaración reglamentaria, así que el número del PDF tiene que ser
 * el mismo que el aprobador leyó y aprobó en pantalla.
 */

/** Una tarjeta de la fila de KPIs (nodo `3830:65741`). */
export interface WasteSinaderExportKpi {
  label: string;
  /**
   * Valor ya formateado. La tarjeta "Estado del período" no tiene cifra: manda el
   * rótulo de su pastilla ("En curso"), que es su valor.
   */
  value: string;
  /** Unidad detrás del valor — el "kg" de "Total acumulado". */
  unit?: string;
}

/** Una línea del consolidado (nodo `3830:65642`). */
export interface WasteSinaderExportRow {
  /** Categoría operativa, como la pastilla de la primera columna. */
  category: string;
  /** Código SINADER y nombre del residuo: "SN-17-04 — Chatarra metálica". */
  waste: string;
  /** Cantidad con su unidad: "1.240 kg". */
  quantity: string;
  treatment: string;
  destination: string;
  transport: string;
}

export interface WasteSinaderExportRequest {
  /** Encabezado de la vista, p. ej. "Reporte SINADER — Agosto 2026". */
  title: string;
  description: string;
  /** Sólo el período, para el subtítulo del documento: "Agosto 2026". */
  periodLabel: string;
  /** Rótulo del estado del período: "En curso", "Declarado". */
  statusLabel: string;
  /**
   * Aviso de período abierto, el banner `3830:65735`.
   *
   * OPCIONAL porque un período cerrado no lo muestra. Viaja para que el PDF avise
   * lo mismo que la pantalla: sin esa línea, un consolidado parcial impreso se lee
   * como definitivo, que es exactamente el malentendido que el banner evita.
   */
  notice?: string;
  kpis: WasteSinaderExportKpi[];
  rows: WasteSinaderExportRow[];
  /** Rótulo de la fila de totales: "Total acumulado hasta hoy". */
  totalLabel: string;
  /** Total del período con su unidad: "2.290 kg". */
  totalQuantity: string;
  /** Pie de la vista: "Última actualización: 14 ago 2026, 08:40 — …". */
  updatedAtLabel: string;
}
