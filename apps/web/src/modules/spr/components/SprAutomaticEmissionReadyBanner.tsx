import { SprInfoCircleIcon } from '../icons/SprIcons';
import { SPR_FORM_FLOW_COPY } from '../sprFormFlow.constants';

type SprAutomaticEmissionReadyBannerProps = {
  areaLabel?: string;
  automaticSource?: string;
  onReview?: () => void;
};

/**
 * Notificación al gerente de área automática (Figma 2606:5127).
 * El sistema ya emitió; el gerente debe ver que está listo para firmar.
 * El consolidado no depende de esa firma.
 */
export function SprAutomaticEmissionReadyBanner({
  areaLabel,
  automaticSource,
  onReview,
}: SprAutomaticEmissionReadyBannerProps) {
  return (
    <div className="w-full shrink-0 border-b-2 border-[#24588b] bg-[#e8f2fb] px-[20px] py-[12px]">
      <div className="flex items-start gap-[10px]">
        <SprInfoCircleIcon className="mt-[1px] h-[16px] w-[20px] shrink-0 text-[#24588b]" />
        <div className="min-w-0 flex-1">
          <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#24588b]">
            {SPR_FORM_FLOW_COPY.managerAutomaticReadyTitle}
          </p>
          <p className="pt-[3px] font-['Inter:Regular',sans-serif] text-[11px] leading-[16.5px] text-[#24588b]">
            {SPR_FORM_FLOW_COPY.managerAutomaticReadyBody}
          </p>
          {areaLabel || automaticSource ? (
            <p className="pt-[6px] font-['Inter:Regular',sans-serif] text-[10.5px] text-[#3d6a96]">
              {areaLabel ? <span className="font-semibold">{areaLabel}</span> : null}
              {areaLabel && automaticSource ? ' · ' : null}
              {automaticSource ? <>Fuente: {automaticSource}</> : null}
            </p>
          ) : null}
          <p className="pt-[6px] font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15px] text-[#3d6a96]">
            {SPR_FORM_FLOW_COPY.managerAutomaticReadyHelper}
          </p>
          {onReview ? (
            <button
              type="button"
              onClick={onReview}
              className="mt-[10px] rounded-[6px] bg-[#24588b] px-[12px] py-[6px] font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-white hover:bg-[#1d4a73]"
            >
              {SPR_FORM_FLOW_COPY.managerAutomaticReadyCta}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
