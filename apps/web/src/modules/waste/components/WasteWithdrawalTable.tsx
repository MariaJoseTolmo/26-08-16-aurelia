import { formatQuantity } from '../wasteFilterPrimitives';
import {
  formatIsoAsDdMmYy,
  type WasteWithdrawalFilterKey,
  type WasteWithdrawalFilterOptions,
  type WasteWithdrawalFilters,
  type WasteWithdrawalSelectFilterKey,
} from '../wasteWithdrawalFilters';
import {
  WASTE_WITHDRAWAL_FOLIO_PENDING_LABEL,
  type WasteWithdrawalRow,
} from '../wasteWithdrawalRows';
import { WarehouseMonthFilterField } from './WarehouseMonthFilterField';
import { WarehouseSelectFilterField } from './WarehouseSelectFilterField';
import { WarehouseTextFilterField } from './WarehouseTextFilterField';
import {
  WasteDataTable,
  WASTE_TABLE_CELL_CLASS,
  WASTE_TABLE_CELL_COLOR,
  WASTE_TABLE_FIRST_CELL_COLOR,
} from './WasteDataTable';
import { WasteTablePagination } from './WasteTablePagination';
import { WasteWithdrawalPill, WasteWithdrawalStatusBadge } from './WasteWithdrawalStatusBadge';

/**
 * Tabla de "Solicitud de retiro" — nodo Figma `3817:55311` (columnas en
 * `3817:55312`, pie de paginación en `3817:55609`).
 *
 * El armazón —contenedor, encabezado oscuro, fila de filtros, celda y estado
 * vacío— es `WasteDataTable`, compartido con las otras tres tablas del módulo;
 * ahí está anotada la geometría y por qué se transpone a filas. Acá queda lo
 * propio de esta tabla: sus ocho columnas, su control de filtro y su fila.
 *
 *   anchos  121.5 · 180.5 · 180.5 · 162.5 · 158 · 161 · 174 · 102 px, total 1240
 *   filtros control bg white · border #d1d1d1 · rounded-[8px] · px-[8px] py-[5px]
 *           texto Inter Regular 13px #131313 · placeholder #acacac
 *   pie     `WasteTablePagination`, compartido con "Ingresos a bodega"
 *
 * Las 8 columnas suman 1240px contra los 1016px del contenedor, así que en Figma
 * la tabla se recorta con `overflow-clip`. Acá el desplazamiento horizontal lo
 * toma la propia tabla (`overflow="self"`), igual que en "Ingresos a bodega": el
 * desborde es de ~224px y arrastrar toda la página dejaría la intro y la barra de
 * acciones fuera de cuadro. El pie queda fuera del área que scrollea, como en el
 * nodo, donde es hermano de las columnas y no hijo.
 *
 * UN DESVÍO PROPIO:
 *
 * - El placeholder del filtro de folio viene con DOS espacios en el nodo
 *    (`3817:55540`: "Busca por  Nº de folio", con `whitespace-pre`). Se emite con
 *    uno solo: es un typo del archivo, y HTML colapsaría el segundo igual.
 *
 * DOS COLUMNAS CON CELDA PROPIA, que es lo que distingue esta tabla:
 *
 * - "FOLIO SIDREP" tiene dos estilos de celda según el dato. Con folio va Inter
 *   Regular 12px #131313 (`3817:55550`); sin folio, "No aplica" en Inter Regular
 *   11.5px #646464 (`3817:55544`). El nodo centra ambas.
 * - "ESTADO" dibuja `WasteWithdrawalStatusBadge`, que NO es la pastilla de
 *   peligrosidad con otros colores. Ver la nota de ese archivo.
 *
 * El nodo `3765:40905` agrega el estado `pending`, que toca las DOS columnas: el
 * estado muestra "Pendiente" y el folio pasa a la pastilla "A espera de aprobación"
 * en vez de "No aplica".
 */

interface WasteWithdrawalColumnBase {
  key: keyof WasteWithdrawalRow;
  label: string;
  /** Porcentaje del ancho total, derivado de los anchos del nodo. */
  width: string;
  /** Folio y estado centran su contenido; el resto alinea a la izquierda. */
  centered?: boolean;
}

/**
 * Unión discriminada por `filter`, no un objeto con todo opcional: así el tipo
 * garantiza que una columna con selector SIEMPRE trae su `filterKey` y su
 * etiqueta de valor vacío, y el render no necesita castear ni chequear en
 * runtime. Es el mismo patrón de `WarehouseIntakeTable`.
 */
type WasteWithdrawalColumn = WasteWithdrawalColumnBase &
  (
    | { filter: 'month'; filterKey: 'period' }
    | { filter: 'select'; filterKey: WasteWithdrawalSelectFilterKey; filterLabel: string }
    | { filter: 'number'; filterKey: 'quantity'; filterLabel: string }
    | { filter: 'text'; filterKey: 'sidrepFolio'; filterLabel: string }
  );

const COLUMNS: WasteWithdrawalColumn[] = [
  // El período no lleva `filterLabel`: su control es el selector de meses, que
  // muestra "May 2026" y resuelve su propio texto vacío.
  { key: 'withdrawalDate', label: 'Periodo', width: '9.7984%', filter: 'month', filterKey: 'period' },
  { key: 'category', label: 'Categoría operativa', width: '14.5565%', filter: 'select', filterKey: 'category', filterLabel: 'Todas' },
  { key: 'wasteType', label: 'Residuo específico', width: '14.5565%', filter: 'select', filterKey: 'wasteType', filterLabel: 'Todos' },
  { key: 'quantity', label: 'Cantidad retirada', width: '13.1048%', filter: 'number', filterKey: 'quantity', filterLabel: '#' },
  { key: 'unit', label: 'Unidad de medida', width: '12.7419%', filter: 'select', filterKey: 'unit', filterLabel: 'Todas' },
  { key: 'recipient', label: 'Destinatario', width: '12.9839%', filter: 'select', filterKey: 'recipient', filterLabel: 'Todos' },
  { key: 'sidrepFolio', label: 'Folio SIDREP', width: '14.0323%', filter: 'text', filterKey: 'sidrepFolio', filterLabel: 'Busca por Nº de folio', centered: true },
  { key: 'status', label: 'Estado', width: '8.2258%', filter: 'select', filterKey: 'status', filterLabel: 'Todos', centered: true },
];

/**
 * La primera columna del nodo pinta su texto en #333 (`3817:55330`) y las demás
 * en #131313 (`--gray/900_txt`). Se respeta la diferencia tal como viene del
 * diseño, igual que en "Ingresos a bodega".
 */
const CELL_CLASS = WASTE_TABLE_CELL_CLASS;
const FIRST_CELL_COLOR = WASTE_TABLE_FIRST_CELL_COLOR;
const CELL_COLOR = WASTE_TABLE_CELL_COLOR;

interface WasteWithdrawalTableProps {
  /** Filas ya filtradas: la tabla no filtra, solo dibuja lo que recibe. */
  rows: WasteWithdrawalRow[];
  /**
   * Filtros aplicados. Es el MISMO estado que muestran las pastillas de "Filtros
   * activos": los controles de columna y las pastillas son dos vistas del mismo
   * dato, no dos juegos de filtros.
   */
  filters: WasteWithdrawalFilters;
  options: WasteWithdrawalFilterOptions;
  onFilterChange: (key: WasteWithdrawalFilterKey, value: string | null) => void;
  /** Lectura única de "hoy" de la vista, para los años que ofrece el selector de meses. */
  today: Date;
  page?: number;
  totalPages?: number;
  pageSize?: number;
  /**
   * Filas del conjunto COMPLETO, no de esta página. El pie las necesita para decir
   * "Mostrando 1–10 de 11 datos"; `rows` ya viene recortada a la página.
   */
  totalRows?: number;
  onPageChange?: (page: number) => void;
}

export function WasteWithdrawalTable({
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
}: WasteWithdrawalTableProps) {
  return (
    <WasteDataTable
      caption="Histórico de retiros de residuos"
      columns={COLUMNS}
      minWidth={1240}
      rows={rows}
      getRowKey={(row) => row.id}
      renderRow={(row) => <WasteWithdrawalTableCells row={row} />}
      renderFilter={(column) => (
        <WasteWithdrawalFilterControl
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

function WasteWithdrawalFilterControl({
  column,
  filters,
  options,
  onFilterChange,
  today,
}: {
  column: WasteWithdrawalColumn;
  filters: WasteWithdrawalFilters;
  options: WasteWithdrawalFilterOptions;
  onFilterChange: (key: WasteWithdrawalFilterKey, value: string | null) => void;
  today: Date;
}) {
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
function WasteWithdrawalTableCells({ row }: { row: WasteWithdrawalRow }) {
  return (
    <>
      <td className={`${CELL_CLASS} ${FIRST_CELL_COLOR}`}>{formatIsoAsDdMmYy(row.withdrawalDate)}</td>
      <td className={`${CELL_CLASS} ${CELL_COLOR}`}>{row.category}</td>
      <td className={`${CELL_CLASS} ${CELL_COLOR}`}>{row.wasteType}</td>
      <td className={`${CELL_CLASS} ${CELL_COLOR}`}>{formatQuantity(row.quantity)}</td>
      <td className={`${CELL_CLASS} ${CELL_COLOR}`}>{row.unit}</td>
      <td className={`${CELL_CLASS} ${CELL_COLOR}`}>{row.recipient}</td>
      {/*
        Los dos estados de la celda de folio salen de los nodos `3817:55550` y
        `3817:55544`, que NO comparten tipografía: el folio va en 12px #131313 y
        el "No aplica" en 11.5px #646464.
      */}
      <td className={`${CELL_CLASS} ${CELL_COLOR} text-center`}>
        {/*
          TRES estados, no dos. Con folio se muestra el folio; en `pending` va la
          pastilla ámbar del nodo `3817:55964`, porque todavía no hay folio pero
          tampoco es que no aplique; y recién si no es ninguno de los dos aparece
          el "No aplica" de `3817:55544`.
        */}
        {row.sidrepFolio ? (
          row.sidrepFolio
        ) : row.status === 'pending' ? (
          <WasteWithdrawalPill tone="amber">{WASTE_WITHDRAWAL_FOLIO_PENDING_LABEL}</WasteWithdrawalPill>
        ) : (
          <span className="text-[11.5px] text-[#646464]">No aplica</span>
        )}
      </td>
      <td className={`${CELL_CLASS} ${CELL_COLOR} text-center`}>
        <WasteWithdrawalStatusBadge status={row.status} />
      </td>
    </>
  );
}
