import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCreateSprCycleValidation } from '../../shared/hooks/useSprCycleValidations';
import { SprFooterInfoIcon, SprSubmitIcon } from './icons/SprIcons';
import {
  SprKpiReviewCard,
  SprKpiReviewReportBanner,
  type SprKpiReviewResponse,
  type SprKpiReviewResponseMeta,
} from './components/SprKpiReviewCard';
import { SprKpiReviewFinalizeModal } from './components/SprKpiReviewFinalizeModal';
import {
  SPR_ACTIVE_CYCLE,
  SPR_FORM_DEMO_DISCREPANCY_QUERY,
  SPR_FORM_DEMO_FINALIZE_MODAL,
  SPR_FORM_DEMO_MODAL_QUERY,
  SPR_FORM_DEMO_REVIEW_PRESET_QUERY,
  SPR_FORM_DEMO_REVIEW_PRESET_REVIEWED,
  SPR_KPI_REVIEW,
  SPR_KPI_REVIEW_FINALIZE_MODAL,
  type SprKpiReviewCardConfig,
} from './spr.constants';
import { buildSoxValidationPayload } from './sprKpiReviewCards';

interface SprKpiReviewViewProps {
  onBack: () => void;
  /** Solo demo Figma: navega a estado submitted sin POST. */
  onFinalize?: () => void;
  /** Modo real — POST /spr/cycles/:id/validations. */
  cycleId?: string;
  areaId?: string;
  areaName?: string;
  cycleLabel?: string;
  metaLabel?: string;
  cards?: SprKpiReviewCardConfig[];
}

function SprKpiReviewBackIcon() {
  return (
    <svg width="16.25" height="13" viewBox="0 0 16.25 13" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M6.5 1.625L1.625 6.5L6.5 11.375"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M1.625 6.5H14.625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function formatDateLabel(date = new Date()) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
}

function formatTimeLabel(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function buildDemoReviewedState(): {
  responses: Record<string, SprKpiReviewResponse>;
  responseMeta: Record<string, SprKpiReviewResponseMeta>;
  discrepancyComments: Record<string, string>;
} {
  const dateLabel = SPR_KPI_REVIEW.responseDateFallback;
  const timeLabel = SPR_KPI_REVIEW.discrepancyTimeFallback;

  return {
    responses: {
      'ground-water-freshwater': 'confirmed',
      'water-recycled': 'confirmed',
      'freshwater-intensity': 'discrepancy',
    },
    responseMeta: {
      'ground-water-freshwater': { dateLabel },
      'water-recycled': { dateLabel },
      'freshwater-intensity': { dateLabel, timeLabel },
    },
    discrepancyComments: {
      'freshwater-intensity': SPR_KPI_REVIEW.demoDiscrepancyCommentFallback,
    },
  };
}

// Revision de KPIs (Figma 2653:2078 real / 1760:* demo).
export function SprKpiReviewView({
  onBack,
  onFinalize,
  cycleId,
  areaId,
  areaName,
  cycleLabel,
  metaLabel,
  cards: cardsProp,
}: SprKpiReviewViewProps) {
  const [searchParams] = useSearchParams();
  const demoDiscrepancyCardId = searchParams.get(SPR_FORM_DEMO_DISCREPANCY_QUERY);
  const isDemoReviewedPreset =
    searchParams.get(SPR_FORM_DEMO_REVIEW_PRESET_QUERY) === SPR_FORM_DEMO_REVIEW_PRESET_REVIEWED;
  const isDemoFinalizeModal = searchParams.get(SPR_FORM_DEMO_MODAL_QUERY) === SPR_FORM_DEMO_FINALIZE_MODAL;
  const demoReviewedState = isDemoReviewedPreset ? buildDemoReviewedState() : null;

  const isRealMode = Boolean(cycleId && areaId);
  const cards = cardsProp ?? [...SPR_KPI_REVIEW.cards];
  const resolvedCycleLabel = cycleLabel ?? SPR_ACTIVE_CYCLE.label;
  const resolvedMetaLabel = metaLabel ?? SPR_KPI_REVIEW.metaLabel;
  const resolvedAreaName = areaName ?? SPR_KPI_REVIEW_FINALIZE_MODAL.areaLabelFallback;

  const createValidation = useCreateSprCycleValidation(cycleId);

  const [responses, setResponses] = useState<Record<string, SprKpiReviewResponse>>(() => {
    if (demoReviewedState) return demoReviewedState.responses;
    return Object.fromEntries(cards.map((card) => [card.id, 'pending' as const]));
  });
  const [responseMeta, setResponseMeta] = useState<Record<string, SprKpiReviewResponseMeta>>(
    () => demoReviewedState?.responseMeta ?? {},
  );
  const [discrepancyComments, setDiscrepancyComments] = useState<Record<string, string>>(
    () => demoReviewedState?.discrepancyComments ?? {},
  );
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(isDemoFinalizeModal && isDemoReviewedPreset);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const allReviewed = useMemo(
    () => cards.length > 0 && cards.every((card) => responses[card.id] !== 'pending'),
    [cards, responses],
  );

  const reviewSummary = useMemo(() => {
    const values = cards.map((card) => responses[card.id] ?? 'pending');
    return {
      confirmedCount: values.filter((response) => response === 'confirmed').length,
      discrepancyCount: values.filter((response) => response === 'discrepancy').length,
    };
  }, [cards, responses]);

  function setCardResponse(cardId: string, response: Exclude<SprKpiReviewResponse, 'pending'>) {
    const now = new Date();
    setResponseMeta((current) => ({
      ...current,
      [cardId]: {
        dateLabel: formatDateLabel(now),
        ...(response === 'discrepancy' ? { timeLabel: formatTimeLabel(now) } : {}),
      },
    }));
    setResponses((current) => ({ ...current, [cardId]: response }));
    setEditingCardId(null);
  }

  function setCardDiscrepancy(cardId: string, comment: string) {
    setDiscrepancyComments((current) => ({ ...current, [cardId]: comment }));
    setCardResponse(cardId, 'discrepancy');
  }

  function handleOpenFinalizeModal() {
    if (!allReviewed) return;
    setSubmitError(null);
    setFinalizeModalOpen(true);
  }

  async function handleConfirmFinalize() {
    if (!allReviewed || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (isRealMode && cycleId && areaId) {
        const payload = buildSoxValidationPayload(cards, responses, discrepancyComments);
        await createValidation.mutateAsync({
          areaId,
          decision: payload.decision,
          comments: payload.comments,
        });
        setFinalizeModalOpen(false);
        onBack();
        return;
      }
      onFinalize?.();
      setFinalizeModalOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : SPR_KPI_REVIEW.submitErrorFallback);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col bg-[#f7f7f7]">
      <div className="shrink-0 border-b border-[#e3e3e3] bg-white">
        <div className="flex items-center justify-between gap-[12px] px-[22px] py-[10px]">
          <div className="flex min-w-0 items-center gap-[10px]">
            <button
              type="button"
              onClick={onBack}
              aria-label="Volver"
              className="flex size-[28px] shrink-0 items-center justify-center rounded-[6px] border border-[#e3e3e3] bg-white text-[#646464] hover:border-[#24588b] hover:text-[#24588b]"
            >
              <SprKpiReviewBackIcon />
            </button>
            <p className="font-['Inter:Bold',sans-serif] text-[13.5px] font-bold text-[#001e39]">
              {SPR_KPI_REVIEW.pageTitle(resolvedCycleLabel)}
            </p>
          </div>
          <p className="hidden shrink-0 font-['Inter:Regular',sans-serif] text-[10px] text-[#646464] sm:block">
            {resolvedMetaLabel}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-[14px] px-[22px] py-[18px] pb-[80px]">
          <SprKpiReviewReportBanner cycleLabel={resolvedCycleLabel} />
          {cards.length === 0 ? (
            <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#646464]">
              {SPR_KPI_REVIEW.emptySoxCardsMessage}
            </p>
          ) : (
            cards.map((card) => (
              <SprKpiReviewCard
                key={card.id}
                card={card}
                response={responses[card.id] ?? 'pending'}
                responseMeta={responseMeta[card.id]}
                discrepancyComment={discrepancyComments[card.id]}
                initialReportingDiscrepancy={
                  demoDiscrepancyCardId === card.id && (responses[card.id] ?? 'pending') === 'pending'
                }
                isEditing={editingCardId === card.id}
                onConfirm={() => setCardResponse(card.id, 'confirmed')}
                onReportDiscrepancy={(comment) => setCardDiscrepancy(card.id, comment)}
                onEdit={() => setEditingCardId(card.id)}
                onCancelEdit={() => setEditingCardId(null)}
              />
            ))
          )}
          {submitError ? (
            <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#bd3b5b]" role="alert">
              {submitError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#e3e3e3] bg-white px-[22px] py-[12px]">
        <div className="flex flex-wrap items-center justify-between gap-[10px]">
          <div className="flex items-center gap-[6px]">
            <SprFooterInfoIcon className="h-[11px] w-[13.75px] shrink-0 text-[#646464]" />
            <p className="font-['Inter:Regular',sans-serif] text-[11px] text-[#646464]">
              {SPR_KPI_REVIEW.footerHint(cards.length || SPR_KPI_REVIEW.cards.length)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenFinalizeModal}
            disabled={!allReviewed}
            className={`flex h-[36px] items-center gap-[6px] rounded-[7px] px-[20px] font-['Inter:Bold',sans-serif] text-[12px] font-bold ${
              allReviewed
                ? 'bg-[#c8a064] text-white hover:bg-[#b89255]'
                : 'cursor-not-allowed bg-[#e3e3e3] text-[#acacac]'
            }`}
          >
            <SprSubmitIcon className="h-[12px] w-[15px]" />
            {SPR_KPI_REVIEW.finalizeLabel}
          </button>
        </div>
      </div>

      <SprKpiReviewFinalizeModal
        open={finalizeModalOpen}
        summary={reviewSummary}
        kpiCount={cards.length || SPR_KPI_REVIEW_FINALIZE_MODAL.kpiCount}
        areaLabel={resolvedAreaName}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (isSubmitting) return;
          setFinalizeModalOpen(false);
        }}
        onConfirm={handleConfirmFinalize}
      />
    </div>
  );
}
