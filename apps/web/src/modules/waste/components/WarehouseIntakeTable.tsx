import { formatQuantity } from '../wasteFilterPrimitives';
import {
  formatIsoAsDdMmYyyy,
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
import {
  WasteDataTable,
  WASTE_TABLE_CELL_CLASS,
  WASTE_TABLE_CELL_COLOR,
  WASTE_TABLE_FIRST_CELL_COLOR,
} from './WasteDataTable';
import { WasteTablePagination } from './WasteTablePagination';

/**
 * Tabla de "Ingresos a bodega" — nodo Figma `3734:28299` (columnas en `3817:57411`,
 * pie de paginación en `3734:28523`).
 *
 * El frame `3817:56515` es un SEGUNDO dibujo de estas mismas columnas, en otra
 * parte del canvas. Se verificó columna por columna contra el design context —los
 * nueve anchos, los nueve encabezados, los cuatro tipos de control, la pastilla de
 * peligrosidad y los siete assets, estos últimos por checksum— y no aporta ningún
 * cambio: describe exactamente lo que ya está acá. Queda anotado para que no se
 * vuelva a diffear.
 *
 * Su única discrepancia es que la celda de datos de la columna de fecha
 * (`3817:56589`) trae `py-[13.5px]` donde el resto usa `py-[14px]`. No se
 * reproduce: con `h-[46px]` y contenido centrado en vertical, el padding no
 * desplaza nada.
 *
 * El armazón —contenedor, encabezado oscuro, fila de filtros, celda y estado
 * vacío— es `WasteDataTable`, compartido con las otras tres tablas del módulo;
 * ahí está anotada la geometría y por qué se transpone a filas. Acá queda lo
 * propio de esta tabla: sus nueve columnas, su control de filtro y su fila.
 *
 *   anchos     153.5 · 180.5 · 163.5 · 171.5 · 158 · 215.5 · 180.5 · 215 · 125.5 px,
 *              total 1563.5
 *   filtros    control bg white · border #d1d1d1 · rounded-[8px] · px-[8px]
 *              py-[5px] (py-[4px] solo en la fecha, por el icono de 18px)
 *              texto Inter Regular 13px #131313 · placeholder #acacac
 *   pastillas  rounded-[20px] · gap-[5px] · px-[9px] py-[3px] · texto Bold 10px
 *
 * Las 9 columnas suman 1563.5px contra los 1016px del contenedor, así que en
 * Figma la tabla se recorta con `overflow-clip` y las últimas columnas no se ven.
 * Acá el desplazamiento horizontal lo toma la propia tabla (`overflow="self"`)
 * —a diferencia de `WarehouseLotsTable`, donde lo resuelve la vista— porque el
 * desborde es de ~550px: arrastrar toda la página dejaría el intro y la barra de
 * filtros fuera de cuadro. El pie de paginación queda fuera del área que
 * scrollea, igual que en el nodo, donde es hijo del contenedor y no de las
 * columnas.
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

/**
 * La primera columna del nodo pinta su texto en #333 y las demás en #131313
 * (`--gray/900_txt`). Se respeta la diferencia tal como viene del diseño.
 */
const CELL_CLASS = WASTE_TABLE_CELL_CLASS;
const FIRST_CELL_COLOR = WASTE_TABLE_FIRST_CELL_COLOR;
const CELL_COLOR = WASTE_TABLE_CELL_COLOR;

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
    <WasteDataTable
      caption="Ingresos de residuos a la bodega de acopio"
      columns={COLUMNS}
      minWidth={1563.5}
      rows={rows}
      getRowKey={(row) => row.id}
      renderRow={(row) => <WarehouseIntakeTableCells row={row} />}
      renderFilter={(column) => (
        <WarehouseIntakeFilterControl
          column={column}
          filters={filters}
          options={options}
          onFilterChange={onFilterChange}
        />
      )}
      emptyMessage="No hay ingresos para los filtros aplicados"
      footer={
        <WasteTablePagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalRows={rows.length}
          onPageChange={onPageChange}
        />
      }
    />
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

/** Celdas de la fila; el `<tr>` de 46px lo aporta `WasteDataTable`. */
function WarehouseIntakeTableCells({ row }: { row: WarehouseIntakeRow }) {
  return (
    <>
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
    </>
  );
}
