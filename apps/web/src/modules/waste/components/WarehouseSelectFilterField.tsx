import { SelectMenu } from '../../../shared/components/SelectMenu';
import { WarehouseTableCaretIcon } from '../icons/WarehouseTableIcons';
import type { WasteIntakeOption } from '../wasteIntakeFilters';

/**
 * Selector de alternativas de los filtros de columna de las tablas del módulo:
 * "Ingresos a bodega" —"Categoría operativa" (`3817:57451`), "Residuo específico"
 * (`3817:57479`), "Unidad de medida" (`3817:57534`), "Lugar/sector proveniente"
 * (`3817:57562`) y "Peligrosidad" (`3817:57644`)— y "Detalle de lotes en bodega".
 *
 * Shell del nodo: bg white · border #d1d1d1 · rounded-[8px] · px-[8px] py-[5px]
 * · gap-[8px] · texto Inter Regular 13px #131313 · caret en caja de 16 × 16.
 * El alto sale de esas medidas: 16 del caret + 5 + 5 = 26px, el mismo que usa
 * `TableFilterShell` en inspecciones.
 *
 * POR QUÉ NO ES UN `<select>` NATIVO:
 *
 * Lo fue en la primera versión, por no tener shadcn/ui ni radix en `apps/web` y
 * no querer escribir un menú a mano. El problema es que el widget que despliega
 * el sistema operativo no se parece en nada al resto de la app: el formulario
 * "Registrar ingreso a Bodega" ya abría el panel propio del Dashboard, y los
 * filtros de la tabla de al lado abrían la lista gris del sistema.
 *
 * Ahora usa `shared/components/SelectMenu`, el mismo desplegable del Dashboard y
 * del formulario de ingreso. No se pierde nada de lo que daba el nativo:
 * `SelectMenu` implementa el patrón combobox de la APG —roles ARIA, ↑ ↓ Home
 * End, Enter/Espacio, Escape, Tab— que era la única ventaja real del `<select>`.
 *
 * `portal` es OBLIGATORIO acá: las dos tablas envuelven el `<table>` en
 * `overflow-hidden` y la de ingresos suma `overflow-x-auto`, así que un panel
 * anclado al flujo quedaría recortado por el contenedor.
 *
 * La CAJA del disparador la pone este archivo, igual que en el formulario:
 * `SelectMenu` aporta comportamiento y panel, no la geometría del campo.
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
    <SelectMenu
      portal
      ariaLabel={label}
      value={value}
      onChange={onChange}
      options={options}
      /* El valor vacío es la primera alternativa del panel: es lo que limpia el filtro. */
      placeholder={emptyOptionLabel}
      /*
       * `px-[8px]` + `gap-[8px]` + los 16px del caret reproducen el `pr-[32px]`
       * que reservaba el `<select>`: el texto largo se recorta con `truncate` en
       * vez de meterse debajo de la flecha.
       */
      triggerClassName="flex h-[26px] w-full items-center gap-[8px] overflow-hidden rounded-[8px] border border-solid border-[#d1d1d1] bg-white px-[8px]"
      valueClassName="min-w-0 flex-1 truncate text-left font-['Inter:Regular',sans-serif] text-[13px] font-normal not-italic leading-[normal] text-[#131313]"
      caret={
        /*
          El asset viene apuntando hacia arriba; Figma lo voltea con
          `-rotate-180 -scale-x-100`, cuyo efecto neto es un espejo vertical. Se
          reproduce con `-scale-y-100` para obtener el caret hacia abajo.
        */
        <span className="flex size-[16px] shrink-0 items-center justify-center">
          <WarehouseTableCaretIcon className="block h-[6px] w-[10px] -scale-y-100 text-[#131313]" />
        </span>
      }
    />
  );
}
