import { SPR_FORM_FLOW_COPY } from '../sprFormFlow.constants';
import { SprFooterInfoIcon } from '../icons/SprIcons';

type SprAutomaticAreaStatusViewProps = {
  areaLabel: string;
  automaticSource: string;
};

/**
 * Áreas automáticas (Figma 2606:5127): el responsable no llena formulario;
 * el sistema emite los datos y notifica al gerente para firma.
 */
export function SprAutomaticAreaStatusView({ areaLabel, automaticSource }: SprAutomaticAreaStatusViewProps) {
  return (
    <div className="flex h-[calc(100vh-56px)] w-full items-start justify-center bg-[#f7f7f7] px-[22px] py-[28px]">
      <div className="w-full max-w-[720px] rounded-[10px] border border-[#e3e3e3] bg-white px-[22px] py-[20px]">
        <p className="font-['Inter:Bold',sans-serif] text-[14px] font-bold text-[#131313]">
          {SPR_FORM_FLOW_COPY.responsibleAutomaticTitle}
        </p>
        <p className="pt-[8px] font-['Inter:Regular',sans-serif] text-[12px] leading-[18px] text-[#646464]">
          {SPR_FORM_FLOW_COPY.responsibleAutomaticBody}
        </p>
        <div className="mt-[14px] rounded-[8px] border border-[#d6e6f5] bg-[#f6faff] px-[14px] py-[12px]">
          <p className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#24588b]">{areaLabel}</p>
          <p className="pt-[4px] font-['Inter:Regular',sans-serif] text-[11px] text-[#646464]">
            Fuente registrada automáticamente: <span className="font-semibold text-[#131313]">{automaticSource}</span>
          </p>
        </div>
        <div className="mt-[14px] flex items-start gap-[8px]">
          <SprFooterInfoIcon className="mt-[2px] h-[11px] w-[13.75px] shrink-0 text-[#646464]" />
          <p className="font-['Inter:Regular',sans-serif] text-[11px] leading-[16px] text-[#646464]">
            {SPR_FORM_FLOW_COPY.responsibleAutomaticHelper}
          </p>
        </div>
        <p className="mt-[16px] border-t border-[#e3e3e3] pt-[12px] font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15px] text-[#8a8a8a]">
          {SPR_FORM_FLOW_COPY.sharedParamsNote}
        </p>
      </div>
    </div>
  );
}
