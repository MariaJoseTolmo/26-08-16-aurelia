/**
 * Campos propios del retiro NO peligroso, el que se registra sin pasar por SIDREP
 * — nodo `3785:44731`.
 *
 * VIVEN APARTE DE `WasteWithdrawalFormValues` a propósito. Ese modelo es el tronco
 * común de las dos variantes (lote, cantidad, transportista) y lo consume el flujo
 * SIDREP entero; meterle una patente que el camino peligroso nunca usa —porque allá
 * la pide el paso 1— obligaría a las tres pantallas SIDREP a arrastrar dos campos
 * vacíos y a `isWasteWithdrawalFormComplete` a decidir para cuál de los dos caminos
 * está respondiendo.
 *
 * SON LOS MISMOS DOS CAMPOS QUE EL PASO 1 DE SIDREP, sin el conductor. No es un
 * descuido del diseño: el nodo `3785:44739` dibuja dos columnas y el `3765:39422`
 * dibuja tres. Un retiro que no va a SIDREP no necesita declarar quién conduce.
 */

export interface WasteWithdrawalDirectValues {
  /** Patente del vehículo. Nodo `3785:44743`. */
  plate: string;
  /** Lugar de disposición final, o `null` mientras no se elige. Nodo `3785:44759`. */
  disposalSite: string | null;
}

export function createWasteWithdrawalDirectValues(): WasteWithdrawalDirectValues {
  return { plate: '', disposalSite: null };
}

/**
 * `true` cuando los campos de esta tarjeta están completos.
 *
 * NO alcanza para habilitar "Registrar retiro": eso pide además el tronco común
 * (cantidad dentro del saldo y transportista), y lo compone la pantalla. Acá se
 * responde solo por lo propio, que es lo que deja la regla reutilizable.
 */
export function isWasteWithdrawalDirectComplete(values: WasteWithdrawalDirectValues): boolean {
  return values.plate.trim().length > 0 && values.disposalSite !== null;
}
