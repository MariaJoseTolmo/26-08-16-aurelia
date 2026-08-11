import { useEffect, useRef, useState } from 'react';
import { WarehouseTableCaretIcon } from '../icons/WarehouseTableIcons';
import { formatIsoMonthLabel } from '../wasteMonthFilter';
import { WarehouseMonthPicker } from './WarehouseMonthPicker';

/**
 * Campo del filtro "Período": la celda que se ve en la fila de filtros y que
 * despliega el selector de meses del nodo `4068:75846`.
 *
 * El shell es el mismo de los otros filtros de columna del módulo —bg white ·
 * border #d1d1d1 · rounded-[8px] · h-[26px] · px-[8px] · gap-[8px] · texto Inter
 * Regular 13px #131313 · caret en caja de 16 × 16—, verificado contra
 * `WarehouseSelectFilterField` y `WarehouseDateFilterField`, que lo sacaron de
 * los nodos `3817:57451` y `3817:57422`.
 *
 * El popover se cierra por click afuera y por Escape, el mismo mecanismo que
 * `WarehouseExportButton`: no hay radix ni shadcn/ui en `apps/web`, así que ese
 * comportamiento va a mano.
 */

interface WarehouseMonthFilterFieldProps {
  /** Mes aplicado en ISO `yyyy-mm`, o `null` cuando el filtro está vacío. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Lectura única de "hoy" de la vista, para los años que ofrece el selector. */
  today: Date;
  label: string;
  /** Texto de la celda sin filtro aplicado. */
  placeholder?: string;
  className?: string;
}

export function WarehouseMonthFilterField({
  value,
  onChange,
  today,
  label,
  placeholder = 'Todos',
  className = '',
}: WarehouseMonthFilterFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const appliedLabel = formatIsoMonthLabel(value);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        className="flex h-[26px] w-full items-center gap-[8px] overflow-hidden rounded-[8px] border border-solid border-[#d1d1d1] bg-white px-[8px] transition-colors hover:bg-[#f7f7f7]"
      >
        <span
          className={`min-w-0 flex-1 truncate text-left font-['Inter:Regular',sans-serif] text-[13px] font-normal not-italic leading-[normal] ${
            appliedLabel ? 'text-[#131313]' : 'text-[#8a8a8a]'
          }`}
        >
          {appliedLabel ?? placeholder}
        </span>
        {/*
          Mismo caret y misma corrección de orientación que
          `WarehouseSelectFilterField`: el asset viene apuntando hacia arriba.
        */}
        <span className="flex size-[16px] shrink-0 items-center justify-center">
          <WarehouseTableCaretIcon className="block h-[6px] w-[10px] -scale-y-100 text-[#131313]" />
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 top-[30px] z-[20]">
          <WarehouseMonthPicker
            value={value}
            today={today}
            onClose={() => setOpen(false)}
            onChange={(month) => {
              // Volver a elegir el mes aplicado limpia el filtro: es la única
              // forma de vaciarlo, porque el nodo no dibuja un "Todos".
              onChange(month === value ? null : month);
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
