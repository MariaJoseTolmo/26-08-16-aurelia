import { WarehouseTableCaretIcon } from '../icons/WarehouseTableIcons';
import type { WasteIntakeOption } from '../wasteIntakeFilters';

/**
 * Selector de alternativas de los filtros de columna de "Ingresos a bodega":
 * "Categoría operativa" (`3817:57451`), "Residuo específico" (`3817:57479`),
 * "Unidad de medida" (`3817:57534`), "Lugar/sector proveniente" (`3817:57562`) y
 * "Peligrosidad" (`3817:57644`).
 *
 * Shell del nodo: bg white · border #d1d1d1 · rounded-[8px] · px-[8px] py-[5px]
 * · gap-[8px] · texto Inter Regular 13px #131313 · caret en caja de 16 × 16.
 * El alto sale de esas medidas: 16 del caret + 5 + 5 = 26px, el mismo que usa
 * `TableFilterShell` en inspecciones.
 *
 * POR QUÉ `<select>` NATIVO:
 *
 * Mismo motivo que el campo de fecha (ver `WarehouseDateFilterField`): `apps/web`
 * no tiene shadcn/ui ni radix, así que un menú propio habría que escribirlo a
 * mano —foco, teclado, colisiones de scroll y ARIA incluidos—. El `<select>`
 * despliega las alternativas con el widget del sistema, que ya trae navegación
 * por teclado, búsqueda por tipeo y comportamiento correcto en móvil.
 *
 * El `<select>` se estira sobre TODO el control y dibuja su propio texto con la
 * tipografía del diseño; no se duplica el label en un `<span>` aparte, que se
 * vería encimado. Su flecha nativa se apaga con `appearance-none` y el caret
 * visible es el SVG exportado del nodo `650:141`, con `pointer-events-none` para
 * que el click ahí también despliegue. `pr-[32px]` = 8 de padding + 16 del caret
 * + 8 de gap: reserva su lugar para que el texto largo no se le meta debajo.
 */

interface WarehouseSelectFilterFieldProps {
  /** Valor aplicado, o `null` cuando el filtro está vacío. */
  value: string | null;
  onChange: (value: string | null) => void;
  options: WasteIntakeOption[];
  /** Etiqueta del valor vacío: "Todas" o "Todos" según la columna del diseño. */
  emptyOptionLabel: string;
  label: string;
}

export function WarehouseSelectFilterField({
  value,
  onChange,
  options,
  emptyOptionLabel,
  label,
}: WarehouseSelectFilterFieldProps) {
  return (
    <span className="relative flex h-[26px] w-full items-center overflow-hidden rounded-[8px] border border-solid border-[#d1d1d1] bg-white">
      <select
        aria-label={label}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}
        className="absolute inset-0 size-full cursor-pointer appearance-none border-0 bg-transparent pl-[8px] pr-[32px] font-['Inter:Regular',sans-serif] text-[13px] font-normal not-italic leading-[normal] text-[#131313] outline-none"
      >
        <option value="">{emptyOptionLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {/*
        El asset viene apuntando hacia arriba; Figma lo voltea con
        `-rotate-180 -scale-x-100`, cuyo efecto neto es un espejo vertical. Se
        reproduce con `-scale-y-100` para obtener el caret hacia abajo.
      */}
      <span className="pointer-events-none ml-auto mr-[8px] flex size-[16px] shrink-0 items-center justify-center">
        <WarehouseTableCaretIcon className="block h-[6px] w-[10px] -scale-y-100 text-[#131313]" />
      </span>
    </span>
  );
}
