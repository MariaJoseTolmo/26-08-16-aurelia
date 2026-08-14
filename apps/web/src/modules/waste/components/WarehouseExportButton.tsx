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
 *
 * EL MENÚ AHORA TIENE NODO. Hasta "Reporte SINADER" su aspecto estaba inventado
 * —no había ningún frame del archivo que lo dibujara— y se resolvía con un panel
 * de 180px, texto de 12px y una sombra a ojo. `4304:31205` lo define:
 *
 *   panel  bg white · border #d1d1d1 · rounded-[12px] · p-[8px]
 *          sombra Shadow_S: 0 4px 8px rgba(19,19,19,0.24)
 *   ítem   h-[40px] · rounded-[8px] · px-[8px] · gap-[8px]
 *          Inter Regular 14px / 22.7px · tracking-[0.28px] · #131313
 *
 * El cambio alcanza a las cuatro vistas que usan el botón, que es lo correcto: es
 * UN componente del sistema de diseño y el nodo es la primera especificación real
 * que tuvo.
 */

/**
 * Rótulos del nodo `4304:31205`. Antes cada vista pasaba el suyo ("Descargar
 * Excel", "Exportar a PDF") y decían cosas distintas para la misma acción; ahora
 * el default sale de acá y `label` queda sólo para el caso que necesite apartarse.
 */
export const WASTE_EXPORT_FORMAT_LABELS: Record<WasteExportFormat, string> = {
  xlsx: 'Excel (.xlsx)',
  pdf: 'PDF (.pdf)',
};

export interface WarehouseExportOption {
  format: WasteExportFormat;
  /** Por defecto, el rótulo del nodo para ese formato. */
  label?: string;
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
  /**
   * Hacia dónde abre el menú.
   *
   * `down` es el default y sirve mientras el botón esté en la parte de arriba de
   * la vista, que es donde lo tienen "Control de bodega", "Ingresos a bodega",
   * "Solicitud de retiro" e "Histórico".
   *
   * `up` lo necesita "Reporte SINADER": ahí el botón vive en la barra del PIE
   * (`3830:65721`), así que un menú hacia abajo se dibuja por debajo del borde de
   * la ventana y lo recorta el `overflow-hidden` de la página. Abrir hacia arriba
   * es además lo que hace cualquier menú pegado al borde inferior.
   */
  placement?: 'down' | 'up';
}

export function WarehouseExportButton({
  options,
  onExport,
  exporting = null,
  disabled = false,
  disabledHint,
  placement = 'down',
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
        /*
         * `min-w-[180px]` y no un ancho fijo: el nodo mide 191px con "Excel
         * (.xlsx)" adentro, o sea que ese ancho es el del contenido más el padding,
         * no una restricción. Con `min-w` el panel nunca queda más angosto que el
         * botón y crece si un rótulo es más largo.
         */
        <div
          role="menu"
          className={`absolute right-0 z-[10] flex min-w-[180px] flex-col rounded-[12px] border border-solid border-[#d1d1d1] bg-white p-[8px] shadow-[0_4px_8px_rgba(19,19,19,0.24)] ${
            /*
             * Clases literales y no `${placement === 'up' ? 'bottom' : 'top'}-[40px]`:
             * Tailwind no puede generar una clase a partir de un valor de runtime.
             * 40 = los 36px del botón más los 4 de separación, en las dos
             * direcciones.
             */
            placement === 'up' ? 'bottom-[40px]' : 'top-[40px]'
          }`}
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
              className="flex h-[40px] w-full items-center gap-[8px] whitespace-nowrap rounded-[8px] px-[8px] text-left font-['Inter:Regular',sans-serif] text-[14px] font-normal not-italic leading-[22.7px] tracking-[0.28px] text-[#131313] transition-colors hover:bg-[#f0f4f8]"
            >
              {option.label ?? WASTE_EXPORT_FORMAT_LABELS[option.format]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
