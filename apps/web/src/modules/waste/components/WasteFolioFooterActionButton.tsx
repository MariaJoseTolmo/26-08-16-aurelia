import type { ReactNode } from 'react';

/**
 * Acción principal del PIE del panel de detalle de un folio SIDREP — nodo
 * `3081:7977` ("Registrar cierre", pestaña "Abiertos").
 *
 * Geometría del design context:
 *
 *   botón   bg #c8a064 · rounded-[8px] · `flex-[1_0_0] h-full` en un pie de 34.5px
 *           contenido centrado · gap-[6px]
 *   icono   15 × 12 · white
 *   rótulo  Inter Bold 12px · white · text-center
 *
 * ES EL HERMANO DORADO DE `WasteTertiaryActionButton`, no una variante de
 * `WastePrimaryActionButton`. Los dos ocupan la MISMA franja —el pie del panel, 34.5px
 * de alto y a todo el ancho, con `rounded-[8px]`— y por eso comparten medidas; lo que
 * cambia entre ellos es el peso de la acción: el azul de borde para "Ver respaldo
 * completo", que sólo mira, y el dorado macizo para "Registrar cierre", que escribe.
 *
 * El primario de las BARRAS es otro botón: `rounded-[6px]` con `px-[16px] py-[10.5px]`,
 * `gap-[7px]` y al tamaño de su contenido. Reusarlo acá pedía condicionar el radio, el
 * padding, el gap y el ancho a la vez —cuatro ejes—, con lo que el componente habría
 * dejado de decir qué botón es.
 *
 * EL ALTO SÍ VA FIJO Y ES DELIBERADO. El nodo declara el botón `h-full` dentro de un
 * pie de 34.5px, así que la medida es del diseño y no de un texto: con padding vertical
 * el botón crecería con el `line-height` heredado y el pie dejaría de coincidir con el
 * del panel de la pestaña "Cerrados", que llega a los mismos 34.5px por otro camino
 * (`pt-[8.5px] pb-[9px]` más dos bordes). El brief prohíbe anchos fijos de layout, no
 * altos de control.
 *
 * DESHABILITADO: `bg #e2e2e2` con texto e icono en `#acacac`, el mismo par que ya usa
 * `WastePrimaryActionButton`. El nodo del pie del panel no lo dibuja —entra con el botón
 * activo— pero el nodo `4230:13314`, el "Confirmar cierre" del modal de cierre, SÍ: es el
 * estado con el que el formulario abre.
 *
 * ES TAMBIÉN EL PRIMARIO DEL PIE DE LOS MODALES del módulo (`4230:13314` y `4319:34845`),
 * y ahí el nodo lo dibuja al tamaño de su contenido en vez de a todo el ancho: mismo alto
 * de 34.5, mismo radio, mismo par de colores, mismo glifo de 15 × 12 y mismo texto Inter
 * Bold 12px, con `px-[16px]` y el mismo `gap-[6px]`. Es un solo eje —`fullWidth`— y no un
 * segundo botón, porque todo lo demás coincide.
 *
 * Y ES TAMBIÉN EL "RECHAZAR" de "Pendientes de revisión" (`3073:6084`), que comparte la
 * franja con el "Aprobar y generar folio" (`3073:6088`) — ver `WasteFolioFooterActionTone`.
 */

/**
 * Qué tan grave es la acción del pie. LA GEOMETRÍA ES LA MISMA EN LOS DOS TONOS y por eso
 * es una prop y no otro botón: los nodos `3073:6084` y `3073:6088` conviven en la misma
 * franja de 34.5px, con el mismo `rounded-[8px]`, el mismo glifo de 15 × 12, el mismo
 * `gap-[6px]` —medido: 15 + 6 + 56 = 77 centrados en 214.13 dan el `left-[68.01px]` del
 * icono— y el mismo rótulo Inter Bold 12px centrado. Lo único que cambia es la piel.
 *
 *   `primary`  `3081:7977` / `3073:6088`  macizo dorado #c8a064 · glifo y rótulo blancos
 *   `danger`   `3073:6084`                borde #ffd0db · sin fondo · glifo y rótulo #bd3b5b
 *
 * `danger` NO ES `WasteSecondaryActionButton` con otro color: aquél es el "Cancelar" gris
 * de las barras de formulario, con `px-[19px] py-[10px]`, sin icono y sin alto fijo. Éste
 * vive en el pie del panel, mide 34.5 y lleva la "X".
 *
 * El par #ffd0db / #bd3b5b ya está en el módulo —es el borde y el texto rojo que
 * `WasteFolioNotice` usa en tono `danger`—, así que el hover pinta el fondo con ese mismo
 * `#ffd0db` en vez de inventar un color. El nodo no dibuja estados.
 */
export type WasteFolioFooterActionTone = 'primary' | 'danger';

interface WasteFolioFooterActionButtonProps {
  label: string;
  onClick?: () => void;
  /** Por defecto `primary`, que fue el primero y es el mayoritario en el módulo. */
  tone?: WasteFolioFooterActionTone;
  /**
   * `true` —el pie del panel de detalle— ocupa todo el ancho. `false` —el pie de un
   * modal, donde acompaña al "Cancelar"— queda al tamaño de su contenido con el
   * `px-[16px]` del nodo.
   */
  fullWidth?: boolean;
  /**
   * `submit` para el primario de un modal montado como `<form>`: así Enter en cualquier
   * campo dispara la misma acción que el botón.
   */
  type?: 'button' | 'submit';
  /**
   * Glifo de la izquierda. Recibe el `className` con la caja y el tono ya resueltos
   * —incluido el gris del estado deshabilitado— y devuelve el icono, así que quien lo
   * pasa no tiene que conocer la paleta del botón. Misma firma que
   * `WastePrimaryActionButton`.
   */
  icon?: (className: string) => ReactNode;
  disabled?: boolean;
  /** Explicación del bloqueo, como `title` del botón. */
  disabledHint?: string;
}

/**
 * El deshabilitado del tono `danger` NO se apaga a `#e2e2e2` macizo: un botón de borde
 * apagado a fondo lleno cambia de forma al deshabilitarse. Conserva la caja de borde y
 * lleva el mismo `#e2e2e2` que el otro tono, pero como BORDE, con el gris `#acacac` que
 * el módulo ya usa para el texto inactivo.
 */
const ACTION_TONE: Record<WasteFolioFooterActionTone, { enabled: string; disabled: string; ink: string }> = {
  primary: {
    enabled: 'bg-[#c8a064] hover:bg-[#bb9057]',
    disabled: 'bg-[#e2e2e2]',
    ink: 'text-white',
  },
  danger: {
    enabled: 'border border-solid border-[#ffd0db] hover:bg-[#ffd0db]',
    disabled: 'border border-solid border-[#e2e2e2]',
    ink: 'text-[#bd3b5b]',
  },
};

export function WasteFolioFooterActionButton({
  label,
  onClick,
  tone = 'primary',
  fullWidth = true,
  type = 'button',
  icon,
  disabled = false,
  disabledHint,
}: WasteFolioFooterActionButtonProps) {
  const skin = ACTION_TONE[tone];
  const ink = disabled ? 'text-[#acacac]' : skin.ink;
  const iconClassName = `block h-[12px] w-[15px] shrink-0 ${ink}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={disabled ? disabledHint : undefined}
      className={`flex h-[34.5px] items-center justify-center gap-[6px] rounded-[8px] transition-colors ${
        fullWidth ? 'w-full' : 'shrink-0 px-[16px]'
      } ${disabled ? `cursor-not-allowed ${skin.disabled}` : skin.enabled}`}
    >
      {icon ? icon(iconClassName) : null}
      <span
        className={`whitespace-nowrap text-center font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] ${ink}`}
      >
        {label}
      </span>
    </button>
  );
}
