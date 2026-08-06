import {
  WarehouseHazardousIcon,
  WarehouseNonHazardousIcon,
  WarehouseTableCaretIcon,
  WarehouseTableSortIcon,
} from '../icons/WarehouseTableIcons';
import {
  LOT_STORAGE_STATUS_LABELS,
  LOT_STORAGE_STATUS_STYLES,
  type LotStorageStatus,
} from '../wasteWarehouseThresholds';

/**
 * Tabla "Detalle de lotes en bodega" — nodo Figma `3765:42711`.
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
 *               control bg white · border #d1d1d1 · rounded-[8px] · px-[8px] py-[5px]
 *               texto Inter Regular 13px #131313 · placeholder #acacac
 *   celda       bg white · border-b #e3e3e3 · h-[46px] · px-[12px] py-[14px]
 *               texto Inter Regular 12px #131313
 *   pastillas   rounded-[20px] · gap-[5px] · px-[9px] py-[3px] · texto Bold 10px
 *
 * DOS DESVÍOS ESTRUCTURALES, ambos deliberados:
 *
 * 1. En Figma la tabla está armada por COLUMNAS: siete frames verticales, cada
 *    uno con su encabezado, su filtro y sus quince celdas. No existe ningún nodo
 *    que represente una fila. Acá se transpone a `<table>` con `<thead>`/`<tbody>`
 *    porque es lo correcto en HTML semántico y accesible; el árbol de Figma no
 *    sirve de guía para esta parte.
 * 2. Los anchos de columna del nodo (125.5 · 180.5 · 180.5 · 172.5 · 152.5 ·
 *    155.5 · 117.46 px, total 1084.46) se expresan como porcentajes en un
 *    `<colgroup>`: preservan la proporción exacta del diseño sin fijar píxeles.
 *    El nodo desborda su contenedor de 1060px y Figma lo recorta con
 *    `overflow-clip`. Acá la tabla NO scrollea por su cuenta: declara su ancho
 *    mínimo de 1084px y el desplazamiento lo resuelve el contenedor de la vista
 *    (`WarehouseControlPage`), para que todos los bloques se muevan juntos.
 */

interface WarehouseLotColumn {
  key: string;
  label: string;
  /** Porcentaje del ancho total, derivado de los anchos del nodo. */
  width: string;
  /** Tipo de control en la fila de filtros. */
  filter: 'select' | 'number';
  /** Etiqueta del selector: "Todos" en todas las columnas menos unidad ("Todas"). */
  selectLabel?: string;
}

const COLUMNS: WarehouseLotColumn[] = [
  { key: 'hazardous', label: 'Peligrosidad', width: '11.573%', filter: 'select', selectLabel: 'Todos' },
  { key: 'category', label: 'Categoría operativa', width: '16.644%', filter: 'select', selectLabel: 'Todos' },
  { key: 'wasteType', label: 'Residuo específico', width: '16.644%', filter: 'select', selectLabel: 'Todos' },
  { key: 'quantity', label: 'Cantidad en bodega', width: '15.906%', filter: 'number' },
  { key: 'unit', label: 'Unidad de medida', width: '14.062%', filter: 'select', selectLabel: 'Todas' },
  { key: 'elapsed', label: 'Tiempo en bodega', width: '14.339%', filter: 'number' },
  { key: 'status', label: 'Estado', width: '10.831%', filter: 'select', selectLabel: 'Todos' },
];

export interface WarehouseLotRow {
  id: string;
  isHazardous: boolean;
  category: string;
  wasteType: string;
  quantity: string;
  unit: string;
  /** Antigüedad ya formateada, p. ej. "6,1 meses". */
  elapsedLabel: string;
  status: LotStorageStatus;
}

/** Las quince filas del nodo: 8 peligrosas y 7 no peligrosas. */
export const WAREHOUSE_LOT_ROW_DEFAULTS: WarehouseLotRow[] = [
  { id: '1', isHazardous: true, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '6,1 meses', status: 'overdue' },
  { id: '2', isHazardous: true, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '5,2 meses', status: 'near_limit' },
  { id: '3', isHazardous: true, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '5,0 meses', status: 'near_limit' },
  { id: '4', isHazardous: true, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,6 meses', status: 'normal' },
  { id: '5', isHazardous: true, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,4 meses', status: 'normal' },
  { id: '6', isHazardous: true, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
  { id: '7', isHazardous: true, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
  { id: '8', isHazardous: true, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
  { id: '9', isHazardous: false, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
  { id: '10', isHazardous: false, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
  { id: '11', isHazardous: false, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
  { id: '12', isHazardous: false, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
  { id: '13', isHazardous: false, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
  { id: '14', isHazardous: false, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
  { id: '15', isHazardous: false, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
];

const CELL_CLASS =
  "border-b border-solid border-[#e3e3e3] bg-white px-[12px] py-[14px] align-middle font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[normal] text-[#131313]";

interface WarehouseLotsTableProps {
  rows?: WarehouseLotRow[];
}

export function WarehouseLotsTable({ rows = WAREHOUSE_LOT_ROW_DEFAULTS }: WarehouseLotsTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-[8px] border border-solid border-[#e3e3e3]">
      <table className="w-full min-w-[1084px] border-collapse text-left">
        <caption className="sr-only">Detalle de lotes de residuos en bodega</caption>
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
                className="border-b border-r border-solid border-b-[#e3e3e3] border-r-[#e3e3e3] bg-[#f0f4f8] px-[12px] py-[5.5px] last:border-r-0"
              >
                <WarehouseLotsFilterControl column={column} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <WarehouseLotsTableRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Controles de la fila de filtros. Son presentacionales en esta iteración: el
 * cableado a los parámetros de `GET /waste/lots` llega cuando la vista consuma
 * la API.
 */
function WarehouseLotsFilterControl({ column }: { column: WarehouseLotColumn }) {
  if (column.filter === 'number') {
    return (
      <span className="flex w-full items-center overflow-hidden rounded-[8px] border border-solid border-[#d1d1d1] bg-white px-[8px] py-[5px]">
        <span className="whitespace-nowrap font-['Inter:Regular',sans-serif] text-[13px] font-normal leading-[normal] text-[#acacac]">
          #
        </span>
      </span>
    );
  }

  return (
    <span className="flex w-full items-center justify-center gap-[8px] overflow-hidden rounded-[8px] border border-solid border-[#d1d1d1] bg-white px-[8px] py-[5px]">
      <span className="min-w-0 flex-1 font-['Inter:Regular',sans-serif] text-[13px] font-normal leading-[normal] text-[#131313]">
        {column.selectLabel}
      </span>
      {/*
        El asset viene apuntando hacia arriba; Figma lo voltea con
        `-rotate-180 -scale-x-100`, cuyo efecto neto es un espejo vertical. Se
        reproduce con `-scale-y-100` para obtener el caret hacia abajo.
      */}
      <span className="flex size-[16px] shrink-0 items-center justify-center">
        <WarehouseTableCaretIcon className="block h-[6px] w-[10px] -scale-y-100 text-[#131313]" />
      </span>
    </span>
  );
}

function WarehouseLotsTableRow({ row }: { row: WarehouseLotRow }) {
  const statusStyle = LOT_STORAGE_STATUS_STYLES[row.status];

  return (
    <tr className="h-[46px]">
      <td className={`${CELL_CLASS} text-center`}>
        <WarehouseHazardStatusBadge isHazardous={row.isHazardous} />
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
    </tr>
  );
}

/** Pastilla de peligrosidad: `#ffd0db`/`#570b1d` o `#e6f3ff`/`#0d3862`. */
function WarehouseHazardStatusBadge({ isHazardous }: { isHazardous: boolean }) {
  const background = isHazardous ? '#ffd0db' : '#e6f3ff';
  const color = isHazardous ? '#570b1d' : '#0d3862';
  const Icon = isHazardous ? WarehouseHazardousIcon : WarehouseNonHazardousIcon;

  return (
    <span
      className="inline-flex items-center gap-[5px] rounded-[20px] px-[9px] py-[3px]"
      style={{ backgroundColor: background, color }}
    >
      <Icon className="block h-[10px] w-[12.5px] shrink-0" />
      <span className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[10px] font-bold not-italic leading-[normal]">
        {isHazardous ? 'Peligroso' : 'No peligroso'}
      </span>
    </span>
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
