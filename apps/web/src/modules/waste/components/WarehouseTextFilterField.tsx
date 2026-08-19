/**
 * Campos de escritura de la fila de filtros de "Ingresos a bodega":
 * "Cantidad ingresada" (`3817:57507`, numérico), "Patente del vehículo"
 * (`3817:57590`) y "Conductor" (`3817:57617`).
 *
 * Shell del nodo: bg white · border #d1d1d1 · rounded-[8px] · px-[8px] py-[5px]
 * · alto 26px · texto Inter Regular 13px #131313 · placeholder #acacac.
 *
 * El numérico va CENTRADO —así está el "#" en el nodo, dentro de un
 * `justify-center`— y las búsquedas alineadas a la izquierda, donde el nodo pone
 * "Busca por patente" y "Busca por nombre y apellido".
 *
 * `type="number"` trae los spinners del navegador, que el diseño no tiene: se
 * apagan con `appearance-none` sobre los pseudo-elementos y `[appearance:textfield]`
 * para Firefox. `inputMode="decimal"` levanta el teclado numérico en móvil, y
 * `step="any"` deja pasar decimales —las cantidades de residuos los tienen—.
 */

const HIDE_NUMBER_SPINNERS = [
  '[appearance:textfield]',
  '[&::-webkit-outer-spin-button]:appearance-none',
  '[&::-webkit-inner-spin-button]:appearance-none',
  '[&::-webkit-outer-spin-button]:m-0',
  '[&::-webkit-inner-spin-button]:m-0',
].join(' ');

interface WarehouseTextFilterFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
  label: string;
  kind: 'number' | 'search';
}

export function WarehouseTextFilterField({
  value,
  onChange,
  placeholder,
  label,
  kind,
}: WarehouseTextFilterFieldProps) {
  const isNumber = kind === 'number';

  return (
    <span className="flex h-[26px] w-full items-center overflow-hidden rounded-[8px] border border-solid border-[#d1d1d1] bg-white px-[8px] py-[5px]">
      <input
        type={isNumber ? 'number' : 'text'}
        inputMode={isNumber ? 'decimal' : undefined}
        step={isNumber ? 'any' : undefined}
        aria-label={label}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}
        className={`min-w-0 flex-1 border-0 bg-transparent p-0 font-['Inter:Regular',sans-serif] text-[13px] font-normal not-italic leading-[normal] text-[#131313] outline-none placeholder:text-[#acacac] ${isNumber ? `text-center ${HIDE_NUMBER_SPINNERS}` : ''}`}
      />
    </span>
  );
}
