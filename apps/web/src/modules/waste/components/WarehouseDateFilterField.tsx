import { useRef, type KeyboardEvent } from 'react';
import { WarehouseDateFilterIcon } from '../icons/WarehouseIntakeIcons';

/**
 * Campo de fecha de los filtros de "Ingresos a bodega". Sirve a los dos lugares
 * donde el nodo `3729:27632` dibuja un control de fecha: el filtro de la columna
 * "Fecha de ingreso" (`3817:57422`) y la barra "Filtros activos" (`3817:57807`).
 *
 * Shell del nodo: bg white · border #d1d1d1 · rounded-[8px] · px-[8px] py-[4px]
 * · gap-[8px] · texto Inter Regular 13px #131313 · icono 18 × 18.
 *
 * POR QUÉ `<input type="date">` NATIVO Y NO UN CALENDARIO PROPIO:
 *
 * `apps/web` no tiene shadcn/ui ni radix ni react-day-picker —solo react,
 * react-router, react-query y zustand—, así que un popover de calendario habría
 * que escribirlo a mano. El input nativo da picker real, navegación por teclado,
 * validación y formato local (en es-CL muestra exactamente `dd-mm-aaaa`, el
 * placeholder del diseño) con cero dependencias.
 *
 * El icono del picker que dibuja el navegador se oculta —el del diseño es el SVG
 * exportado del nodo `3817:57425`— y el botón que lo envuelve abre el calendario
 * con `showPicker()`. Así el control se ve igual en Chromium, Safari y Firefox,
 * que no expone ese pseudo-elemento.
 */

const HIDE_NATIVE_PICKER_ICON = '[&::-webkit-calendar-picker-indicator]:hidden';

interface WarehouseDateFilterFieldProps {
  /** Fecha en ISO `yyyy-mm-dd`, o `null` cuando el filtro está vacío. */
  value: string | null;
  onChange: (value: string | null) => void;
  label: string;
  /** El nodo usa `py-[4px]` en la celda de la tabla; la barra de filtros repite la medida. */
  className?: string;
  autoFocus?: boolean;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  /**
   * Se dispara cuando el foco sale del campo COMPLETO. No alcanza con el `blur`
   * del input: el click en el botón del calendario también lo dispara, y quien
   * despliega el campo lo cerraría justo antes de que el picker abra.
   */
  onDismiss?: () => void;
}

export function WarehouseDateFilterField({
  value,
  onChange,
  label,
  className = '',
  autoFocus = false,
  onKeyDown,
  onDismiss,
}: WarehouseDateFilterFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleOpenPicker() {
    const input = inputRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch {
        // showPicker() lanza si el gesto no lo habilita: el foco alcanza.
      }
    }
    input.focus();
  }

  return (
    <span
      onBlur={(event) => {
        if (!onDismiss) return;
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        onDismiss();
      }}
      className={`relative flex h-[26px] items-center gap-[8px] overflow-hidden rounded-[8px] border border-solid border-[#d1d1d1] bg-white px-[8px] py-[4px] ${className}`}
    >
      <input
        ref={inputRef}
        type="date"
        aria-label={label}
        value={value ?? ''}
        autoFocus={autoFocus}
        onKeyDown={onKeyDown}
        onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}
        className={`min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 font-['Inter:Regular',sans-serif] text-[13px] font-normal not-italic leading-[normal] text-[#131313] outline-none ${HIDE_NATIVE_PICKER_ICON}`}
      />
      <button
        type="button"
        aria-label={`Abrir calendario de ${label.toLowerCase()}`}
        onClick={handleOpenPicker}
        className="flex size-[18px] shrink-0 items-center justify-center"
      >
        <WarehouseDateFilterIcon className="pointer-events-none block size-[18px] shrink-0 text-[#646464]" />
      </button>
    </span>
  );
}
