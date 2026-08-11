import type { ReactNode } from 'react';
import { WarehouseActiveFiltersIcon } from '../icons/WarehouseIntakeIcons';

/**
 * Panel azul "Filtros activos:" y su pastilla — nodos `3817:57802` (Ingresos a
 * bodega) y `3817:55646` (Solicitud de retiro), que son el mismo componente.
 *
 * Geometría del design context, idéntica en ambos nodos:
 *
 *   panel     bg #eff4ff · flex-[1_0_0] min-w-px · sin radio (rectángulo a sangre)
 *             interior flex gap-[10px] items-center px-[14px] py-[10px]
 *   embudo    12.5 × 10 · #24588b
 *   rótulo    "Filtros activos:" Inter Semi Bold 11px #0d3862
 *   pastilla  bg #e6f3ff · border #b4d1ed · rounded-[4px]
 *             flex gap-[5px] items-center px-[9px] py-[3px]
 *             texto Inter Semi Bold 10px #0d3862
 *             "×" Arial Regular 10px · leading-[10px] · caja de 6px de ancho
 *
 * El panel no decide cuándo mostrarse ni qué pastillas hay: recibe hijos. Cada
 * vista tiene su propio modelo de filtros —fecha en "Ingresos a bodega", mes en
 * "Solicitud de retiro"— y tipar sus claves acá obligaría a degradarlas a
 * `string`, que es justo lo que evita que un filtro inexistente compile.
 */
export function WasteActiveFiltersPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-[10px] bg-[#eff4ff] px-[14px] py-[10px]">
      <div className="flex shrink-0 items-center gap-[6px]">
        <WarehouseActiveFiltersIcon className="block h-[10px] w-[12.5px] shrink-0 text-[#24588b]" />
        <p className="whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold not-italic leading-[normal] text-[#0d3862]">
          Filtros activos:
        </p>
      </div>
      {children}
    </div>
  );
}

interface WasteActiveFilterChipProps {
  label: string;
  /** Sin `onEdit` la etiqueta es texto: solo los filtros editables en la barra lo traen. */
  onEdit?: () => void;
  onRemove: () => void;
}

export function WasteActiveFilterChip({ label, onEdit, onRemove }: WasteActiveFilterChipProps) {
  const labelClass =
    "whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold not-italic leading-[normal] text-[#0d3862]";

  return (
    <span className="flex shrink-0 items-center gap-[5px] rounded-[4px] border border-solid border-[#b4d1ed] bg-[#e6f3ff] px-[9px] py-[3px]">
      {onEdit ? (
        <button type="button" onClick={onEdit} className={labelClass}>
          {label}
        </button>
      ) : (
        <span className={labelClass}>{label}</span>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar filtro ${label}`}
        className="flex w-[6px] shrink-0 flex-col items-center justify-center"
      >
        {/*
          Los nodos `3817:57810` y `3817:55654` usan Arial y no Inter: es el glifo
          "×" del set del sistema, con leading igual a su tamaño para que quede
          centrado en 10px.
        */}
        <span aria-hidden className="whitespace-nowrap text-center font-['Arial',sans-serif] text-[10px] font-normal not-italic leading-[10px] text-[#0d3862]">
          ×
        </span>
      </button>
    </span>
  );
}
