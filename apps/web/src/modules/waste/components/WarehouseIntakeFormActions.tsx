import { WarehouseFormInfoIcon, WarehouseFormSubmitCheckIcon } from '../icons/WarehouseIntakeFormIcons';

/**
 * Barra de acciones del formulario — nodo `3564:1403`.
 *
 * Caja: `bg white · border-t #e3e3e3 · px-[28px] pt-[15px] pb-[14px] · flex
 * items-center justify-between`. Los 65px de alto del nodo salen de esa suma.
 *
 * EL ESTADO DEL BOTÓN PRIMARIO:
 *
 * El nodo `3565:3031` está dibujado DESHABILITADO —`bg #e3e3e3`, texto y check
 * en #acacac—, que es el estado correcto con el formulario vacío. El diseño no
 * entrega el estado habilitado, así que se extrapola con el primario que el
 * módulo ya usa en "Nueva recepción a bodega" (`#c8a064` sobre blanco, nodo
 * `3817:57823`). Es la única invención de color de esta pantalla y está acotada
 * a un estado que Figma no dibuja; el resto es literal.
 *
 * El texto del nodo es "Registrar ingreso". El botón del frame padre
 * (`3565:3032` en la vista de 1320) dice "Firmar y enviar"; se toma el de esta
 * barra, que es el nodo que se está implementando.
 */

export const WAREHOUSE_INTAKE_APPROVAL_NOTICE = 'Este registro no requiere aprobación de Medio Ambiente.';

interface WarehouseIntakeFormActionsProps {
  canSubmit: boolean;
  onCancel: () => void;
  /** Mensaje bajo la barra. Hoy solo lo usa el aviso de envío pendiente. */
  notice?: string | null;
}

export function WarehouseIntakeFormActions({ canSubmit, onCancel, notice }: WarehouseIntakeFormActionsProps) {
  return (
    <div className="w-full shrink-0 border-t border-solid border-[#e3e3e3] bg-white">
      <div className="flex w-full flex-wrap items-center justify-between gap-[10px] px-[28px] pb-[14px] pt-[15px]">
        <div className="flex items-center gap-[6px]">
          <WarehouseFormInfoIcon className="block h-[11px] w-[13.75px] shrink-0 text-[#646464]" />
          <p className="font-['Inter:Regular',sans-serif] text-[11px] font-normal not-italic leading-[normal] text-[#646464]">
            {WAREHOUSE_INTAKE_APPROVAL_NOTICE}
          </p>
        </div>
        <div className="flex items-start gap-[10px]">
          <button
            type="button"
            onClick={onCancel}
            className="flex flex-col items-center justify-center rounded-[8px] border border-solid border-[#d1d1d1] px-[19px] py-[10px] transition-colors hover:bg-[#f7f7f7]"
          >
            <span className="whitespace-nowrap text-center font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] text-[#646464]">
              Cancelar
            </span>
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`flex h-[36px] items-center gap-[6px] rounded-[8px] px-[22px] transition-colors ${
              canSubmit ? 'bg-[#c8a064] hover:bg-[#bb9057]' : 'cursor-not-allowed bg-[#e3e3e3]'
            }`}
          >
            <span
              className={`whitespace-nowrap text-center font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] ${
                canSubmit ? 'text-white' : 'text-[#acacac]'
              }`}
            >
              Registrar ingreso
            </span>
            <WarehouseFormSubmitCheckIcon
              className={`block h-[12px] w-[15px] shrink-0 ${canSubmit ? 'text-white' : 'text-[#acacac]'}`}
            />
          </button>
        </div>
      </div>
      {notice ? (
        <p role="status" className="w-full px-[28px] pb-[14px] font-['Inter:Regular',sans-serif] text-[11px] font-normal not-italic leading-[normal] text-[#646464]">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
