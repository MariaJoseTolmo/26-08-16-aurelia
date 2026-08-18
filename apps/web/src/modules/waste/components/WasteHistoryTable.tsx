import { WarehouseMonthFilterField } from './WarehouseMonthFilterField';
import { WarehouseSelectFilterField } from './WarehouseSelectFilterField';
import { WarehouseTextFilterField } from './WarehouseTextFilterField';
import {
  WasteDataTable,
  WASTE_TABLE_CELL_CLASS,
  WASTE_TABLE_CELL_COLOR,
  WASTE_TABLE_FIRST_CELL_COLOR,
} from './WasteDataTable';
import { WasteHazardBadge } from './WasteHazardBadge';
import { WasteTablePagination } from './WasteTablePagination';
import { WasteWithdrawalPill } from './WasteWithdrawalStatusBadge';
import type {
  WasteHistoryFilterKey,
  WasteHistoryFilterOptions,
  WasteHistoryFilters,
  WasteHistoryNumberFilterKey,
  WasteHistorySelectFilterKey,
} from '../wasteHistoryFilters';
import {
  WASTE_HISTORY_FOLIO_NOT_APPLICABLE,
  WASTE_HISTORY_STATUS_LABELS,
  type WasteHistoryRow,
  type WasteHistoryStatus,
} from '../wasteHistoryRows';
import { formatIsoAsDdMmYy } from '../wasteWithdrawalFilters';

/**
 * Tabla de "Histórico de retiros" — nodo Figma `3785:47830`, diecinueve columnas
 * que suman 2758.5px (verificado contra el ancho del frame).
 *
 * REEMPLAZA a `4230:12118`, que traía dieciocho columnas y 2509px. El delta son
 * dos columnas y nada más: "Responsable MA" (138.5px) se desdobló en
 * "Responsable MA apertura" (`3811:48406`, 204.5px) y "Responsable MA cierre"
 * (`5068:11735`, 183.5px, nueva). Las otras diecisiete conservan ancho, orden y
 * subestructura idénticos —se comparó columna por columna—, así que sólo cambian
 * los porcentajes del `<colgroup>`, que se reparten sobre el nuevo total.
 *
 * El armazón —contenedor, encabezado oscuro, fila de filtros, celda y estado
 * vacío— es `WasteDataTable`, compartido con las otras tres tablas del módulo;
 * ahí está anotada la geometría y por qué se transpone a filas. Acá queda lo
 * propio: las dieciocho columnas, su control de filtro y su fila.
 *
 * Es con diferencia la tabla más ancha del módulo: 2758.5px contra los 1044px
 * del cuerpo. El desplazamiento lo toma ELLA (`overflow="self"`, el default) y
 * no la página, porque arrastrar el cuerpo entero dejaría la intro, las
 * pestañas y los KPIs fuera de cuadro.
 *
 * CUATRO COLUMNAS CON CELDA PROPIA:
 *
 * - "TIPO" (`3785:47864`) dibuja `WasteHazardBadge`, la misma pastilla de
 *   peligrosidad de las otras tablas: se comparó el design context y no difiere.
 * - "FOLIO SIDREP" (`3785:48111`) tiene dos estilos según el dato: con folio va
 *   Inter Regular 12px #131313; sin folio, "No aplica" en 11.5px #646464. A
 *   diferencia de "Solicitud de retiro", acá el nodo NO centra la celda.
 * - "ESTADO" (`3785:48142`) reusa `WasteWithdrawalPill`: los tres tonos del nodo
 *   —ámbar, neutro y teal— son exactamente los tres que esa pastilla ya define.
 *   "Abierto" comparte el ámbar con "Pendiente", que es el mismo sentido.
 * - "RESPALDO" (`3816:49843`) es la ÚNICA sin control de filtro —su celda de
 *   filtro está vacía en el nodo— y su celda es un enlace subrayado #c8a064, o
 *   nada cuando el retiro no tiene respaldo.
 *
 * DOS TYPOS DEL ARCHIVO DE FIGMA que NO se reproducen, porque son copy visible
 * para el aprobador y propagar una falta de ortografía no es fidelidad:
 *
 * - Los dos encabezados de responsable dicen "reponsable MA …" (`3811:48408` y
 *   `5068:11737`), sin la "s". Acá van como "Responsable MA apertura/cierre".
 * - El placeholder del filtro de folio trae DOS espacios (`4230:12484`: "Busca
 *   por  Nº de folio", con `whitespace-pre`). Se emite con uno solo; es el mismo
 *   typo que en "Solicitud de retiro" y HTML colapsaría el segundo igual.
 */

interface WasteHistoryColumnBase {
  key: string;
  label: string;
  /** Porcentaje del ancho total (2509px), derivado de los anchos del nodo. */
  width: string;
  /** Estado y respaldo centran su contenido; el resto alinea a la izquierda. */
  centered?: boolean;
}

/**
 * Unión discriminada por `filter`, no un objeto con todo opcional: así el tipo
 * garantiza que una columna con selector SIEMPRE trae su `filterKey`, y el
 * render no necesita chequear en runtime. Mismo patrón que las otras tablas.
 */
type WasteHistoryColumn = WasteHistoryColumnBase &
  (
    | { filter: 'month'; filterKey: 'period' }
    | { filter: 'select'; filterKey: WasteHistorySelectFilterKey; filterLabel: string }
    | { filter: 'number'; filterKey: WasteHistoryNumberFilterKey; filterLabel: string }
    | { filter: 'text'; filterKey: 'sidrepFolio'; filterLabel: string }
    | { filter: 'none' }
  );

const COLUMNS: WasteHistoryColumn[] = [
  { key: 'period', label: 'Periodo', width: '4.4046%', filter: 'month', filterKey: 'period' },
  { key: 'hazard', label: 'Tipo', width: '4.4046%', filter: 'select', filterKey: 'hazard', filterLabel: 'Todos' },
  { key: 'category', label: 'Categoría operativa', width: '6.3984%', filter: 'select', filterKey: 'category', filterLabel: 'Todas' },
  { key: 'wasteType', label: 'Residuo específico', width: '5.9271%', filter: 'select', filterKey: 'wasteType', filterLabel: 'Todos' },
  { key: 'quantity', label: 'Cantidad retirada', width: '5.8909%', filter: 'number', filterKey: 'quantity', filterLabel: '#' },
  { key: 'unit', label: 'Unidad de medida', width: '5.7278%', filter: 'select', filterKey: 'unit', filterLabel: 'Todas' },
  { key: 'carrier', label: 'Transportista', width: '4.9846%', filter: 'select', filterKey: 'carrier', filterLabel: 'Todos' },
  { key: 'sector', label: 'Sector de retiro', width: '5.4921%', filter: 'select', filterKey: 'sector', filterLabel: 'Todos' },
  { key: 'recipient', label: 'Destinatario', width: '5.8365%', filter: 'select', filterKey: 'recipient', filterLabel: 'Todos' },
  { key: 'sidrepFolio', label: 'Folio SIDREP', width: '6.3078%', filter: 'text', filterKey: 'sidrepFolio', filterLabel: 'Busca por Nº de folio' },
  { key: 'declaredWeight', label: 'Peso declarado', width: '5.3109%', filter: 'number', filterKey: 'declaredWeight', filterLabel: '#' },
  { key: 'receivedWeight', label: 'Peso recibido', width: '4.6946%', filter: 'number', filterKey: 'receivedWeight', filterLabel: '#' },
  { key: 'weightDiffKg', label: 'Dif. Peso (kg)', width: '4.5133%', filter: 'number', filterKey: 'weightDiffKg', filterLabel: '#' },
  { key: 'weightDiffPercent', label: 'Dif. Peso (%)', width: '4.2958%', filter: 'number', filterKey: 'weightDiffPercent', filterLabel: '#%' },
  { key: 'daysOpen', label: 'Días abierto', width: '4.4046%', filter: 'number', filterKey: 'daysOpen', filterLabel: '#' },
  { key: 'environmentOwnerOpen', label: 'Responsable MA apertura', width: '7.4134%', filter: 'select', filterKey: 'environmentOwnerOpen', filterLabel: 'Todas' },
  { key: 'environmentOwnerClose', label: 'Responsable MA cierre', width: '6.6522%', filter: 'select', filterKey: 'environmentOwnerClose', filterLabel: 'Todas' },
  { key: 'status', label: 'Estado', width: '3.6977%', filter: 'select', filterKey: 'status', filterLabel: 'Todos', centered: true },
  { key: 'support', label: 'Respaldo', width: '3.6433%', filter: 'none', centered: true },
];

/** Tonos de `WasteWithdrawalPill` para los tres estados del nodo `4230:12718`. */
const STATUS_TONE = {
  open: 'amber',
  informational: 'neutral',
  closed: 'teal',
} as const satisfies Record<WasteHistoryStatus, 'amber' | 'neutral' | 'teal'>;

interface WasteHistoryTableProps {
  /** Filas ya filtradas y paginadas: la tabla no filtra, solo dibuja. */
  rows: WasteHistoryRow[];
  filters: WasteHistoryFilters;
  options: WasteHistoryFilterOptions;
  onFilterChange: (key: WasteHistoryFilterKey, value: string | null) => void;
  /** Lectura única de "hoy" de la vista, para los años del selector de meses. */
  today: Date;
  page?: number;
  totalPages?: number;
  pageSize?: number;
  /** Filas del conjunto COMPLETO, no de esta página. */
  totalRows?: number;
  onPageChange?: (page: number) => void;
}

export function WasteHistoryTable({
  rows,
  filters,
  options,
  onFilterChange,
  today,
  page = 1,
  totalPages = 1,
  pageSize = 10,
  totalRows,
  onPageChange,
}: WasteHistoryTableProps) {
  return (
    <WasteDataTable
      caption="Histórico consolidado de retiros de residuos"
      columns={COLUMNS}
      minWidth={2758.5}
      rows={rows}
      getRowKey={(row) => row.id}
      renderRow={(row) => <WasteHistoryTableCells row={row} />}
      renderFilter={(column) => (
        <WasteHistoryFilterControl
          column={column}
          filters={filters}
          options={options}
          onFilterChange={onFilterChange}
          today={today}
        />
      )}
      emptyMessage="No hay retiros para los filtros aplicados"
      footer={
        <WasteTablePagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalRows={totalRows ?? rows.length}
          onPageChange={onPageChange}
        />
      }
    />
  );
}

function WasteHistoryFilterControl({
  column,
  filters,
  options,
  onFilterChange,
  today,
}: {
  column: WasteHistoryColumn;
  filters: WasteHistoryFilters;
  options: WasteHistoryFilterOptions;
  onFilterChange: (key: WasteHistoryFilterKey, value: string | null) => void;
  today: Date;
}) {
  if (column.filter === 'none') return null;

  if (column.filter === 'month') {
    return (
      <WarehouseMonthFilterField
        className="w-full"
        label={column.label}
        value={filters.period}
        today={today}
        onChange={(value) => onFilterChange('period', value)}
      />
    );
  }

  if (column.filter === 'select') {
    return (
      <WarehouseSelectFilterField
        label={column.label}
        emptyOptionLabel={column.filterLabel}
        options={options[column.filterKey]}
        value={filters[column.filterKey]}
        onChange={(value) => onFilterChange(column.filterKey, value)}
      />
    );
  }

  return (
    <WarehouseTextFilterField
      kind={column.filter === 'number' ? 'number' : 'search'}
      label={column.label}
      placeholder={column.filterLabel}
      value={filters[column.filterKey]}
      onChange={(value) => onFilterChange(column.filterKey, value)}
    />
  );
}

/** Celdas de la fila; el `<tr>` de 46px lo aporta `WasteDataTable`. */
function WasteHistoryTableCells({ row }: { row: WasteHistoryRow }) {
  const cell = `${WASTE_TABLE_CELL_CLASS} ${WASTE_TABLE_CELL_COLOR}`;

  return (
    <>
      <td className={`${WASTE_TABLE_CELL_CLASS} ${WASTE_TABLE_FIRST_CELL_COLOR}`}>
        {formatIsoAsDdMmYy(row.withdrawalDate)}
      </td>
      <td className={cell}>
        <WasteHazardBadge isHazardous={row.isHazardous} />
      </td>
      <td className={cell}>{row.category}</td>
      <td className={cell}>{row.wasteType}</td>
      <td className={cell}>{row.quantity}</td>
      <td className={cell}>{row.unit}</td>
      <td className={cell}>{row.carrier}</td>
      <td className={cell}>{row.sector}</td>
      <td className={cell}>{row.recipient}</td>
      <td className={cell}>
        {row.sidrepFolio ?? (
          <span className="text-[11.5px] text-[#646464]">{WASTE_HISTORY_FOLIO_NOT_APPLICABLE}</span>
        )}
      </td>
      <td className={cell}>{row.declaredWeight}</td>
      <td className={cell}>{row.receivedWeight}</td>
      <td className={cell}>{row.weightDiffKg}</td>
      <td className={cell}>{row.weightDiffPercent}</td>
      <td className={cell}>{row.daysOpen}</td>
      <td className={cell}>{row.environmentOwnerOpen}</td>
      <td className={cell}>{row.environmentOwnerClose}</td>
      <td className={`${cell} text-center`}>
        <WasteWithdrawalPill tone={STATUS_TONE[row.status]}>
          {WASTE_HISTORY_STATUS_LABELS[row.status]}
        </WasteWithdrawalPill>
      </td>
      <td className={`${cell} text-center`}>
        {/*
          El nodo dibuja el respaldo como texto subrayado, sin destino. Sale como
          `<a>` porque eso es: abre el documento del retiro. Las filas sin
          respaldo quedan vacías, igual que en el diseño.
        */}
        {row.supportUrl ? (
          <a
            href={row.supportUrl}
            className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] text-[#c8a064] underline"
          >
            Ver respaldo
          </a>
        ) : null}
      </td>
    </>
  );
}
