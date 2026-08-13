/**
 * Campos de la tarjeta "Lote seleccionado" que aparece al elegir Truckshop —
 * nodo `4223:9920`.
 *
 * VIVEN APARTE DE `WasteWithdrawalFormValues` por lo mismo que
 * `WasteWithdrawalDirectValues`: ese modelo es el tronco común del flujo que
 * arranca por el RESIDUO y lo consume la cadena SIDREP entera. Este arranca por
 * el SECTOR y todavía no desemboca en ninguna pantalla, así que mezclarlos
 * obligaría a las tres vistas SIDREP a arrastrar cuatro campos que nunca leen.
 *
 * NO SON LOS MISMOS CAMPOS QUE `3765:39024`, la otra tarjeta "Lote seleccionado"
 * del módulo, aunque compartan título e icono. Allá el lote ya está elegido y sus
 * datos son de SOLO LECTURA —`WarehouseFormReadOnlyField`—; acá los cuatro son
 * editables y el lote todavía no existe. Por eso son dos componentes y no uno con
 * un `readOnly`.
 */

export interface WasteWithdrawalTruckshopValues {
  /** Selector "Residuo". Nodo `4223:9966`. */
  wasteTypeId: string | null;
  /** Selector "Categoría". Nodo `4223:9974`. */
  categoryId: string | null;
  /** Campo "Cantidad a retirar". Nodo `4223:10011`. */
  quantity: string;
  /** Selector "Unidad de medida". Nodo `4223:10004`. */
  unitId: string | null;
}

export function createWasteWithdrawalTruckshopValues(): WasteWithdrawalTruckshopValues {
  return { wasteTypeId: null, categoryId: null, quantity: '', unitId: null };
}

/**
 * `true` con los cuatro campos de la tarjeta completos.
 *
 * Es lo que habilita el CTA del aviso SIDREP: el nodo `4230:10232` lo dibuja
 * ACTIVO sobre una tarjeta con los cuatro campos llenos, mientras que el
 * `3765:39068` —el mismo aviso sin datos— lo dibuja deshabilitado.
 *
 * La cantidad se valida solo por "hay algo escrito" y no contra un saldo: acá el
 * lote todavía no existe, así que no hay disponible contra el cual comparar. Es
 * la diferencia con `isWasteWithdrawalFormComplete`, que sí parte de un lote.
 */
export function isWasteWithdrawalTruckshopComplete(values: WasteWithdrawalTruckshopValues): boolean {
  return (
    values.wasteTypeId !== null &&
    values.categoryId !== null &&
    values.unitId !== null &&
    values.quantity.trim().length > 0
  );
}
