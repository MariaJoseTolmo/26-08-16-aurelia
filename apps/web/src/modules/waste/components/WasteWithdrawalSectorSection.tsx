import { WasteWithdrawalSectorIcon } from '../icons/WasteWithdrawalFormIcons';
import { WASTE_WITHDRAWAL_SECTOR_OPTIONS } from '../wasteWithdrawalSectors';
import { WarehouseFormCard } from './WarehouseFormCard';

/**
 * Tarjeta "Sector" de la nueva solicitud del retirador — nodo `4217:7221`.
 *
 * La caja es `WarehouseFormCard` sin cambios: el nodo declara la misma tarjeta
 * que el resto del módulo —bg white · border #e3e3e3 · rounded-[10px] ·
 * px-[25px] py-[21px], Heading 3 con icono de 16.875 × 13.5 e Inter Bold 13.5px
 * #131313, párrafo `pt-[3px]` en Inter Regular 11.5px #646464—.
 *
 * SELECTOR (`4218:7536`), lo único nuevo:
 *
 *   bandeja  bg #f6faff · border #d1d1d1 · rounded-[8px] · w-full
 *            flex gap-[4px] items-start · p-[4px]
 *   chip     `4218:7537` / `4218:7538`
 *            bg white · border #d1d1d1 · rounded-[8px]
 *            flex gap-[4px] items-center · px-[8px] py-[4.5px]
 *            Inter Regular 14px · leading-[22.7px] · tracking-[0.28px] · #131313
 *
 * El `gap-[8px]` que separa el encabezado del selector lo pone este componente
 * con un `pt-[8px]`, y no el `bodyGap` de la tarjeta: el nodo agrupa Heading 3 y
 * párrafo en un contenedor propio (`4218:7550`) y aplica el gap ENTRE ese grupo y
 * el selector. Con `bodyGap` el mismo gap se metería también entre el título y su
 * párrafo, que en el nodo están separados por los 3px de siempre.
 *
 * EL ESTADO ELEGIDO lo dibuja el nodo `4223:9890` ("Truckshop" elegido):
 * `bg-[#e6f3ff]` (`--blue/100_surf`) con `border-[#73a9dc]` (`--blue/600`). La
 * superficie es la misma azul que el módulo ya usa para "esto quedó elegido"
 * —`WasteWithdrawableLotRow`, nodo `3765:40823`—, pero el BORDE no: allá es el
 * navy `#001e39` y acá es este azul medio. Se respeta el de cada nodo.
 *
 * El peso de la tipografía NO cambia entre estados, y el nodo lo confirma: los
 * dos chips van en Inter Regular 14px. Pasar el elegido a Semi Bold lo
 * ensancharía y correría de lugar al que tiene al lado.
 *
 * Son `<button aria-pressed>` y no radios: es la convención que ya fijó
 * `WasteWithdrawableLotRow`, que también es una selección única.
 */

/** Texto del nodo `4217:7225`. */
export const WASTE_WITHDRAWAL_SECTOR_TITLE = 'Sector';

/**
 * Texto del nodo `4217:7227`, sin el espacio final con el que viene de Figma
 * —es un resto de tipeo y el HTML no lo muestra—.
 */
export const WASTE_WITHDRAWAL_SECTOR_DESCRIPTION = 'Seleccione el sector proveniente del retiro';

interface WasteWithdrawalSectorSectionProps {
  /** Sector elegido, o `null` mientras no se elige ninguno. */
  value: string | null;
  onChange: (value: string) => void;
}

export function WasteWithdrawalSectorSection({ value, onChange }: WasteWithdrawalSectorSectionProps) {
  return (
    <WarehouseFormCard
      icon={<WasteWithdrawalSectorIcon className="block h-[13.5px] w-[16.875px] shrink-0 text-[#131313]" />}
      title={WASTE_WITHDRAWAL_SECTOR_TITLE}
      description={WASTE_WITHDRAWAL_SECTOR_DESCRIPTION}
    >
      <div className="w-full pt-[8px]">
        <div
          className="flex w-full items-start gap-[4px] rounded-[8px] border border-solid border-[#d1d1d1] bg-[#f6faff] p-[4px]"
          data-name="Selector"
        >
          {WASTE_WITHDRAWAL_SECTOR_OPTIONS.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(option.value)}
                className={`flex shrink-0 items-center gap-[4px] rounded-[8px] border border-solid px-[8px] py-[4.5px] transition-colors ${
                  selected ? 'border-[#73a9dc] bg-[#e6f3ff]' : 'border-[#d1d1d1] bg-white hover:bg-[#f7f7f7]'
                }`}
                data-name="Chips"
              >
                <span className="whitespace-nowrap font-['Inter:Regular',sans-serif] text-[14px] font-normal not-italic leading-[22.7px] tracking-[0.28px] text-[#131313]">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </WarehouseFormCard>
  );
}
