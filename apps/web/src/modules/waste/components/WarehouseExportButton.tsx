import { useEffect, useRef, useState } from 'react';
import type { WasteExportFormat } from '../../../shared/services/waste-warehouse-export.service';
import { WarehouseCaretDownIcon, WarehouseExportIcon } from '../icons/WarehouseControlIcons';

/**
 * Botón "Exportar" del módulo de residuos — nodos `3817:58610` (Control de
 * bodega) y `3817:57812` (Ingresos a bodega), que son el mismo componente:
 *
 *   botón   h-[36px] · border-[1.5px] #d1d1d1 · rounded-[8px] · bg white
 *           interior flex gap-[6px] items-center px-[13.5px] py-[1.5px]
 *           iconos 15 × 12 y 12.5 × 10 · label Inter Semi Bold 12px #333
 *
 * Salió de `WarehouseControlIntro`, donde vivía mezclado con el párrafo de la
 * vista. Al necesitarlo "Ingresos a bodega" se extrajo en vez de copiarlo: el
 * caret del diseño abre un menú de formatos, y ese comportamiento —cierre por
 * click afuera y por Escape, estado de "generando"— no debería existir dos veces.
 *
 * El menú es un popover propio y no un `<select>`, así que ese cierre hay que
 * implementarlo a mano.
 */

export interface WarehouseExportOption {
  format: WasteExportFormat;
  label: string;
}

/** Texto del botón mientras la API renderiza. */
const BUSY_LABELS: Record<WasteExportFormat, string> = {
  pdf: 'Generando PDF…',
  xlsx: 'Generando Excel…',
};

interface WarehouseExportButtonProps {
  options: WarehouseExportOption[];
  onExport?: (format: WasteExportFormat) => void;
  /** Formato en curso, para bloquear el botón mientras la API responde. */
  exporting?: WasteExportFormat | null;
  /**
   * Bloquea el botón cuando la vista todavía no tiene de dónde exportar.
   *
   * Sin esto la única alternativa era dejarlo activo con un menú cuyas opciones
   * no hacen nada, que es peor: el diseño no distingue "exportar" de "exportar
   * pero todavía no", y un control muerto es más engañoso que uno deshabilitado.
   */
  disabled?: boolean;
  /** Explicación del bloqueo, como `title` del botón. */
  disabledHint?: string;
}

export function WarehouseExportButton({
  options,
  onExport,
  exporting = null,
  disabled = false,
  disabledHint,
}: WarehouseExportButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const isExporting = exporting !== null;
  const isBlocked = isExporting || disabled;

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        disabled={isBlocked}
        title={disabled ? disabledHint : undefined}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex h-[36px] shrink-0 items-center gap-[6px] rounded-[8px] border-[1.5px] border-solid border-[#d1d1d1] bg-white px-[13.5px] py-[1.5px] transition-colors hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {/*
          Alto natural del asset (12.4219) en vez de los 12px de la caja: con 12px
          `preserveAspectRatio` encogería el glifo a 14.49px de ancho. El nodo
          `3817:58611` también lo desborda, con `inset-[0_0_-3.52%_0]`.
        */}
        <WarehouseExportIcon className="block h-[12.4219px] w-[15px] shrink-0 text-[#333333]" />
        <span className="whitespace-nowrap text-center font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold not-italic leading-[normal] text-[#333333]">
          {exporting ? BUSY_LABELS[exporting] : 'Exportar'}
        </span>
        <WarehouseCaretDownIcon className="block h-[10px] w-[12.5px] shrink-0 text-[#131313]" />
      </button>

      {menuOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-[40px] z-[10] flex w-[180px] flex-col overflow-hidden rounded-[8px] border border-solid border-[#e3e3e3] bg-white py-[4px] shadow-[0_6px_16px_rgba(0,0,0,0.1)]"
        >
          {options.map((option) => (
            <button
              key={option.format}
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onExport?.(option.format);
              }}
              className="w-full px-[12px] py-[7px] text-left font-['Inter:Regular',sans-serif] text-[12px] font-normal text-[#131313] transition-colors hover:bg-[#f0f4f8]"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
