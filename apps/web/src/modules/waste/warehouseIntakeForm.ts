import type { SectorResponse, WasteOperationalCategoryResponse, WasteTypeResponse, WasteUnitResponse } from '@aurelia/contracts';
import type { WasteOption } from './wasteFilterPrimitives';
import { toIsoDate } from './wasteIntakeFilters';

/**
 * Modelo del formulario "Registrar ingreso a Bodega — Plataforma 18"
 * (nodo Figma `3564:1787`).
 *
 * Vive fuera de `components/` por el mismo motivo que `wasteIntakeRows`: es el
 * modelo de la vista, no su presentación. Los componentes de las tarjetas solo
 * dibujan; quién es requerido y qué cuenta como cantidad válida se decide acá,
 * en un archivo que se puede leer entero.
 *
 * Los campos guardan IDs y no nombres. El formulario los va a mandar a
 * `waste_receipts` / `waste_lots`, cuyas columnas son claves foráneas
 * (`origin_sector_id`, `waste_type_id`, `unit_id`): guardar el rótulo obligaría
 * a resolverlo de vuelta al enviar, y dos residuos pueden compartir nombre entre
 * categorías.
 */

export interface WarehouseIntakeFormValues {
  categoryId: string | null;
  wasteTypeId: string | null;
  /** Fecha de ingreso en ISO `yyyy-mm-dd`, que es lo que emite `<input type="date">`. */
  entryDate: string;
  /**
   * Cantidad como STRING y no como `number`. Es lo que da el input y lo que
   * espera la columna `numeric` de Postgres; parsearla acá perdería los estados
   * intermedios del tecleo ("", "1.", "0,5") y forzaría a decidir un número
   * cuando todavía no hay ninguno.
   */
  quantity: string;
  unitId: string | null;
  originSectorId: string | null;
  plate: string;
  driver: string;
}

export type WarehouseIntakeFormField = keyof WarehouseIntakeFormValues;

/**
 * Valores iniciales. La fecha arranca en el día en curso: el diseño muestra el
 * campo con una fecha concreta ("16/07/2026"), no con un placeholder, así que
 * el estado por defecto es "hoy" y no vacío.
 *
 * `today` entra por parámetro porque `new Date()` es impuro en render; la página
 * lo resuelve una sola vez al montar, igual que `WarehouseIntakePage`.
 */
export function createWarehouseIntakeFormValues(today: Date): WarehouseIntakeFormValues {
  return {
    categoryId: null,
    wasteTypeId: null,
    entryDate: toIsoDate(today),
    quantity: '',
    unitId: null,
    originSectorId: null,
    plate: '',
    driver: '',
  };
}

/**
 * Cantidad tecleada, o `null` si todavía no es una cantidad usable.
 *
 * Acepta coma decimal porque el formulario es es-CL y "0,5" es lo que la gente
 * escribe. Exige que sea POSITIVA: un lote de 0 —o negativo— no es una
 * recepción, es un registro que la bodega no puede acopiar.
 */
export function parseIntakeQuantity(quantity: string): number | null {
  const normalized = quantity.trim().replace(',', '.');
  if (normalized.length === 0) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Si el formulario está listo para enviarse. Es lo que habilita el botón
 * "Registrar ingreso", que el nodo `3565:3031` dibuja deshabilitado.
 *
 * Los requeridos salen del esquema, no del diseño —el diseño no marca ningún
 * campo con asterisco—: `waste_receipts.received_at` y las columnas del lote
 * (residuo, cantidad, unidad) son NOT NULL, mientras que `origin_sector_id`,
 * `vehicle_plate` y `driver_name` son nullable. Por eso patente y conductor no
 * bloquean el envío.
 *
 * `categoryId` entra igual aunque no sea columna del recibo: sin categoría no
 * hay residuo posible, y dejarla afuera permitiría un estado donde el botón se
 * habilita con el segundo selector todavía sin cargar.
 */
export function isWarehouseIntakeFormComplete(values: WarehouseIntakeFormValues): boolean {
  return (
    values.categoryId !== null &&
    values.wasteTypeId !== null &&
    values.unitId !== null &&
    values.entryDate.length > 0 &&
    parseIntakeQuantity(values.quantity) !== null
  );
}

/**
 * Adaptadores de catálogo a alternativas de selector.
 *
 * Los cuatro catálogos llegan de endpoints distintos con formas distintas, pero
 * el selector solo necesita `value` + `label`. Convertir acá —y no en cada
 * tarjeta— evita que una vista muestre el `code` y otra el `name` del mismo
 * registro.
 *
 * NO se reordenan: los tres endpoints de residuos ya ordenan en SQL
 * (`sort_order`, `name`) y `sectors` viene ordenado por el servicio de
 * organización. Reordenar en el cliente pisaría el `sort_order` con el que el
 * maestro decide cómo se listan las categorías.
 */

export const toCategoryOptions = (categories: WasteOperationalCategoryResponse[]): WasteOption[] =>
  categories.map((category) => ({ value: category.id, label: category.name }));

export const toWasteTypeOptions = (types: WasteTypeResponse[]): WasteOption[] =>
  types.map((type) => ({ value: type.id, label: type.name }));

/**
 * La unidad muestra su símbolo entre paréntesis cuando lo tiene ("Kilogramo
 * (kg)"): en una lista de unidades el símbolo es lo que desambigua, y la
 * columna es nullable, así que se omite el paréntesis vacío.
 */
export const toUnitOptions = (units: WasteUnitResponse[]): WasteOption[] =>
  units.map((unit) => ({
    value: unit.id,
    label: unit.symbol ? `${unit.name} (${unit.symbol})` : unit.name,
  }));

export const toSectorOptions = (sectors: SectorResponse[]): WasteOption[] =>
  sectors.map((sector) => ({ value: sector.id, label: sector.name }));
