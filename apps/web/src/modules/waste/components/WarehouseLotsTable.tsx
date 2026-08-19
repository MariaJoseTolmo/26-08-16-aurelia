import type {
  WasteWarehouseFilterKey,
  WasteWarehouseFilterOptions,
  WasteWarehouseFilters,
  WasteWarehouseNumberFilterKey,
  WasteWarehouseSelectFilterKey,
} from '../wasteWarehouseFilters';
import { WAREHOUSE_LOT_ROW_DEFAULTS, type WarehouseLotRow } from '../wasteWarehouseLotRows';
import {
  LOT_STORAGE_STATUS_LABELS,
  LOT_STORAGE_STATUS_STYLES,
  type LotStorageStatus,
} from '../wasteWarehouseThresholds';
import { WarehouseSelectFilterField } from './WarehouseSelectFilterField';
import { WasteDataTable, WASTE_TABLE_CELL_CLASS_FLUSH, WASTE_TABLE_CELL_COLOR } from './WasteDataTable';
import { WasteHazardBadge } from './WasteHazardBadge';

/**
 * Tabla "Detalle de lotes en bodega" — nodo Figma `3765:42711`.
 *
 * El armazón —contenedor, encabezado oscuro, fila de filtros, celda y estado
 * vacío— es `WasteDataTable`, compartido con las otras tres tablas del módulo;
 * ahí está anotada la geometría y por qué se transpone a filas. Acá queda lo
 * propio de esta tabla: sus siete columnas, su control de filtro y su fila.
 *
 *   anchos     125.5 · 180.5 · 180.5 · 172.5 · 152.5 · 155.5 · 117.46 px,
 *              total 1084.46
 *   filtros    control bg white · border #d1d1d1 · rounded-[8px] · px-[8px] py-[5px]
 *              texto Inter Regular 13px #131313 · placeholder #acacac
 *   pastillas  rounded-[20px] · gap-[5px] · px-[9px] py-[3px] · texto Bold 10px
 *
 * Es la ÚNICA de las cuatro cuyas celdas no llevan separador vertical (de ahí
 * `WASTE_TABLE_CELL_CLASS_FLUSH`) y la única sin pie de paginación: el nodo no
 * los dibuja.
 *
 * El nodo desborda su contenedor de 1060px y Figma lo recorta con
 * `overflow-clip`. Acá la tabla NO scrollea por su cuenta (`overflow="page"`):
 * declara su ancho mínimo de 1084px y el desplazamiento lo resuelve el
 * contenedor de la vista (`WarehouseControlPage`), para que todos los bloques se
 * muevan juntos.
 */

/**
 * Unión discriminada por `filter`, no un objeto con todo opcional: así el tipo
 * garantiza que una columna con selector SIEMPRE trae su `filterKey`, y no hay
 * que comprobarlo en runtime. Un control sin `filterKey` es, por definición,
 * presentacional. Mismo criterio que la tabla de "Ingresos a bodega".
 */
type WarehouseLotColumn = {
  key: string;
  label: string;
  /** Porcentaje del ancho total, derivado de los anchos del nodo. */
  width: string;
} & (
  | { filter: 'select'; filterKey: WasteWarehouseSelectFilterKey; filterLabel: string }
  | { filter: 'number'; filterKey: WasteWarehouseNumberFilterKey; filterLabel: string; filterName: string; step: string }
);

const COLUMNS: WarehouseLotColumn[] = [
  { key: 'hazardous', label: 'Peligrosidad', width: '11.573%', filter: 'select', filterKey: 'hazard', filterLabel: 'Todos' },
  { key: 'category', label: 'Categoría operativa', width: '16.644%', filter: 'select', filterKey: 'category', filterLabel: 'Todos' },
  { key: 'wasteType', label: 'Residuo específico', width: '16.644%', filter: 'select', filterKey: 'wasteType', filterLabel: 'Todos' },
  // `filterName` es el nombre accesible: el diseño solo trae "#", que no dice
  // que el filtro sea por mínimo. `step` acompaña a la magnitud — las cantidades
  // son enteras, los meses van con un decimal.
  { key: 'quantity', label: 'Cantidad en bodega', width: '15.906%', filter: 'number', filterKey: 'quantityMin', filterLabel: '#', filterName: 'Cantidad mínima en bodega', step: '1' },
  { key: 'unit', label: 'Unidad de medida', width: '14.062%', filter: 'select', filterKey: 'unit', filterLabel: 'Todas' },
  { key: 'elapsed', label: 'Tiempo en bodega', width: '14.339%', filter: 'number', filterKey: 'elapsedMin', filterLabel: '#', filterName: 'Tiempo mínimo en bodega, en meses', step: '0.1' },
  { key: 'status', label: 'Estado', width: '10.831%', filter: 'select', filterKey: 'status', filterLabel: 'Todos' },
];

const CELL_CLASS = `${WASTE_TABLE_CELL_CLASS_FLUSH} ${WASTE_TABLE_CELL_COLOR}`;

interface WarehouseLotsTableProps {
  rows?: WarehouseLotRow[];
  /** Filtros aplicados. La tabla es controlada: el estado vive en la página. */
  filters: WasteWarehouseFilters;
  options: WasteWarehouseFilterOptions;
  onFilterChange: (key: WasteWarehouseFilterKey, value: string | null) => void;
}

export function WarehouseLotsTable({
  rows = WAREHOUSE_LOT_ROW_DEFAULTS,
  filters,
  options,
  onFilterChange,
}: WarehouseLotsTableProps) {
  return (
    <WasteDataTable
      caption="Detalle de lotes de residuos en bodega"
      columns={COLUMNS}
      minWidth={1084}
      overflow="page"
      rows={rows}
      getRowKey={(row) => row.id}
      renderRow={(row) => <WarehouseLotsTableCells row={row} />}
      renderFilter={(column) => (
        <WarehouseLotsFilterControl
          column={column}
          filters={filters}
          options={options}
          onFilterChange={onFilterChange}
        />
      )}
      emptyMessage="No hay lotes para los filtros aplicados"
    />
  );
}

/**
 * Controles de la fila de filtros.
 *
 * Las cinco columnas con alternativas usan `WarehouseSelectFilterField`, el mismo
 * desplegable de la tabla de "Ingresos a bodega": la geometría del nodo es
 * idéntica (border #d1d1d1 · rounded-[8px] · px-[8px] py-[5px] · caret en caja de
 * 16 × 16), así que duplicarlo solo agregaría un segundo lugar donde arreglar los
 * mismos bugs de foco y teclado.
 *
 * Los dos `#` son `<input type="number">` reales y filtran por mínimo.
 */
function WarehouseLotsFilterControl({
  column,
  filters,
  options,
  onFilterChange,
}: {
  column: WarehouseLotColumn;
  filters: WasteWarehouseFilters;
  options: WasteWarehouseFilterOptions;
  onFilterChange: (key: WasteWarehouseFilterKey, value: string | null) => void;
}) {
  if (column.filter === 'number') {
    return (
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step={column.step}
        aria-label={column.filterName}
        title={column.filterName}
        placeholder={column.filterLabel}
        value={filters[column.filterKey] ?? ''}
        onChange={(event) => onFilterChange(column.filterKey, event.target.value === '' ? null : event.target.value)}
        /*
          `h-[26px]` y no `py-[5px]`: es el mismo alto que resuelve el selector
          (16 del caret + 5 + 5) y así los siete controles de la fila quedan
          alineados. `text-center` reproduce el "#" centrado del nodo.
        */
        className="h-[26px] w-full rounded-[8px] border border-solid border-[#d1d1d1] bg-white px-[8px] text-center font-['Inter:Regular',sans-serif] text-[13px] font-normal leading-[normal] text-[#131313] outline-none placeholder:text-[#acacac] focus:border-[#00b398]"
      />
    );
  }

  return (
    <WarehouseSelectFilterField
      label={column.label}
      value={filters[column.filterKey]}
      options={options[column.filterKey]}
      emptyOptionLabel={column.filterLabel}
      onChange={(value) => onFilterChange(column.filterKey, value)}
    />
  );
}

/** Celdas de la fila; el `<tr>` de 46px lo aporta `WasteDataTable`. */
function WarehouseLotsTableCells({ row }: { row: WarehouseLotRow }) {
  const statusStyle = LOT_STORAGE_STATUS_STYLES[row.status];

  return (
    <>
      <td className={`${CELL_CLASS} text-center`}>
        <WasteHazardBadge isHazardous={row.isHazardous} />
      </td>
      <td className={CELL_CLASS}>{row.category}</td>
      <td className={CELL_CLASS}>{row.wasteType}</td>
      <td className={CELL_CLASS}>{row.quantity}</td>
      <td className={CELL_CLASS}>{row.unit}</td>
      <td className={CELL_CLASS}>
        <span className={`whitespace-nowrap not-italic leading-[normal] ${statusStyle.elapsedClassName}`}>
          {row.elapsedLabel}
        </span>
      </td>
      <td className={`${CELL_CLASS} text-center`}>
        <WarehouseLotStatusBadge status={row.status} />
      </td>
    </>
  );
}

/** "Normal" va como texto plano: el diseño no le pone pastilla. */
function WarehouseLotStatusBadge({ status }: { status: LotStorageStatus }) {
  const style = LOT_STORAGE_STATUS_STYLES[status];
  const label = LOT_STORAGE_STATUS_LABELS[status];

  if (style.badgeBackground === null) {
    return (
      <span
        className="whitespace-nowrap font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[normal]"
        style={{ color: style.badgeText }}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center rounded-[20px] px-[9px] py-[3px] font-['Inter:Bold',sans-serif] text-[10px] font-bold not-italic leading-[normal] whitespace-nowrap"
      style={{ backgroundColor: style.badgeBackground, color: style.badgeText }}
    >
      {label}
    </span>
  );
}
