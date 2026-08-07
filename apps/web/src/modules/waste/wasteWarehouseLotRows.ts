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
 * Los nombres se extraen a constantes porque cada uno se repite hasta cuatro
 * veces y `lotRow` los resuelve por igualdad exacta contra el catálogo: con el
 * literal suelto, una tilde distinta en una sola fila revienta el módulo entero
 * al importarse, y hay que encontrar cuál de las quince es.
 *
 * Los textos del nodo ("Categoría del residuo", "Detalle del residuo", "XXXX")
 * son marcadores de posición, no datos, y con ellos los filtros no se pueden
 * ejercitar: un selector con una sola alternativa no se prueba, y un valor
 * numérico no tiene contra qué compararse. Se reemplazan por los catálogos
 * reales —los mismos que usa "Ingresos a bodega"— para que las dos tablas
 * ofrezcan exactamente las mismas alternativas.
 */
const ACEITE_USADO = 'Aceite usado / Aceites minerales usados';
const BATERIAS_PLOMO = 'Baterías de plomo';
const FILTROS_ACEITE = 'Filtros de aceite';
const CHATARRA = 'Chatarra (hierro y acero no galvanizados)';
const RESIDUOS_MUNICIPALES = 'Mezclas de residuos municipales (domésticos)';
const LODOS_PTAS = 'Lodos del tratamiento de aguas residuales urbanas / PTAS';

export const WAREHOUSE_LOT_ROW_DEFAULTS: WarehouseLotRow[] = [
  lotRow('1', ACEITE_USADO, 'Tambor', 12, 6.1, 'overdue'),
  lotRow('2', BATERIAS_PLOMO, 'Unidad', 8, 5.2, 'near_limit'),
  lotRow('3', FILTROS_ACEITE, 'Contenedor', 5, 5.0, 'near_limit'),
  lotRow('4', ACEITE_USADO, 'Tambor', 20, 0.6, 'normal'),
  lotRow('5', FILTROS_ACEITE, 'Contenedor', 3, 0.4, 'normal'),
  lotRow('6', BATERIAS_PLOMO, 'Unidad', 15, 0.3, 'normal'),
  lotRow('7', ACEITE_USADO, 'Tambor', 7, 0.3, 'normal'),
  lotRow('8', FILTROS_ACEITE, 'Tambor', 9, 0.3, 'normal'),
  lotRow('9', CHATARRA, 'Tonelada', 25, 0.3, 'normal'),
  lotRow('10', RESIDUOS_MUNICIPALES, 'Kilogramo', 4, 0.3, 'normal'),
  lotRow('11', LODOS_PTAS, 'Metro cúbico', 11, 0.3, 'normal'),
  lotRow('12', CHATARRA, 'Tonelada', 6, 0.3, 'normal'),
  lotRow('13', RESIDUOS_MUNICIPALES, 'Kilogramo', 18, 0.3, 'normal'),
  lotRow('14', LODOS_PTAS, 'Metro cúbico', 2, 0.3, 'normal'),
  lotRow('15', CHATARRA, 'Tonelada', 14, 0.3, 'normal'),
];
