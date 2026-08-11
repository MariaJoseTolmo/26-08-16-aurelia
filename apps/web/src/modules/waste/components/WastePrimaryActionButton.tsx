import { WarehouseIntakeNewIcon } from '../icons/WarehouseIntakeIcons';

/**
 * Botón de acción principal de las barras de acciones del módulo de residuos —
 * nodos `3817:57823` ("Nueva recepción a bodega") y `3817:55662` ("Nueva
 * solicitud"). El mismo componente, con distinto rótulo.
 *
 *   botón   bg #c8a064 · rounded-[6px]
 *           flex gap-[7px] items-center px-[16px] py-[10.5px]
 *   icono   "+" 15 × 12 · white
 *   rótulo  Inter Bold 12px · white · text-center
 *
 * El icono es el mismo asset en ambos nodos —verificado byte a byte contra
 * `figma-3817-57824-new-intake-plus.svg`—, así que no se parametriza.
 */
interface WastePrimaryActionButtonProps {
  label: string;
  onClick?: () => void;
}

export function WastePrimaryActionButton({ label, onClick }: WastePrimaryActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 items-center gap-[7px] rounded-[6px] bg-[#c8a064] px-[16px] py-[10.5px] transition-colors hover:bg-[#bb9057]"
    >
      <WarehouseIntakeNewIcon className="block h-[12px] w-[15px] shrink-0 text-white" />
      <span className="whitespace-nowrap text-center font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] text-white">
        {label}
      </span>
    </button>
  );
}
