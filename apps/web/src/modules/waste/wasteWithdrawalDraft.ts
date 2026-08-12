import { WASTE_SIDREP_STEPS } from './components/WasteSidrepStepper';
import { toIsoDate } from './wasteIntakeFilters';
import type { WasteSidrepFormValues } from './wasteSidrepForm';
import { formatIsoAsDdMmYy } from './wasteWithdrawalFilters';
import type { WasteWithdrawalFormValues } from './wasteWithdrawalForm';

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

export interface WasteWithdrawalDraftProgress {
  /** Paso en curso, base 1 sobre `WASTE_SIDREP_STEPS`. */
  step: number;
  totalSteps: number;
  /** Entero: el "33%" del nodo `4278:15668`. */
  percent: number;
  /** "Pasos 1/3" — nodo `4278:15672`. */
  stepsLabel: string;
  /** Ruta del paso que falta completar, que es a donde lleva el aviso. */
  route: string;
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
 * Progreso del borrador en curso, o `null` si no hay ninguno.
 *
 * EL PASO SE DEDUCE DE QUÉ HAY GUARDADO, no de un contador aparte. Un contador sería
 * un segundo lugar donde vive la verdad, y bastaría con que una pantalla se olvidara
 * de incrementarlo para que el aviso llevara al paso equivocado. Acá la regla es
 * directa: hay borrador y no hay datos de traslado → falta el paso 1; ya hay datos de
 * traslado → falta el paso 2.
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

  const totalSteps = WASTE_SIDREP_STEPS.length;
  const step = sidrep ? 2 : 1;

  return {
    step,
    totalSteps,
    percent: Math.round((step / totalSteps) * 100),
    stepsLabel: `Pasos ${step}/${totalSteps}`,
    /* El paso 3 no tiene pantalla: cae en la última que sí existe. */
    route: WASTE_SIDREP_STEP_ROUTES[step - 1] ?? WASTE_SIDREP_STEP_ROUTES[1],
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
