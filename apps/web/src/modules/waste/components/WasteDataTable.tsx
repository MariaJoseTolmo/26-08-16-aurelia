import type { ReactNode } from 'react';
import { WarehouseTableSortIcon } from '../icons/WarehouseTableIcons';

/**
 * Armazón de las tablas del módulo de residuos.
 *
 * Las cuatro tablas del módulo dibujan EXACTAMENTE el mismo contenedor, el mismo
 * encabezado oscuro, la misma fila de filtros y la misma celda; lo que cambia son
 * las columnas, el control de cada filtro y el contenido de la fila. Estaba
 * escrito cuatro veces:
 *
 *   `3765:42711`  Detalle de lotes en bodega   7 columnas
 *   `3734:28299`  Ingresos a bodega            9 columnas
 *   `3817:55311`  Solicitud de retiro          8 columnas
 *   `4230:12118`  Histórico de retiros        19 columnas
 *
 * Geometría, verificada contra el design context de los cuatro nodos:
 *
 *   contenedor  border #e3e3e3 · rounded-[8px] · overflow-clip
 *   encabezado  bg #001e39 · border-r #122e47 · flex gap-[3px] items-center
 *               px-[12px] py-[9.5px]
 *               texto Inter Semi Bold 11px · rgba(255,255,255,0.7)
 *               tracking-[0.44px] · uppercase · icono de orden 12.5 × 10
 *   filtros     bg #f0f4f8 · border-b #e3e3e3 · px-[12px] py-[5.5px]
 *   celda       bg white · border-b #e3e3e3 · h-[46px] · px-[12px] py-[14px]
 *               texto Inter Regular 12px
 *
 * DOS DESVÍOS ESTRUCTURALES, heredados de las cuatro tablas y deliberados:
 *
 * 1. En Figma la tabla está armada por COLUMNAS: un frame vertical por columna,
 *    cada uno con su encabezado, su filtro y sus celdas. No existe ningún nodo
 *    que represente una fila. Acá se transpone a `<table>` con `<thead>`/`<tbody>`
 *    porque es lo correcto en HTML semántico y accesible; el árbol de Figma no
 *    sirve de guía para esta parte.
 * 2. Los anchos de columna del nodo se expresan como PORCENTAJES en un
 *    `<colgroup>`: preservan la proporción exacta sin fijar píxeles. El único
 *    píxel que sobrevive es `minWidth`, que es un mínimo —la suma de los anchos
 *    del nodo— y no un ancho: la tabla sigue creciendo con el viewport.
 *
 * El icono de orden es DECORATIVO en los cuatro nodos: se dibuja en todas las
 * columnas pero el diseño no define todavía el orden aplicado ni su estado. Se
 * emite como tal (`aria-hidden` vía el propio SVG) y no como botón, para no
 * prometer una interacción que no existe.
 */

export interface WasteDataTableColumn {
  key: string;
  label: string;
  /** Porcentaje del ancho total, derivado de los anchos del nodo. */
  width: string;
}

/**
 * Celda con separador vertical — "Ingresos a bodega", "Solicitud de retiro" e
 * "Histórico de retiros". El `last:border-r-0` evita la línea doble contra el
 * borde del contenedor.
 */
export const WASTE_TABLE_CELL_CLASS =
  "border-b border-r border-solid border-[#e3e3e3] bg-white px-[12px] py-[14px] align-middle font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[normal] last:border-r-0";

/** Celda sin separador vertical — "Detalle de lotes en bodega" (nodo `3765:42711`). */
export const WASTE_TABLE_CELL_CLASS_FLUSH =
  "border-b border-solid border-[#e3e3e3] bg-white px-[12px] py-[14px] align-middle font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[normal]";

/**
 * La primera columna de "Ingresos a bodega" y "Solicitud de retiro" pinta su
 * texto en #333 y las demás en #131313 (`--gray/900_txt`). Se respeta la
 * diferencia tal como viene del diseño.
 */
export const WASTE_TABLE_FIRST_CELL_COLOR = 'text-[#333333]';
export const WASTE_TABLE_CELL_COLOR = 'text-[#131313]';

interface WasteDataTableProps<C extends WasteDataTableColumn, R> {
  /** Descripción de la tabla para lectores de pantalla; no se dibuja. */
  caption: string;
  columns: readonly C[];
  /** Suma de los anchos del nodo, en píxeles. Es un MÍNIMO, no un ancho fijo. */
  minWidth: number;
  /**
   * Quién resuelve el desplazamiento horizontal cuando las columnas desbordan.
   *
   * `self` — la tabla, dentro de su contenedor. Es lo correcto cuando el
   *   desborde es grande: arrastrar la página entera dejaría el intro y la barra
   *   de filtros fuera de cuadro.
   * `page` — el contenedor de la vista, para que todos los bloques se muevan
   *   juntos. Lo usa "Control de bodega".
   */
  overflow?: 'self' | 'page';
  /** Filas ya filtradas y paginadas: la tabla no filtra, solo dibuja. */
  rows: readonly R[];
  getRowKey: (row: R) => string;
  /** Devuelve los `<td>` de la fila; el armazón aporta el `<tr>` de 46px. */
  renderRow: (row: R) => ReactNode;
  /** Control de filtro de la columna, dentro de su `<th>`. */
  renderFilter: (column: C) => ReactNode;
  /** Copy del estado vacío. Ningún nodo lo dibuja; la guía de UX lo exige. */
  emptyMessage: string;
  /** Pie de la tabla —la paginación—, fuera del área que scrollea. */
  footer?: ReactNode;
}

export function WasteDataTable<C extends WasteDataTableColumn, R>({
  caption,
  columns,
  minWidth,
  overflow = 'self',
  rows,
  getRowKey,
  renderRow,
  renderFilter,
  emptyMessage,
  footer,
}: WasteDataTableProps<C, R>) {
  const table = (
    /*
     * `minWidth` va en estilo y no en una clase `min-w-[…]`: Tailwind no puede
     * generar una clase a partir de un valor de runtime, y cada tabla trae el
     * suyo. Sigue siendo un mínimo, así que la tabla crece con el viewport.
     */
    <table className="w-full border-collapse text-left" style={{ minWidth: `${minWidth}px` }}>
      <caption className="sr-only">{caption}</caption>
      <colgroup>
        {columns.map((column) => (
          <col key={column.key} style={{ width: column.width }} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              className="border-r border-solid border-[#122e47] bg-[#001e39] px-[12px] py-[9.5px] text-left last:border-r-0"
            >
              <span className="flex items-center gap-[3px]">
                <span className="whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold uppercase not-italic leading-[normal] tracking-[0.44px] text-[rgba(255,255,255,0.7)]">
                  {column.label}
                </span>
                <WarehouseTableSortIcon className="block h-[10.001px] w-[12.5px] shrink-0 text-[rgba(255,255,255,0.7)]" />
              </span>
            </th>
          ))}
        </tr>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              className="border-b border-r border-solid border-[#e3e3e3] bg-[#f0f4f8] px-[12px] py-[5.5px] last:border-r-0"
            >
              {renderFilter(column)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={getRowKey(row)} className="h-[46px]">
            {renderRow(row)}
          </tr>
        ))}
        {rows.length === 0 ? (
          <tr className="h-[46px]">
            <td
              colSpan={columns.length}
              className="border-b border-solid border-[#e3e3e3] bg-white px-[12px] py-[14px] text-center font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[normal] text-[#646464]"
            >
              {emptyMessage}
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );

  return (
    <div className="w-full overflow-hidden rounded-[8px] border border-solid border-[#e3e3e3]">
      {overflow === 'self' ? <div className="w-full overflow-x-auto">{table}</div> : table}
      {footer}
    </div>
  );
}
