import { useId, type ReactNode } from 'react';
import { SelectMenu } from '../../../shared/components/SelectMenu';
import { WarehouseTableCaretIcon } from '../icons/WarehouseTableIcons';
import type { WasteOption } from '../wasteFilterPrimitives';

/**
 * Controles del formulario "Registrar ingreso a Bodega" — nodo Figma `3564:1787`.
 *
 * El nodo dibuja DOS familias de campo que no son la misma, y acá se conservan
 * las dos en vez de unificarlas:
 *
 *   `dropdown`  tarjetas "Categoría y residuo específico" y "Datos del lote"
 *               rótulo Inter Bold 10px #131313 · caja border-[1.5px] rounded-[8px]
 *               px-[13.5px] · texto 12px
 *   `text`      tarjeta "Origen del ingreso"
 *               rótulo Inter Semi Bold 11.5px #333 · caja border rounded-[7px]
 *               px-[12px] · texto 12.5px
 *
 * Es una inconsistencia del diseño, no un descuido de lectura: los nodos
 * `3713:26897` y `3564:1371` declaran grosores, radios y tipografías distintas.
 * Se reproducen tal cual porque la instrucción es pixel-perfect; unificarlas es
 * una decisión de diseño, no de implementación.
 *
 * DE DÓNDE SALE EL MENÚ DESPLEGADO:
 *
 * De `shared/components/SelectMenu`, que es el desplegable del Dashboard
 * extraído. El `<select>` nativo quedó descartado —era la primera versión de
 * esta pantalla— porque el widget que dibuja el sistema no se parece en nada al
 * panel del resto de la app. `SelectMenu` sí trae teclado y roles ARIA, que es lo
 * único que el nativo daba gratis y los dos originales del Dashboard no tienen.
 *
 * La CAJA del disparador la sigue poniendo este archivo, no `SelectMenu`: es la
 * del nodo `3713:26897` y no la del Dashboard, que usa borde de 1px y texto de
 * 13px. Figma no dibuja el estado abierto, así que el panel se toma prestado sin
 * pisar nada; el campo cerrado sí está dibujado y manda el nodo.
 *
 */

/** Tono del rótulo. Los nombres describen el nodo que los usa, no un tamaño. */
type WarehouseFormTone = 'dropdown' | 'text';

const LABEL_CLASS: Record<WarehouseFormTone, string> = {
  dropdown: "font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#131313]",
  text: "font-['Inter:Semi_Bold',sans-serif] text-[11.5px] font-semibold text-[#333333]",
};

/** Caja del control. El alto de 36px es el mismo en las dos familias. */
const SHELL_CLASS: Record<WarehouseFormTone, string> = {
  dropdown: 'h-[36px] rounded-[8px] border-[1.5px] border-solid border-[#d1d1d1] bg-white',
  text: 'h-[36px] rounded-[7px] border border-solid border-[#d1d1d1] bg-white',
};

/**
 * Estado de un catálogo remoto, tal como lo entrega TanStack Query.
 *
 * Los cuatro selectores consumen un `useQuery`, así que los cuatro tienen los
 * mismos cuatro estados. Pasarlos en un objeto —en vez de que cada tarjeta
 * decida qué texto mostrar— es lo que garantiza que "Cargando…" diga lo mismo
 * en los cuatro y que ninguno se olvide de ofrecer "Reintentar".
 */
export interface WarehouseFormCatalogState {
  options: WasteOption[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  /**
   * Selector encadenado que todavía no tiene de qué depender: "Residuo
   * específico" antes de elegir categoría. No es carga ni error ni vacío — es un
   * campo que aún no aplica.
   */
  waitingFor?: string;
}

interface FieldProps {
  id: string;
  label: string;
  tone: WarehouseFormTone;
  children: ReactNode;
  /** Línea de estado bajo el control: error de carga, catálogo vacío. */
  footer?: ReactNode;
}

function Field({ id, label, tone, children, footer }: FieldProps) {
  return (
    <div className="flex w-full min-w-px flex-col items-start gap-[5px]">
      <label
        htmlFor={id}
        className={`whitespace-nowrap not-italic leading-[normal] ${LABEL_CLASS[tone]}`}
      >
        {label}
      </label>
      {children}
      {footer}
    </div>
  );
}

interface CatalogFooterProps {
  state: WarehouseFormCatalogState;
  label: string;
}

/**
 * Estados de carga que el diseño no dibuja pero la vista necesita.
 *
 * Solo se renderiza cuando hay algo que decir: en éxito no ocupa alto, así que
 * la tarjeta mide exactamente lo del nodo. El error trae "Reintentar" porque un
 * catálogo caído deja el formulario inservible y recargar la página entera
 * perdería lo ya tecleado.
 */
function CatalogFooter({ state, label }: CatalogFooterProps) {
  if (state.isError) {
    return (
      <p role="alert" className="font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-[#bd3b5b]">
        No se pudo cargar {label.toLowerCase()}.{' '}
        <button
          type="button"
          onClick={state.onRetry}
          className="font-['Inter:Bold',sans-serif] font-bold underline underline-offset-2"
        >
          Reintentar
        </button>
      </p>
    );
  }

  if (!state.isLoading && !state.waitingFor && state.options.length === 0) {
    return (
      <p className="font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-[#646464]">
        No hay alternativas configuradas en el maestro.
      </p>
    );
  }

  return null;
}

/** Texto del valor vacío según el estado del catálogo. */
function emptyOptionLabel(state: WarehouseFormCatalogState, placeholder: string): string {
  if (state.waitingFor) return state.waitingFor;
  if (state.isLoading) return 'Cargando…';
  if (state.isError) return 'No disponible';
  if (state.options.length === 0) return 'Sin alternativas';
  return placeholder;
}

interface WarehouseFormSelectProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  state: WarehouseFormCatalogState;
  /** Valor vacío del nodo: "Seleccione" en los cuatro selectores del diseño. */
  placeholder?: string;
  tone?: WarehouseFormTone;
}

export function WarehouseFormSelect({
  label,
  value,
  onChange,
  state,
  placeholder = 'Seleccione',
  tone = 'dropdown',
}: WarehouseFormSelectProps) {
  const id = useId();
  const unusable = state.isLoading || state.isError || Boolean(state.waitingFor) || state.options.length === 0;

  return (
    <Field id={id} label={label} tone={tone} footer={<CatalogFooter state={state} label={label} />}>
      <SelectMenu
        id={id}
        value={value}
        onChange={onChange}
        options={state.options}
        placeholder={emptyOptionLabel(state, placeholder)}
        disabled={unusable}
        /* La caja es la del nodo `3713:26897`: `justify-between` deja el caret pegado al padding derecho. */
        triggerClassName={`flex w-full items-center justify-between gap-[8px] overflow-hidden px-[13.5px] disabled:cursor-not-allowed ${SHELL_CLASS[tone]}`}
        valueClassName={`min-w-0 flex-1 truncate text-left font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[normal] ${
          unusable ? 'text-[#acacac]' : 'text-[#131313]'
        }`}
        caret={
          /*
            El asset del nodo apunta hacia arriba y Figma lo voltea con
            `-rotate-180 -scale-x-100`, cuyo efecto neto es un espejo vertical.
            Se reproduce con `-scale-y-100`, igual que en la tabla de ingresos.
          */
          <span className="flex size-[16px] shrink-0 items-center justify-center">
            <WarehouseTableCaretIcon className="block h-[6px] w-[10px] -scale-y-100 text-[#131313]" />
          </span>
        }
      />
    </Field>
  );
}

