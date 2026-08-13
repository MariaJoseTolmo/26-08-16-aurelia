import { ClockIcon } from '../../../shared/components/icons/ClockIcon';
import { WarehouseFormCard } from './WarehouseFormCard';

/**
 * Tarjeta "Qué pasa después de enviar" del paso 3 — nodo `3765:35804`.
 *
 * Es el tono `info` de `WarehouseFormCard` sin cambios: `bg #e6f3ff`, borde
 * `#c5d8f0` y texto `#0d3862` son exactamente los tres colores que declara el nodo,
 * y es la misma tarjeta que "Qué pasa después de registrar" en la recepción a
 * bodega (`3713:27413`).
 *
 * EL PÁRRAFO LLEVA UN TRAMO EN NEGRITA. El nodo `3765:35810` parte el texto en tres
 * `span` y el del medio —"6 horas"— va en Inter Bold. No se pierde: es el dato que
 * la tarjeta viene a subrayar, el SLA de Medio Ambiente. Por eso el copy vive
 * partido en tres constantes y no como un string suelto.
 *
 * El reloj no es un asset nuevo: es el `ClockIcon` de `shared/`, el mismo dibujo
 * escalado —17.5/16.875, razón constante 1.037—, así que solo cambia la caja.
 */

export const SIDREP_AFTER_SUBMIT_TITLE = 'Qué pasa después de enviar';

/** Los tres tramos del nodo `3765:35810`. El del medio va en negrita. */
export const SIDREP_AFTER_SUBMIT_TEXT = {
  before: 'Medio Ambiente revisará tu solicitud dentro de las próximas ',
  strong: '6 horas',
  after: '. Recibirás una notificación con la aprobación (y el N° de Folio SIDREP) o el motivo del rechazo.',
} as const;

export function WasteSidrepAfterSubmitNotice() {
  return (
    <WarehouseFormCard
      tone="info"
      icon={<ClockIcon className="block h-[13.5px] w-[16.875px] shrink-0 text-[#0d3862]" />}
      title={SIDREP_AFTER_SUBMIT_TITLE}
    >
      <div className="w-full pt-[3px]">
        <p className="font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[normal] text-[#0d3862]">
          {SIDREP_AFTER_SUBMIT_TEXT.before}
          <strong className="font-['Inter:Bold',sans-serif] font-bold">{SIDREP_AFTER_SUBMIT_TEXT.strong}</strong>
          {SIDREP_AFTER_SUBMIT_TEXT.after}
        </p>
      </div>
    </WarehouseFormCard>
  );
}
