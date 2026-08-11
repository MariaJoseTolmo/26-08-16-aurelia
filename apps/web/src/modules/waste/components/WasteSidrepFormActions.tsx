import { WasteWithdrawalContinueArrowIcon } from '../icons/WasteWithdrawalFormIcons';
import { WasteSecondaryActionButton } from './WasteSecondaryActionButton';

/**
 * Barra de acciones del flujo SIDREP — nodo `3765:39458`.
 *
 *   caja       bg white · border-t #e3e3e3
 *              flex items-center justify-end · px-[28px] pt-[15px] pb-[14px]
 *   secundario `3765:39464` → `WasteSecondaryActionButton`, al tamaño de su
 *              contenido (acá NO va `fullWidth`, a diferencia del pie del modal)
 *   primario   `3765:39466` h-[36px] · rounded-[8px] · px-[22px] · gap-[6px]
 *              flecha 15 × 12 · rótulo Inter Bold 12px
 *
 * El nodo dibuja el primario DESHABILITADO (`bg #e3e3e3`, texto y flecha en
 * `#acacac`), correcto con el paso incompleto. El habilitado usa `#c8a064` sobre
 * blanco, el mismo par que `3765:40899` ya confirma para este flujo.
 *
 * El rótulo del primario es "Continuar" (nodo `3765:39467`). El NOMBRE DE CAPA en
 * Figma dice "Firmar y enviar ", que es copy viejo — el mismo tipo de desfase que
 * ya apareció en el párrafo de "Residuo a retirar" y en el botón del modal.
 *
 * La flecha tampoco es un asset nuevo: es el mismo archivo que `3765:39070`,
 * verificado por checksum, así que se reutiliza su componente.
 */

/** Rótulo del nodo `3765:39465`. */
export const SIDREP_BACK_LABEL = 'Volver a selección de residuo';
/** Rótulo del nodo `3765:39467`. En el nodo termina con un espacio, que se descarta. */
export const SIDREP_CONTINUE_LABEL = 'Continuar';

interface WasteSidrepFormActionsProps {
  canContinue: boolean;
  onBack: () => void;
  onContinue?: () => void;
}

export function WasteSidrepFormActions({
  canContinue,
  onBack,
  onContinue,
}: WasteSidrepFormActionsProps) {
  return (
    <div className="w-full shrink-0 border-t border-solid border-[#e3e3e3] bg-white">
      <div className="flex w-full items-center justify-end px-[28px] pb-[14px] pt-[15px]">
        <div className="flex items-start gap-[10px]">
          <WasteSecondaryActionButton label={SIDREP_BACK_LABEL} onClick={onBack} />
          <button
            type="button"
            disabled={!canContinue}
            onClick={onContinue}
            className={`flex h-[36px] shrink-0 items-center gap-[6px] rounded-[8px] px-[22px] transition-colors ${
              canContinue ? 'bg-[#c8a064] hover:bg-[#bb9057]' : 'cursor-not-allowed bg-[#e3e3e3]'
            }`}
          >
            <span
              className={`whitespace-nowrap text-center font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] ${
                canContinue ? 'text-white' : 'text-[#acacac]'
              }`}
            >
              {SIDREP_CONTINUE_LABEL}
            </span>
            <WasteWithdrawalContinueArrowIcon
              className={`block h-[12px] w-[15px] shrink-0 ${canContinue ? 'text-white' : 'text-[#acacac]'}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
