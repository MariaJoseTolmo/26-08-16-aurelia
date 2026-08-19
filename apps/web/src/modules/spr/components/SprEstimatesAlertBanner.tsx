import { SprInfoCircleIcon } from '../icons/SprIcons';
import { SPR_FORM_ESTIMATES_MODE } from '../sprFormCycles';

/** Banner superior — ciclo con datos estimados (Figma 2424:1619). */
export function SprEstimatesAlertBanner() {
  return (
    <div className="w-full shrink-0 border-b-2 border-[#7b4fbf] bg-[#f3eeff] px-[20px] pb-[12px] pt-[10px]">
      <div className="flex items-start gap-[10px]">
        <SprInfoCircleIcon className="mt-[1px] h-[16px] w-[20px] shrink-0 text-[#7b4fbf]" />
        <div className="min-w-0 flex flex-col">
          <p className="font-['Inter:Bold',sans-serif] text-[11.5px] font-bold text-[#7b4fbf]">
            {SPR_FORM_ESTIMATES_MODE.bannerTitle}
          </p>
          <p className="pt-[3px] font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#7b4fbf]">
            {SPR_FORM_ESTIMATES_MODE.bannerBody}
          </p>
        </div>
      </div>
    </div>
  );
}
