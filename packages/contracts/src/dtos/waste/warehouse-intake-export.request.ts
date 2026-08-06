/**
 * Payload de exportación de la vista "Ingresos a bodega" (módulo Residuos).
 *
 * Sigue la misma idea que `warehouse-control-export.request`: es un DOCUMENTO,
 * no una consulta. El cliente manda exactamente lo que está viendo —las filas ya
 * filtradas y las pastillas de filtro tal como se leen en pantalla— así que el
 * Excel y la pantalla coinciden por construcción y no por que dos formateadores
 * distintos se pongan de acuerdo.
 *
 * `quantity` es la excepción numérica, por el mismo motivo por el que el
 * porcentaje de las barras viaja como número en el otro payload: una cantidad
 * que llega como texto no se puede sumar ni ordenar, y eso es justamente para lo
 * que sirve un Excel. La fecha sí viaja formateada (`dd-mm-aaaa`) porque ahí lo
 * que importa es leerla igual que en la tabla.
 */

export interface WarehouseIntakeExportRow {
  /** Fecha de ingreso ya formateada como en la tabla: `dd-mm-aaaa`. */
  entryDate: string;
  category: string;
  wasteType: string;
  /** Cantidad como número real, para que la planilla pueda sumarla y ordenarla. */
  quantity: number;
  unit: string;
  /** Lugar o sector de origen del residuo. */
  origin: string;
  plate: string;
  driver: string;
  hazardous: boolean;
}

export interface WarehouseIntakeExportRequest {
  /** Título del header de la vista, p. ej. "Bodega de acopio - Plataforma 18". */
  title: string;
  description: string;
  /**
   * Pastillas de "Filtros activos" tal como se ven, p. ej.
   * `["06-08-2026 día de hoy", "Categoría: Lodos"]`. Se imprimen en la cabecera
   * de la planilla: sin eso, un Excel con 4 de 6 filas no explica por qué faltan
   * las otras dos.
   */
  activeFilters: string[];
  /** Filas ya filtradas, todas — no solo la página visible. */
  rows: WarehouseIntakeExportRow[];
}
