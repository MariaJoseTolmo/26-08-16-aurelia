import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WasteWithdrawalFormValues } from '../../modules/waste/wasteWithdrawalForm';
import type { WasteSidrepFormValues } from '../../modules/waste/wasteSidrepForm';
import type { WasteWithdrawalDirectValues } from '../../modules/waste/wasteWithdrawalDirectForm';
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
 * SE PERSISTE EL BORRADOR, Y ESO CAMBIÓ DE CRITERIO.
 *
 * Antes este store no llevaba `persist`, con el argumento de que el borrador incluye
 * el lote con su saldo y un saldo guardado en el navegador envejece. El nodo
 * `4278:15644` zanja la discusión: su aviso dice "Continúa donde lo dejaste ·
 * guardados localmente". Eso es una PROMESA al usuario, y dibujarla sobre un store
 * volátil sería mentirle —el mismo criterio por el que el botón "Exportar" va
 * deshabilitado en vez de fingir que descarga—. El propio texto es además el
 * descargo: avisa que lo guardado es local y no del servidor.
 *
 * QUEDA PENDIENTE, y es el riesgo real de esta decisión: al retomar un borrador hay
 * que RE-VALIDAR el saldo del lote contra la API. Mientras los lotes sean datos de
 * muestra no hay saldo que envejezca, pero el día que exista el endpoint, resumir sin
 * revalidar puede dejar pasar una cantidad que ya no está disponible.
 *
 * NO SE PERSISTEN `pendingRequests` NI `submissionNotice`. La primera es un espejo de
 * lo que el servidor todavía no devolvió: sobrevivir a la recarga la haría mentir,
 * porque la solicitud podría estar ya aprobada. El segundo es un aviso de un solo
 * uso; reaparecer al recargar sería un snackbar sin causa.
 */
/**
 * Cuál de los dos cierres dejó el aviso pendiente.
 *
 *   `sidrep`  la solicitud peligrosa se envió a Medio ambiente (nodo `3785:45722`)
 *   `direct`  el retiro no peligroso se registró de una (nodo `3785:44731`)
 */
export type WasteWithdrawalNoticeKind = 'sidrep' | 'direct';

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
   * Campos del retiro NO peligroso (patente y lugar de disposición final).
   *
   * Viajan por acá por un motivo distinto que `sidrep`: no cruzan una ruta, sino una
   * RECARGA. El retiro no peligroso se llena y se registra en la misma pantalla, así
   * que sin esto "continúa donde lo dejaste" devolvería al usuario a un formulario con
   * el lote puesto y los dos campos en blanco.
   */
  direct: WasteWithdrawalDirectValues | null;
  /**
   * Cuándo se guardó por última vez, en ISO, o `null` sin borrador.
   *
   * Lo escribe el store y no la pantalla: es un dato del guardado, no del formulario,
   * y dejarlo en manos de quien llama abre la puerta a que una pantalla se olvide y
   * el aviso muestre la hora de otro paso. Va como STRING y no como `Date` porque
   * viaja a `localStorage`, donde un `Date` vuelve convertido en texto.
   */
  savedAt: string | null;
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
  /**
   * Qué acción cerró el retiro, para que el listado elija el texto del snackbar, o
   * `null` si no hay aviso pendiente.
   *
   * DEJÓ DE SER UN BOOLEANO cuando apareció el segundo camino: los dos terminan en el
   * histórico con un aviso verde, pero uno dice que la solicitud viajó a Medio ambiente
   * y el otro que el retiro quedó registrado. Con un booleano, el segundo habría
   * mostrado el texto del primero.
   */
  submissionNotice: WasteWithdrawalNoticeKind | null;
  setDraft: (values: WasteWithdrawalFormValues) => void;
  setSidrep: (values: WasteSidrepFormValues) => void;
  setDirect: (values: WasteWithdrawalDirectValues) => void;
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
  /**
   * Cierra un retiro NO peligroso: guarda la fila, prende SU aviso y descarta el
   * borrador.
   *
   * Es una acción aparte de `submitDraft` y no un parámetro suyo porque son dos cosas
   * distintas del negocio: una ENVÍA a Medio ambiente y la otra REGISTRA de una. Lo que
   * las diferencia hacia afuera es justamente el texto del aviso.
   */
  registerWithdrawal: (row: Omit<WasteWithdrawalRow, 'id'>) => void;
  /** Apaga el snackbar. Lo llama el propio aviso al cerrarse. */
  dismissSubmissionNotice: () => void;
}

/**
 * Agrega la fila al tope de las locales.
 *
 * La MÁS RECIENTE PRIMERO: es el orden del nodo `3765:40905`, que pone la solicitud
 * recién cerrada arriba de todo. El `id` se asigna acá y no en la fábrica de filas
 * porque depende de cuántas haya, que es algo que solo sabe el store.
 *
 * El prefijo es `local-` y no `pendiente-`: la fila puede quedar en "Pendiente" —si se
 * envió a Medio ambiente— o en "Informativo" —si se registró de una—, así que un id
 * que dijera "pendiente" mentiría en la mitad de los casos. Lo que tienen en común es
 * ser locales, sin id del servidor.
 */
/**
 * Borrador vacío.
 *
 * Existe como constante porque los TRES cierres tienen que limpiar los mismos cuatro
 * campos —enviar, registrar y cancelar—, y el día que se agregue un quinto, olvidarlo
 * en uno de ellos deja un borrador huérfano que hace aparecer "Formulario inconcluso"
 * de algo ya cerrado.
 */
const CLEARED_DRAFT = { draft: null, sidrep: null, direct: null, savedAt: null } as const;

function prependLocalRow(
  rows: WasteWithdrawalRow[],
  row: Omit<WasteWithdrawalRow, 'id'>,
): { pendingRequests: WasteWithdrawalRow[] } {
  return { pendingRequests: [{ ...row, id: `local-${rows.length + 1}` }, ...rows] };
}

export const useWasteWithdrawalDraftStore = create<WasteWithdrawalDraftState>()(
  persist(
    (set) => ({
      draft: null,
      sidrep: null,
      direct: null,
      savedAt: null,
      pendingRequests: [],
      submissionNotice: null,
      setDraft: (values) => set({ draft: values, savedAt: new Date().toISOString() }),
      setSidrep: (values) => set({ sidrep: values, savedAt: new Date().toISOString() }),
      setDirect: (values) => set({ direct: values, savedAt: new Date().toISOString() }),
      clearDraft: () => set({ ...CLEARED_DRAFT }),
      submitDraft: (row) =>
        set((state) => ({
          ...prependLocalRow(state.pendingRequests, row),
          ...CLEARED_DRAFT,
          submissionNotice: 'sidrep',
        })),
      registerWithdrawal: (row) =>
        set((state) => ({
          ...prependLocalRow(state.pendingRequests, row),
          ...CLEARED_DRAFT,
          submissionNotice: 'direct',
        })),
      dismissSubmissionNotice: () => set({ submissionNotice: null }),
    }),
    {
      /* Mismo prefijo que las claves de sesión (`aurelia_token`, `aurelia_user`). */
      name: 'aurelia_waste_withdrawal_draft',
      /*
       * Solo el borrador. `partialize` es lo que impide que `pendingRequests` y
       * `submissionNotice` se cuelen en `localStorage`: sin él, `persist` guarda todo
       * el estado y esos dos volverían a aparecer en cada recarga.
       *
       * Y EL TICKET DE PESAJE SE CAE A PROPÓSITO. `weighingTicket` es un `File`, y un
       * `File` no sobrevive a `JSON.stringify`: se guardaría como `{}`, o sea un
       * objeto VERDADERO que ya no es un archivo. Cualquier `if (weighingTicket)`
       * pasaría y recién fallaría al leerle el nombre o al subirlo. Guardarlo en
       * `null` es lo honesto: al retomar el borrador hay que volver a adjuntarlo, que
       * es lo que de verdad pasa —el archivo nunca salió del navegador—.
       */
      partialize: (state) => ({
        draft: state.draft,
        sidrep: state.sidrep ? { ...state.sidrep, weighingTicket: null } : null,
        direct: state.direct,
        savedAt: state.savedAt,
      }),
    },
  ),
);
