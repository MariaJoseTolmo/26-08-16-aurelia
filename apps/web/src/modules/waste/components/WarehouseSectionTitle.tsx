import type { ReactNode } from 'react';

/**
 * Título de sección de la vista, según el nodo `3686:25738`:
 * `flex gap-[8px] h-[21px] items-center pt-[4px] w-full`, con el icono en
 * 17.5 × 14 y el texto en Inter Bold 14px #131313.
 *
 * El Dashboard Residuos repite el MISMO título —icono 17.5 × 14, `gap-[8px]`,
 * `items-center`, Inter Bold 14px #131313— con otro espaciado superior
 * (`3086:13927`: `pt-[18px]`, sin alto fijo). Eso entra por `spacing` en vez de
 * un componente gemelo.
 */
interface WarehouseSectionTitleProps {
  icon: ReactNode;
  children: ReactNode;
  /**
   * `compact` (default) es el nodo `3686:25738`: `pt-[4px]` con `h-[21px]`.
   * `spaced` es el nodo `3086:13927`: `pt-[18px]` y alto derivado del texto.
   *
   * El alto fijo se mantiene SOLO en `compact` a propósito: las vistas de bodega
   * ya están calibradas contra esos 21px y sacárselo las movería por el redondeo
   * del alto de línea de Inter. En `spaced` no hace falta, porque el nodo tampoco
   * lo declara.
   */
  spacing?: 'compact' | 'spaced';
}

export function WarehouseSectionTitle({ icon, children, spacing = 'compact' }: WarehouseSectionTitleProps) {
  return (
    <div
      className={`flex w-full items-center gap-[8px] ${spacing === 'spaced' ? 'pt-[18px]' : 'h-[21px] pt-[4px]'}`}
    >
      <span className="block h-[14px] w-[17.5px] shrink-0 text-[#131313]">{icon}</span>
      <h2 className="shrink-0 whitespace-nowrap font-['Inter:Bold',sans-serif] text-[14px] font-bold not-italic leading-[normal] text-[#131313]">
        {children}
      </h2>
    </div>
  );
}
