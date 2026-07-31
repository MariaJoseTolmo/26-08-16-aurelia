import { useState } from 'react';
import {
  SprConfirmSendIcon,
  SprInfoCircleIcon,
  SprPdfFileIcon,
  SprProcessStatusApprovedIcon,
  SprWarningTriangleIcon,
} from '../icons/SprIcons';
import { SPR_ACTIVE_CYCLE, SPR_KPI_REVIEW, type SprKpiReviewCardConfig } from '../spr.constants';

export type SprKpiReviewResponse = 'pending' | 'confirmed' | 'discrepancy';

export interface SprKpiReviewResponseMeta {
  dateLabel: string;
  timeLabel?: string;
}

interface SprKpiReviewCardProps {
  card: SprKpiReviewCardConfig;
  response: SprKpiReviewResponse;
  responseMeta?: SprKpiReviewResponseMeta;
  discrepancyComment?: string;
  initialReportingDiscrepancy?: boolean;
  isEditing?: boolean;
  onConfirm: () => void;
  onReportDiscrepancy: (comment: string) => void;
  onEdit: () => void;
  onCancelEdit: () => void;
}

function PendingBadge() {
  return (
    <span className="rounded-[4px] bg-[#ffeab8] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#8e6e3e]">
      {SPR_KPI_REVIEW.pendingBadge}
    </span>
  );
}

function DiscrepancyReportedBadge() {
  return (
    <span className="rounded-[4px] bg-[#ffd0db] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#570b1d]">
      {SPR_KPI_REVIEW.discrepancyReportedBadge}
    </span>
  );
}

function HeaderBadge({ response }: { response: SprKpiReviewResponse }) {
  if (response === 'discrepancy') return <DiscrepancyReportedBadge />;
  return <PendingBadge />;
}

function EditPencilIcon() {
  return (
    <svg width="11.25" height="9" viewBox="0 0 11.25 9" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M8.4375 0.5625L10.6875 2.8125L3.9375 9.5625H1.6875V7.3125L8.4375 0.5625ZM9.5625 1.6875L8.4375 0.5625L2.8125 6.1875V7.3125H3.9375L9.5625 1.6875Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ConfirmedSummaryBar({
  dateLabel,
  onEdit,
}: {
  dateLabel: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-[8px] bg-[#e0ffd3] px-[12px] py-[9px]">
      <div className="flex items-center gap-[7px]">
        <SprProcessStatusApprovedIcon className="h-[13px] w-[16.25px] shrink-0 text-[#2a5c16]" />
        <p className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#2a5c16]">
          {SPR_KPI_REVIEW.confirmedSummaryLabel(dateLabel)}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="flex h-[24px] items-center gap-[4px] rounded-[5px] border border-[#a8dfa8] bg-white px-[10px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#2a5c16] hover:border-[#7ecf7e]"
      >
        <EditPencilIcon />
        {SPR_KPI_REVIEW.editLabel}
      </button>
    </div>
  );
}

function DiscrepancySummaryBar({
  dateLabel,
  timeLabel,
  comment,
  onEdit,
}: {
  dateLabel: string;
  timeLabel: string;
  comment: string;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-[8px] bg-[#ffd0db] px-[13px] py-[11px]">
      <div className="flex items-center justify-between gap-[8px]">
        <div className="flex min-w-0 items-center gap-[6px]">
          <SprWarningTriangleIcon className="h-[11px] w-[13.75px] shrink-0 text-[#570b1d]" />
          <p className="font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#570b1d]">
            {SPR_KPI_REVIEW.discrepancyReportedSummaryLabel(dateLabel, timeLabel)}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex h-[24px] shrink-0 items-center gap-[4px] rounded-[5px] border border-[#bd3b5b] bg-white px-[10px] font-['Inter:Semi_Bold',sans-serif] text-[9.5px] font-semibold text-[#bd3b5b] hover:border-[#a8324f]"
        >
          <EditPencilIcon />
          {SPR_KPI_REVIEW.editLabel}
        </button>
      </div>
      {comment ? (
        <p className="pt-[6px] font-['Inter:Italic',sans-serif] text-[10.5px] italic leading-[15.75px] text-[#570b1d]">
          {comment}
        </p>
      ) : null}
    </div>
  );
}

function ActionButtons({
  response,
  onConfirm,
  onStartDiscrepancy,
}: {
  response: SprKpiReviewResponse;
  onConfirm: () => void;
  onStartDiscrepancy: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-[9px] sm:grid-cols-2">
      <button
        type="button"
        onClick={onConfirm}
        className={`flex h-[36px] items-center justify-center gap-[6px] rounded-[8px] border-[1.5px] px-[12px] font-['Inter:Semi_Bold',sans-serif] text-[11.5px] font-semibold ${
          response === 'confirmed'
            ? 'border-[#a8dfa8] bg-[#e0ffd3] text-[#2a5c16]'
            : 'border-[#e3e3e3] bg-white text-[#2a5c16] hover:border-[#a8dfa8]'
        }`}
      >
        <SprProcessStatusApprovedIcon className="h-[11.5px] w-[14.375px] shrink-0" />
        {SPR_KPI_REVIEW.confirmLabel}
      </button>
      <button
        type="button"
        onClick={onStartDiscrepancy}
        className={`flex h-[36px] items-center justify-center gap-[6px] rounded-[8px] border-[1.5px] px-[12px] font-['Inter:Semi_Bold',sans-serif] text-[11.5px] font-semibold ${
          response === 'discrepancy'
            ? 'border-[#f0a8b8] bg-[#ffd0db] text-[#570b1d]'
            : 'border-[#e3e3e3] bg-white text-[#bd3b5b] hover:border-[#f0a8b8]'
        }`}
      >
        <SprWarningTriangleIcon className="h-[11.5px] w-[14.375px] shrink-0" />
        {SPR_KPI_REVIEW.reportDiscrepancyLabel}
      </button>
    </div>
  );
}

function DiscrepancyReportForm({
  initialComment,
  onCancel,
  onSubmit,
}: {
  initialComment?: string;
  onCancel: () => void;
  onSubmit: (comment: string) => void;
}) {
  const [comment, setComment] = useState(initialComment ?? '');

  return (
    <div className="flex flex-col gap-[6px]">
      <p className="font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#131313]">
        {SPR_KPI_REVIEW.discrepancyExplanationLabel} <span className="text-[#bd3b5b]">*</span>
      </p>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder={SPR_KPI_REVIEW.discrepancyExplanationPlaceholder}
        className="h-[72px] w-full resize-none rounded-[8px] border-[1.5px] border-[#bd3b5b] bg-[#fffafa] px-[11.5px] py-[9.5px] font-['Inter:Regular',sans-serif] text-[11px] text-[#131313] outline-none placeholder:text-[#acacac] focus:border-[#bd3b5b]"
      />
      <div className="flex justify-end gap-[8px]">
        <button
          type="button"
          onClick={onCancel}
          className="h-[29px] rounded-[6px] border border-[#e3e3e3] bg-white px-[13px] font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold text-[#646464] hover:border-[#acacac]"
        >
          {SPR_KPI_REVIEW.cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => onSubmit(comment.trim())}
          disabled={comment.trim().length === 0}
          className="flex h-[29px] items-center gap-[5px] rounded-[6px] bg-[#bd3b5b] px-[12px] font-['Inter:Bold',sans-serif] text-[10.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SprConfirmSendIcon className="h-[10px] w-[12.5px] shrink-0" />
          {SPR_KPI_REVIEW.submitDiscrepancyLabel}
        </button>
      </div>
    </div>
  );
}

function DirectComparisonPanel({ card }: { card: Extract<SprKpiReviewCardConfig, { type: 'direct' }> }) {
  const sacUnavailable = card.sacUnavailable === true;

  return (
    <div className="overflow-hidden rounded-[8px] border border-[#e3e3e3]">
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="bg-[#f7f7f7] px-[14px] py-[12px] text-center sm:border-r sm:border-[#e3e3e3]">
          <p className="font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.63px] text-[#acacac]">
            Tú ingresaste
          </p>
          <p className="pt-[5px] font-['Inter:Bold',sans-serif] text-[22px] font-bold leading-[22px] text-[#131313]">
            {card.youEntered.value}
          </p>
          {card.youEntered.unit ? (
            <p className="pt-[2px] font-['Inter:Regular',sans-serif] text-[11px] text-[#646464]">{card.youEntered.unit}</p>
          ) : null}
        </div>
        <div className="bg-[#e6f3ff] px-[14px] py-[12px] text-center">
          <p className="font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.63px] text-[#acacac]">
            Recibido por el SAC
          </p>
          {sacUnavailable ? (
            <p className="pt-[5px] font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold leading-[16px] text-[#0d3862]">
              {card.sacReceived.value}
            </p>
          ) : (
            <>
              <p className="pt-[5px] font-['Inter:Bold',sans-serif] text-[22px] font-bold leading-[22px] text-[#0d3862]">
                {card.sacReceived.value}
              </p>
              {card.sacReceived.unit ? (
                <p className="pt-[2px] font-['Inter:Regular',sans-serif] text-[11px] text-[#646464]">{card.sacReceived.unit}</p>
              ) : null}
            </>
          )}
        </div>
      </div>
      {sacUnavailable ? (
        <div className="flex items-start gap-[6px] border-t border-[#c5d8f0] bg-[#f0f6ff] px-[12px] py-[8px]">
          <SprInfoCircleIcon className="mt-px h-[11px] w-[13.75px] shrink-0 text-[#0d3862]" />
          <p className="font-['Inter:Regular',sans-serif] text-[9.5px] leading-[normal] text-[#0d3862]">
            {SPR_KPI_REVIEW.sacUnavailableFooter}
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-[5px] border-t border-[#a8dfa8] bg-[#e0ffd3] px-[12px] py-[6px]">
          <SprProcessStatusApprovedIcon className="h-[11px] w-[13.75px] shrink-0 text-[#2a5c16]" />
          <p className="font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#2a5c16]">{card.matchMessage}</p>
        </div>
      )}
    </div>
  );
}

function CalculatedComparisonPanel({ card }: { card: Extract<SprKpiReviewCardConfig, { type: 'calculated' }> }) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-[#e3e3e3]">
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="bg-[#f7f7f7] px-[14px] py-[11px] sm:border-r sm:border-[#e3e3e3]">
          <p className="font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.54px] text-[#acacac]">
            Datos que tú ingresaste
          </p>
          <div className="flex flex-col gap-[3px] pt-[6px]">
            {card.inputs.map((input) => (
              <div key={input.label} className="flex items-start justify-between gap-[8px]">
                <p className="font-['Inter:Regular',sans-serif] text-[10.5px] text-[#646464]">{input.label}</p>
                <p className="shrink-0 font-['Inter:Bold',sans-serif] text-[10.5px] font-bold text-[#131313]">{input.value}</p>
              </div>
            ))}
          </div>
          <p className="pt-[5px] font-['Inter:Italic',sans-serif] text-[9px] italic text-[#acacac]">{card.formula}</p>
        </div>
        <div className="bg-[#e6f3ff] px-[14px] py-[11px] text-center">
          <p className="font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.54px] text-[#acacac]">
            Calculado por el SAC
          </p>
          <p className="pt-[5px] font-['Inter:Bold',sans-serif] text-[22px] font-bold leading-[22px] text-[#0d3862]">
            {card.sacValue}
          </p>
          <p className="pt-[2px] font-['Inter:Regular',sans-serif] text-[11px] text-[#646464]">{card.sacUnit}</p>
        </div>
      </div>
      <div className="flex items-start gap-[6px] border-t border-[#c5d8f0] bg-[#f0f6ff] px-[12px] py-[8px]">
        <SprInfoCircleIcon className="mt-px h-[11px] w-[13.75px] shrink-0 text-[#0d3862]" />
        <p className="font-['Inter:Regular',sans-serif] text-[9.5px] leading-[normal] text-[#0d3862]">{card.infoMessage}</p>
      </div>
    </div>
  );
}

export function SprKpiReviewCard({
  card,
  response,
  responseMeta,
  discrepancyComment,
  initialReportingDiscrepancy = false,
  isEditing = false,
  onConfirm,
  onReportDiscrepancy,
  onEdit,
  onCancelEdit,
}: SprKpiReviewCardProps) {
  const [isReportingDiscrepancy, setIsReportingDiscrepancy] = useState(
    initialReportingDiscrepancy && response === 'pending',
  );

  const showActionArea = response === 'pending' || isEditing;
  const dateLabel = responseMeta?.dateLabel ?? SPR_KPI_REVIEW.responseDateFallback;
  const timeLabel = responseMeta?.timeLabel ?? SPR_KPI_REVIEW.discrepancyTimeFallback;

  function handleConfirm() {
    setIsReportingDiscrepancy(false);
    onConfirm();
  }

  function handleSubmitDiscrepancy(comment: string) {
    if (!comment) return;
    setIsReportingDiscrepancy(false);
    onReportDiscrepancy(comment);
  }

  function handleStartDiscrepancy() {
    setIsReportingDiscrepancy(true);
  }

  function handleCancelForm() {
    setIsReportingDiscrepancy(false);
    if (isEditing) onCancelEdit();
  }

  function handleEdit() {
    if (response === 'discrepancy') setIsReportingDiscrepancy(true);
    onEdit();
  }

  return (
    <article className="w-full min-w-0 overflow-hidden rounded-[9px] border border-[#e3e3e3] bg-white">
      <header className="flex w-full items-start justify-between gap-[12px] border-b border-[#e3e3e3] px-[15px] py-[12px]">
        <div className="min-w-0">
          <p className="font-['Inter:Bold',sans-serif] text-[12.5px] font-bold text-[#001e39]">{card.title}</p>
          <p className="pt-[2px] font-['Inter:Regular',sans-serif] text-[9.5px] text-[#646464]">{card.subtitle}</p>
        </div>
        <HeaderBadge response={response} />
      </header>

      <div className="flex w-full flex-col gap-[12px] px-[15px] py-[13px]">
        {card.type === 'direct' ? <DirectComparisonPanel card={card} /> : <CalculatedComparisonPanel card={card} />}
        {showActionArea ? (
          isReportingDiscrepancy ? (
            <DiscrepancyReportForm
              initialComment={discrepancyComment}
              onCancel={handleCancelForm}
              onSubmit={handleSubmitDiscrepancy}
            />
          ) : (
            <ActionButtons
              response={response === 'pending' ? 'pending' : response}
              onConfirm={handleConfirm}
              onStartDiscrepancy={handleStartDiscrepancy}
            />
          )
        ) : response === 'confirmed' ? (
          <ConfirmedSummaryBar dateLabel={dateLabel} onEdit={handleEdit} />
        ) : (
          <DiscrepancySummaryBar
            dateLabel={dateLabel}
            timeLabel={timeLabel}
            comment={discrepancyComment ?? ''}
            onEdit={handleEdit}
          />
        )}
      </div>
    </article>
  );
}

export function SprKpiReviewReportBanner({ cycleLabel }: { cycleLabel?: string }) {
  const label = cycleLabel ?? SPR_ACTIVE_CYCLE.label;
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-[12px] rounded-[9px] bg-[#001e39] px-[18px] py-[14px]">
      <div className="flex min-w-0 items-center gap-[12px]">
        <div className="flex size-[40px] shrink-0 items-center justify-center rounded-[9px] bg-[rgba(255,255,255,0.1)]">
          <SprPdfFileIcon className="h-[18px] w-[22.5px] text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-white">
            {SPR_KPI_REVIEW.reportBannerTitle(label)}
          </p>
          <p className="pt-[3px] font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[rgba(255,255,255,0.6)]">
            {SPR_KPI_REVIEW.reportBannerDescription}
          </p>
        </div>
      </div>
      <button
        type="button"
        className="flex h-[32px] shrink-0 items-center gap-[8px] rounded-[5px] border border-[#001e39] bg-[#001e39] px-[14px] font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold text-white hover:bg-[#0a2f52]"
      >
        <SprPdfFileIcon className="h-[12px] w-[15px]" />
        {SPR_KPI_REVIEW.downloadPdfLabel}
      </button>
    </div>
  );
}
