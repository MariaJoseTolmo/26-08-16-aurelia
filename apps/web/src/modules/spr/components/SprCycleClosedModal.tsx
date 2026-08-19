import type { ReactPortal } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { SPR_ACTIVE_CYCLE, SPR_CONSOLIDATED_REPORT } from '../spr.constants';
import { SPR_KPI_MONITORING_ROUTE } from '../sprKpiMonitoring.constants';

type MilestoneStatus = 'pending' | 'completed';

function MilestoneBadge({ status }: { status: MilestoneStatus }) {
  if (status === 'completed') {
    return (
      <span className="rounded-[4px] bg-[#e0ffd3] px-[6px] py-px font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#2a5c16]">
        Completado
      </span>
    );
  }

  return (
    <span className="rounded-[4px] bg-[#ffd0db] px-[6px] py-px font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#570b1d]">
      Pendiente
    </span>
  );
}

// Figma 2035:7406 — modal ciclo cerrado exitosamente tras cumplir los 4 hitos.
export function SprCycleClosedModal({ open, onClose }: { open: boolean; onClose: () => void }): ReactPortal | null {
  const navigate = useNavigate();
  const copy = SPR_CONSOLIDATED_REPORT.cycleClosedModal;

  function handleGoToMonitoring() {
    onClose();
    navigate(SPR_KPI_MONITORING_ROUTE);
  }

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(19,19,19,0.75)] p-[20px]"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-[495px] flex-col items-center gap-[32px] rounded-[16px] bg-white px-[16px] py-[24px] shadow-[0_20px_30px_rgba(0,0,0,0.25)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spr-cycle-closed-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex size-[72px] items-center justify-center rounded-full bg-[#3a9b3a]">
          <svg width="35" height="28" viewBox="0 0 35 28" fill="none" aria-hidden>
            <path
              d="M3 14.5L12.5 24L32 4"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="flex w-full flex-col items-center gap-[8px]">
          <p
            id="spr-cycle-closed-modal-title"
            className="text-center font-['Inter:Bold',sans-serif] text-[18px] font-bold text-[#3a9b3a]"
          >
            {copy.title(SPR_ACTIVE_CYCLE.label)}
          </p>
          <p className="text-center font-['Inter:Regular',sans-serif] text-[14px] leading-[22.7px] tracking-[0.28px] text-[#131313]">
            {copy.body}
          </p>

          <div className="flex w-full flex-col gap-[8px]">
            <div className="flex items-center justify-between rounded-[8px] bg-[#f9fafb] px-[8px] py-[4px]">
              <p className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#131313]">
                {copy.overallStatusLabel}
              </p>
              <span className="rounded-[4px] bg-[#e0ffd3] px-[6px] py-px font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#2a5c16]">
                {copy.overallStatusBadge}
              </span>
            </div>

            <div className="flex w-full flex-col gap-[2px]">
              {copy.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between border-b border-[#e3e3e3] px-[8px] py-[4px]"
                >
                  <p className="min-w-0 pr-[8px] font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#131313]">
                    {milestone.label}
                  </p>
                  <MilestoneBadge status={milestone.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoToMonitoring}
          className="flex h-[40px] w-full items-center justify-center rounded-[8px] bg-[#c8a064] px-[16px] font-['Inter:Bold',sans-serif] text-[14px] font-bold tracking-[0.28px] text-white hover:bg-[#b89158]"
        >
          {copy.ctaLabel}
        </button>
      </div>
    </div>,
    document.body,
  );
}
