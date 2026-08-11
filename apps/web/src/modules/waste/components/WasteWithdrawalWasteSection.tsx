import type { WasteWithdrawableLot } from '../wasteWithdrawableLots';
import { WasteWithdrawalSectionIcon } from '../icons/WasteWithdrawalFormIcons';
import { WarehouseFormCard } from './WarehouseFormCard';
import { WasteWithdrawableLotRow } from './WasteWithdrawableLotRow';

/**
 * Tarjeta "Residuo a retirar" del formulario "Nueva solicitud de retiro" — nodo
 * `3765:38875`.
 *
 * La caja es `WarehouseFormCard`, sin cambios: el nodo declara EXACTAMENTE la
 * misma tarjeta que las cuatro secciones de "Registrar ingreso a Bodega"
 * —bg white · border #e3e3e3 · rounded-[10px] · px-[25px] py-[21px], Heading 3
 * con icono de 16.875 × 13.5 e Inter Bold 13.5px #131313, párrafo `pt-[3px]` en
 * Inter Regular 11.5px #646464—. Acá queda lo propio: el icono, los textos y el
 * recuadro punteado.
 *
 * RECUADRO PUNTEADO (`3765:38883`), el único elemento nuevo:
 *
 *   contenedor  `3765:38882` pt-[16px] · w-full
 *   caja        bg white · border-[1.5px] DASHED #d1d1d1 · rounded-[9px]
 *               flex items-center · px-[17.5px] py-[15.5px] · w-full
 *   rótulo      Inter Semi Bold 10px · #646464
 *
 * El rótulo va a la IZQUIERDA aunque el nodo lo marque `text-center`: la caja es
 * un `flex items-center` sin `justify-center` y el texto es su único hijo
 * `shrink-0`, así que queda pegado al `px-[17.5px]`. El nodo lo confirma —el
 * texto arranca en `x=17.5` sobre una caja de 954— y el `text-center` solo
 * afecta a un renglón que nunca se parte.
 *
 * El alto de 43px del nodo NO se fija: sale de `py-[15.5px]` más la línea de
 * 10px. Los 134px de la tarjeta salen de la misma suma.
 *
 * ES UN `<button>`, no un div: el diseño lo llama "recuadro" y su propio párrafo
 * dice "Presione el recuadro", así que es un control y tiene que ser operable con
 * teclado y anunciado como botón. Abre el modal de selección de residuo, que
 * todavía no tiene nodo de Figma.
 */

/** Texto del nodo `3765:38879`. */
export const WASTE_WITHDRAWAL_SECTION_TITLE = 'Residuo a retirar';

/**
 * Texto del nodo `3765:38881`, con comillas tipográficas como el diseño.
 *
 * OJO: el NOMBRE DE CAPA de ese nodo en Figma quedó viejo ("Solo se muestran
 * lotes con cantidad disponible may…"). El copy vigente es este, que es el que
 * devuelve el design context.
 */
export const WASTE_WITHDRAWAL_SECTION_DESCRIPTION =
  'Presione el recuadro “Seleccionar residuo” para ingresar el contenido del retiro.';

/** Rótulo del nodo `3765:38884`. */
export const WASTE_WITHDRAWAL_SELECT_LABEL = 'Seleccionar residuo';

interface WasteWithdrawalWasteSectionProps {
  /**
   * Lote confirmado. Con lote, el nodo `3765:38998` reemplaza el recuadro
   * punteado por la fila del lote en su estado ELEGIDO (`3765:39006`); sin lote
   * sigue el recuadro de `3765:38883`.
   *
   * El párrafo de la tarjeta NO cambia entre los dos estados —los nodos
   * `3765:38881` y `3765:39004` dicen lo mismo—, aunque hable de un recuadro que
   * ya no está. Es lo que declara el diseño y no se corrige por cuenta propia.
   */
  selectedLot?: WasteWithdrawableLot | null;
  /** Abre el modal de selección de residuo. */
  onSelect?: () => void;
}

export function WasteWithdrawalWasteSection({
  selectedLot = null,
  onSelect,
}: WasteWithdrawalWasteSectionProps) {
  return (
    <WarehouseFormCard
      icon={<WasteWithdrawalSectionIcon className="block h-[13.502px] w-[16.875px] shrink-0 text-[#131313]" />}
      title={WASTE_WITHDRAWAL_SECTION_TITLE}
      description={WASTE_WITHDRAWAL_SECTION_DESCRIPTION}
    >
      <div className="w-full pt-[16px]">
        {selectedLot ? (
          /*
           * La fila queda pulsable: es lo que ocupó el lugar del recuadro
           * "Seleccionar residuo", así que sigue siendo el control que abre el
           * selector — ahora para cambiar el lote.
           */
          <WasteWithdrawableLotRow
            selected
            lot={selectedLot}
            onSelect={onSelect}
            ariaLabel={`Cambiar residuo seleccionado: ${selectedLot.wasteType}`}
          />
        ) : (
          <button
            type="button"
            onClick={onSelect}
            className="flex w-full items-center rounded-[9px] border-[1.5px] border-dashed border-[#d1d1d1] bg-white px-[17.5px] py-[15.5px] text-left transition-colors hover:bg-[#f7f7f7]"
          >
            <span className="whitespace-nowrap text-center font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold not-italic leading-[normal] text-[#646464]">
              {WASTE_WITHDRAWAL_SELECT_LABEL}
            </span>
          </button>
        )}
      </div>
    </WarehouseFormCard>
  );
}
