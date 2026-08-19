import { WasteSecondaryActionButton } from './WasteSecondaryActionButton';

/**
 * Barra de acciones de "Nueva solicitud de retiro" — nodo `3765:38885`.
 *
 *   caja    bg white · border-t #e3e3e3
 *           flex items-center justify-end · px-[28px] pt-[15px] pb-[14px]
 *   botón   `3765:38886` → `WasteSecondaryActionButton`, compartido con
 *           la barra de "Nueva recepción a bodega"
 *
 * Los 64px de alto del nodo NO se fijan: salen de `pt-[15px]` + los 35px del
 * botón (`py-[10px]` sobre una línea de 12px) + `pb-[14px]`.
 *
 * DOS DIFERENCIAS CONTRA `WarehouseIntakeFormActions`, que es la barra hermana:
 *
 * 1. `justify-end` en vez de `justify-between`. Acá no hay aviso a la izquierda
 *    —el nodo no dibuja ninguno— así que el botón se va contra el borde derecho.
 * 2. NO HAY BOTÓN PRIMARIO. El nodo trae un solo control. No se inventa un
 *    "Registrar retiro": mientras no haya residuo seleccionado no hay nada que
 *    enviar, y el diseño todavía no dibuja ese estado de la pantalla.
 *
 * Por eso las dos barras siguen siendo componentes distintos y solo comparten el
 * botón: coinciden en la caja, pero no en lo que ponen adentro.
 */

/** Rótulo del nodo `3765:38887`. */
export const WASTE_WITHDRAWAL_CANCEL_LABEL = 'Cancelar retiro';

interface WasteWithdrawalFormActionsProps {
  onCancel: () => void;
}

export function WasteWithdrawalFormActions({ onCancel }: WasteWithdrawalFormActionsProps) {
  return (
    <div className="w-full shrink-0 border-t border-solid border-[#e3e3e3] bg-white">
      <div className="flex w-full items-center justify-end px-[28px] pb-[14px] pt-[15px]">
        <WasteSecondaryActionButton label={WASTE_WITHDRAWAL_CANCEL_LABEL} onClick={onCancel} />
      </div>
    </div>
  );
}
