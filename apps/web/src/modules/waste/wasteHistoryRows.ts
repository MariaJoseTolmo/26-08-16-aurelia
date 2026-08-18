/**
 * Filas de "Histórico de retiros" — nodo Figma `4230:12118`.
 *
 * Vive fuera de `components/` por el mismo criterio que `wasteWithdrawalRows`:
 * es el MODELO de la vista, no su dibujo, y lo consume tanto la tabla como el
 * filtrado.
 *
 * Las diez filas del nodo son maqueta —"Categoría del residuo", "XXXX",
 * "X.XXX"— salvo cuatro columnas que SÍ varían fila a fila y que son las que dan
 * el sentido de la pantalla. Al cruzarlas se ve que el diseño es coherente y no
 * arbitrario:
 *
 *   peligroso     → tiene folio SIDREP → estado Abierto o Cerrado
 *   no peligroso  → "No aplica"        → estado Informativo
 *   respaldo      → sólo en los CERRADOS
 *   RECHAZADO     → peligroso SIN folio todavía; ver la nota del estado
 *
 * Esa coherencia es la regla de negocio de la vista, así que los defaults la
 * respetan: un "no peligroso" con folio sería un dato imposible.
 */

/**
 * Estados del nodo `4230:12718` MÁS "Rechazado", que ese nodo no dibuja.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A CONFIRMAR CON DISEÑO: "RECHAZADO" NO TIENE NODO EN ESTA TABLA
 *
 * El nodo `4230:12718` dibuja tres pastillas —Abierto, Informativo, Cerrado— y ninguna
 * de rechazo, porque cuando se dibujó la tabla el rechazo de solicitudes no existía. Lo
 * pide el aviso `4278:17632`, que manda a "revisar la columna Folio SIDREP para
 * identificar las solicitudes rechazadas": sin este estado, esa columna dice "No aplica"
 * en una solicitud que sí aplica —es peligrosa y va a SIDREP— y el aviso manda a mirar
 * algo que no está.
 *
 * NO SE INVENTÓ NI EL TONO NI EL PATRÓN. El tono es el `red` de `WastePill`
 * (`#ffd0db`/`#570b1d`), que el módulo ya usa para el rechazo desde la franja
 * `4295:24658`; y la pastilla en la celda de FOLIO es lo que la tabla de retiros ya hace
 * con "A espera de aprobación" (`3817:55964`) para una solicitud sin folio. Lo que falta
 * es que diseño confirme la pastilla en ESTA tabla.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * UNA RECHAZADA NO TIENE FOLIO. El folio SIDREP se emite al APROBAR —lo dice el modal
 * `3087:17238`, "Aprobar y generar folio SIDREP"—, así que una solicitud devuelta para
 * corrección no puede tenerlo. Por eso su celda de folio lleva la pastilla del estado y
 * no un número.
 */
export type WasteHistoryStatus = 'open' | 'informational' | 'closed' | 'rejected';

export const WASTE_HISTORY_STATUS_LABELS: Record<WasteHistoryStatus, string> = {
  open: 'Abierto',
  informational: 'Informativo',
  closed: 'Cerrado',
  /*
   * La misma palabra que la pastilla de la bandeja de pendientes
   * (`WASTE_SIDREP_REQUEST_REJECTED_STATUS`, nodo `4295:24656`): es el mismo hecho visto
   * desde otra tabla, y dos palabras distintas para el mismo estado se leerían como dos
   * estados.
   */
  rejected: 'Rechazado',
};

/** Texto del nodo `4230:12490`, para los retiros sin folio. */
export const WASTE_HISTORY_FOLIO_NOT_APPLICABLE = 'No aplica';

export interface WasteHistoryRow {
  id: string;
  /** ISO `yyyy-mm-dd`. El nodo lo dibuja como `dd-mm-aa`. */
  withdrawalDate: string;
  isHazardous: boolean;
  category: string;
  wasteType: string;
  quantity: string;
  unit: string;
  carrier: string;
  sector: string;
  recipient: string;
  /** `null` cuando no aplica: los no peligrosos no pasan por SIDREP. */
  sidrepFolio: string | null;
  declaredWeight: string;
  receivedWeight: string;
  weightDiffKg: string;
  weightDiffPercent: string;
  daysOpen: string;
  /**
   * Responsable de Medio Ambiente que ABRE el retiro y el que lo CIERRA.
   *
   * Son dos columnas distintas desde el nodo `3785:47830`: la versión anterior
   * (`4230:12118`) traía un solo "Responsable MA". No se colapsan en un campo:
   * en un retiro cerrado por otra persona son dos nombres diferentes, y ese
   * cruce es justamente lo que el aprobador va a mirar.
   */
  environmentOwnerOpen: string;
  environmentOwnerClose: string;
  status: WasteHistoryStatus;
  /** URL del respaldo. `null` deja la celda vacía, como en el nodo. */
  supportUrl: string | null;
}

/**
 * Las diez filas del nodo, en su orden.
 *
 * Los textos de maqueta se dejan TAL CUAL: son el contenido del diseño, y
 * cambiarlos por datos inventados haría más difícil comparar la pantalla contra
 * Figma. Se reemplazan cuando la vista consuma la API.
 */
const PLACEHOLDER = {
  category: 'Categoría del residuo',
  wasteType: 'Detalle del residuo',
  quantity: 'XXXX',
  unit: 'Tambores, M3, Ton, etc',
  carrier: 'EECC',
  sector: 'Bodega o Truckshop',
  recipient: 'Nombre del destinatario',
  declaredWeight: 'X.XXX',
  receivedWeight: 'X.XXX',
  weightDiffKg: 'X.XXX',
  weightDiffPercent: 'XX%',
  daysOpen: 'XX',
  environmentOwnerOpen: 'Nombre y apellido',
  environmentOwnerClose: 'Nombre y apellido',
} as const;

interface WasteHistorySeed {
  isHazardous: boolean;
  sidrepFolio: string | null;
  status: WasteHistoryStatus;
  hasSupport: boolean;
}

/** Lo único que cambia fila a fila en el nodo. */
const SEEDS: WasteHistorySeed[] = [
  /*
   * LA RECHAZADA VA PRIMERA Y ES LA ÚNICA QUE EL NODO NO DIBUJA. Va arriba porque es la
   * única fila de la tabla que le pide algo a alguien —corregir y reenviar— y porque es
   * la que el aviso `4278:17632` manda a buscar; el resto son historia.
   *
   * SIN FOLIO Y PELIGROSA, que es lo que la hace RESPEL rechazada: el folio se emite al
   * aprobar. Los pesos y los responsables siguen siendo los del placeholder del nodo,
   * igual que en las diez filas de muestra —una rechazada real no tendría peso recibido
   * ni responsable de cierre—, porque llenarlos distinto sería inventar datos donde el
   * nodo puso "XXXX".
   */
  { isHazardous: true, sidrepFolio: null, status: 'rejected', hasSupport: false },
  { isHazardous: true, sidrepFolio: '2026-SD-04821', status: 'open', hasSupport: false },
  { isHazardous: false, sidrepFolio: null, status: 'informational', hasSupport: false },
  { isHazardous: true, sidrepFolio: '2026-SD-04743', status: 'open', hasSupport: false },
  { isHazardous: false, sidrepFolio: null, status: 'informational', hasSupport: false },
  { isHazardous: false, sidrepFolio: null, status: 'informational', hasSupport: false },
  { isHazardous: true, sidrepFolio: '2026-SD-04756', status: 'closed', hasSupport: true },
  { isHazardous: false, sidrepFolio: null, status: 'informational', hasSupport: false },
  { isHazardous: true, sidrepFolio: '2026-SD-04690', status: 'closed', hasSupport: true },
  { isHazardous: true, sidrepFolio: '2026-SD-04690', status: 'closed', hasSupport: true },
  { isHazardous: true, sidrepFolio: '2026-SD-04690', status: 'closed', hasSupport: true },
];

/**
 * Las diez filas, fechadas dentro del mes de `reference`.
 *
 * Es una FUNCIÓN y no una constante justamente por la fecha. El nodo escribe
 * "XX-07-26" en las diez celdas —un placeholder, no una fecha— pero la pantalla
 * arranca filtrada por el mes en curso (`3813:48480`, "Mes actual [Nombre del
 * mes]"). Con fechas fijas, ese filtro dejaría la tabla vacía en cuanto pasara
 * el mes, y la vista se vería rota sin que nada estuviera roto.
 *
 * `reference` se inyecta en vez de leer `new Date()` acá dentro porque el módulo
 * quedaría impuro y la página ya resuelve "hoy" una sola vez al montar.
 */
export function buildWasteHistoryRows(reference: Date): WasteHistoryRow[] {
  const year = reference.getFullYear();
  const month = String(reference.getMonth() + 1).padStart(2, '0');

  return SEEDS.map((seed, index) => ({
    id: `waste-history-${index + 1}`,
    withdrawalDate: `${year}-${month}-${String(index + 1).padStart(2, '0')}`,
    isHazardous: seed.isHazardous,
    sidrepFolio: seed.sidrepFolio,
    status: seed.status,
    supportUrl: seed.hasSupport ? '#' : null,
    ...PLACEHOLDER,
  }));
}
