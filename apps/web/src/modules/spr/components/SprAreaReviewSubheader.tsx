import { useNavigate } from 'react-router-dom';
import { ClockIcon } from '../../../shared/components/icons/ClockIcon';
import { SprTraceabilityIcon } from '../icons/SprIcons';
import { SPR_AREA_REVIEW } from '../spr.constants';
import { SPR_CYCLE_TRACEABILITY_ROUTE } from '../sprCycleTraceability.constants';
import { SprHistoricalRangeBadge } from './SprHistoricalRangeBadge';

interface SprAreaReviewSubheaderProps {
  responsibleLabel: string;
  historicalAlertCount: number;
}

/** Badge Figma 1672:9254 */
function SprPendingReviewBadge() {
  return (
    <div className="flex items-center gap-[3px] rounded-[5px] bg-[#ffeab8] px-[7px] py-[2px]">
      <ClockIcon className="h-[9px] w-[11.25px] shrink-0 text-[#463100]" />
      <p className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[10px] font-bold leading-[normal] text-[#463100]">
        {SPR_AREA_REVIEW.pendingReviewBadge}
      </p>
    </div>
  );
}

// Sub-header de revision del gerente (Figma 1399:13951 / 1672:9253 + 1672:9254).
export function SprAreaReviewSubheader({ responsibleLabel, historicalAlertCount }: SprAreaReviewSubheaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center justify-between gap-[10px] border-b border-[#e3e3e3] bg-white px-[20px] py-[10px]">
      <div className="flex flex-wrap items-center gap-[10px]">
        <p className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[13px] font-bold leading-[normal] text-[#001e39]">
          {SPR_AREA_REVIEW.formSentTitle(responsibleLabel)}
        </p>
        <SprPendingReviewBadge />
        <SprHistoricalRangeBadge count={historicalAlertCount} />
      </div>

      <div className="flex flex-wrap items-center gap-[8px]">
        <p className="font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">{SPR_AREA_REVIEW.readOnlyHint}</p>
        <button
          type="button"
          onClick={() => navigate(SPR_CYCLE_TRACEABILITY_ROUTE)}
          className="flex h-[27px] items-center gap-[5px] rounded-[6px] border border-[#e3e3e3] bg-white px-[12px] font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold text-[#24588b] hover:bg-[#fafafa]"
        >
          <SprTraceabilityIcon className="h-[11px] w-[13.75px] shrink-0" />
          Ver trazabilidad
        </button>
      </div>
    </div>
  );
}
