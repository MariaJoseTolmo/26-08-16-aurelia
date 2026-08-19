import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { WasteWithdrawalModalCloseIcon, WasteWithdrawalSectionIcon } from '../icons/WasteWithdrawalFormIcons';
import { filterWithdrawableLots, type WasteWithdrawableLot } from '../wasteWithdrawableLots';
import { WasteWithdrawableLotRow } from './WasteWithdrawableLotRow';
import { WasteSecondaryActionButton } from './WasteSecondaryActionButton';

/**
 * Modal "Seleccionar residuo a retirar" — nodo `3765:40585`, tal como se emplaza
 * en `3765:40461`.
 *
 * ESTRUCTURA Y MEDIDAS DEL NODO
 *
 *   velo        `rgba(19,19,19,0.75)`, medido del render de `3765:40461` y
 *               verificado contra tres fondos distintos (blanco → 78,
 *               `#f7f7f7` → 76, degradado del sidebar → 14,27,33). Resulta ser el
 *               mismo valor que ya usan los 13 overlays de `apps/web`.
 *   panel       538 × 688 · bg white · rounded-[16px]
 *
 * EL PANEL NO VA CENTRADO, VA CONTRA EL BORDE DERECHO. En `3765:40461` y en
 * `3765:40681` el frame del modal está en `x=726` sobre una pantalla de 1280:
 * `726 + 538 = 1264`, o sea 16px de margen a la derecha, los mismos que tiene
 * arriba (`y=16`) y abajo (`720 - 704`). De ahí `justify-end` con `p-[16px]`, y no
 * el `justify-center` del resto de los overlays de la app.
 *   encabezado  `3765:40587` h-64 · px-[14px] py-[12px] · rounded-t-[16px]
 *               título    Inter Bold 16px · leading-[22px] · tracking-[0.32px] · #2a2a2a
 *               subtítulo Inter Regular 11.5px · #646464
 *               Close     32 × 32
 *   cuerpo      `3765:40595` px-[14px] pt-[15px] pb-[14px]
 *   buscador    `3765:40596` pt-[16px] · caja h-[38px] px-[13px] py-px
 *               rounded-[8px] border #d1d1d1 · lupa 20 × 16.0023
 *               placeholder Inter Regular 12.5px #757575
 *   lista       `3765:40602` pt-[12px] · gap-[8px]
 *   pie         `3765:40675` h-65 · border-t #e3e3e3 · px-[20px] pt-[15px] pb-[14px]
 *               dos botones `flex-[1_0_0]` separados por 10px
 *
 * EL PANEL OCUPA TODO EL ALTO DISPONIBLE, NO 688px. Los 688 del nodo no son una
 * medida propia del diálogo: son `720 - 16 - 16`, o sea la pantalla de Figma menos
 * el mismo margen que ya tiene a la derecha. Escribirlos como alto fijo dejaba el
 * modal corto en cualquier viewport más alto que 720.
 *
 * Se resuelve dejando que el panel se estire: el overlay es `fixed inset-0` con
 * `p-[16px]` y sin `items-center`, así que el `align-items: stretch` por defecto
 * le da exactamente `100vh - 32px`. En una pantalla de 720 eso son los 688 del
 * nodo, clavados, y en una de 1080 el diálogo acompaña.
 *
 * Que el alto NO dependa del contenido es igual de importante: la lista llena 298
 * de los 559 disponibles en el nodo y el resto es blanco, porque el pie tiene que
 * quedarse quieto mientras el buscador filtra. Por eso estira en vez de ajustarse.
 *
 * EL ESTADO CON LOTE ELEGIDO ES EL NODO `3765:40805`, el mismo modal con la
 * primera fila seleccionada. De ahí salen los dos únicos cambios:
 *
 *   fila elegida  `3765:40823` bg `#e6f3ff` · border-[1.5px] `#001e39`
 *                 (el resto de la fila NO cambia: la caja del icono y la pastilla
 *                 siguen en la paleta de peligrosidad, y el icono es el mismo
 *                 asset, verificado por checksum)
 *   primario      `3765:40899` bg `#c8a064` · texto white
 *
 * UN DESVÍO DELIBERADO: EL BUSCADOR NO SCROLLEA. En el nodo vive dentro del mismo
 * contenedor que la lista, pero un campo de búsqueda que se va de pantalla
 * mientras filtrás es un problema real. Solo scrollea la lista. Al tamaño de
 * diseño se ve idéntico.
 *
 * Los iconos de fila NO son assets nuevos: son los glifos de `WasteHazardBadge`
 * escalados 1.3×. Ver la nota de `WasteWithdrawalFormIcons`.
 */

/** Texto del nodo `3765:40591`. */
export const LOT_PICKER_TITLE = 'Seleccionar residuo a retirar';
/** Texto del nodo `3765:40592`. */
export const LOT_PICKER_SUBTITLE = 'Solo se muestran lotes con cantidad disponible mayor a 0.';
/** Placeholder del nodo `3765:40601`. */
export const LOT_PICKER_SEARCH_PLACEHOLDER = 'Buscar por residuo, categoría u origen';
/** Rótulo del nodo `3765:40680`. */
export const LOT_PICKER_CONFIRM_LABEL = 'Agregar residuo seleccionado';

interface WasteWithdrawalLotPickerModalProps {
  open: boolean;
  lots: WasteWithdrawableLot[];
  /**
   * Lote ya confirmado, para que reabrir el modal muestre marcado lo que el
   * usuario había elegido en vez de arrancar en blanco.
   */
  selectedLotId?: string | null;
  onClose: () => void;
  onConfirm: (lot: WasteWithdrawableLot) => void;
}

export function WasteWithdrawalLotPickerModal({
  open,
  lots,
  selectedLotId = null,
  onClose,
  onConfirm,
}: WasteWithdrawalLotPickerModalProps): ReactNode {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(selectedLotId);
  const searchRef = useRef<HTMLInputElement>(null);

  /**
   * Cada apertura limpia la búsqueda y vuelve a partir del lote confirmado. La
   * búsqueda SÍ se resetea —arrastrar el filtro anterior esconde lotes sin que se
   * entienda por qué—; la selección NO, porque es la decisión que el usuario ya
   * tomó.
   */
  useEffect(() => {
    if (!open) return undefined;

    setQuery('');
    setSelectedId(selectedLotId);
    // El foco arranca en el buscador: es lo primero que se usa y evita que el
    // teclado quede atrapado detrás del velo.
    searchRef.current?.focus();
    return undefined;
  }, [open, selectedLotId]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const visibleLots = useMemo(() => filterWithdrawableLots(lots, query), [lots, query]);
  const selectedLot = useMemo(
    () => visibleLots.find((lot) => lot.id === selectedId) ?? null,
    [visibleLots, selectedId],
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
        aria-labelledby="lot-picker-title"
        aria-describedby="lot-picker-subtitle"
        className="flex w-full max-w-[538px] flex-col overflow-hidden rounded-[16px] bg-white"
      >
        <div className="flex w-full shrink-0 flex-col items-center px-[14px] py-[12px]">
          <div className="flex w-full items-center gap-[12px]">
            <div className="flex min-w-px flex-1 flex-col items-start justify-center">
              <div className="flex w-full flex-col items-start gap-[4px]">
                <h2
                  id="lot-picker-title"
                  className="w-full font-['Inter:Bold',sans-serif] text-[16px] font-bold not-italic leading-[22px] tracking-[0.32px] text-[#2a2a2a]"
                >
                  {LOT_PICKER_TITLE}
                </h2>
                <p
                  id="lot-picker-subtitle"
                  className="font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[normal] text-[#646464]"
                >
                  {LOT_PICKER_SUBTITLE}
                </p>
              </div>
            </div>
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

        {/* Buscador fijo — ver el desvío 1 del encabezado de este archivo. */}
        <div className="w-full shrink-0 px-[14px] pt-[15px]">
          <div className="w-full pt-[16px]">
            <div className="flex h-[38px] w-full items-center gap-[8px] rounded-[8px] border border-solid border-[#d1d1d1] bg-white px-[13px] py-px">
              {/* Mismo glifo que el encabezado "Residuo a retirar", en la caja de 20 × 16.0023 del nodo `3765:40598`. */}
              <WasteWithdrawalSectionIcon className="block h-[16.0023px] w-[20px] shrink-0 text-black" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label={LOT_PICKER_SEARCH_PLACEHOLDER}
                placeholder={LOT_PICKER_SEARCH_PLACEHOLDER}
                className="min-w-px flex-1 border-0 bg-transparent px-[2px] py-px font-['Inter:Regular',sans-serif] text-[12.5px] font-normal not-italic leading-[normal] text-[#131313] outline-none placeholder:text-[#757575] [&::-webkit-search-cancel-button]:hidden"
              />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-[14px] pb-[14px]">
          <div className="flex w-full flex-col gap-[8px] pt-[12px]">
            {visibleLots.map((lot) => (
              <WasteWithdrawableLotRow
                key={lot.id}
                lot={lot}
                selected={lot.id === selectedId}
                onSelect={() => setSelectedId(lot.id)}
              />
            ))}
            {visibleLots.length === 0 ? (
              <p className="w-full py-[16px] text-center font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[normal] text-[#646464]">
                {lots.length === 0
                  ? 'No hay lotes con cantidad disponible para retirar.'
                  : 'Ningún lote coincide con la búsqueda.'}
              </p>
            ) : null}
          </div>
        </div>

        <div className="w-full shrink-0 border-t border-solid border-[#e3e3e3] bg-white">
          <div className="flex w-full items-center justify-end px-[20px] pb-[14px] pt-[15px]">
            <div className="flex min-w-px flex-1 items-start gap-[10px]">
              <div className="min-w-px flex-1">
                <WasteSecondaryActionButton fullWidth label="Cancelar" onClick={onClose} />
              </div>
              <button
                type="button"
                disabled={selectedLot === null}
                onClick={() => {
                  if (selectedLot) onConfirm(selectedLot);
                }}
                className={`flex h-[36px] min-w-px flex-1 items-center justify-center rounded-[8px] px-[22px] transition-colors ${
                  selectedLot ? 'bg-[#c8a064] hover:bg-[#bb9057]' : 'cursor-not-allowed bg-[#e3e3e3]'
                }`}
              >
                <span
                  className={`whitespace-nowrap text-center font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] ${
                    selectedLot ? 'text-white' : 'text-[#acacac]'
                  }`}
                >
                  {LOT_PICKER_CONFIRM_LABEL}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
