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
  informational: 'Informativo',
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
 * Fila temporal de una solicitud recién enviada.
 *
 * La construye quien confirma el envío, no el store: los datos vienen repartidos
 * entre el borrador —lote, cantidad— y el paso SIDREP —lugar de disposición—, y
 * armarla afuera evita que el store tenga que conocer las dos formas.
 *
 * El `id` lleva prefijo `pendiente-` para que no choque con los índices de las
 * muestras ni, más adelante, con los ids que devuelva la API.
 *
 * TRADUCE DEL LOTE AL CATÁLOGO, y esa es su razón de ser. El modal dibuja nombres
 * CORTOS —"Aceite usado", `3765:40610`— y una sigla de categoría —"RESPEL"—, pero
 * las columnas de esta tabla se filtran con las alternativas de `wasteCatalogs`. Si
 * la fila se armara con los rótulos del modal, su propio filtro no la encontraría.
 * Por eso toma `wasteTypeName` y `unitName` del lote y deriva la categoría del
 * maestro.
 *
 * NO devuelve `id`: lo asigna el store al guardarla, que es quien sabe cuántas hay.
 */
export function createPendingWithdrawalRow({
  lot,
  quantity,
  recipient,
  today,
}: {
  lot: WasteWithdrawableLot;
  /** Cantidad a retirar confirmada, no el saldo del lote. */
  quantity: string;
  /** Lugar de disposición final elegido en el paso SIDREP, ya como rótulo. */
  recipient: string;
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
    // Sin folio y en `pending`: es lo que sostiene la correlación de la tabla.
    sidrepFolio: null,
    status: 'pending',
  };
}

export function buildWasteWithdrawalRows(today: Date): WasteWithdrawalRow[] {
  // `monthOffset` y `day` se desestructuran afuera a propósito: son la receta del
  // dato, no parte de la fila, y el spread los arrastraría al modelo.
  return SAMPLE_ROWS.map(({ monthOffset, day, ...row }, index) => ({
    ...row,
    id: String(index + 1),
    withdrawalDate: toIsoDate(new Date(today.getFullYear(), today.getMonth() + monthOffset, day)),
  }));
}
