import {
  WasteSinaderConstraints,
  hasWasteSinaderPeriodEnded,
  isWasteSinaderDeclarationOverdue,
  type WasteSinaderExportRequest,
} from '@aurelia/contracts';
import type { WastePillTone } from './components/WastePill';
import type { WasteKpi } from './components/WasteKpiCard';
import type {
  WasteSinaderPeriodDetailResponse,
  WasteSinaderPeriodLineResponse,
  WasteSinaderPeriodResponse,
  WasteSinaderPeriodStatus,
} from '../../shared/services/waste-sinader.service';
import {
  WASTE_MONTH_LONG_LABELS,
  WASTE_MONTH_SHORT_LABELS,
  parseIsoMonth,
} from './wasteMonthFilter';

/**
 * Modelo de la vista "Reporte SINADER" — nodo Figma `3830:65385`.
 *
 * Vive fuera de `components/` por el mismo criterio que `wasteHistoryRows` y
 * `wasteCompanyPerformance`: es el MODELO de la vista —el adaptador entre lo que
 * devuelve el servidor y lo que dibujan los componentes—, no su dibujo.
 *
 * La regla que sigue todo este archivo: el SERVIDOR aporta los hechos (kilos,
 * conteos, estado, fechas) y el cliente compone las frases. Es la misma división
 * que ya usa `wasteDashboardKpis`, y es la que permite cambiar el idioma de la
 * interfaz sin tocar la API.
 */

/**
 * Rótulos de los tres estados del período.
 *
 * SÓLO "En curso" está dibujado (`3830:65748`). Los otros dos son la lectura
 * directa de los valores del enum `waste_sinader_period_status` de la API
 * —`pending_declaration` y `declared`—, que la pantalla necesita porque el
 * selector de período llega a meses ya cerrados. PENDIENTE DE CONFIRMAR la copy
 * exacta con negocio.
 */
export const WASTE_SINADER_STATUS_LABELS: Record<WasteSinaderPeriodStatus, string> = {
  in_progress: 'En curso',
  pending_declaration: 'Pendiente de declaración',
  declared: 'Declarado',
};

/**
 * Tono de la pastilla de estado.
 *
 * `in_progress` es azul y sale del nodo. Los otros dos reutilizan tonos que YA
 * existen en `WastePill` con su propio nodo de origen —el ámbar de "Pendiente" de
 * `3817:56001` y el teal de "Cerrado" de `3817:55589`—, y significan lo mismo que
 * ahí: falta una acción / la acción está hecha. No se inventa ningún color nuevo.
 */
export const WASTE_SINADER_STATUS_TONES: Record<WasteSinaderPeriodStatus, WastePillTone> = {
  in_progress: 'blue',
  pending_declaration: 'amber',
  declared: 'teal',
};

/**
 * La geometría de fechas del plazo SINADER vive en `@aurelia/contracts`
 * (`schemas/waste.constraints.ts`) y no acá: la evalúan también el correo de la API
 * y el job que lo programa, y tienen que coincidir en el borde. Este archivo sólo
 * la consulta y le agrega lo que es del período —si ya se declaró—, que es un hecho
 * de la base y no del calendario.
 */

/**
 * Un período abierto se sigue sumando: es lo que explica el banner (`3830:65735`),
 * lo que pone el "(parcial)" en el KPI y el "hasta hoy" en la fila de totales.
 */
export function isWasteSinaderPeriodOpen(
  period: Pick<WasteSinaderPeriodResponse, 'periodYear' | 'periodMonth'>,
  today: Date,
): boolean {
  return !hasWasteSinaderPeriodEnded(period, today);
}

/**
 * Por qué "Marcar como declarado" (`3830:65730`) está o no habilitado.
 *
 * El nodo sólo dibuja el botón deshabilitado con el período en curso, pero los
 * otros dos casos existen igual y necesitan explicarse distinto: no es lo mismo
 * "todavía no se puede" que "ya está hecho".
 */
export type WasteSinaderDeclareState =
  /** El mes todavía corre. El total no es definitivo. */
  | 'period_open'
  /** El mes terminó y nadie lo declaró: el único caso con el botón activo. */
  | 'declarable'
  /** Ya se declaró. Volver a hacerlo duplicaría la declaración. */
  | 'already_declared';

export function resolveWasteSinaderDeclareState(
  period: WasteSinaderPeriodResponse,
  today: Date,
): WasteSinaderDeclareState {
  if (period.status === 'declared') return 'already_declared';
  return hasWasteSinaderPeriodEnded(period, today) ? 'declarable' : 'period_open';
}

/**
 * Plazo de declaración vencido — nodo `4304:31540`.
 *
 * NO ES UN ESTADO MÁS del período: es `declarable` que además se pasó de fecha. Por
 * eso devuelve un booleano y no un cuarto valor de `WasteSinaderDeclareState`: el
 * botón se comporta igual —se puede declarar— y lo único que cambia es que la vista
 * suma el recuadro rojo. Convertirlo en estado obligaría a todos los `switch` a
 * tratar dos casos que hacen lo mismo.
 *
 * Encadena las dos condiciones que `isWasteSinaderDeclarationOverdue` de contracts
 * deliberadamente NO junta: la del calendario, que es compartida, y la del estado
 * del período, que sólo conoce esta vista.
 */
export function isWasteSinaderPeriodOverdue(
  period: WasteSinaderPeriodResponse,
  today: Date,
): boolean {
  if (period.status === 'declared') return false;
  return isWasteSinaderDeclarationOverdue(period, today);
}

/** Título y cuerpo del recuadro rojo `4304:31895`. */
export const WASTE_SINADER_OVERDUE_TITLE = 'SLA vencido';

export function buildWasteSinaderOverdueNotice(
  deadlineDay = WasteSinaderConstraints.declarationDeadlineDay,
): string {
  return `Este reporte tuvo que haberse declarado el día ${deadlineDay} de este mes. Procura declararlo lo antes posible.`;
}

/**
 * Formato chileno de una cantidad que llega como STRING numérico de Postgres:
 * `"1240.000000"` → `"1.240"`.
 *
 * El punto separador de miles del diseño ("2.290") es el chileno, así que se
 * delega en `Intl` y no en un `replace` a mano. Los decimales se muestran sólo si
 * existen: el nodo no dibuja ninguno, pero un residuo pesado en toneladas sí puede
 * traerlos y truncarlos en la pantalla que va a un informe reglamentario sería
 * perder información.
 *
 * Un valor que no parsea se devuelve tal cual en vez de convertirse en `NaN`: es
 * preferible mostrar el crudo del servidor a inventar un cero.
 */
export function formatWasteQuantity(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;

  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 3 }).format(parsed);
}

/** Símbolo de la unidad de la línea, con el código como respaldo si no lo tiene. */
function resolveUnitSymbol(line: WasteSinaderPeriodLineResponse): string {
  return line.unit.symbol ?? line.unit.code;
}

/**
 * "28 jul 2026, 08:40" — el pie del nodo `3830:65722`.
 *
 * Se compone a mano y no con `Intl.DateTimeFormat` porque ese formato exacto —mes
 * abreviado en MINÚSCULA, coma antes de la hora, reloj de 24— no es el que produce
 * ningún locale por defecto, y depender de la implementación del navegador para
 * acertarlo sería frágil. Las abreviaturas salen del mismo arreglo que usa el
 * selector de meses, así que no hay dos listas de meses que puedan divergir.
 */
export function formatWasteSinaderUpdatedAt(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  /*
   * El `?? ''` es para `noUncheckedIndexedAccess`, no una rama real: `getMonth()`
   * devuelve 0–11 y el arreglo tiene doce entradas.
   */
  const month = (WASTE_MONTH_SHORT_LABELS[date.getMonth()] ?? '').toLowerCase();
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${date.getDate()} ${month} ${date.getFullYear()}, ${hours}:${minutes}`;
}

/**
 * Sólo el nombre del mes, para las frases del banner ("Julio aún no termina").
 *
 * El `<h2>` y el selector NO usan esto: les alcanza con `formatIsoMonthLabel`, que
 * ya devuelve "Julio 2026".
 */
/**
 * Nombre del mes SIGUIENTE al del período — el "1° de agosto" que promete el
 * banner `3830:65739` cuando se está mirando julio.
 *
 * El `% 12` cierra el año: diciembre devuelve "Enero". El AÑO no se nombra en la
 * frase, así que no hace falta arrastrarlo.
 */
export function formatWasteSinaderNextMonthName(isoMonth: string): string {
  const parsed = parseIsoMonth(isoMonth);
  if (!parsed) return isoMonth;
  return WASTE_MONTH_LONG_LABELS[(parsed.monthIndex + 1) % 12] ?? isoMonth;
}

export function formatWasteSinaderMonthName(isoMonth: string): string {
  const parsed = parseIsoMonth(isoMonth);
  // `parseIsoMonth` ya descarta los índices fuera de 0–11; el `??` es para el compilador.
  return (parsed ? WASTE_MONTH_LONG_LABELS[parsed.monthIndex] : undefined) ?? isoMonth;
}

/**
 * Las cuatro tarjetas del nodo `3830:65741`.
 *
 * La primera no tiene cifra: su valor ES el estado, así que va como pastilla. Las
 * otras tres son conteos que el servidor ya calculó al consolidar el período; no se
 * recalculan acá sumando las líneas, porque entonces habría dos fuentes para el
 * mismo número y la de la pantalla sólo vería la página que tiene cargada.
 */
export function buildWasteSinaderKpis(
  period: WasteSinaderPeriodResponse,
  today: Date,
): WasteKpi[] {
  const isOpen = isWasteSinaderPeriodOpen(period, today);
  const isDeclared = period.status === 'declared';

  return [
    {
      label: 'Estado del período',
      value: '',
      badge: {
        label: WASTE_SINADER_STATUS_LABELS[period.status],
        tone: WASTE_SINADER_STATUS_TONES[period.status],
      },
    },
    /*
     * LA SEGUNDA TARJETA CAMBIA DE DATO, no sólo de rótulo.
     *
     * Con el período abierto muestra el total acumulado (`3830:65751`); una vez
     * declarado, el nodo `3830:66138` pone en su lugar el N° de folio SINADER. Es
     * coherente: el total ya no es noticia —está en la fila de totales de la
     * tabla, que no se mueve— y lo que el aprobador necesita a mano en un período
     * cerrado es la referencia con la que quedó declarado ante la autoridad.
     *
     * El "(parcial)" del rótulo abierto describe justamente eso: mientras el mes
     * corre, el total no es definitivo.
     */
    isDeclared
      ? { label: 'N° Folio SINADER', value: period.declaredFolio ?? EMPTY_CELL }
      : {
          /*
           * "Total a declarar" y no "Total acumulado" con el período cerrado: así
           * lo rotulan `4319:34428` y `4304:31540`. La diferencia importa —el
           * primero describe una suma, el segundo una obligación pendiente— y es
           * la que hace que la tarjeta acompañe al botón de abajo.
           */
          label: isOpen ? 'Total acumulado (parcial)' : 'Total a declarar',
          value: formatWasteQuantity(period.totalQuantityKg),
          unit: 'kg',
        },
    { label: 'Categorías con movimiento', value: `${period.categoryCount}` },
    { label: 'Movimientos incluidos', value: `${period.movementCount}` },
  ];
}

/** Texto del párrafo de entrada de un período ya declarado — nodo `3830:66106`. */
export const WASTE_SINADER_DECLARED_DESCRIPTION =
  'Período cerrado y declarado en la Ventanilla Única del RETC. Este registro queda como respaldo de solo lectura.';

/**
 * Frase del banner verde de un período declarado (`3830:66121`), partida en tres
 * para poder poner el folio en negrita como hace el nodo.
 *
 * DOS DATOS PUEDEN FALTAR y la frase se arma igual:
 *
 * - El NOMBRE de quien declaró. El nodo dice "Declarado por Catalina Cortés", pero
 *   `GET /waste/sinader/periods/:id` no trae la relación `declaredByUser` —sólo
 *   `declaredByUserId`—, así que hoy nunca llega. Sin nombre la frase arranca
 *   "Declarado el …", que sigue siendo cierta. Hay que pedir el join.
 * - La FECHA, si el backend marcó `declared` sin `declaredAt`. Es un caso
 *   defensivo, no uno esperado.
 */
export function buildWasteSinaderDeclaredNotice(period: WasteSinaderPeriodResponse): {
  before: string;
  folio: string | null;
  after: string;
} {
  const when = period.declaredAt ? formatWasteSinaderUpdatedAt(period.declaredAt) : null;
  const who = period.declaredByName?.trim();

  const opening = who ? `Declarado por ${who}` : 'Declarado';
  const dated = when ? `${opening} el ${when}` : opening;

  return period.declaredFolio
    ? {
        before: `${dated} — N° Folio SINADER `,
        folio: period.declaredFolio,
        after: '. Este período quedó cerrado y no admite más movimientos.',
      }
    : { before: `${dated}. Este período quedó cerrado y no admite más movimientos.`, folio: null, after: '' };
}

/** Pie de la vista con el período declarado — nodo `3830:66225`. */
export function buildWasteSinaderDeclaredFooterNote(period: WasteSinaderPeriodResponse): string {
  const when = period.declaredAt ? formatWasteSinaderUpdatedAt(period.declaredAt) : null;
  return when
    ? `Declarado el ${when} — período cerrado, sin más cambios posibles.`
    : 'Período cerrado, sin más cambios posibles.';
}

/** Una fila de la tabla `3830:65642`, ya lista para dibujar. */
export interface WasteSinaderRow {
  id: string;
  /** Pastilla de la primera columna: "CHATARRA", "RSD", "MADERA". */
  categoryLabel: string;
  /** Segunda línea de la primera columna: "17 04 05 — Hierro y acero no galvanizados". */
  wasteLabel: string;
  /** "1.240 kg", ya con su unidad. */
  quantityLabel: string;
  treatmentLabel: string;
  destinationLabel: string;
  transportLabel: string;
}

/**
 * Texto de las celdas que el servidor puede devolver vacías —tratamiento, destino
 * y transportista son columnas anulables en `waste_sinader_period_lines`—.
 *
 * Es una raya y no una celda en blanco: una celda vacía se lee como "todavía no
 * cargué esto", y acá significa "esta línea no tiene ese dato".
 */
const EMPTY_CELL = '—';

/**
 * Pastilla de categoría de la primera columna.
 *
 * El nodo dibuja formas cortas —"CHATARRA", "RSD", "MADERA"— y el catálogo guarda
 * los nombres largos: la categoría `SCRAP_METAL` se llama "Chatarra" y `DOMESTIC`
 * "RSD Residuos sólidos domésticos". Se muestra el nombre real del catálogo en
 * mayúscula en vez de un mapa de rótulos cableado acá, que quedaría mudo para las
 * otras seis categorías y desincronizado en cuanto negocio renombre una.
 *
 * DOS PENDIENTES, los dos del lado del servidor:
 *
 * 1. `GET /waste/sinader/periods/:id` no anida `operationalCategory` en su
 *    `relations`. Sin ese join la pastilla cae al `code` del residuo. Hay que
 *    pedir el join.
 * 2. El catálogo no tiene un rótulo corto. "RSD Residuos sólidos domésticos" no
 *    entra en la pastilla del diseño; el arreglo correcto es una columna de
 *    etiqueta breve en `waste_operational_categories`, no recortar el string acá.
 */
function resolveCategoryLabel(line: WasteSinaderPeriodLineResponse): string {
  const category = line.wasteType.operationalCategory;
  return (category?.name ?? line.wasteType.code).toUpperCase();
}

/**
 * "17 04 05 — Hierro y acero no galvanizados".
 *
 * El guión largo lo pone el cliente y no el servidor: es puntuación de
 * presentación. Un residuo sin `sinaderCode` muestra sólo su nombre en vez de
 * arrancar con un separador huérfano.
 */
function resolveWasteLabel(line: WasteSinaderPeriodLineResponse): string {
  const { sinaderCode, name } = line.wasteType;
  return sinaderCode ? `${sinaderCode} — ${name}` : name;
}

export function buildWasteSinaderRows(period: WasteSinaderPeriodDetailResponse): WasteSinaderRow[] {
  return period.lines.map((line) => ({
    id: line.id,
    categoryLabel: resolveCategoryLabel(line),
    wasteLabel: resolveWasteLabel(line),
    quantityLabel: `${formatWasteQuantity(line.quantity)} ${resolveUnitSymbol(line)}`,
    treatmentLabel: line.treatmentType ?? EMPTY_CELL,
    destinationLabel: line.destinationCompany?.name ?? EMPTY_CELL,
    transportLabel: line.transportCompany?.name ?? EMPTY_CELL,
  }));
}

/**
 * Payload de exportación a PDF y Excel (nodos `3830:65724` y `4304:31205`).
 *
 * SE CONSTRUYE DESDE LO QUE YA SE DIBUJÓ, no desde la respuesta cruda: recibe los
 * mismos `kpis` y `rows` que la pantalla está mostrando, en vez de recalcularlos.
 * Es la garantía de que el archivo dice exactamente lo que el aprobador leyó —si
 * mañana cambia una regla de formato, cambia en un solo lugar y las tres
 * representaciones la siguen—. Es el mismo criterio que
 * `buildWarehouseControlExportRequest`.
 *
 * Por eso también es una función pura que NO toca la respuesta del servidor salvo
 * para el total: ese número no está en ninguna fila, es del período.
 */
/**
 * Rótulo de la píldora del PDF — nodos `4319:33874`, `4319:33592` y `4319:33727`.
 *
 * NO reutiliza `WASTE_SINADER_STATUS_LABELS`: la tarjeta de KPI dice "En curso" y
 * la píldora del documento dice "EN CURSO — DATOS PARCIALES". El documento tiene
 * más espacio y se lee fuera de contexto, así que dice más.
 */
export const WASTE_SINADER_EXPORT_BADGE_LABELS: Record<WasteSinaderPeriodStatus, string> = {
  in_progress: 'EN CURSO — DATOS PARCIALES',
  pending_declaration: 'PENDIENTE DE DECLARAR',
  declared: 'DECLARADO',
};

/**
 * Aclaración bajo el total del período abierto — nodo `4319:33968`.
 *
 * Sólo viaja en curso: es la advertencia de que ese total todavía se mueve.
 */
export const WASTE_SINADER_EXPORT_TABLE_FOOTNOTE =
  'Pueden sumarse más movimientos antes de fin de mes';

/**
 * Subtítulo del DOCUMENTO exportado — nodos `4319:33869`, `4319:33587` y
 * `4319:33722`.
 *
 * No es la descripción de la pantalla. Aquélla es un párrafo que explica el estado
 * al aprobador que está mirando la vista; ésta es la línea que identifica el
 * documento para quien lo abra suelto seis meses después, y por eso el declarado
 * agrega "comprobante de declaración".
 */
export const WASTE_SINADER_EXPORT_SUBTITLES: Record<WasteSinaderPeriodStatus, string> = {
  in_progress: 'Consolidado automático de residuos no peligrosos',
  pending_declaration: 'Consolidado automático de residuos no peligrosos',
  declared: 'Consolidado automático de residuos no peligrosos — comprobante de declaración',
};

export function buildWasteSinaderExportRequest(input: {
  period: WasteSinaderPeriodResponse;
  kpis: WasteKpi[];
  rows: WasteSinaderRow[];
  title: string;
  description: string;
  periodLabel: string;
  /** Texto del banner. Sólo viaja con el período abierto, igual que en pantalla. */
  notice?: string;
  totalLabel: string;
  updatedAtLabel: string;
}): WasteSinaderExportRequest {
  const status = input.period.status;

  return {
    status,
    statusBadgeLabel: WASTE_SINADER_EXPORT_BADGE_LABELS[status],
    /*
     * La nota y la firma son las dos ranuras opcionales del documento. Van atadas al
     * estado y no a una prop de la vista: es el mismo hecho el que decide que el
     * total todavía se mueve y que todavía no hay nada que firmar.
     */
    tableFootnote: status === 'in_progress' ? WASTE_SINADER_EXPORT_TABLE_FOOTNOTE : undefined,
    signature:
      status === 'declared' && input.period.declaredFolio
        ? {
            declaredBy: `${input.period.declaredByName?.trim() || 'Especialista Medio Ambiente'}`,
            declaredAtAndFolio: input.period.declaredAt
              ? `${formatWasteSinaderUpdatedAt(input.period.declaredAt)} · Folio ${input.period.declaredFolio}`
              : `Folio ${input.period.declaredFolio}`,
          }
        : undefined,
    title: input.title,
    description: WASTE_SINADER_EXPORT_SUBTITLES[status],
    periodLabel: input.periodLabel,
    statusLabel: WASTE_SINADER_STATUS_LABELS[input.period.status],
    notice: input.notice,
    /*
     * La tarjeta "Estado del período" no tiene cifra: su valor es el rótulo de la
     * pastilla. Se traduce acá y no en el renderer para que el PDF y el Excel
     * reciban un `value` uniforme y no tengan que conocer el concepto de pastilla.
     */
    kpis: input.kpis.map((kpi) => ({
      label: kpi.label,
      value: kpi.badge?.label ?? kpi.value,
      unit: kpi.unit,
    })),
    rows: input.rows.map((row) => ({
      category: row.categoryLabel,
      waste: row.wasteLabel,
      quantity: row.quantityLabel,
      treatment: row.treatmentLabel,
      destination: row.destinationLabel,
      transport: row.transportLabel,
    })),
    totalLabel: input.totalLabel,
    totalQuantity: `${formatWasteQuantity(input.period.totalQuantityKg)} kg`,
    updatedAtLabel: input.updatedAtLabel,
  };
}
