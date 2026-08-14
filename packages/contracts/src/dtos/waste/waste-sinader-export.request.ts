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

/**
 * Estado del período, en su forma SEMÁNTICA.
 *
 * Viaja aparte de `statusLabel` porque el renderer no elige colores a partir de un
 * texto: de este valor salen el tono de la pastilla, el del recuadro de contexto y
 * cuál de los dos textos legales va al pie. Es el mismo criterio que
 * `WarehouseControlLotStatus`, que también manda el estado y deja el mapa de
 * colores del lado que dibuja.
 */
export type WasteSinaderExportStatus = 'in_progress' | 'pending_declaration' | 'declared';

/**
 * Bloque de firma del documento declarado — nodo `4319:33833`.
 *
 * Sólo existe en esa variante: es la constancia de quién trasladó los totales a la
 * Ventanilla Única y con qué folio quedaron. En los otros dos estados todavía no
 * hay nada que firmar.
 */
export interface WasteSinaderExportSignature {
  /** "[Nombre y apellido] — Especialista Medio Ambiente". */
  declaredBy: string;
  /** "05-08-2026, 10:15 · Folio 1227458". */
  declaredAtAndFolio: string;
}

export interface WasteSinaderExportRequest {
  /** Decide tonos y texto legal. Ver `WasteSinaderExportStatus`. */
  status: WasteSinaderExportStatus;
  /**
   * Rótulo de la pastilla, en mayúsculas — "EN CURSO — DATOS PARCIALES".
   *
   * NO es `statusLabel`: aquél es el valor de la tarjeta de KPI ("En curso") y éste
   * el de la píldora del encabezado, que en el documento dice más. Los nodos los
   * escriben distinto, así que son dos campos.
   */
  statusBadgeLabel: string;
  /**
   * Aclaración bajo la tabla — "Pueden sumarse más movimientos antes de fin de mes".
   *
   * Sólo la trae el período en curso (`4319:33968`): es la advertencia de que ese
   * total todavía se mueve. Un período cerrado no la necesita.
   */
  tableFootnote?: string;
  signature?: WasteSinaderExportSignature;
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
