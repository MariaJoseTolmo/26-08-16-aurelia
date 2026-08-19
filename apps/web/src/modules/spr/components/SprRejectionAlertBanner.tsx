import { SprDismissIcon, SprProcessStatusRejectedIcon } from '../icons/SprIcons';
import type { SprRejectionContext } from '../sprRejectedContext';

interface SprRejectionAlertBannerProps {
  context: SprRejectionContext;
  onDismiss: () => void;
}

// Banner superior en modo corrección (Figma 1672:6739).
export function SprRejectionAlertBanner({ context, onDismiss }: SprRejectionAlertBannerProps) {
  return (
    <div className="w-full shrink-0 border-b-2 border-[#bd3b5b] bg-[#ffd0db] px-[20px] py-[10px]">
      <div className="flex items-start gap-[10px]">
        <SprProcessStatusRejectedIcon className="mt-px h-[16px] w-[20px] shrink-0 text-[#570b1d]" />

        <div className="min-w-0 flex-1">
          <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#570b1d]">{context.bannerTitle}</p>
          <p className="pt-[3px] font-['Inter:Italic',sans-serif] text-[11px] italic leading-[16.5px] text-[#570b1d]">
            &ldquo;{context.comment}&rdquo;
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Ocultar alerta de rechazo"
          className="shrink-0 rounded-[4px] p-[3px] text-[#570b1d] transition-colors hover:bg-[#f5b8c6]"
        >
          <SprDismissIcon className="h-[14px] w-[17.5px]" />
        </button>
      </div>
    </div>
  );
}
