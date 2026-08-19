import { SprWarningTriangleIcon } from '../icons/SprIcons';
import { SPR_DISCREPANCY_CORRECTION } from '../spr.constants';

const copy = SPR_DISCREPANCY_CORRECTION;

// Panel "Discrepancia a corregir" (Figma 1760:27773).
export function SprDiscrepancyCorrectionSummary() {
  return (
    <section className="overflow-hidden rounded-[9px] border border-[#bd3b5b] bg-white">
      <div className="border-b border-[#e3e3e3] px-[15px] py-[12px]">
        <p className="font-['Inter:Bold',sans-serif] text-[12.5px] font-bold text-[#001e39]">{copy.summaryTitle}</p>
      </div>

      <div className="flex flex-col gap-[12px] px-[15px] py-[13px]">
        <div className="overflow-hidden rounded-[8px] border border-[#e3e3e3]">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="border-b border-[#e3e3e3] bg-[#f7f7f7] px-[14px] py-[11px] lg:border-b-0 lg:border-r">
              <p className="font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.54px] text-[#acacac]">
                {copy.yourDataLabel}
              </p>
              {copy.inputs.map((input) => (
                <div key={input.label} className="flex items-start justify-between gap-[8px] pt-[6px]">
                  <p className="font-['Inter:Regular',sans-serif] text-[10.5px] text-[#646464]">{input.label}</p>
                  <p className="font-['Inter:Bold',sans-serif] text-[10.5px] font-bold text-[#131313]">{input.value}</p>
                </div>
              ))}
              <p className="pt-[5px] font-['Inter:Italic',sans-serif] text-[9px] italic text-[#acacac]">{copy.formula}</p>
            </div>

            <div className="bg-[#e6f3ff] px-[14px] py-[11px] text-center">
              <p className="font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.54px] text-[#acacac]">
                {copy.sacCalculatedLabel}
              </p>
              <p className="pt-[5px] font-['Inter:Bold',sans-serif] text-[22px] font-bold leading-[22px] text-[#0d3862]">
                {copy.sacValue}
              </p>
              <p className="pt-[2px] font-['Inter:Regular',sans-serif] text-[11px] text-[#646464]">{copy.sacUnit}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[8px] bg-[#ffd0db] px-[13px] py-[11px]">
          <div className="flex items-center gap-[6px]">
            <SprWarningTriangleIcon className="h-[11px] w-[13.75px] shrink-0 text-[#570b1d]" />
            <p className="font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#570b1d]">
              {copy.discrepancyReportedLabel(copy.reportedDate, copy.reportedTime)}
            </p>
          </div>
          <p className="pt-[6px] font-['Inter:Italic',sans-serif] text-[10.5px] italic leading-[15.75px] text-[#570b1d]">
            {copy.comment}
          </p>
        </div>
      </div>
    </section>
  );
}
