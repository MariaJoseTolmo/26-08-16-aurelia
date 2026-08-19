import type { ReactNode } from 'react';

/**
 * Tabla de CONSOLIDADO del módulo de residuos — nodo `3830:65642` ("Reporte
 * SINADER").
 *
 * No es `WasteDataTable` con otro tema: son dos tablas distintas del sistema de
 * diseño y se diferencian en las tres cosas que definen para qué sirve cada una.
 *
 *                        `WasteDataTable`            `WasteSummaryTable`
 *   encabezado           #001e39, texto blanco       #f7f7f7, texto #646464
 *   fila de filtros      sí, #f0f4f8                 no
 *   icono de orden       sí, en cada columna         no
 *   fila de totales      no                          sí, #f7f7f7 e Inter Bold
 *   alto de celda        46px                        derivado (71px en el nodo)
 *
 * La de arriba es una tabla de TRABAJO —se filtra, se ordena, se pagina—; ésta es
 * un consolidado que se lee y se declara. Meter las dos en un componente con
 * banderas dejaría un armazón donde la mitad de las props apagan a la otra mitad.
 *
 * Geometría, del design context del nodo:
 *
 *   contenedor  border #e3e3e3 · rounded-[8px] · overflow-clip
 *   encabezado  bg #f7f7f7 · border-b #e3e3e3 · px-[12px] py-[9.5px]
 *               Inter Semi Bold 11px · #646464 · tracking-[0.44px] · uppercase
 *   celda       bg white · border-b #e3e3e3 · px-[12px] py-[14px] · contenido centrado
 *               Inter Regular 12px · #131313
 *   totales     bg #f7f7f7 · border-b #e3e3e3 · px-[12px] py-[9.5px]
 *               Inter Bold 12px · negro
 *
 * DOS DESVÍOS ESTRUCTURALES, los mismos que ya asume `WasteDataTable`:
 *
 * 1. En Figma la tabla está armada por COLUMNAS —un frame vertical por columna,
 *    con su encabezado, sus celdas y su celda de total—. No existe ningún nodo que
 *    represente una fila. Acá se transpone a `<table>` con `<thead>`/`<tbody>`/
 *    `<tfoot>` porque es lo correcto en HTML semántico y accesible; el árbol de
 *    Figma no sirve de guía para esta parte.
 * 2. Los anchos del nodo (437, 86, 157, 242 y 122 px sobre 1044) se expresan como
 *    PORCENTAJES en un `<colgroup>`: preservan la proporción exacta sin fijar
 *    píxeles. El único píxel que sobrevive es `minWidth`, que es un mínimo y no un
 *    ancho: la tabla sigue creciendo con el viewport.
 *
 * El alto de 71px de las celdas del nodo TAMPOCO se fija. Es alto derivado: la
 * primera columna apila la pastilla de categoría (18px), un `gap-[10px]` y el
 * nombre del residuo (15px), y con los `py-[14px]` suma exactamente 71. Fijarlo
 * recortaría la fila el día que un nombre de residuo ocupe dos líneas. El resto de
 * las columnas centra su texto con `align-middle`, que es lo que hace el
 * `justify-center` de los frames del nodo.
 */

export interface WasteSummaryTableColumn {
  key: string;
  label: string;
  /** Porcentaje del ancho total, derivado de los anchos del nodo. */
  width: string;
}

/** Celda de datos. El color del texto lo pone quien la usa; el nodo pinta #131313. */
export const WASTE_SUMMARY_CELL_CLASS =
  "border-b border-solid border-[#e3e3e3] bg-white px-[12px] py-[14px] align-middle font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[normal] text-[#131313]";

/**
 * Variante en negrita de la celda de datos: la columna "Cantidad" del nodo
 * (`3830:65670`) es la única que va Inter Bold, porque es la cifra que se declara.
 */
export const WASTE_SUMMARY_CELL_CLASS_STRONG =
  "border-b border-solid border-[#e3e3e3] bg-white px-[12px] py-[14px] align-middle font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] text-[#131313]";

/** Celda de la fila de totales. Negro puro, no `--gray/900_txt`: así lo declara el nodo. */
export const WASTE_SUMMARY_TOTAL_CELL_CLASS =
  "border-b border-solid border-[#e3e3e3] bg-[#f7f7f7] px-[12px] py-[9.5px] align-middle font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] text-black";

interface WasteSummaryTableProps<C extends WasteSummaryTableColumn, R> {
  /** Descripción de la tabla para lectores de pantalla; no se dibuja. */
  caption: string;
  columns: readonly C[];
  /** Suma de los anchos del nodo, en píxeles. Es un MÍNIMO, no un ancho fijo. */
  minWidth: number;
  /** Filas ya consolidadas: la tabla no agrega ni ordena, solo dibuja. */
  rows: readonly R[];
  getRowKey: (row: R) => string;
  /** Devuelve los `<td>` de la fila; el armazón aporta el `<tr>`. */
  renderRow: (row: R) => ReactNode;
  /**
   * `<td>` de la fila de totales. Opcional: los estados de carga y de error
   * dibujan la tabla sin total, porque todavía no hay nada que totalizar.
   */
  renderTotalRow?: () => ReactNode;
  /** Copy del estado vacío. El nodo no lo dibuja; la guía de UX lo exige. */
  emptyMessage: string;
}

export function WasteSummaryTable<C extends WasteSummaryTableColumn, R>({
  caption,
  columns,
  minWidth,
  rows,
  getRowKey,
  renderRow,
  renderTotalRow,
  emptyMessage,
}: WasteSummaryTableProps<C, R>) {
  return (
    <div className="w-full overflow-hidden rounded-[8px] border border-solid border-[#e3e3e3]">
      <div className="w-full overflow-x-auto">
        {/*
         * `minWidth` va en estilo y no en una clase `min-w-[…]`: Tailwind no puede
         * generar una clase a partir de un valor de runtime. Sigue siendo un
         * mínimo, así que la tabla crece con el viewport.
         */}
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
                  className="border-b border-solid border-[#e3e3e3] bg-[#f7f7f7] px-[12px] py-[9.5px] text-left"
                >
                  <span className="block whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold uppercase not-italic leading-[normal] tracking-[0.44px] text-[#646464]">
                    {column.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowKey(row)}>{renderRow(row)}</tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="border-b border-solid border-[#e3e3e3] bg-white px-[12px] py-[14px] text-center font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[normal] text-[#646464]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
          </tbody>
          {/*
           * La fila de totales va en `<tfoot>` y no como una fila más del cuerpo:
           * es lo que le dice al lector de pantalla —y a quien exporte la tabla—
           * que ese renglón resume los anteriores en vez de ser otro residuo.
           */}
          {renderTotalRow ? (
            <tfoot>
              <tr>{renderTotalRow()}</tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}
