import { create } from 'zustand';
import type { WasteSidrepRequestRejection } from '../../modules/waste/wasteSidrepPendingFolios';

/**
 * Solicitudes de retiro rechazadas por Medio Ambiente, mientras cruzan rutas.
 *
 * POR QUÉ EXISTE. El rechazo se envía en la bandeja "Pendientes de revisión"
 * (`/waste/folios-sidrep`) y hasta acá vivía en un `useState` de esa página, que era
 * suficiente porque el único que lo leía era el panel de detalle de al lado. El nodo
 * `4278:17632` lo saca de ahí: su aviso "Rechazadas · N solicitud(es)" se dibuja en OTRA
 * ruta —el histórico de retiros—, así que el dato tiene que sobrevivir al desmontaje de la
 * página donde se produjo.
 *
 * POR QUÉ ZUSTAND. Es el mismo caso que `waste-withdrawal-draft.store`: estado temporal que
 * viaja entre rutas y que la API todavía no conoce. No es server state —no hay endpoint de
 * rechazo— así que TanStack Query no tiene nada que cachear.
 *
 * NO SE PERSISTE, y es una decisión y no un olvido. Un rechazo es un espejo de lo que el
 * backend va a devolver: sobrevivir a la recarga lo haría mentir, porque la solicitud podría
 * estar ya corregida y reenviada. Es el mismo criterio con el que el store del borrador deja
 * `pendingRequests` fuera de `localStorage` —ahí está escrito el por qué—. Mientras no haya
 * endpoint, el aviso del histórico se ve en la misma sesión en que se rechazó, que es
 * exactamente lo que el flujo produce hoy.
 *
 * CUANDO EXISTA EL ENDPOINT esto se cae: los rechazos van a llegar con la solicitud y este
 * store deja de tener razón de ser.
 */
interface WasteSidrepRejectionsState {
  /**
   * Indexados POR SOLICITUD y no en una lista: la franja del panel busca el de la solicitud
   * abierta en cada render, y volver a rechazar la misma —que el nodo permite, porque deja
   * las dos acciones activas— tiene que REEMPLAZAR el motivo y no apilar un segundo
   * registro.
   */
  rejections: Record<string, WasteSidrepRequestRejection>;
  /**
   * Registra el rechazo de una solicitud.
   *
   * EL INSTANTE SE SELLA ACÁ, en la acción, y no en el render de lo que lo muestra: con
   * `new Date()` dentro de un componente el titular de la franja cambiaría de hora en cada
   * render. Acá corre una sola vez, cuando se envía.
   */
  rejectRequest: (request: string, reason: string) => void;
}

export const useWasteSidrepRejectionsStore = create<WasteSidrepRejectionsState>()((set) => ({
  rejections: {},
  rejectRequest: (request, reason) =>
    set((state) => ({
      rejections: {
        ...state.rejections,
        [request]: { request, reason, rejectedAt: new Date() },
      },
    })),
}));
