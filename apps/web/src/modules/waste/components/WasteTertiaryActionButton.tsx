/**
 * Botón terciario del módulo de residuos — nodo `3083:11032` ("Ver respaldo
 * completo", pie del panel de detalle de un folio SIDREP).
 *
 * Geometría del design context:
 *
 *   botón   border #c5d8f0 · rounded-[var(--value/corner-radius/8px, 8px)]
 *           pt-[8.5px] pb-[9px]
 *   rótulo  Inter Bold 12px · var(--blue/800_cta, #24588b) · text-center
 *
 * El `pt-[8.5px] pb-[9px]` NO es simetría rota por capricho: el nodo pone el texto
 * en `top-[8.5px]` dentro de un botón de 34.5px de alto, y con los dos bordes de
 * 1px eso deja 9 abajo. Redondear a `py-[9px]` daría 35 y correría el pie del panel
 * medio píxel.
 *
 * NO ES UN TERCER TONO DE `WasteSecondaryActionButton`. Aquél lleva borde #d1d1d1,
 * texto #646464 y `px-[19px] py-[10px]`: es el "Cancelar" gris de las barras de
 * formulario. Éste es el par AZUL del módulo —`#c5d8f0` de borde con `#24588b` de
 * texto, el mismo que ya usan `WasteNoticeBanner` en tono `info` y el embudo de
 * "Filtros activos"— y no tiene padding horizontal: el nodo lo estira a todo el
 * ancho de su franja y centra el rótulo. Son dos botones distintos del sistema de
 * diseño, no dos variantes de uno.
 *
 * El hover pinta el fondo con `#e6f3ff`, la superficie que ya acompaña a ese borde
 * en el resto del módulo. El nodo no dibuja estados, así que se toma el par que el
 * sistema ya tiene en vez de inventar un color.
 */

interface WasteTertiaryActionButtonProps {
  label: string;
  onClick?: () => void;
  /**
   * Estira el botón a todo el ancho disponible. El nodo lo usa así —es
   * `flex-[1_0_0]` dentro del pie del panel—, pero la prop queda igual que en
   * `WasteSecondaryActionButton` para que el consumidor lo decida.
   */
  fullWidth?: boolean;
}

export function WasteTertiaryActionButton({
  label,
  onClick,
  fullWidth = false,
}: WasteTertiaryActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center rounded-[8px] border border-solid border-[#c5d8f0] pb-[9px] pt-[8.5px] transition-colors hover:bg-[#e6f3ff] ${
        fullWidth ? 'w-full' : 'px-[19px]'
      }`}
    >
      <span className="whitespace-nowrap text-center font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] text-[#24588b]">
        {label}
      </span>
    </button>
  );
}
