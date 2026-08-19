import { resolveWasteTypeCategory } from './wasteCatalogs';
import { toIsoDate } from './wasteIntakeFilters';
import type { WasteWithdrawableLot } from './wasteWithdrawableLots';

/**
 * Modelo de fila de "Solicitud de retiro" y los datos de muestra del nodo
 * `3817:55312`.
 *
 * Vive fuera de `components/` por lo mismo que `wasteIntakeRows`: es el modelo de
 * la vista, no su presentación. Cuando la vista consuma la API, este archivo es el
 * que se reemplaza por el mapeo desde los contratos, y la tabla no se toca.
 */

/**
 * Estados que dibujan los nodos. El tipo es cerrado a propósito: agregar uno
 * obliga a pasar por `WASTE_WITHDRAWAL_STATUS_LABELS` y por la pastilla.
 *
 * La lectura viene de la bajada de la vista (nodo `3765:38504`): los retiros
 * peligrosos llevan folio SIDREP y aprobación —y terminan `closed`—, y los no
 * peligrosos son solo `informational`.
 *
 * `pending` es el estado intermedio de un retiro peligroso recién enviado, y sale
 * del nodo `3765:40905`: la solicitud ya viajó a Medio Ambiente pero todavía no
 * tiene folio. Su fila es el "elemento temporal" del listado.
 */
export type WasteWithdrawalStatus = 'informational' | 'pending' | 'closed';

export const WASTE_WITHDRAWAL_STATUS_LABELS: Record<WasteWithdrawalStatus, string> = {
  /*
   * "RETIRO REGISTRADO" Y NO "INFORMATIVO", que es como lo escribía el nodo `3817:55580`.
   * El nodo `4278:18063` —el que agrega la fila rechazada y la columna de acciones—
   * reescribió las cuatro celdas de este estado, y el rótulo nuevo dice lo que el estado
   * ES: el retiro no peligroso se registró de una, sin pasar por Medio Ambiente.
   * "Informativo" describía para qué sirve la fila, no qué le pasó al retiro.
   *
   * TOCA TAMBIÉN EL FILTRO, que deriva sus alternativas de este record: el selector
   * "Estado" y la pastilla de filtros activos pasan a decir "Retiro registrado". Es lo
   * correcto —un filtro que ofrezca una palabra que la tabla ya no usa no encuentra nada
   * a la vista— y es la razón por la que el rótulo vive acá y no en la pastilla.
   */
  informational: 'Retiro registrado',
  pending: 'Pendiente',
  closed: 'Cerrado',
};

/**
 * Texto de la celda FOLIO SIDREP mientras la solicitud espera aprobación — nodo
 * `3817:55965`.
 *
 * Reemplaza al "No aplica" y al folio: hasta que Medio Ambiente apruebe no hay
 * folio que mostrar, pero tampoco es que no aplique.
 */
export const WASTE_WITHDRAWAL_FOLIO_PENDING_LABEL = 'A espera de aprobación';

/**
 * Texto de la celda FOLIO SIDREP de una solicitud RECHAZADA — nodo `4278:18460`.
 *
 * ES LA CELDA QUE EL AVISO `4278:17632` MANDA A MIRAR: "revisa la columna «Folio SIDREP»
 * para identificar las solicitudes rechazadas". Ocupa el lugar del folio por lo mismo que
 * "A espera de aprobación": no hay folio —se emite al aprobar, lo dice el modal
 * `3087:17238`— pero tampoco es que no aplique.
 *
 * MISMA PALABRA QUE LA PASTILLA DE LA BANDEJA DE PENDIENTES
 * (`WASTE_SIDREP_REQUEST_REJECTED_STATUS`, nodo `4295:24656`): es el mismo hecho visto
 * desde otra tabla, y dos palabras para el mismo estado se leerían como dos estados.
 */
export const WASTE_WITHDRAWAL_FOLIO_REJECTED_LABEL = 'Rechazado';

/**
 * Rótulo de la columna ACCIONES y de su único control — nodo `4278:18538`.
 *
 * SÓLO LA FILA RECHAZADA LO TIENE. El nodo dibuja la columna con las diez filas y el link
 * aparece en una sola: las demás no tienen nada que corregir, así que su celda va vacía.
 */
export const WASTE_WITHDRAWAL_CORRECTION_ACTION_LABEL = 'Corregir';

/** Motivo de respaldo mientras la API de retiros todavía no expone la observación. */
export const WASTE_WITHDRAWAL_REJECTION_FALLBACK_REASON =
  'Solicitud devuelta por Medio ambiente para corregir los antecedentes informados';

export interface WasteWithdrawalRow {
  id: string;
  /**
   * Fecha del retiro en ISO `yyyy-mm-dd`. La columna se llama "PERIODO" y se
   * filtra por MES, pero el dato es una fecha concreta: el nodo `3817:55330`
   * muestra un día ("XX-07-26"), no un mes.
   */
  withdrawalDate: string;
  category: string;
  wasteType: string;
  /** Cantidad como STRING numérico, igual que en ingresos: es lo que devuelve la API. */
  quantity: string;
  unit: string;
  /** Destinatario del retiro (el receptor autorizado). */
  recipient: string;
  /**
   * Folio SIDREP, o `null` cuando el retiro no lo requiere. El nodo dibuja ese
   * caso como "No aplica" con otro estilo de texto, así que la ausencia tiene que
   * ser representable y no una cadena vacía.
   */
  sidrepFolio: string | null;
  status: WasteWithdrawalStatus;
  /**
   * Medio Ambiente devolvió la solicitud para corrección — nodo `4278:18063`.
   *
   * NO ES UN `WasteWithdrawalStatus`, y el nodo lo demuestra: en su fila rechazada la
   * columna ESTADO sigue diciendo "Pendiente" y lo que cambia son las otras dos celdas —el
   * folio pasa a la pastilla "Rechazado" y aparece el link "Corregir"—. Tiene sentido: la
   * solicitud sigue pendiente de aprobación, lo que pasó es que volvió con observaciones.
   * Sumarlo a la unión lo habría metido además en el selector "Estado", que ofrecería
   * filtrar por un estado que la columna no dibuja.
   *
   * OPCIONAL PORQUE ES LA EXCEPCIÓN: una fila sin la marca no está rechazada, que es el
   * caso de todas menos una. Exigirlo obligaría a escribir `rejected: false` en las once
   * filas de muestra y en los dos caminos que crean filas locales, sin decir nada nuevo.
   */
  rejected?: boolean;
  /**
   * Instante del rechazo en ISO, para la línea "Hoy 16:54" del aviso `4278:17651`.
   *
   * VA EN LA FILA Y NO SÓLO EN EL STORE DE LA BANDEJA porque el aviso cuenta lo que la
   * tabla muestra: una fila rechazada que el listado trae del servidor —o de las muestras—
   * no pasó por el rechazo de esta sesión y el aviso igual tiene que poder fecharla.
   */
  rejectedAt?: string;
  /** Número que enlaza la fila con el rechazo emitido en la bandeja SIDREP. */
  requestNumber?: string;
  /** Nombre de quien devolvió la solicitud; forma parte del titular del nodo `4278:19235`. */
  rejectedByName?: string;
  /** Observación visible en la cita de la banda de corrección. */
  rejectionReason?: string;
}

/**
 * Las once filas del nodo.
 *
 * En Figma las diez repiten el mismo texto ("Categoría del residuo", "Detalle del
 * residuo", "XX-07-26"…): son marcadores de posición, no datos. Con los filtros
 * andando eso no sirve —un selector con una sola alternativa no se puede probar—,
 * así que cada columna filtrable trae valores distintos, igual que en
 * `wasteIntakeRows`.
 *
 * Categoría y residuo salen de `wasteCatalogs`, y unidad de `waste_units`. El
 * destinatario y el folio SÍ son de muestra: la base todavía no tiene retiros.
 *
 * LA CORRELACIÓN FOLIO ↔ ESTADO NO ES DECORATIVA. Los nodos la respetan en las
 * once filas: las que muestran "No aplica" están "Informativo", las que traen folio
 * están "Cerrado" y la que espera aprobación está "Pendiente". Es la regla de
 * negocio de la bajada de la vista, así que las muestras la reproducen en vez de
 * combinar los dos campos al azar.
 *
 * `monthOffset` cuenta meses desde hoy: ocho filas caen en el mes en curso —el
 * filtro por defecto— y dos quedan en el mes anterior, para que se vea el efecto
 * de mover o limpiar el período. Los días se quedan en 1..28 para que ningún mes
 * los desborde.
 */
const SAMPLE_ROWS = [
  /*
   * Fila RECHAZADA, la primera del nodo `4278:18063`: folio "Rechazado", estado
   * "Pendiente" y el link "Corregir" en la columna de acciones.
   *
   * VA ARRIBA porque es la única fila de la tabla que le pide algo a alguien —corregir y
   * reenviar— y porque es la que el aviso `4278:17632` manda a buscar; el resto son
   * historia. Es también RESPEL, como toda solicitud que pasa por SIDREP.
   *
   * Va en las muestras y no sólo como resultado de un rechazo por lo mismo que la
   * pendiente: el listado es compartido, así que siempre puede haber una solicitud
   * devuelta que este navegador no rechazó.
   */
  {
    monthOffset: 0,
    day: 22,
    category: 'RESPEL Residuos peligrosos',
    wasteType: 'Envases contaminados con hidrocarburos/aceites/grasas',
    quantity: '18',
    unit: 'Unidad',
    recipient: 'Hidronor Chile S.A.',
    sidrepFolio: null,
    status: 'pending' as const,
    rejected: true,
    rejectedHour: 16,
    rejectedMinute: 54,
    requestNumber: 'SR-2026-0847',
    rejectedByName: 'Francisco Villalobos R.',
    rejectionReason:
      'La fotografía frontal del camión está demasiado borrosa. Por favor asegurese de que la patente se vea nítida',
  },
  /*
   * Fila PENDIENTE. El nodo `3765:40905` muestra 11 filas con esta primera —folio
   * "A espera de aprobación" y estado "Pendiente"—, que es el estado en que queda
   * un retiro peligroso recién enviado. Va en las muestras y no solo como resultado
   * del envío porque el listado es compartido: siempre puede haber solicitudes de
   * otras personas esperando aprobación.
   */
  { monthOffset: 0, day: 26, category: 'RESPEL Residuos peligrosos', wasteType: 'Aceite usado / Aceites minerales usados', quantity: '2', unit: 'Contenedor', recipient: 'Hidronor — Planta Pudahuel', sidrepFolio: null, status: 'pending' as const },
  { monthOffset: 0, day: 3, category: 'RESPEL Residuos peligrosos', wasteType: 'Aceite usado / Aceites minerales usados', quantity: '8', unit: 'Tambor', recipient: 'Hidronor Chile S.A.', sidrepFolio: null, status: 'informational' as const },
  { monthOffset: 0, day: 5, category: 'Chatarra', wasteType: 'Chatarra (hierro y acero no galvanizados)', quantity: '12.5', unit: 'Tonelada', recipient: 'Gerdau Aza S.A.', sidrepFolio: null, status: 'informational' as const },
  { monthOffset: 0, day: 8, category: 'RSD Residuos sólidos domésticos', wasteType: 'Mezclas de residuos municipales (domésticos)', quantity: '540', unit: 'Kilogramo', recipient: 'Relleno Sanitario Til Til', sidrepFolio: null, status: 'informational' as const },
  { monthOffset: 0, day: 11, category: 'RESPEL Residuos peligrosos', wasteType: 'Baterías de plomo', quantity: '24', unit: 'Unidad', recipient: 'Recimat S.A.', sidrepFolio: '2026-SD-04756', status: 'closed' as const },
  { monthOffset: 0, day: 14, category: 'Lodos', wasteType: 'Lodos del tratamiento de aguas residuales urbanas / PTAS', quantity: '30', unit: 'Metro cúbico', recipient: 'Ecoprial Ltda.', sidrepFolio: null, status: 'informational' as const },
  { monthOffset: 0, day: 17, category: 'RESPEL Residuos peligrosos', wasteType: 'Filtros de aceite', quantity: '6', unit: 'Contenedor', recipient: 'Hidronor Chile S.A.', sidrepFolio: '2026-SD-04690', status: 'closed' as const },
  { monthOffset: 0, day: 20, category: 'RESPEL Residuos peligrosos', wasteType: 'Residuos de solventes halogenados y no halogenados', quantity: '2', unit: 'Tambor', recipient: 'Bravo Energy Chile S.A.', sidrepFolio: '2026-SD-04691', status: 'closed' as const },
  { monthOffset: 0, day: 24, category: 'RESPEL Residuos peligrosos', wasteType: 'Envases contaminados con hidrocarburos/aceites/grasas', quantity: '45', unit: 'Unidad', recipient: 'Recimat S.A.', sidrepFolio: '2026-SD-04702', status: 'closed' as const },
  { monthOffset: -1, day: 9, category: 'RESPEL Residuos peligrosos', wasteType: 'Sólidos contaminados con hidrocarburos', quantity: '110', unit: 'Kilogramo', recipient: 'Hidronor Chile S.A.', sidrepFolio: '2026-SD-04588', status: 'closed' as const },
  { monthOffset: -1, day: 22, category: 'Madera', wasteType: 'Madera no contaminada', quantity: '3.5', unit: 'Tonelada', recipient: 'Reciclajes Industriales SpA', sidrepFolio: null, status: 'informational' as const },
];

/**
 * Fila local de un retiro que el front acaba de cerrar y la API todavía no devuelve.
 *
 * LOS DOS CAMINOS LA USAN, y ahí está el `status` como parámetro:
 *
 *   peligroso     se ENVÍA a Medio ambiente  → `pending`        (nodo `3765:40905`)
 *   no peligroso  se REGISTRA directo        → `informational`  (nodo `3785:44731`)
 *
 * El estado no se deduce de `lot.isHazardous` acá aunque hoy coincida: quien llama es
 * el que sabe qué acción cerró: "Enviar solicitud" y "Registrar retiro" son dos cosas
 * distintas, y un peligroso rechazado y devuelto tendría el mismo lote con otro estado.
 *
 * La construye quien confirma la acción, no el store: los datos vienen repartidos
 * entre el borrador —lote, cantidad— y la pantalla que cierra —lugar de disposición—,
 * y armarla afuera evita que el store tenga que conocer las dos formas.
 *
 * TRADUCE DEL LOTE AL CATÁLOGO, y esa es su razón de ser. El modal dibuja nombres
 * CORTOS —"Aceite usado", `3765:40610`— y una sigla de categoría —"RESPEL"—, pero
 * las columnas de esta tabla se filtran con las alternativas de `wasteCatalogs`. Si
 * la fila se armara con los rótulos del modal, su propio filtro no la encontraría.
 * Por eso toma `wasteTypeName` y `unitName` del lote y deriva la categoría del
 * maestro.
 *
 * SIN FOLIO EN LOS DOS CASOS, y por motivos distintos: al peligroso todavía no se lo
 * emitieron y el no peligroso no lleva. Es lo que sostiene la correlación
 * folio ↔ estado de la tabla, donde `informational` se dibuja "No aplica".
 *
 * NO devuelve `id`: lo asigna el store al guardarla, que es quien sabe cuántas hay.
 */
export function createWithdrawalRowFromLot({
  lot,
  quantity,
  recipient,
  status,
  today,
}: {
  lot: WasteWithdrawableLot;
  /** Cantidad a retirar confirmada, no el saldo del lote. */
  quantity: string;
  /** Lugar de disposición final elegido, ya como rótulo. */
  recipient: string;
  /** Qué acción cerró el retiro. */
  status: WasteWithdrawalStatus;
  today: Date;
}): Omit<WasteWithdrawalRow, 'id'> {
  return {
    withdrawalDate: toIsoDate(today),
    // Del catálogo, no de la sigla del lote: es lo que filtra la columna.
    category: resolveWasteTypeCategory(lot.wasteTypeName) ?? lot.categoryCode,
    wasteType: lot.wasteTypeName,
    quantity,
    unit: lot.unitName,
    recipient,
    sidrepFolio: null,
    status,
  };
}

export function buildWasteWithdrawalRows(today: Date): WasteWithdrawalRow[] {
  // `monthOffset` y `day` se desestructuran afuera a propósito: son la receta del
  // dato, no parte de la fila, y el spread los arrastraría al modelo.
  return SAMPLE_ROWS.map(({ monthOffset, day, rejectedHour, rejectedMinute, ...row }, index) => ({
    ...row,
    id: String(index + 1),
    /*
     * "Hoy 16:54" es lo que escribe el nodo `4278:17651`, y la hora es DATO DE MUESTRA como
     * "XXXX" o "Nombre del destinatario": se fecha con la lectura de hoy de la vista para
     * que el aviso diga "Hoy" —si se fijara un día, en cuanto pasara la fecha el aviso
     * mostraría un rechazo viejo y el mock se leería como un bug.
     */
    ...(rejectedHour === undefined
      ? {}
      : {
          rejectedAt: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            rejectedHour,
            rejectedMinute,
          ).toISOString(),
        }),
    withdrawalDate: toIsoDate(new Date(today.getFullYear(), today.getMonth() + monthOffset, day)),
  }));
}

const TWO_DIGITS = (value: number): string => String(value).padStart(2, '0');

/** Titular dinámico con la forma exacta del nodo Figma `4278:19235`. */
export function wasteWithdrawalCorrectionHeading(
  correction: Pick<WasteWithdrawalRow, 'rejectedAt' | 'rejectedByName'>,
): string {
  const rejectedAt = correction.rejectedAt ? new Date(correction.rejectedAt) : null;
  const hasValidDate = rejectedAt !== null && !Number.isNaN(rejectedAt.getTime());
  const actor = correction.rejectedByName?.trim();
  const prefix = actor ? `Formulario rechazado por ${actor}.` : 'Formulario rechazado.';

  if (!hasValidDate) return prefix;

  const date = `${TWO_DIGITS(rejectedAt.getDate())}-${TWO_DIGITS(rejectedAt.getMonth() + 1)}-${rejectedAt.getFullYear()}`;
  const time = `${TWO_DIGITS(rejectedAt.getHours())}:${TWO_DIGITS(rejectedAt.getMinutes())}`;

  return `${prefix} · ${date} · ${time}`;
}
