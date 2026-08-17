import type { ReactNode } from 'react';
import { WasteAlertWeightIcon } from '../icons/WasteDashboardIcons';
import { WarehouseFormAttachedCheckIcon } from '../icons/WarehouseIntakeFormIcons';
import { WarehousePageNextIcon } from '../icons/WarehouseIntakeIcons';

/**
 * Lista de folios SIDREP de la vista "Folios SIDREP" — nodo `3083:10909`, la
 * columna izquierda de la pestaña "Cerrados".
 *
 * Es la lista maestra de un maestro-detalle: cada fila abre su folio en
 * `WasteFolioDetailPanel`, a la derecha. Por eso las filas son BOTONES dentro de
 * un `<ul>` y no `<div>` con `onClick`: se llegan con Tab, se activan con Enter y
 * con Espacio, y el lector de pantalla anuncia "lista, 3 elementos".
 *
 * Geometría del design context:
 *
 *   tarjeta  bg white · border var(--gray/300, #e3e3e3) · rounded-[10px]
 *   fila     grid-cols-[36px 370.35px 47.62px 13.75px] · gap-[14px]
 *            px-[18px] · border-b #e3e3e3 salvo la última
 *   casilla  size-[36px] · rounded-[var(--value/corner-radius/8px, 8px)]
 *            glifo centrado de 17.5 × 14
 *   título   Inter Bold 13px
 *   subtítulo  pt-[2px] · Inter Regular 11px · var(--gray/600_cta, #646464)
 *   estado   Inter Bold 12px · var(--teal/900_txt, #006153) · items-end
 *   fecha    Inter Regular 9.5px · tracking-[0.19px] · uppercase
 *            var(--gray/500, #acacac)
 *   chevron  13.75 × 11 · #acacac
 *
 * EL `py-[14px]` UNIFORME NO CONTRADICE LAS ALTURAS DEL NODO, las explica. Figma
 * dibuja los bordes HACIA ADENTRO de la caja y CSS los suma por fuera, así que las
 * dos primeras filas miden 65 (14 + 36 + 14 + 1 de `border-b`) y la última 64
 * (14 + 36 + 14, sin borde) — que es exactamente lo que declara el nodo. Con el
 * `pb-[15px]` literal del design context darían 66 y 64, y la tarjeta se pasaría
 * de sus 196px. Total: 1 + 65 + 65 + 64 + 1 = 196. ✅
 *
 * El `p-px` del nodo tampoco se reproduce: es ese mismo borde interior de Figma. El
 * `overflow-hidden` sí es necesario, y no es decorativo: sin él el fondo azul de la
 * fila seleccionada pisa las esquinas redondeadas de la tarjeta.
 *
 * Los anchos de columna del grid no se fijan —el de 370.35px es la caja de texto de
 * Figma— porque suman justo el interior de la tarjeta: 18 + 36 + 14 + 370.35 + 14 +
 * 47.62 + 14 + 13.75 + 18 = 545.72. La fila sale como `flex` con el bloque de texto
 * en `flex-1`, y el reparto queda igual pero tolera títulos más largos.
 */

/**
 * Cómo cerró el folio. Los dos tonos salen de nodos concretos, no de una escala
 * inventada, y cambian LA CASILLA Y EL GLIFO a la vez:
 *
 *   `closed`     `3083:10911`  bg var(--teal/100, #c5fff6) · check #006153
 *   `weightGap`  `3083:10943`  bg #fff0e6 · balanza #570b1d
 *
 * El check dice "cerró limpio"; la balanza, "cerró con diferencia de peso" —el
 * folio `2026-SD-04812`, el único de los tres que trae el recuadro de alerta en su
 * panel—. Por eso el tono se nombra por el ESTADO y no por el color: el color es
 * consecuencia, y el glifo cambia con él.
 *
 * `#fff0e6` con `#6b3a1f` es el mismo par ámbar que ya usa `WastePill` para
 * "Pendiente" y que este panel repite en su pastilla y en su recuadro de peso; no
 * es un color nuevo del sistema.
 */
export type WasteFolioListRowTone = 'closed' | 'weightGap';

const ROW_TONE: Record<WasteFolioListRowTone, { tile: string; icon: ReactNode }> = {
  closed: {
    tile: 'bg-[#c5fff6]',
    /*
     * MISMO ASSET que los adjuntos del formulario de bodega (`3713:27396`):
     * 17.5 × 14 y `fill` #006153, idéntico byte a byte al que exporta este nodo.
     */
    icon: <WarehouseFormAttachedCheckIcon className="block h-[14px] w-[17.5px] shrink-0 text-[#006153]" />,
  },
  weightGap: {
    tile: 'bg-[#fff0e6]',
    /*
     * MISMO GLIFO que la alerta de peso del dashboard (`3086:13911`), que va en
     * caja de 15 × 12: se comparó el path escalado por 17.5/15 y coincide. El
     * `viewBox` escala solo, así que basta pedirle la caja de este nodo.
     */
    icon: <WasteAlertWeightIcon className="block h-[14px] w-[17.5px] shrink-0 text-[#570b1d]" />,
  },
};

export interface WasteFolioListRow {
  /** Identidad de la fila. Es lo que el maestro-detalle usa para seleccionar. */
  id: string;
  /** Residuo y peso, ya formateados: "Aceite lubricante usado — 1.020 kg". */
  title: string;
  /** Transportista y folio: "Resiter S.A. · Folio 2026-SD-04690". */
  subtitle: string;
  /** Rótulo del estado del folio. En esta pestaña, siempre "Cerrado". */
  status: string;
  /** Fecha corta del nodo: "05 jul". La mayúscula la pone el CSS. */
  date: string;
  tone: WasteFolioListRowTone;
}

interface WasteFolioListCardProps {
  /** Nombre accesible de la lista. No se dibuja: el nodo no le pone rótulo. */
  label: string;
  rows: WasteFolioListRow[];
  /** Folio abierto en el panel de detalle, o `null` mientras no haya ninguno. */
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function WasteFolioListCard({ label, rows, selectedId, onSelect }: WasteFolioListCardProps) {
  return (
    <ul
      aria-label={label}
      className="flex w-full flex-col items-start overflow-hidden rounded-[10px] border border-solid border-[#e3e3e3] bg-white"
      data-name="Container"
    >
      {rows.map((row, index) => {
        const selected = row.id === selectedId;
        const tone = ROW_TONE[row.tone];
        const last = index === rows.length - 1;

        return (
          <li key={row.id} className="w-full">
            <button
              type="button"
              onClick={() => onSelect(row.id)}
              /*
               * `aria-current` y no `aria-selected`: esto es una lista de
               * navegación dentro de la vista, no un `listbox`. Es lo que anuncia
               * "elemento actual" sin prometer semántica de control de formulario.
               */
              aria-current={selected ? 'true' : undefined}
              className={`flex w-full items-center gap-[14px] px-[18px] py-[14px] text-left transition-colors ${
                last ? '' : 'border-b border-solid border-[#e3e3e3]'
              } ${selected ? 'bg-[#e6f3ff]' : 'bg-white hover:bg-[#f7f7f7]'}`}
            >
              <span
                className={`flex size-[36px] shrink-0 items-center justify-center rounded-[8px] ${tone.tile}`}
                data-name="Container"
              >
                {tone.icon}
              </span>

              <span className="flex min-w-px flex-1 flex-col items-start">
                {/*
                  El título cambia de color con la selección: `3083:10948` lo pinta
                  en var(--blue/900_txt, #0d3862) sobre el fondo azul, contra el
                  #131313 de las filas en reposo. El subtítulo NO cambia: los tres
                  nodos lo dejan en #646464.
                */}
                <span
                  className={`w-full truncate font-['Inter:Bold',sans-serif] text-[13px] font-bold not-italic leading-[normal] ${
                    selected ? 'text-[#0d3862]' : 'text-[#131313]'
                  }`}
                >
                  {row.title}
                </span>
                <span className="w-full truncate pt-[2px] font-['Inter:Regular',sans-serif] text-[11px] font-normal not-italic leading-[normal] text-[#646464]">
                  {row.subtitle}
                </span>
              </span>

              {/*
                El estado va en teal en las TRES filas, también en la seleccionada
                (`3083:11037`): lo ámbar de este folio es su casilla, no su estado.
              */}
              <span className="flex shrink-0 flex-col items-end">
                <span className="whitespace-nowrap text-right font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] text-[#006153]">
                  {row.status}
                </span>
                <span className="whitespace-nowrap text-right font-['Inter:Regular',sans-serif] text-[9.5px] font-normal uppercase not-italic leading-[normal] tracking-[0.19px] text-[#acacac]">
                  {row.date}
                </span>
              </span>

              {/*
                MISMO GLIFO que la flecha "página siguiente" del pie de tabla
                (`3734:28533`), que va en caja de 12.5 × 10: el path escalado por
                1.1 coincide con el de este nodo. Se reusa a la caja de acá.
              */}
              <WarehousePageNextIcon className="block h-[11px] w-[13.75px] shrink-0 text-[#acacac]" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
