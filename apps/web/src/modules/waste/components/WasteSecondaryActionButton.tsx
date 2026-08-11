/**
 * Botón secundario de las barras de acciones del módulo de residuos — nodos
 * `3564:1403` ("Cancelar", en "Nueva recepción a bodega") y `3765:38886`
 * ("Cancelar retiro", en "Nueva solicitud de retiro"). El mismo componente, con
 * distinto rótulo.
 *
 *   botón   border #d1d1d1 · rounded-[8px]
 *           flex flex-col items-center justify-center · px-[19px] py-[10px]
 *   rótulo  Inter Bold 12px · #646464 · text-center
 *
 * No es `WastePrimaryActionButton` con otro color: aquel es el dorado `#c8a064`
 * con icono "+", `rounded-[6px]` y `px-[16px] py-[10.5px]`. Son dos botones
 * distintos del sistema de diseño, no dos variantes de uno.
 *
 * El `flex flex-col` del nodo se conserva aunque el rótulo sea un único hijo: es
 * lo que declara Figma y no cambia el render.
 */
interface WasteSecondaryActionButtonProps {
  label: string;
  onClick?: () => void;
  /**
   * Estira el botón a todo el ancho disponible. Lo pide el pie del modal
   * `3765:40677`, donde el botón es `flex-[1_0_0]` y comparte la fila en mitades
   * con el primario; en las barras de formulario va al tamaño de su contenido.
   */
  fullWidth?: boolean;
}

export function WasteSecondaryActionButton({ label, onClick, fullWidth = false }: WasteSecondaryActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-[8px] border border-solid border-[#d1d1d1] px-[19px] py-[10px] transition-colors hover:bg-[#f7f7f7] ${fullWidth ? 'w-full' : ''}`}
    >
      <span className="whitespace-nowrap text-center font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] text-[#646464]">
        {label}
      </span>
    </button>
  );
}
