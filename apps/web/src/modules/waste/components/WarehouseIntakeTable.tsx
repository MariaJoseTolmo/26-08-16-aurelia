import {
  WarehousePageNextIcon,
  WarehousePagePrevIcon,
  WarehouseRowsPerPageCaretIcon,
} from '../icons/WarehouseIntakeIcons';
import { WarehouseTableSortIcon } from '../icons/WarehouseTableIcons';
import {
  formatIsoAsDdMmYyyy,
  formatQuantity,
  type WasteIntakeFilterKey,
  type WasteIntakeFilterOptions,
  type WasteIntakeFilters,
  type WasteIntakeSearchFilterKey,
  type WasteIntakeSelectFilterKey,
} from '../wasteIntakeFilters';
import type { WarehouseIntakeRow } from '../wasteIntakeRows';
import { WasteHazardBadge } from './WasteHazardBadge';
import { WarehouseDateFilterField } from './WarehouseDateFilterField';
import { WarehouseSelectFilterField } from './WarehouseSelectFilterField';
import { WarehouseTextFilterField } from './WarehouseTextFilterField';

/**
 * Tabla de "Ingresos a bodega" — nodo Figma `3734:28299` (columnas en `3817:57411`,
 * pie de paginación en `3734:28523`).
 *
 * Geometría del nodo:
 *
 *   contenedor  border #e3e3e3 · rounded-[8px] · overflow-clip
 *   encabezado  bg #001e39 · border-r #122e47 · flex gap-[3px] items-center
 *               px-[12px] py-[9.5px]
 *               texto Inter Semi Bold 11px · rgba(255,255,255,0.7)
 *               tracking-[0.44px] · uppercase
 *               icono de orden 12.5 × 10
 *   filtros     bg #f0f4f8 · border-b #e3e3e3 · px-[12px] py-[5.5px]
 *               control bg white · border #d1d1d1 · rounded-[8px] · px-[8px]
 *               py-[5px] (py-[4px] solo en la fecha, por el icono de 18px)
 *               texto Inter Regular 13px #131313 · placeholder #acacac
 *   celda       bg white · border-b #e3e3e3 · border-r #e3e3e3 · h-[46px]
 *               px-[12px] py-[14px] · texto Inter Regular 12px
 *   pastillas   rounded-[20px] · gap-[5px] · px-[9px] py-[3px] · texto Bold 10px
 *   pie         bg white · border-t #e3e3e3 · h-[53px] · px-[16px] pt-[11px] pb-[10px]
 *
 * TRES DESVÍOS ESTRUCTURALES, los tres deliberados:
 *
 * 1. En Figma la tabla está armada por COLUMNAS: nueve frames verticales, cada
 *    uno con su encabezado, su filtro y sus seis celdas. No existe ningún nodo
 *    que represente una fila. Acá se transpone a `<table>` con `<thead>`/`<tbody>`
 *    porque es lo correcto en HTML semántico y accesible.
 * 2. Los anchos del nodo (153.5 · 180.5 · 163.5 · 171.5 · 158 · 215.5 · 180.5 ·
 *    215 · 125.5 px, total 1563.5) se expresan como porcentajes en un `<colgroup>`:
 *    preservan la proporción exacta sin fijar píxeles.
 * 3. Las 9 columnas suman 1563.5px contra los 1016px del contenedor, así que en
 *    Figma la tabla se recorta con `overflow-clip` y las últimas columnas no se
 *    ven. Acá el desplazamiento horizontal lo toma la propia tabla —a diferencia
 *    de `WarehouseLotsTable`, donde lo resuelve la vista— porque el desborde es
 *    de ~550px: arrastrar toda la página dejaría el intro y la barra de filtros
 *    fuera de cuadro. El pie de paginación queda fuera del área que scrollea,
 *    igual que en el nodo, donde es hijo del contenedor y no de las columnas.
 *
 * De los nueve filtros, seis están cableados al estado de la vista: la fecha y
 * los cinco selectores de alternativas. "Cantidad ingresada", "Patente del
 * vehículo" y "Conductor" siguen siendo PRESENTACIONALES —búsqueda libre, que se
 * resuelve cuando la vista consuma la API—.
 */

interface WarehouseIntakeColumnBase {
  key: keyof WarehouseIntakeRow | 'hazard';
  label: string;
  /** Porcentaje del ancho total, derivado de los anchos del nodo. */
  width: string;
  /** Las celdas de peligrosidad centran su pastilla; el resto alinea a la izquierda. */
  centered?: boolean;
}

/**
 * Unión discriminada por `filter`, no un objeto con todo opcional: así el tipo
 * garantiza que una columna con selector SIEMPRE trae su `filterKey` y su
 * etiqueta de valor vacío, y el render no necesita castear ni chequear en
 * runtime. Un control sin `filterKey` es, por definición, presentacional.
 */
type WarehouseIntakeColumn = WarehouseIntakeColumnBase &
  (
    | { filter: 'date'; filterKey: 'entryDate' }
    | { filter: 'select'; filterKey: WasteIntakeSelectFilterKey; filterLabel: string }
    | { filter: 'number'; filterKey: 'quantity'; filterLabel: string }
    | { filter: 'text'; filterKey: WasteIntakeSearchFilterKey; filterLabel: string }
  );

const COLUMNS: WarehouseIntakeColumn[] = [
  // La columna de fecha no lleva `filterLabel`: el `dd-mm-aaaa` del nodo es el
  // placeholder que `<input type="date">` ya dibuja solo en locales es-*.
  { key: 'entryDate', label: 'Fecha de ingreso', width: '9.8177%', filter: 'date', filterKey: 'entryDate' },
  { key: 'category', label: 'Categoría operativa', width: '11.5446%', filter: 'select', filterKey: 'category', filterLabel: 'Todas' },
  { key: 'wasteType', label: 'Residuo específico', width: '10.4573%', filter: 'select', filterKey: 'wasteType', filterLabel: 'Todos' },
  { key: 'quantity', label: 'Cantidad ingresada', width: '10.9690%', filter: 'number', filterKey: 'quantity', filterLabel: '#' },
  { key: 'unit', label: 'Unidad de medida', width: '10.1055%', filter: 'select', filterKey: 'unit', filterLabel: 'Todas' },
  { key: 'origin', label: 'Lugar/sector proveniente', width: '13.7832%', filter: 'select', filterKey: 'origin', filterLabel: 'Todos' },
  { key: 'plate', label: 'Patente del vehículo', width: '11.5446%', filter: 'text', filterKey: 'plate', filterLabel: 'Busca por patente' },
  { key: 'driver', label: 'Conductor', width: '13.7512%', filter: 'text', filterKey: 'driver', filterLabel: 'Busca por nombre y apellido' },
  { key: 'hazard', label: 'Peligrosidad', width: '8.0269%', filter: 'select', filterKey: 'hazard', filterLabel: 'Todos', centered: true },
];

const CELL_CLASS =
  "border-b border-r border-solid border-[#e3e3e3] bg-white px-[12px] py-[14px] align-middle font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[normal] last:border-r-0";

/**
 * La primera columna del nodo pinta su texto en #333 y las demás en #131313
 * (`--gray/900_txt`). Se respeta la diferencia tal como viene del diseño.
 */
const FIRST_CELL_COLOR = 'text-[#333333]';
const CELL_COLOR = 'text-[#131313]';

interface WarehouseIntakeTableProps {
  /** Filas ya filtradas: la tabla no filtra, solo dibuja lo que recibe. */
  rows: WarehouseIntakeRow[];
  /**
   * Filtros aplicados. Es el MISMO estado que muestran las pastillas de "Filtros
   * activos": los controles de columna y las pastillas son dos vistas del mismo
   * dato, no dos juegos de filtros.
   */
  filters: WasteIntakeFilters;
  /** Alternativas de cada selector, derivadas del set completo de filas. */
  options: WasteIntakeFilterOptions;
  onFilterChange: (key: WasteIntakeFilterKey, value: string | null) => void;
  /** Página activa del nodo `3734:28530`. */
  page?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function WarehouseIntakeTable({
  rows,
  filters,
  options,
  onFilterChange,
  page = 1,
  totalPages = 1,
  pageSize = 10,
  onPageChange,
}: WarehouseIntakeTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-[8px] border border-solid border-[#e3e3e3]">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[1563.5px] border-collapse text-left">
          <caption className="sr-only">Ingresos de residuos a la bodega de acopio</caption>
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
                  <WarehouseIntakeFilterControl column={column} filters={filters} options={options} onFilterChange={onFilterChange} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <WarehouseIntakeTableRow key={row.id} row={row} />
            ))}
            {rows.length === 0 ? (
              <tr className="h-[46px]">
                <td
                  colSpan={COLUMNS.length}
                  className="border-b border-solid border-[#e3e3e3] bg-white px-[12px] py-[14px] text-center font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[normal] text-[#646464]"
                >
                  No hay ingresos para los filtros aplicados
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <WarehouseIntakePagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalRows={rows.length}
        onPageChange={onPageChange}
      />
    </div>
  );
}

function WarehouseIntakeFilterControl({
  column,
  filters,
  options,
  onFilterChange,
}: {
  column: WarehouseIntakeColumn;
  filters: WasteIntakeFilters;
  options: WasteIntakeFilterOptions;
  onFilterChange: (key: WasteIntakeFilterKey, value: string | null) => void;
}) {
  if (column.filter === 'date') {
    // `py-[4px]` sale del nodo `3817:57422`, que compensa el icono de 18px.
    return (
      <WarehouseDateFilterField
        className="w-full"
        label={column.label}
        value={filters.entryDate}
        onChange={(value) => onFilterChange('entryDate', value)}
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

  /*
   * Numérico y búsquedas comparten control. En el nodo `3817:57617` (Conductor)
   * el control es del tamaño de su contenido, pero ese contenido mide exactamente
   * el ancho disponible (175px + 16px de padding = 191px): al ancho de diseño el
   * resultado es el mismo, y en columnas más angostas el texto se recorta en vez
   * de desbordar.
   */
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

function WarehouseIntakeTableRow({ row }: { row: WarehouseIntakeRow }) {
  return (
    <tr className="h-[46px]">
      <td className={`${CELL_CLASS} ${FIRST_CELL_COLOR}`}>{formatIsoAsDdMmYyyy(row.entryDate)}</td>
      <td className={`${CELL_CLASS} ${CELL_COLOR}`}>{row.category}</td>
      <td className={`${CELL_CLASS} ${CELL_COLOR}`}>{row.wasteType}</td>
      <td className={`${CELL_CLASS} ${CELL_COLOR}`}>{formatQuantity(row.quantity)}</td>
      <td className={`${CELL_CLASS} ${CELL_COLOR}`}>{row.unit}</td>
      <td className={`${CELL_CLASS} ${CELL_COLOR}`}>{row.origin}</td>
      <td className={`${CELL_CLASS} ${CELL_COLOR}`}>{row.plate}</td>
      <td className={`${CELL_CLASS} ${CELL_COLOR}`}>{row.driver}</td>
      <td className={`${CELL_CLASS} ${CELL_COLOR} text-center`}>
        <WasteHazardBadge isHazardous={row.isHazardous} />
      </td>
    </tr>
  );
}

/**
 * Pie de paginación — nodo `3734:28523`.
 *
 * Los botones de navegación del nodo vienen con `opacity-35` porque en el diseño
 * hay una sola página. Acá esa opacidad se ata al estado `disabled`, que es lo
 * que la produce.
 */
function WarehouseIntakePagination({
  page,
  totalPages,
  pageSize,
  totalRows,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  totalRows: number;
  onPageChange?: (page: number) => void;
}) {
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = totalRows === 0 ? 0 : firstRow + totalRows - 1;
  const navButtonClass =
    'flex size-[32px] min-w-[32px] shrink-0 items-center justify-center rounded-[6px] border border-solid border-[#e3e3e3] bg-white px-[9px] py-px transition-opacity disabled:opacity-35';

  return (
    <div className="flex h-[53px] w-full items-center justify-between border-t border-solid border-[#e3e3e3] bg-white px-[16px] pb-[10px] pt-[11px]">
      <p className="whitespace-nowrap font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[normal] text-[#646464]">
        {/* Guion largo (–) como en el nodo `3734:28525`, no guion corto. */}
        Mostrando {firstRow}–{lastRow} de {totalRows} datos
      </p>
      <div className="flex items-center gap-[4px]">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onPageChange?.(page - 1)}
          className={navButtonClass}
        >
          <WarehousePagePrevIcon className="block h-[10px] w-[12.5px] shrink-0 text-[#646464]" />
        </button>
        <button
          type="button"
          aria-current="page"
          className="flex size-[32px] min-w-[32px] shrink-0 items-center justify-center rounded-[6px] border border-solid border-[#c8a064] bg-[#c8a064] px-[9px] py-px text-center font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold not-italic leading-[normal] text-[#001e39]"
        >
          {page}
        </button>
        <button
          type="button"
          aria-label="Página siguiente"
          disabled={page >= totalPages}
          onClick={() => onPageChange?.(page + 1)}
          className={navButtonClass}
        >
          <WarehousePageNextIcon className="block h-[10px] w-[12.5px] shrink-0 text-[#646464]" />
        </button>
      </div>
      <div className="flex items-center gap-[8px]">
        <p className="whitespace-nowrap font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[normal] text-[#646464]">
          Filas por página
        </p>
        {/*
          Selector presentacional, como el resto de los controles de esta
          iteración. El caret va posicionado —left-[31.75px] top-[11.5px] en el
          nodo `3734:28540`— porque vive fuera de la caja del dropdown, que
          reserva su lugar con pr-[25px].
        */}
        <div className="relative shrink-0">
          <div className="flex h-[32px] w-[51px] items-center rounded-[6px] border border-solid border-[#d1d1d1] bg-white py-px pl-[11px] pr-[25px]">
            <span className="whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold not-italic leading-[normal] text-[#646464]">
              {pageSize}
            </span>
          </div>
          <WarehouseRowsPerPageCaretIcon className="absolute left-[31.75px] top-[11.5px] block h-[9px] w-[11.25px] text-[#131313]" />
        </div>
      </div>
    </div>
  );
}
