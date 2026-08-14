import type { ReactNode } from 'react';
import { WarehouseIntakeNewIcon } from '../icons/WarehouseIntakeIcons';

/**
 * Botón de acción principal de las barras de acciones del módulo de residuos —
 * nodos `3817:57823` ("Nueva recepción a bodega"), `3817:55662` ("Nueva
 * solicitud") y `3830:65730` ("Marcar como declarado"). El mismo componente, con
 * distinto rótulo.
 *
 *   botón   bg #c8a064 · rounded-[6px]
 *           flex gap-[7px] items-center px-[16px] py-[10.5px]
 *   icono   15 × 12 · white
 *   rótulo  Inter Bold 12px · white · text-center
 *
 * El "+" es el mismo asset en los dos primeros nodos —verificado byte a byte
 * contra `figma-3817-57824-new-intake-plus.svg`—, así que sigue siendo el glifo por
 * defecto. El tercero trae un tilde propio, y por eso el icono se parametriza.
 *
 * DESHABILITADO: `bg #e2e2e2` con texto e icono en `#acacac`, tal como declara
 * `3830:65730`. Es el único estado que dibuja ese nodo, y es el correcto: el
 * período de julio sigue en curso, así que todavía no hay nada que declarar.
 *
 * Ese gris es #e2e2e2 y no el #e3e3e3 de `WasteSidrepFormActions`. Es un punto de
 * diferencia entre dos nodos distintos y se respeta cada uno tal cual viene, en
 * vez de unificarlos por cuenta propia: el día que el sistema de diseño fije el
 * gris de deshabilitado, se cambia en los dos lugares con esa decisión hecha.
 */
interface WastePrimaryActionButtonProps {
  label: string;
  onClick?: () => void;
  /**
   * Glifo de la izquierda. Recibe el `className` con la caja y el tono ya
   * resueltos —incluido el gris del estado deshabilitado— y devuelve el icono, así
   * que quien lo pasa no tiene que conocer la paleta del botón.
   */
  icon?: (className: string) => ReactNode;
  disabled?: boolean;
  /** Explicación del bloqueo, como `title` del botón. */
  disabledHint?: string;
}

export function WastePrimaryActionButton({
  label,
  onClick,
  icon,
  disabled = false,
  disabledHint,
}: WastePrimaryActionButtonProps) {
  const iconClassName = `block h-[12px] w-[15px] shrink-0 ${disabled ? 'text-[#acacac]' : 'text-white'}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? disabledHint : undefined}
      className={`flex shrink-0 items-center gap-[7px] rounded-[6px] px-[16px] py-[10.5px] transition-colors ${
        disabled ? 'cursor-not-allowed bg-[#e2e2e2]' : 'bg-[#c8a064] hover:bg-[#bb9057]'
      }`}
    >
      {icon ? icon(iconClassName) : <WarehouseIntakeNewIcon className={iconClassName} />}
      <span
        className={`whitespace-nowrap text-center font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] ${
          disabled ? 'text-[#acacac]' : 'text-white'
        }`}
      >
        {label}
      </span>
    </button>
  );
}
