import { formatWasteNoticeTimestamp } from './wasteWithdrawalDraft';

/**
 * Aviso "Rechazadas" de la vista de histórico — nodo Figma `4278:17632`, emplazado por el
 * nodo `4278:17511` entre la bajada y la barra de acciones.
 *
 * QUÉ CUENTA Y POR QUÉ SON TODAS RESPEL. Cuenta solicitudes devueltas para corrección, y
 * todas pasan por SIDREP: SIDREP es el sistema de declaración de residuos PELIGROSOS, así
 * que una solicitud que pasa por ahí es RESPEL por definición. No hace falta filtrar por
 * categoría —y filtrar por el rótulo "RESPEL Residuos peligrosos" sería peor: es texto de
 * la fila, no el hecho—.
 *
 * RECIBE INSTANTES Y NO REGISTROS, y por eso no importa de dónde salen. Hoy la vista suma
 * dos fuentes que no se pueden cruzar entre sí:
 *
 *   las FILAS rechazadas del listado    lo que el aviso manda a mirar en la tabla
 *   los rechazos de la BANDEJA          lo enviado desde "Pendientes de revisión"
 *
 * No hay id común —las filas de la tabla no llevan el "SR-2026-…" con el que la bandeja
 * indexa sus rechazos—, así que se suman sin deduplicar. Hoy no pueden solaparse: la
 * bandeja rechaza solicitudes que esta tabla todavía no lista. Cuando exista el endpoint
 * las dos fuentes van a ser una y esto se simplifica.
 *
 * EL AVISO NO ES ACCIONABLE, al revés que el de borrador. El nodo no dibuja chevrón y su
 * propio texto manda a mirar la columna "Folio SIDREP" de la tabla que ya está abajo. Ver
 * la nota de `onAction` en `WasteProcessNoticeCard`.
 */

/** Textos de los nodos `4278:17641`, `4278:17649` y `4278:17651`. */
export const WASTE_WITHDRAWAL_REJECTED_NOTICE = {
  /** Rótulo de la columna izquierda. */
  label: 'Rechazadas',
  /** Nombre del proceso, en la fila. */
  processName: 'Solicitud de retiro',
  /**
   * Bajada de la fila.
   *
   * DICE "correciones" CON UNA SOLA R, y es el texto del nodo. Se reproduce como está —el
   * criterio de esta pantalla con los restos del diseño: reproducir y anotar— y queda
   * pedido a diseño como corrección de copy. Es la única palabra mal escrita del aviso, así
   * que arreglarla del lado del código haría que la pantalla y el nodo dejen de coincidir
   * sin que nadie se entere.
   *
   * LAS COMILLAS DE “Folio SIDREP” SON TIPOGRÁFICAS, como las dibuja el nodo: nombran la
   * columna de la tabla, no citan a nadie.
   */
  description:
    'MA ha solicitado correciones. Revisa la columna “Folio SIDREP” para identificar las solicitudes rechazadas.',
} as const;

/**
 * "1 solicitud" — nodo `4278:18061`.
 *
 * EL NODO SÓLO DIBUJA EL SINGULAR y el plural hay que escribirlo igual: en cuanto Medio
 * Ambiente rechaza la segunda, "2 solicitud" sería un error de la pantalla, no del diseño.
 */
export function rejectedRequestsCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'solicitud' : 'solicitudes'}`;
}

export interface WasteWithdrawalRejectedNoticeData {
  /** "1 solicitud" / "3 solicitudes". */
  countLabel: string;
  /** "Hoy 16:54" del rechazo MÁS RECIENTE; ver la nota de abajo. */
  rejectedAtLabel: string;
}

/**
 * Datos del aviso, o `null` cuando no hay ninguna solicitud rechazada.
 *
 * `null` Y NO UN CERO: una tarjeta que dijera "Rechazadas · 0 solicitudes" sería ruido
 * permanente en la vista, igual que el aviso de borrador sin borrador que retomar.
 *
 * LA FECHA ES LA DEL RECHAZO MÁS RECIENTE. El nodo dibuja UNA sola línea de tiempo para un
 * conteo que puede ser de varias, así que hay que elegir cuál; la última es la que explica
 * por qué el aviso aparece ahora. Con la más antigua, rechazar una solicitud hoy dejaría el
 * aviso fechado la semana pasada.
 */
export function resolveWasteWithdrawalRejectedNotice(
  /** Un instante por solicitud rechazada; ver la nota de arriba sobre las dos fuentes. */
  rejectedAt: Date[],
  today: Date,
): WasteWithdrawalRejectedNoticeData | null {
  /*
   * Se desestructura en vez de mirar `length` y leer `rejectedAt[0]`: con
   * `noUncheckedIndexedAccess` el índice es `T | undefined` —y tiene razón, un `length`
   * chequeado dos líneas antes no es una garantía para el compilador—, así que el primero
   * se saca una vez y el resto se compara contra él.
   */
  const [first, ...rest] = rejectedAt;
  if (!first) return null;

  const lastRejectedAt = rest.reduce((latest, at) => (at > latest ? at : latest), first);

  return {
    countLabel: rejectedRequestsCountLabel(rejectedAt.length),
    rejectedAtLabel: formatWasteNoticeTimestamp(lastRejectedAt.toISOString(), today),
  };
}
