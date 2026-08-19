import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { resolveWasteAccumulationTone } from '@aurelia/contracts';
import { WarehouseTableCaretIcon } from '../icons/WarehouseTableIcons';
import {
  WasteWithdrawalModalCloseIcon,
  WasteWithdrawalSectionIcon,
} from '../icons/WasteWithdrawalFormIcons';
import { matchesSearch } from '../wasteFilterPrimitives';
import type { WasteRcaBreakdownBar, WasteRcaDetailRow } from '../wasteRcaThresholds';
import {
  ACCUMULATION_TONE_STYLES,
  clampPercentage,
  formatAccumulationDeviation,
} from '../wasteWarehouseThresholds';

/**
 * Modal "Acumulado mensual vs. umbral RCA" — nodo `4304:30640`, tal como se
 * emplaza en `4304:30256`. Lo abre el enlace "Ver detalle completo"
 * (`4304:28838`) de la tarjeta del dashboard.
 *
 * REUSA EL SHELL DEL NODO `3765:40585` (`WasteWithdrawalLotPickerModal`), que es
 * el mismo diálogo con otro contenido. Coincide medida por medida:
 *
 *   velo        `rgba(19,19,19,0.75)` — el rectángulo `4304:30639` de 1280 × 720
 *   panel       538 de ancho · bg white · rounded-[16px], contra el borde derecho
 *   encabezado  px-[14px] py-[12px] · título Inter Bold 16px / 22px /
 *               tracking-[0.32px] · #2a2a2a · Close 32 × 32
 *   buscador    h-[38px] px-[13px] py-px · rounded-[8px] · border #d1d1d1
 *               lupa 20 × 16.0023 · placeholder Inter Regular 12.5px #757575
 *
 * PLAZAMIENTO A LA DERECHA, no centrado: en `4304:30256` el modal está en x=726
 * sobre 1280, o sea `726 + 538 = 1264` → 16px de margen derecho, los mismos que
 * abajo (`720 - 704`). Igual que el picker de lotes: `justify-end` con `p-[16px]`.
 * El nodo tiene 19px arriba contra 16 abajo; se usan 16/16 —el estirón del panel—
 * porque esos 3px son un empujón del frame, no una medida del diálogo.
 *
 * DOS DIFERENCIAS CON EL PICKER DE LOTES, las dos del nodo:
 *
 *   1. NO hay subtítulo bajo el título, así que el encabezado mide 56 y no 64.
 *   2. NO hay pie con botones: el modal es de sólo lectura y se cierra por la X,
 *      por Escape o por el velo.
 *
 * CERO ICONOS NUEVOS. Los cuatro glifos ya estaban en el proyecto y se verificó el
 * `path` de cada uno:
 *
 *   Close    `WasteWithdrawalModalCloseIcon` — el asset del nodo `4304:30645` es
 *            byte a byte `figma-3765-40593-modal-close.svg`
 *   lupa     `WasteWithdrawalSectionIcon` — razón 20/16.875 = 1.185185:
 *            12.6562→15, 5.48438→6.5, 14.9396→17.7063
 *   caret    `WarehouseTableCaretIcon` (nodo `650:141`, el mismo componente que
 *            instancia el nodo). El asset apunta hacia ARRIBA; el `-scale-y-100`
 *            lo baja, que es el neto del `-rotate-180 -scale-x-100` de Figma y lo
 *            que ya hacen los tres selectores de bodega.
 *   pastilla `ACCUMULATION_TONE_STYLES` — los tres pares del nodo
 *            (#fff0e6/#6b3a1f, #ffd0db/#570b1d, #c5fff6/#006153) son exactamente
 *            los suyos, así que el color sale de la misma fuente que las barras.
 *
 * EL ALTO DEL PANEL NO SE FIJA. Los 685px del nodo son `720 - 19 - 16`, no una
 * medida del diálogo: con 302px de contenido, el resto es blanco. El panel se
 * estira a `100vh - 32px` igual que el picker, y la lista scrollea sola.
 */

/** Texto del nodo `4304:30644`. */
export const RCA_DETAIL_MODAL_TITLE = 'Acumulado mensual vs. umbral RCA';
/** Placeholder del nodo `4304:30653`. */
export const RCA_DETAIL_SEARCH_PLACEHOLDER = 'Buscar por residuo, categoría u origen';

interface WasteRcaThresholdsModalProps {
  open: boolean;
  bars: WasteRcaDetailRow[];
  /**
   * Avance del mes. Es lo que decide el tono de cada pastilla, igual que en la
   * tarjeta: sin él las pastillas del modal podrían decir algo distinto de las
   * barras que hay detrás.
   */
  monthElapsedPercentage: number;
  onClose: () => void;
}

export function WasteRcaThresholdsModal({
  open,
  bars,
  monthElapsedPercentage,
  onClose,
}: WasteRcaThresholdsModalProps): ReactNode {
  const [query, setQuery] = useState('');
  /*
   * Categorías abiertas, por rótulo.
   *
   * Es un SET y no un solo rótulo: las filas son disclosures independientes, no un
   * acordeón. El emplazamiento `4304:31115` muestra una sola abierta, pero eso no
   * prueba exclusividad —hay una sola en la maqueta—, y cerrarle al usuario la fila
   * que estaba leyendo para abrir otra es peor por defecto. Si diseño quiere
   * acordeón, se reemplaza el Set por un `string | null`.
   */
  const [expandedLabels, setExpandedLabels] = useState<Set<string>>(() => new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  /** Cada apertura arranca sin filtro, con todo colapsado y el foco en el buscador. */
  useEffect(() => {
    if (!open) return undefined;

    setQuery('');
    setExpandedLabels(new Set());
    searchRef.current?.focus();
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  /*
   * El placeholder del nodo promete "residuo, categoría u origen", pero la
   * respuesta de `/waste/dashboard/rca-thresholds` sólo trae la CATEGORÍA. Se
   * filtra por lo que hay; residuo y origen entran cuando el contrato los traiga.
   */
  const visibleBars = useMemo(
    () => bars.filter((bar) => matchesSearch(bar.label, query)),
    [bars, query],
  );

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex justify-end bg-[rgba(19,19,19,0.75)] p-[16px]"
      onMouseDown={(event) => {
        // Solo el click en el velo cierra; uno que empieza dentro del panel no.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rca-detail-title"
        className="flex w-full max-w-[538px] flex-col overflow-hidden rounded-[16px] bg-white"
      >
        {/* Encabezado `4304:30642`. Sin subtítulo, por eso mide 56 y no 64. */}
        <div className="flex w-full shrink-0 flex-col items-start justify-center px-[14px] py-[12px]">
          <div className="flex w-full items-center gap-[12px]">
            <h2
              id="rca-detail-title"
              className="min-w-px flex-1 font-['Inter:Bold',sans-serif] text-[16px] font-bold not-italic leading-[22px] tracking-[0.32px] text-[#2a2a2a]"
            >
              {RCA_DETAIL_MODAL_TITLE}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] transition-colors hover:bg-[#f7f7f7]"
            >
              <WasteWithdrawalModalCloseIcon className="block size-[32px] shrink-0 text-black" />
            </button>
          </div>
        </div>

        {/*
          Cuerpo `4304:30647`: `border-t #e3e3e3 px-[14px] pt-[15px] pb-[14px]`.
          El buscador queda FIJO y sólo scrollea la lista, igual que en el picker de
          lotes: un campo de búsqueda que se va de pantalla mientras filtrás es un
          problema real, y al tamaño de diseño se ve idéntico.
        */}
        <div className="flex min-h-0 w-full flex-1 flex-col border-t border-solid border-[#e3e3e3] bg-white">
          <div className="w-full shrink-0 px-[14px] pt-[15px]">
            <div className="w-full pt-[16px]">
              <div className="flex h-[38px] w-full items-center gap-[8px] rounded-[8px] border border-solid border-[#d1d1d1] bg-white px-[13px] py-px">
                <WasteWithdrawalSectionIcon className="block h-[16.0023px] w-[20px] shrink-0 text-black" />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label={RCA_DETAIL_SEARCH_PLACEHOLDER}
                  placeholder={RCA_DETAIL_SEARCH_PLACEHOLDER}
                  className="min-w-px flex-1 border-0 bg-transparent px-[2px] py-px font-['Inter:Regular',sans-serif] text-[12.5px] font-normal not-italic leading-[normal] text-[#131313] outline-none placeholder:text-[#757575] [&::-webkit-search-cancel-button]:hidden"
                />
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-[14px] pb-[14px]">
            <div className="flex w-full flex-col gap-[8px] pt-[12px]">
              {visibleBars.map((bar) => (
                <WasteRcaThresholdRow
                  key={bar.label}
                  bar={bar}
                  monthElapsedPercentage={monthElapsedPercentage}
                  expanded={expandedLabels.has(bar.label)}
                  onToggle={() =>
                    setExpandedLabels((current) => {
                      const next = new Set(current);
                      if (next.has(bar.label)) next.delete(bar.label);
                      else next.add(bar.label);
                      return next;
                    })
                  }
                />
              ))}
              {visibleBars.length === 0 ? (
                <p className="w-full py-[16px] text-center font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[normal] text-[#646464]">
                  {bars.length === 0
                    ? 'No hay umbrales RCA configurados para este período.'
                    : 'Ninguna categoría coincide con la búsqueda.'}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Fila del modal: colapsada es el nodo `4304:30655`, expandida el `4304:31130`.
 *
 *   caja        bg white · border-[1.5px] #e3e3e3 · rounded-[9px]
 *               px-[15.5px] py-[14.5px] · flex flex-col gap-[24px]
 *   encabezado  flex items-center justify-between w-full
 *   nombre      Inter Bold 13px · #131313 · whitespace-nowrap
 *   pastilla    `pl-[6px]` de separación · px-[7px] py-[2px] · rounded-[20px]
 *               Inter Bold 9.5px, colores según el tono
 *   valor       Inter Regular 11px · #646464, separado del caret por `gap-[24px]`
 *   caret       caja de 16 × 16 con el chevron de 10 × 6
 *
 * LOS DOS NODOS SON LA MISMA CAJA: el expandido no cambia padding, borde ni radio,
 * solo agrega un segundo hijo. Por eso el contenedor es `flex-col gap-[24px]` en
 * los dos estados —el `gap` no se ve con un hijo único— y no hay dos cajas.
 *
 * EL CARET NO ROTA AL EXPANDIR. Se comprobó en el emplazamiento `4304:31115`: la
 * fila abierta muestra el chevron apuntando abajo, igual que las cerradas. Es
 * fidelidad al nodo y va contra la convención de un disclosure; queda anotado como
 * observación para diseño, y revertirlo es agregar `rotate-180` cuando `expanded`.
 */
function WasteRcaThresholdRow({
  bar,
  monthElapsedPercentage,
  expanded,
  onToggle,
}: {
  bar: WasteRcaDetailRow;
  monthElapsedPercentage: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const percentage = clampPercentage(bar.percentage);
  const tone = ACCUMULATION_TONE_STYLES[resolveWasteAccumulationTone(percentage, monthElapsedPercentage)];
  const deviationLabel = formatAccumulationDeviation(percentage, monthElapsedPercentage);
  const panelId = `rca-breakdown-${bar.label.replace(/\s+/g, '-').toLowerCase()}`;
  /*
   * Sin desglose la fila NO se puede expandir: un disclosure que abre para mostrar
   * nada es peor que ninguno. El caret se sigue dibujando —lo dibuja el nodo— pero
   * el control queda deshabilitado.
   */
  const canExpand = bar.breakdown.length > 0;

  return (
    <div className="flex w-full flex-col gap-[24px] rounded-[9px] border-[1.5px] border-solid border-[#e3e3e3] bg-white px-[15.5px] py-[14.5px]">
      {/*
        TODO EL ENCABEZADO es el control, no solo el caret: el área de click de un
        chevron de 16px es incómoda, y la fila entera es lo que el usuario percibe
        como "abrible".
      */}
      <button
        type="button"
        onClick={onToggle}
        disabled={!canExpand}
        aria-expanded={expanded}
        aria-controls={canExpand ? panelId : undefined}
        className="flex w-full items-center justify-between gap-[24px] text-left disabled:cursor-default"
      >
        <span className="flex min-w-px flex-1 items-center">
          <span className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[13px] font-bold not-italic leading-[normal] text-[#131313]">
            {bar.label}
          </span>
          <span className="shrink-0 pl-[6px]">
            <span
              className="block whitespace-nowrap rounded-[20px] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[9.5px] font-bold not-italic leading-[normal]"
              style={{ backgroundColor: tone.badgeBackground, color: tone.badgeText }}
            >
              {deviationLabel}
            </span>
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-[24px]">
          <span className="whitespace-nowrap font-['Inter:Regular',sans-serif] text-[11px] font-normal not-italic leading-[normal] text-[#646464]">
            {bar.valueLabel}
          </span>
          {/*
            Caja de 16 × 16 del nodo `4304:30663` con el chevron en
            `inset-[35.42%_18.75%_27.08%_18.75%]`, que sobre 16px son exactamente
            los 10 × 6 del asset. Se respetan los insets en vez de centrarlo: el
            nodo lo deja 0.67px por debajo del centro.
          */}
          <span aria-hidden className="relative block size-[16px] shrink-0">
            <WarehouseTableCaretIcon className="absolute bottom-[27.08%] left-[18.75%] right-[18.75%] top-[35.42%] block h-auto w-auto -scale-y-100 text-[#131313]" />
          </span>
        </span>
      </button>

      {/* Desglose `4304:31140`: `flex flex-col gap-[8px] w-full`. */}
      {expanded && canExpand ? (
        <div id={panelId} className="flex w-full flex-col gap-[8px]">
          {bar.breakdown.map((item) => (
            <WasteRcaBreakdownRow key={item.wasteName} item={item} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Un residuo del desglose — nodo `4304:31141`.
 *
 *   fila     flex flex-col gap-[6px] w-full
 *   rótulos  contenedor h-[16.5px]; nombre Inter Regular 12.5px #131313,
 *            valor Inter Regular 11px #646464
 *   track    bg #f7f7f7 · h-[9px] · rounded-[5px] · overflow-clip
 *   relleno  bg #001e39 · h-[9px] · rounded-[5px]
 *
 * EL RELLENO VA NEUTRO, no en la paleta de umbrales: el nodo pinta las cuatro
 * barras del mismo `#001e39` porque acá se compara la COMPOSICIÓN de la categoría,
 * no el ritmo de cada residuo contra un umbral propio —que no existe—.
 *
 * En el nodo los dos rótulos van con posición absoluta (`left-0` y
 * `right-[71.5px] translate-x-full`, que es el modo en que Figma expresa "pegado al
 * borde derecho"). Acá se resuelve con `justify-between`, y `items-baseline`
 * reproduce el desnivel de 1.5px entre los dos tamaños de texto sin anclarlo.
 *
 * Los anchos del nodo —214 / 169 / 158 / 85 sobre 476— suman más de 100%, así que
 * son de maqueta: el ancho real es la participación calculada.
 */
function WasteRcaBreakdownRow({ item }: { item: WasteRcaBreakdownBar }) {
  return (
    <div className="flex w-full flex-col gap-[6px]">
      <div className="flex h-[16.5px] w-full items-baseline justify-between gap-[12px]">
        <span className="min-w-0 truncate font-['Inter:Regular',sans-serif] text-[12.5px] font-normal not-italic leading-[normal] text-[#131313]">
          {item.wasteName}
        </span>
        <span className="shrink-0 whitespace-nowrap font-['Inter:Regular',sans-serif] text-[11px] font-normal not-italic leading-[normal] text-[#646464]">
          {item.valueLabel}
        </span>
      </div>
      <div
        className="h-[9px] w-full overflow-hidden rounded-[5px] bg-[#f7f7f7]"
        role="progressbar"
        aria-label={item.wasteName}
        aria-valuenow={item.sharePercentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-[9px] rounded-[5px] bg-[#001e39]"
          style={{ width: `${clampPercentage(item.sharePercentage)}%` }}
        />
      </div>
    </div>
  );
}
