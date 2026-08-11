import { WarehouseHazardousIcon, WarehouseNonHazardousIcon } from '../icons/WarehouseTableIcons';
import { formatQuantity } from '../wasteFilterPrimitives';
import { formatLotMeta, type WasteWithdrawableLot } from '../wasteWithdrawableLots';

/**
 * Fila de lote retirable. Aparece en DOS lugares con la misma maqueta:
 *
 *   `3765:40603` y hermanas  lista del modal de selección (sin elegir)
 *   `3765:40823`             lista del modal, fila elegida
 *   `3765:39006`             tarjeta "Residuo a retirar" del formulario, ya con
 *                            lote confirmado — usa el estado ELEGIDO
 *
 * Geometría del nodo:
 *
 *   caja        border-[1.5px] · rounded-[9px] · flex gap-[24px] items-center
 *               px-[15.5px] py-[14.5px] · w-full
 *   sin elegir  bg white · border #e3e3e3
 *   elegida     bg #e6f3ff · border #001e39
 *   icono       caja 34 × 34 · rounded-[8px] · glifo 16.25 × 13
 *   nombre      Inter Bold 13px #131313 · nowrap
 *   pastilla    rounded-[20px] · px-[8px] py-[2px] · Inter Bold 9.5px
 *               en un contenedor con pl-[6px]
 *   detalle     pt-[2px] · Inter Regular 11px #646464 · w-full (envuelve)
 *   saldo       número Inter Bold 15px #131313 · unidad Inter Semi Bold 9.5px
 *               #646464 uppercase, las dos alineadas a la derecha
 *
 * La paleta del icono y de la pastilla sale de `isHazardous` y son los dos pares
 * exactos de `WasteHazardBadge`: rojo `#ffd0db`/`#570b1d` y azul
 * `#e6f3ff`/`#0d3862`. El glifo tampoco es un asset nuevo: es el de esa pastilla
 * escalado 1.3× (ver la nota de `WasteWithdrawalFormIcons`).
 *
 * OJO con un caso que el diseño no dibuja: en un lote NO peligroso la caja del
 * icono y la pastilla también son `#e6f3ff`, así que al elegirlo quedan del mismo
 * color que el fondo de la fila y se ven "planas". Es lo que declaran los nodos
 * —los dos usan la misma superficie azul— y no se corrige por cuenta propia.
 *
 * Es un `<button>` con `aria-pressed` y no un div: en el modal elegir un lote es
 * la acción central, y en la tarjeta del formulario la fila es lo que reemplazó al
 * recuadro "Seleccionar residuo", así que sigue siendo el control que abre el
 * selector.
 */
interface WasteWithdrawableLotRowProps {
  lot: WasteWithdrawableLot;
  selected: boolean;
  onSelect?: () => void;
  /** Nombre accesible cuando la fila no es una alternativa de una lista. */
  ariaLabel?: string;
}

export function WasteWithdrawableLotRow({
  lot,
  selected,
  onSelect,
  ariaLabel,
}: WasteWithdrawableLotRowProps) {
  const surface = lot.isHazardous ? 'bg-[#ffd0db]' : 'bg-[#e6f3ff]';
  const badgeText = lot.isHazardous ? 'text-[#570b1d]' : 'text-[#0d3862]';
  const Icon = lot.isHazardous ? WarehouseHazardousIcon : WarehouseNonHazardousIcon;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={`flex w-full items-center gap-[24px] rounded-[9px] border-[1.5px] border-solid px-[15.5px] py-[14.5px] text-left transition-colors ${
        selected ? 'border-[#001e39] bg-[#e6f3ff]' : 'border-[#e3e3e3] bg-white hover:border-[#d1d1d1]'
      }`}
    >
      <span className="flex min-w-px flex-1 items-center gap-[12px]">
        <span className={`flex size-[34px] shrink-0 items-center justify-center rounded-[8px] ${surface}`}>
          {/* 16.25 × 13 = el glifo de 12.5 × 10 escalado 1.3×, que es lo que declara el nodo. */}
          <Icon className={`block h-[13px] w-[16.25px] shrink-0 ${badgeText}`} />
        </span>
        <span className="flex min-w-px flex-1 flex-col items-start">
          <span className="flex w-full items-center">
            <span className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[13px] font-bold not-italic leading-[normal] text-[#131313]">
              {lot.wasteType}
            </span>
            <span className="shrink-0 pl-[6px]">
              <span
                className={`flex items-center rounded-[20px] px-[8px] py-[2px] ${surface} whitespace-nowrap font-['Inter:Bold',sans-serif] text-[9.5px] font-bold not-italic leading-[normal] ${badgeText}`}
              >
                {lot.categoryCode}
              </span>
            </span>
          </span>
          <span className="w-full pt-[2px] font-['Inter:Regular',sans-serif] text-[11px] font-normal not-italic leading-[normal] text-[#646464]">
            {formatLotMeta(lot)}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <span className="text-right font-['Inter:Bold',sans-serif] text-[15px] font-bold not-italic leading-[18px] text-[#131313]">
          {formatQuantity(lot.availableQuantity)}
        </span>
        <span className="whitespace-nowrap text-right font-['Inter:Semi_Bold',sans-serif] text-[9.5px] font-semibold not-italic uppercase leading-[normal] text-[#646464]">
          {lot.unitLabel} disp.
        </span>
      </span>
    </button>
  );
}
