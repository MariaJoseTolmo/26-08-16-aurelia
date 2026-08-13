import { WASTE_SIDREP_STEPS } from './components/WasteSidrepStepper';
import { toIsoDate } from './wasteIntakeFilters';
import type { WasteSidrepFormValues } from './wasteSidrepForm';
import { formatIsoAsDdMmYy } from './wasteWithdrawalFilters';
import {
  isWasteWithdrawalFormComplete,
  type WasteWithdrawalFormValues,
} from './wasteWithdrawalForm';

/**
 * Estado BORRADOR de una solicitud de retiro y su progreso.
 *
 * Una solicitud queda en "Borrador" desde que se elige el lote hasta que se envía:
 * el formulario ya empezó pero todavía no viajó a Medio Ambiente. El aviso del nodo
 * `4278:15644` es la única cosa que lo muestra, y lo hace en la vista de histórico
 * (nodo `4278:14803`) para que un formulario a medio llenar no quede invisible.
 *
 * "BORRADOR" NO ES UN `WasteWithdrawalStatus`.
 *
 * Es tentador agregarlo a esa unión —"es un estado más de la solicitud"— y sería un
 * error: `WasteWithdrawalStatus` es el estado de una fila de la TABLA, y una
 * solicitud en borrador no es una fila. No se envió, así que no tiene fecha de
 * retiro, ni destinatario confirmado, ni folio. Sumarlo a la unión lo metería además
 * en el selector "Estado" de la tabla, que ofrecería filtrar por un estado que
 * ninguna fila puede tener. El nodo `4278:14803` lo confirma: dibuja el aviso arriba
 * y sus once filas siguen siendo Informativo, Pendiente y Cerrado — no hay pastilla
 * "Borrador" en ninguna.
 */

/** Rótulo del estado, para cuando haya que nombrarlo en pantalla. */
export const WASTE_WITHDRAWAL_DRAFT_STATUS_LABEL = 'Borrador';

/** Textos del aviso — nodos `4278:15649`, `4278:15653`, `4278:18046` y `4278:15661`. */
export const WASTE_WITHDRAWAL_DRAFT_NOTICE = {
  /** Encabezado de la tarjeta. */
  heading: 'Notificaciones del proceso',
  /** Título de la columna izquierda. */
  title: 'Formulario inconcluso',
  /**
   * Bajada de la columna izquierda.
   *
   * "guardados localmente" ES UN COMPROMISO, no decoración: promete que el borrador
   * sobrevive a cerrar la pestaña. Por eso el store lo persiste; ver la nota de
   * `waste-withdrawal-draft.store.ts`.
   */
  helper: 'Continúa donde lo dejaste · guardados localmente',
  /** Nombre del proceso en curso, en la fila. */
  processName: 'Solicitud de retiro',
} as const;

export interface WasteWithdrawalDraftSteps {
  /** Paso en curso, base 1 sobre `WASTE_SIDREP_STEPS`. */
  step: number;
  totalSteps: number;
  /** Entero: el "33%" del nodo `4278:15668`. */
  percent: number;
  /** "Pasos 1/3" — nodo `4278:15672`. */
  stepsLabel: string;
}

export interface WasteWithdrawalDraftProgress {
  /** Ruta del paso que falta completar, que es a donde lleva el aviso. */
  route: string;
  /**
   * Pasos numerados, o `null` cuando el borrador no tiene ninguno que numerar.
   *
   * LOS PASOS DEL AVISO SON LOS DE SIDREP, no los del formulario. El nodo `4278:15672`
   * escribe "Pasos 1/3" y ese 3 es `WASTE_SIDREP_STEPS`, así que solo los borradores
   * que YA entraron al flujo de documentos tienen un paso que mostrar. Quedan sin
   * numerar dos casos:
   *
   *   el formulario base a medio llenar   todavía no llegó al paso 1
   *   el retiro NO peligroso              nunca va a llegar: se registra de una
   *
   * En esos dos el aviso se dibuja sin barra ni pastilla. La alternativa —"Pasos 1/1"
   * al 100%— sería una barra llena sobre un formulario inconcluso, que es lo contrario
   * de lo que el aviso viene a decir.
   */
  steps: WasteWithdrawalDraftSteps | null;
}

/**
 * Rutas de los pasos del flujo SIDREP, en el orden de `WASTE_SIDREP_STEPS`.
 *
 * El paso 3 ("Revisión y envío") TODAVÍA NO TIENE PANTALLA, así que no tiene ruta.
 * Igual no es alcanzable: `resolveWasteWithdrawalDraftProgress` solo devuelve 1 o 2
 * porque el store no registra que se haya completado el paso 2. Cuando exista, se
 * agrega acá y el resto del archivo no cambia.
 */
const WASTE_SIDREP_STEP_ROUTES = [
  '/waste/solicitud-retiro/nueva/sidrep',
  '/waste/solicitud-retiro/nueva/sidrep/respaldos',
] as const;

/**
 * Ruta de la pantalla donde se llena el formulario base, según el camino.
 *
 * SON DOS Y NO UNA. `/nueva` elige el residuo de un lote recepcionado; el
 * retirador arranca en `/nueva/sector` describiéndolo a partir del sector. Un
 * destino fijo mandaría al retirador a retomar su borrador en la pantalla del otro
 * flujo, que no sabe leerlo y donde además tendría que volver a empezar.
 *
 * El sector en el borrador es lo que distingue los dos: solo el camino del
 * retirador lo escribe.
 */
function resolveFormRoute(draft: WasteWithdrawalFormValues): string {
  return draft.sector ? '/waste/solicitud-retiro/nueva/sector' : '/waste/solicitud-retiro/nueva';
}

/**
 * Progreso del borrador en curso, o `null` si no hay ninguno.
 *
 * EL PASO SE DEDUCE DE QUÉ HAY GUARDADO, no de un contador aparte. Un contador sería
 * un segundo lugar donde vive la verdad, y bastaría con que una pantalla se olvidara
 * de incrementarlo para que el aviso llevara al paso equivocado.
 *
 * Los tres casos, en el orden en que ocurren:
 *
 *   formulario base incompleto  → vuelve a `/nueva` a terminarlo, sin pasos
 *   NO peligroso                → vuelve a `/nueva` a registrarlo, sin pasos
 *   peligroso y completo        → paso 1 o 2 de SIDREP según haya datos de traslado
 *
 * QUE EL BASE INCOMPLETO VUELVA A `/nueva` NO ES UN DETALLE. Con el formulario
 * guardándose mientras se llena, existe el borrador de alguien que eligió el lote y se
 * fue; mandarlo al paso 1 de SIDREP lo dejaría en una pantalla cuyo propio guard lo
 * rebota, porque le falta la cantidad y el transportista.
 *
 * El porcentaje y el rótulo salen del MISMO `step`, así que no pueden contradecirse.
 * El nodo dibuja la barra al 38% con el rótulo en 33% —es una barra puesta a mano—,
 * y se respeta el número escrito, que es el que el usuario lee.
 */
export function resolveWasteWithdrawalDraftProgress(
  draft: WasteWithdrawalFormValues | null,
  sidrep: WasteSidrepFormValues | null,
): WasteWithdrawalDraftProgress | null {
  /*
   * Se exige el LOTE y no solo el borrador: sin lote no hay nada que retomar, y es
   * el mismo guard con el que las tres pantallas del flujo deciden si pueden
   * dibujarse.
   */
  if (!draft?.lot) return null;

  /* Sin el tronco común completo, o sin SIDREP por delante, no hay paso que numerar. */
  if (!draft.lot.isHazardous || !isWasteWithdrawalFormComplete(draft)) {
    return { route: resolveFormRoute(draft), steps: null };
  }

  const totalSteps = WASTE_SIDREP_STEPS.length;
  const step = sidrep ? 2 : 1;

  return {
    /* El paso 3 no tiene pantalla: cae en la última que sí existe. */
    route: WASTE_SIDREP_STEP_ROUTES[step - 1] ?? WASTE_SIDREP_STEP_ROUTES[1],
    steps: {
      step,
      totalSteps,
      percent: Math.round((step / totalSteps) * 100),
      stepsLabel: `Pasos ${step}/${totalSteps}`,
    },
  };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * "Hoy 16:54" — nodo `4278:15663`.
 *
 * EL NODO SOLO DIBUJA EL CASO DE HOY, y un borrador de anteayer que también dijera
 * "Hoy" mentiría. Para los demás días se usa `dd-mm-yy`, que es el formato de fecha
 * de esta vista (columna PERIODO), con la hora detrás.
 *
 * Recibe "hoy" en vez de leerlo: la vista ya resolvió `new Date()` una sola vez al
 * montar y todo lo que depende de la fecha usa esa misma lectura.
 */
export function formatWasteDraftSavedAt(savedAtIso: string, today: Date): string {
  const savedAt = new Date(savedAtIso);
  if (Number.isNaN(savedAt.getTime())) return '';

  const time = `${pad(savedAt.getHours())}:${pad(savedAt.getMinutes())}`;
  const savedDay = toIsoDate(savedAt);

  if (savedDay === toIsoDate(today)) return `Hoy ${time}`;
  return `${formatIsoAsDdMmYy(savedDay)} ${time}`;
}
