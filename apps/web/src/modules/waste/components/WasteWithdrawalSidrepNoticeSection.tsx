import { WarehouseHazardousIcon } from '../icons/WarehouseTableIcons';
import { WasteWithdrawalContinueArrowIcon } from '../icons/WasteWithdrawalFormIcons';
import { WarehouseFormCard } from './WarehouseFormCard';

/**
 * Tarjeta "Este retiro requiere el flujo completo SIDREP" — nodo `3765:39060`.
 *
 * Solo aparece con un lote PELIGROSO: su propio texto dice "Al ser categoría
 * RESPEL…", así que la condición no es una interpretación, está en el copy.
 *
 * La caja es `WarehouseFormCard` con el tono `warning`, agregado para este nodo:
 * `bg #fff0e6` · borde `#f5c4a0` · texto `#6b3a1f`.
 *
 * EL ICONO NO VA DEL COLOR DEL TÍTULO. El nodo `3765:39062` viene en `#E8720C`
 * —naranja— y el título en `#6b3a1f` —marrón—. Son dos colores distintos y se
 * respetan los dos; por eso el color lo pasa esta sección y no la tabla de tonos.
 *
 * Y NO ES UN GLIFO NUEVO: es el mismo dibujo de la pastilla "Peligroso"
 * (`3765:42730`), exportado en la caja de 16.875 × 13.5 en vez de 12.5 × 10. Se
 * detectó comparando los `path` módulo escala —la razón es 1.35 constante—, no por
 * checksum, que no ve un mismo dibujo en otra caja. Tiene todo el sentido: la
 * tarjeta habla justamente de que el residuo es peligroso.
 *
 * El botón del nodo `3765:39068` está dibujado DESHABILITADO (`bg #e3e3e3`, texto
 * y flecha en `#acacac`), que es el estado correcto sin cantidad ni transportista.
 * El habilitado se toma del primario `#c8a064` sobre blanco — no es una
 * extrapolación libre: es el mismo par que el nodo `3765:40899` confirma para el
 * primario del modal de este flujo.
 *
 * El ancho de 253.711px del nodo NO se reproduce: es el que le da su contenido a
 * ese texto en Figma. Con `px-[21px]` sale la misma medida y tolera otro rótulo.
 */

/** Texto del nodo `3765:39064`. */
export const SIDREP_NOTICE_TITLE = 'Este retiro requiere el flujo completo SIDREP';

/** Texto del nodo `3765:39066`. */
export const SIDREP_NOTICE_DESCRIPTION =
  'Al ser categoría RESPEL, deberás completar documentos de respaldo (ticket de pesaje, HDST, guía RESPEL, fotos del vehículo) y Medio Ambiente deberá aprobar la solicitud dentro de un SLA de 6 horas antes de generar el folio.';

/** Rótulo del nodo `3765:39069`. En el nodo termina con un espacio, que se descarta. */
export const SIDREP_NOTICE_CTA_LABEL = 'Continuar a documentos SIDREP';

interface WasteWithdrawalSidrepNoticeSectionProps {
  /** Habilita el CTA. Sale de `isWasteWithdrawalFormComplete`. */
  canContinue: boolean;
  onContinue?: () => void;
}

export function WasteWithdrawalSidrepNoticeSection({
  canContinue,
  onContinue,
}: WasteWithdrawalSidrepNoticeSectionProps) {
  return (
    <WarehouseFormCard
      tone="warning"
      icon={<WarehouseHazardousIcon className="block h-[13.5px] w-[16.875px] shrink-0 text-[#e8720c]" />}
      title={SIDREP_NOTICE_TITLE}
      description={SIDREP_NOTICE_DESCRIPTION}
    >
      {/* `pt-[14px]` es el `pb-[14px]` que el nodo `3765:39065` pone bajo el párrafo. */}
      <div className="w-full pt-[14px]">
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className={`flex h-[34.5px] items-center gap-[6px] rounded-[8px] px-[21px] transition-colors ${
            canContinue ? 'bg-[#c8a064] hover:bg-[#bb9057]' : 'cursor-not-allowed bg-[#e3e3e3]'
          }`}
        >
          <span
            className={`whitespace-nowrap text-center font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] ${
              canContinue ? 'text-white' : 'text-[#acacac]'
            }`}
          >
            {SIDREP_NOTICE_CTA_LABEL}
          </span>
          <WasteWithdrawalContinueArrowIcon
            className={`block h-[12px] w-[15px] shrink-0 ${canContinue ? 'text-white' : 'text-[#acacac]'}`}
          />
        </button>
      </div>
    </WarehouseFormCard>
  );
}
