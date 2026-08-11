import { create } from 'zustand';
import type { WasteWithdrawalFormValues } from '../../modules/waste/wasteWithdrawalForm';

/**
 * Borrador de la solicitud de retiro mientras cruza rutas.
 *
 * POR QUÉ EXISTE. El flujo son dos pantallas: `/waste/solicitud-retiro/nueva`
 * elige el lote, la cantidad y el transportista, y `/waste/solicitud-retiro/nueva/sidrep`
 * los MUESTRA en su tarjeta de resumen (nodo `3765:39372`) y sigue con los datos
 * del traslado. Al ser rutas distintas, el `useState` de la primera pantalla se
 * desmonta y el dato se perdería.
 *
 * POR QUÉ ZUSTAND Y NO `location.state`. `STATE_MANAGEMENT.md` reserva Zustand para
 * "estado temporal de formularios", que es exactamente esto. `location.state`
 * también viaja, pero se pierde al recargar y obliga a leer del router en dos
 * lugares. Y NO es server state: nada de esto existe todavía en la API, así que
 * TanStack Query no tiene nada que cachear.
 *
 * NO SE PERSISTE. Sin middleware `persist` a propósito: el borrador incluye el lote
 * completo con su saldo, y un saldo guardado en el navegador envejece —otro usuario
 * puede retirar del mismo lote—. Recargar la pantalla del paso 2 devuelve al paso 1,
 * que es lo correcto mientras no haya un borrador en el servidor.
 */
interface WasteWithdrawalDraftState {
  /** `null` cuando no hay una solicitud en curso. */
  draft: WasteWithdrawalFormValues | null;
  setDraft: (values: WasteWithdrawalFormValues) => void;
  clearDraft: () => void;
}

export const useWasteWithdrawalDraftStore = create<WasteWithdrawalDraftState>((set) => ({
  draft: null,
  setDraft: (values) => set({ draft: values }),
  clearDraft: () => set({ draft: null }),
}));
