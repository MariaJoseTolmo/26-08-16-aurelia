import { formatQuantity, parseNumericThreshold, type WasteOption } from './wasteFilterPrimitives';
import type { WasteWithdrawableLot } from './wasteWithdrawableLots';

/**
 * Estado del formulario "Nueva solicitud de retiro" y sus reglas de completitud.
 *
 * Mismo papel que `warehouseIntakeForm.ts` en "Registrar ingreso a Bodega": el
 * modelo y las reglas viven acá, fuera de `components/`, para que la pantalla solo
 * dibuje. Cuando exista el endpoint, este archivo es el que se mapea a los
 * contratos.
 */

export interface WasteWithdrawalFormValues {
  /** Lote confirmado en el modal `3765:40585`, o `null` mientras no se elige. */
  lot: WasteWithdrawableLot | null;
  /** Cantidad a retirar, como la teclea el usuario. Nodo `3765:39052`. */
  quantity: string;
  /** Empresa transportista elegida. Nodo `3765:39057`. */
  carrier: string | null;
}

export function createWasteWithdrawalFormValues(): WasteWithdrawalFormValues {
  return { lot: null, quantity: '', carrier: null };
}

/**
 * Empresas transportistas de muestra.
 *
 * SON DATOS DE MUESTRA, no un catálogo. La base no tiene todavía el maestro de
 * transportistas y el nodo solo dibuja el placeholder "Seleccione", así que estas
 * cinco existen para que el selector se pueda probar. Cuando exista el endpoint,
 * se reemplazan por su `useQuery` y el resto del archivo no cambia.
 */
export const WASTE_CARRIER_OPTIONS: WasteOption[] = [
  { value: 'hidronor', label: 'Hidronor Chile S.A.' },
  { value: 'bravo-energy', label: 'Bravo Energy Chile S.A.' },
  { value: 'recimat', label: 'Recimat S.A.' },
  { value: 'ecoprial', label: 'Ecoprial Ltda.' },
  { value: 'resiter', label: 'Resiter S.A.' },
  { value: 'transportes-cordillera', label: 'Transportes Cordillera SpA' },
];

/**
 * Rótulo del transportista elegido, para las pantallas que lo MUESTRAN en vez de
 * ofrecerlo. El resumen del flujo SIDREP (nodo `3765:39393`) escribe "Resiter S.A."
 * y no el `value` interno.
 *
 * Sin transportista devuelve un guion largo: la pantalla siguiente solo se alcanza
 * con el formulario completo, así que es un caso que no debería ocurrir, pero
 * mostrar "null" si ocurre sería peor.
 */
export function resolveCarrierLabel(value: string | null): string {
  if (!value) return '—';
  return WASTE_CARRIER_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

/**
 * Cantidad tecleada como número usable, o `null` mientras no lo sea.
 *
 * Reutiliza `parseNumericThreshold`, que ya resuelve los estados intermedios de un
 * input numérico (`''`, `'-'`, `'1e'`). Acá además se exige que sea POSITIVA:
 * retirar 0 o una cantidad negativa no es una solicitud válida.
 */
export function parseWithdrawalQuantity(value: string): number | null {
  const parsed = parseNumericThreshold(value);
  if (parsed === null || parsed <= 0) return null;
  return parsed;
}

/**
 * `true` si la cantidad tecleada cabe en el saldo del lote.
 *
 * Es la única validación de negocio de esta pantalla y sale de la propia tarjeta:
 * el campo "Disponible" muestra el saldo, así que pedir más que eso es un error
 * que el formulario puede detectar sin consultar a nadie.
 *
 * Con la cantidad todavía sin escribir devuelve `false` porque el formulario no
 * está completo, no porque haya un error: quien quiera distinguir los dos casos
 * usa `parseWithdrawalQuantity`.
 */
export function isWithdrawalQuantityWithinAvailable(values: WasteWithdrawalFormValues): boolean {
  if (!values.lot) return false;

  const requested = parseWithdrawalQuantity(values.quantity);
  if (requested === null) return false;

  const available = Number(values.lot.availableQuantity);
  if (!Number.isFinite(available)) return false;

  return requested <= available;
}

/**
 * `true` cuando se puede avanzar al flujo de documentos.
 *
 * Habilita el botón del nodo `3765:39068`, que el diseño dibuja DESHABILITADO. Que
 * la regla viva acá y no en el componente es lo que permite que la variante no
 * peligrosa la reutilice cuando llegue su pantalla.
 */
export function isWasteWithdrawalFormComplete(values: WasteWithdrawalFormValues): boolean {
  return values.lot !== null && values.carrier !== null && isWithdrawalQuantityWithinAvailable(values);
}

/** "4 contenedores", el valor del campo "Disponible" del nodo `3765:39046`. */
export function formatLotAvailable(lot: WasteWithdrawableLot): string {
  return `${formatQuantity(lot.availableQuantity)} ${lot.unitLabel}`;
}
