import { WASTE_TYPE_CATALOG } from './wasteCatalogs';
import type { LotStorageStatus } from './wasteWarehouseThresholds';

/**
 * Filas de la tabla "Detalle de lotes en bodega" (nodo Figma `3765:42711`).
 *
 * El tipo y los datos viven acá y no dentro del componente para que el módulo de
 * filtros pueda tiparse contra ellos sin importar un `.tsx`. Misma separación que
 * `wasteIntakeRows.ts` en "Ingresos a bodega".
 *
 * CADA MAGNITUD VIAJA DOS VECES: el número para comparar y la cadena para
 * mostrar. Los filtros de "Cantidad en bodega" y "Tiempo en bodega" son
 * numéricos, y no se puede comparar contra "6,1 meses" —coma decimal y unidad
 * pegadas— sin parsear texto en cada tecleo. Cuando la vista consuma la API va a
 * pasar lo mismo: `GET /waste/lots` devuelve los numéricos como string, así que
 * la conversión ocurre una vez al armar la fila.
 */
export interface WarehouseLotRow {
  id: string;
  isHazardous: boolean;
  category: string;
  wasteType: string;
  /** Cantidad tal como se muestra en la celda. */
  quantity: string;
  /** La misma cantidad como número, para el filtro. */
  quantityValue: number;
  unit: string;
  /** Antigüedad ya formateada, p. ej. "6,1 meses". */
  elapsedLabel: string;
  /** La misma antigüedad en meses, para el filtro. */
  elapsedMonths: number;
  status: LotStorageStatus;
}

/** Meses con un decimal y coma, como los escribe el diseño: "6,1 meses". */
function monthsLabel(months: number): string {
  return `${months.toFixed(1).replace('.', ',')} meses`;
}

/**
 * `wasteTypeName` tiene que existir en `WASTE_TYPE_CATALOG`: de ahí salen la
 * categoría y la peligrosidad, que en la base son propiedad del residuo
 * (`waste_types.is_hazardous`) y no de la fila. Así no puede haber un dato de
 * muestra que diga "Aceite usado / no peligroso".
 */
function lotRow(
  id: string,
  wasteTypeName: string,
  unit: string,
  quantityValue: number,
  elapsedMonths: number,
  status: LotStorageStatus,
): WarehouseLotRow {
  const type = WASTE_TYPE_CATALOG.find((entry) => entry.name === wasteTypeName);
  if (!type) throw new Error(`Residuo fuera del catálogo: ${wasteTypeName}`);

  return {
    id,
    isHazardous: type.hazardous,
    category: type.category,
    wasteType: type.name,
    quantity: String(quantityValue),
    quantityValue,
    unit,
    elapsedLabel: monthsLabel(elapsedMonths),
    elapsedMonths,
    status,
  };
}

/**
 * Las quince filas del nodo: 8 peligrosas y 7 no peligrosas, con las mismas
 * antigüedades del diseño.
 *
 * Los textos del nodo ("Categoría del residuo", "Detalle del residuo", "XXXX")
 * son marcadores de posición, no datos, y con ellos los filtros no se pueden
 * ejercitar: un selector con una sola alternativa no se prueba, y un valor
 * numérico no tiene contra qué compararse. Se reemplazan por los catálogos
 * reales —los mismos que usa "Ingresos a bodega"— para que las dos tablas
 * ofrezcan exactamente las mismas alternativas.
 */
export const WAREHOUSE_LOT_ROW_DEFAULTS: WarehouseLotRow[] = [
  lotRow('1', 'Aceite usado', 'Tambor', 12, 6.1, 'overdue'),
  lotRow('2', 'Baterías de plomo ácido', 'Unidad', 8, 5.2, 'near_limit'),
  lotRow('3', 'Huaipe contaminado', 'Contenedor', 5, 5.0, 'near_limit'),
  lotRow('4', 'Aceite usado', 'Tambor', 20, 0.6, 'normal'),
  lotRow('5', 'Huaipe contaminado', 'Contenedor', 3, 0.4, 'normal'),
  lotRow('6', 'Baterías de plomo ácido', 'Unidad', 15, 0.3, 'normal'),
  lotRow('7', 'Aceite usado', 'Tambor', 7, 0.3, 'normal'),
  lotRow('8', 'Huaipe contaminado', 'Tambor', 9, 0.3, 'normal'),
  lotRow('9', 'Chatarra metálica', 'Tonelada', 25, 0.3, 'normal'),
  lotRow('10', 'Residuos domiciliarios', 'Kilogramo', 4, 0.3, 'normal'),
  lotRow('11', 'Lodos de planta de tratamiento', 'Metro cúbico', 11, 0.3, 'normal'),
  lotRow('12', 'Chatarra metálica', 'Tonelada', 6, 0.3, 'normal'),
  lotRow('13', 'Residuos domiciliarios', 'Kilogramo', 18, 0.3, 'normal'),
  lotRow('14', 'Lodos de planta de tratamiento', 'Metro cúbico', 2, 0.3, 'normal'),
  lotRow('15', 'Chatarra metálica', 'Tonelada', 14, 0.3, 'normal'),
];
