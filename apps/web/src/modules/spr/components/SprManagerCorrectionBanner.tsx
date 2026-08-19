import type { SprManagerCorrectionBannerContext } from '../sprRejectedContext';

interface SprManagerCorrectionBannerProps {
  context: SprManagerCorrectionBannerContext;
  onDismiss?: () => void;
}

/** Banner superior re-revisión gerente (Figma 1672:8997). */
export function SprManagerCorrectionBanner({ context, onDismiss }: SprManagerCorrectionBannerProps) {
  return (
    <div className="w-full shrink-0 border-b-2 border-[#c8a064] bg-[#fff6e5] px-[20px] py-[10px]">
      <div className="flex items-start gap-[10px]">
        <div className="mt-px flex size-[20px] shrink-0 items-center justify-center rounded-full bg-[#ffeab8] text-[11px] font-bold text-[#8e6e3e]">
          !
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#463100]">{context.bannerTitle}</p>
          {context.comment ? (
            <p className="pt-[3px] font-['Inter:Italic',sans-serif] text-[11px] italic leading-[16.5px] text-[#463100]">
              &ldquo;{context.comment}&rdquo;
            </p>
          ) : null}
        </div>

        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Ocultar alerta de corrección"
            className="shrink-0 rounded-[4px] px-[6px] py-[2px] font-['Inter:Bold',sans-serif] text-[12px] text-[#8e6e3e] transition-colors hover:bg-[#ffeab8]"
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}
