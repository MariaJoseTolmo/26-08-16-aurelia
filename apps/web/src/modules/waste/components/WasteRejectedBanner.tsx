import { AlertCircleIcon } from '../../../shared/components/icons/AlertCircleIcon';

type WasteRejectedBannerProps = {
  /** Qué ocurrió, quién rechazó y cuándo. */
  heading: string;
  /** Motivo ya compuesto con las comillas tipográficas del diseño. */
  reason: string;
  /** Estado posterior opcional; la variante de corrección no lo dibuja. */
  note?: string;
};

/**
 * Banda reutilizable de rechazo — nodo Figma `4278:19235`.
 *
 * El nodo la usa a ancho completo bajo el header de la solicitud y la bandeja de
 * folios la usa dentro del panel. La geometría es la misma en ambos lugares; el
 * tercer renglón existe sólo en la variante del panel, por eso `note` es opcional.
 *
 * El icono NO viene de una librería: `AlertCircleIcon` contiene el SVG exportado
 * de Figma y documenta la comparación exacta del path. La caja de 20 × 16 centra
 * el glifo de 16 × 16 tal como lo declara el design context.
 */
export function WasteRejectedBanner({ heading, reason, note }: WasteRejectedBannerProps) {
  return (
    <div
      className="flex w-full items-start gap-[10px] border-b-2 border-solid border-[var(--waste-notice-rejected-border)] bg-[var(--waste-notice-rejected-surface)] px-[20px] pb-[12px] pt-[10px]"
      data-name="Formulario rechazado"
      role="status"
    >
      <span className="flex h-[16px] w-[20px] shrink-0 items-center justify-center">
        <AlertCircleIcon className="block size-[16px] text-[var(--waste-notice-rejected-foreground)]" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col items-start">
        <p className="w-full font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] text-[var(--waste-notice-rejected-foreground)]">
          {heading}
        </p>
        <div className="w-full pt-[3px] text-[11px] text-[var(--waste-notice-rejected-foreground)]">
          <p className="font-['Inter:Italic',sans-serif] font-normal italic leading-[16.5px]">
            {reason}
          </p>
          {note ? (
            <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold not-italic leading-[16.5px]">
              {note}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
