import { useEffect, useRef, useState } from 'react';
import type { WarehouseControlExportFormat } from '../../../shared/services/waste-warehouse-export.service';
import { WarehouseExportCaretIcon, WarehouseExportIcon } from '../icons/WarehouseControlIcons';

/**
 * Párrafo introductorio y botón "Exportar" — nodos `3686:25704` / `3686:25705`
 * y `3817:58610`.
 *
 *   fila     flex gap-[24px] items-center pt-[4px] w-full
 *   texto    Inter Regular 12.5px · leading-[18.75px] · #646464
 *   botón    h-[36px] · border-[1.5px] #d1d1d1 · rounded-[8px] · bg white
 *            interior: flex gap-[6px] items-center px-[13.5px] py-[1.5px]
 *            iconos 15 × 12 y 12.5 × 10 · label Inter Semi Bold 12px #333
 */
export const WAREHOUSE_CONTROL_DESCRIPTION =
  'Gestiona los lotes de residuos almacenados transitoriamente. Los residuos peligrosos tienen un plazo máximo de 6 meses de almacenamiento.';

interface WarehouseControlIntroProps {
  description?: string;
  /** Dispara la exportación. El caret del diseño abre el menú de formatos. */
  onExport?: (format: WarehouseControlExportFormat) => void;
  /** Formato en curso, para bloquear el botón mientras la API renderiza. */
  exporting?: WarehouseControlExportFormat | null;
  /** Mensaje de error de la última exportación fallida. */
  exportError?: string | null;
}

const FORMAT_OPTIONS: Array<{ format: WarehouseControlExportFormat; label: string }> = [
  { format: 'pdf', label: 'Descargar PDF (A4)' },
  { format: 'xlsx', label: 'Descargar Excel' },
];

export function WarehouseControlIntro({
  description = WAREHOUSE_CONTROL_DESCRIPTION,
  onExport,
  exporting = null,
  exportError = null,
}: WarehouseControlIntroProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cierre por click afuera y por Escape: el menú es un popover propio, no un
  // <select>, así que ese comportamiento hay que implementarlo.
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

  return (
    <div className="flex w-full flex-wrap items-center gap-[24px] pt-[4px]">
      <div className="min-w-0 flex-1">
        <p className="font-['Inter:Regular',sans-serif] text-[12.5px] font-normal not-italic leading-[18.75px] text-[#646464]">
          {description}
        </p>
        {exportError ? (
          <p role="alert" className="pt-[4px] font-['Inter:Regular',sans-serif] text-[11.5px] font-normal text-[#bd3b5b]">
            {exportError}
          </p>
        ) : null}
      </div>

      <div ref={containerRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          disabled={isExporting}
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
            {exporting === 'pdf' ? 'Generando PDF…' : exporting === 'xlsx' ? 'Generando Excel…' : 'Exportar'}
          </span>
          <WarehouseExportCaretIcon className="block h-[10px] w-[12.5px] shrink-0 text-[#131313]" />
        </button>

        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-[40px] z-[10] flex w-[180px] flex-col overflow-hidden rounded-[8px] border border-solid border-[#e3e3e3] bg-white py-[4px] shadow-[0_6px_16px_rgba(0,0,0,0.1)]"
          >
            {FORMAT_OPTIONS.map((option) => (
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
    </div>
  );
}
