import type { ReactNode } from 'react';

/**
 * Título de sección de la vista, según el nodo `3686:25738`:
 * `flex gap-[8px] h-[21px] items-center pt-[4px] w-full`, con el icono en
 * 17.5 × 14 y el texto en Inter Bold 14px #131313.
 */
interface WarehouseSectionTitleProps {
  icon: ReactNode;
  children: ReactNode;
}

export function WarehouseSectionTitle({ icon, children }: WarehouseSectionTitleProps) {
  return (
    <div className="flex h-[21px] w-full items-center gap-[8px] pt-[4px]">
      <span className="block h-[14px] w-[17.5px] shrink-0 text-[#131313]">{icon}</span>
      <h2 className="shrink-0 whitespace-nowrap font-['Inter:Bold',sans-serif] text-[14px] font-bold not-italic leading-[normal] text-[#131313]">
        {children}
      </h2>
    </div>
  );
}
