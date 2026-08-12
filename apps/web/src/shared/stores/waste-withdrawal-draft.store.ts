import { create } from 'zustand';
import type { WasteWithdrawalFormValues } from '../../modules/waste/wasteWithdrawalForm';
import type { WasteSidrepFormValues } from '../../modules/waste/wasteSidrepForm';
import type { WasteWithdrawalRow } from '../../modules/waste/wasteWithdrawalRows';

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
 *
 * Eso vale también para `pendingRequests`: una fila temporal que sobreviviera a la
 * recarga mentiría, porque la solicitud podría ya estar aprobada del lado del
 * servidor.
 */
interface WasteWithdrawalDraftState {
  /** `null` cuando no hay una solicitud en curso. */
  draft: WasteWithdrawalFormValues | null;
  /**
   * Valores del paso 1 del flujo SIDREP.
   *
   * Viajan por acá por lo mismo que el borrador: la fila temporal necesita el lugar
   * de disposición final como DESTINATARIO, y ese dato lo eligió una ruta anterior.
   */
  sidrep: WasteSidrepFormValues | null;
  /**
   * Solicitudes enviadas que todavía no volvieron de la API: las filas TEMPORALES
   * del listado (nodo `3765:40905`). Se muestran arriba de las demás con folio
   * "A espera de aprobación" y estado "Pendiente".
   *
   * Viven acá y no en TanStack Query porque no hay endpoint que las devuelva: son
   * lo que el front sabe y el servidor todavía no. El día que exista
   * `POST /waste/withdrawals`, esto se reemplaza por una invalidación de la query
   * del listado y el arreglo desaparece.
   */
  pendingRequests: WasteWithdrawalRow[];
  /** `true` justo después de enviar, para que el listado muestre el snackbar. */
  submissionNotice: boolean;
  setDraft: (values: WasteWithdrawalFormValues) => void;
  setSidrep: (values: WasteSidrepFormValues) => void;
  clearDraft: () => void;
  /**
   * Cierra el envío: guarda la fila temporal, prende el aviso y descarta el
   * borrador.
   *
   * Descartar el borrador —y los valores del paso 1— es parte del envío y no un paso
   * aparte: si quedaran, volver a "Nueva solicitud" reabriría la solicitud que se
   * acaba de mandar.
   */
  submitDraft: (row: Omit<WasteWithdrawalRow, 'id'>) => void;
  /** Apaga el snackbar. Lo llama el propio aviso al cerrarse. */
  dismissSubmissionNotice: () => void;
}

export const useWasteWithdrawalDraftStore = create<WasteWithdrawalDraftState>((set) => ({
  draft: null,
  sidrep: null,
  pendingRequests: [],
  submissionNotice: false,
  setDraft: (values) => set({ draft: values }),
  setSidrep: (values) => set({ sidrep: values }),
  clearDraft: () => set({ draft: null, sidrep: null }),
  submitDraft: (row) =>
    set((state) => ({
      /*
       * La más reciente primero: es el orden del nodo, que la pone arriba de todo.
       * El `id` se asigna acá y no en la fábrica porque depende de cuántas haya.
       */
      pendingRequests: [
        { ...row, id: `pendiente-${state.pendingRequests.length + 1}` },
        ...state.pendingRequests,
      ],
      submissionNotice: true,
      draft: null,
      sidrep: null,
    })),
  dismissSubmissionNotice: () => set({ submissionNotice: false }),
}));
