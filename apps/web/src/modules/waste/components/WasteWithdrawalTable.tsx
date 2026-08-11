import { WarehouseTableSortIcon } from '../icons/WarehouseTableIcons';
import { formatQuantity } from '../wasteFilterPrimitives';
import {
  formatIsoAsDdMmYy,
  type WasteWithdrawalFilterKey,
  type WasteWithdrawalFilterOptions,
  type WasteWithdrawalFilters,
  type WasteWithdrawalSelectFilterKey,
} from '../wasteWithdrawalFilters';
import type { WasteWithdrawalRow } from '../wasteWithdrawalRows';
import { WarehouseMonthFilterField } from './WarehouseMonthFilterField';
import { WarehouseSelectFilterField } from './WarehouseSelectFilterField';
import { WarehouseTextFilterField } from './WarehouseTextFilterField';
import { WasteTablePagination } from './WasteTablePagination';
import { WasteWithdrawalStatusBadge } from './WasteWithdrawalStatusBadge';

/**
 * Tabla de "Solicitud de retiro" — nodo Figma `3817:55311` (columnas en
 * `3817:55312`, pie de paginación en `3817:55609`).
 *
 * Geometría del nodo, la misma que "Ingresos a bodega" salvo donde se indica:
 *
 *   contenedor  border #e3e3e3 · rounded-[8px] · overflow-clip
 *   encabezado  bg #001e39 · border-r #122e47 · flex gap-[3px] items-center
 *               px-[12px] py-[9.5px]
 *               texto Inter Semi Bold 11px · rgba(255,255,255,0.7)
 *               tracking-[0.44px] · uppercase · icono de orden 12.5 × 10
 *   filtros     bg #f0f4f8 · border-b #e3e3e3 · px-[12px] py-[5.5px]
 *               control bg white · border #d1d1d1 · rounded-[8px] · px-[8px] py-[5px]
 *               texto Inter Regular 13px #131313 · placeholder #acacac
 *   celda       bg white · border-b #e3e3e3 · border-r #e3e3e3 · h-[46px]
 *               px-[12px] · texto Inter Regular 12px
 *   pie         `WasteTablePagination`, compartido con "Ingresos a bodega"
 *
 * DESVÍOS ESTRUCTURALES, todos deliberados:
 *
 * 1. En Figma la tabla está armada por COLUMNAS: ocho frames verticales, cada uno
 *    con su encabezado, su filtro y sus diez celdas. No existe ningún nodo que
 *    represente una fila. Acá se transpone a `<table>` con `<thead>`/`<tbody>`
 *    porque es lo correcto en HTML semántico y accesible.
 * 2. Los anchos del nodo (121.5 · 180.5 · 180.5 · 162.5 · 158 · 161 · 174 · 102 px,
 *    total 1240) se expresan como porcentajes en un `<colgroup>`: preservan la
 *    proporción exacta sin fijar píxeles.
 * 3. Las 8 columnas suman 1240px contra los 1016px del contenedor, así que en
 *    Figma la tabla se recorta con `overflow-clip`. Acá el desplazamiento
 *    horizontal lo toma la propia tabla, igual que en "Ingresos a bodega": el
 *    desborde es de ~224px y arrastrar toda la página dejaría la intro y la barra
 *    de acciones fuera de cuadro. El pie queda fuera del área que scrollea, como
 *    en el nodo, donde es hermano de las columnas y no hijo.
 * 4. El placeholder del filtro de folio viene con DOS espacios en el nodo
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

const CELL_CLASS =
  "border-b border-r border-solid border-[#e3e3e3] bg-white px-[12px] py-[14px] align-middle font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[normal] last:border-r-0";

/**
 * La primera columna del nodo pinta su texto en #333 (`3817:55330`) y las demás
 * en #131313 (`--gray/900_txt`). Se respeta la diferencia tal como viene del
 * diseño, igual que en "Ingresos a bodega".
 */
const FIRST_CELL_COLOR = 'text-[#333333]';
const CELL_COLOR = 'text-[#131313]';

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
  onPageChange,
}: WasteWithdrawalTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-[8px] border border-solid border-[#e3e3e3]">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[1240px] border-collapse text-left">
          <caption className="sr-only">Histórico de retiros de residuos</caption>
          <colgroup>
            {COLUMNS.map((column) => (
              <col key={column.key} style={{ width: column.width }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="border-r border-solid border-[#122e47] bg-[#001e39] px-[12px] py-[9.5px] text-left last:border-r-0"
                >
                  <span className="flex items-center gap-[3px]">
                    <span className="whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold not-italic uppercase leading-[normal] tracking-[0.44px] text-[rgba(255,255,255,0.7)]">
                      {column.label}
                    </span>
                    <WarehouseTableSortIcon className="block h-[10.001px] w-[12.5px] shrink-0 text-[rgba(255,255,255,0.7)]" />
                  </span>
                </th>
              ))}
            </tr>
            <tr>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="border-b border-r border-solid border-[#e3e3e3] bg-[#f0f4f8] px-[12px] py-[5.5px] last:border-r-0"
                >
                  <WasteWithdrawalFilterControl
                    column={column}
                    filters={filters}
                    options={options}
                    onFilterChange={onFilterChange}
                    today={today}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <WasteWithdrawalTableRow key={row.id} row={row} />
            ))}
            {rows.length === 0 ? (
              <tr className="h-[46px]">
                <td
                  colSpan={COLUMNS.length}
                  className="border-b border-solid border-[#e3e3e3] bg-white px-[12px] py-[14px] text-center font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[normal] text-[#646464]"
                >
                  No hay retiros para los filtros aplicados
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <WasteTablePagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalRows={rows.length}
        onPageChange={onPageChange}
      />
    </div>
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

function WasteWithdrawalTableRow({ row }: { row: WasteWithdrawalRow }) {
  return (
    <tr className="h-[46px]">
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
        {row.sidrepFolio ? (
          row.sidrepFolio
        ) : (
          <span className="text-[11.5px] text-[#646464]">No aplica</span>
        )}
      </td>
      <td className={`${CELL_CLASS} ${CELL_COLOR} text-center`}>
        <WasteWithdrawalStatusBadge status={row.status} />
      </td>
    </tr>
  );
}
