import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SprCycleStatus } from '@aurelia/contracts';
import { useSprCycle } from '../../shared/hooks/useSprCycle';
import { useSprCycleSacSubmission } from '../../shared/hooks/useSprCycleSacSubmission';
import { useSprReportDashboardReal } from '../../shared/hooks/useSprReportDashboardReal';
import { useSprSigners } from '../../shared/hooks/useSprSigners';
import {
  SPR_REPORT_DASHBOARD,
  SPR_REPORT_FLOW_QUERY,
  SPR_REPORT_TIMELINE_STEPS,
  getSprReportDashboardConfig,
  type SprReportAreaCardStatus,
  type SprReportFlowId,
  type SprReportKpiHelperTone,
  type SprReportKpiValueTone,
  type SprReportTimelineAccent,
  type SprReportTimelineStepStatus,
} from './spr.constants';
import {
  appendSprReportCycleToHref,
  buildSprReportAreaHref,
  type SprReportCycle,
} from './sprReportCycles';
import { resolveSprCycleSacBannerMessage } from './sprReportDay9';
import { buildSprReportHonestStatusRows } from './sprReportStatusRows.real';
import { buildFirmaTimelineDescription } from './sprSignerLabels';
import { SprProcessStatusApprovedIcon, SprTimelineStepIcon, SprWarningTriangleIcon } from './icons/SprIcons';

/** Sin `?estado=`, el chrome sigue el status real del ciclo (closed / validation_approved). */
function resolveSprReportEffectiveFlow(
  flowFromUrl: SprReportFlowId,
  hasExplicitEstado: boolean,
  cycleStatus: SprCycleStatus | null | undefined,
): SprReportFlowId {
  if (hasExplicitEstado) return flowFromUrl;
  if (cycleStatus === SprCycleStatus.CLOSED) return 'ciclo-cerrado';
  if (cycleStatus === SprCycleStatus.VALIDATION_APPROVED) return 'validacion-aprobada';
  return 'en-curso';
}

function statusDotClass(status: SprReportAreaCardStatus) {
  if (status === 'complete') return 'bg-[#3a9b3a]';
  if (status === 'consolidating') return 'bg-[#24588b]';
  if (status === 'estimated') return 'bg-[#7b4fbf]';
  // Figma 2109:44036 — Pendiente en tono danger.
  return 'bg-[#bd3b5b]';
}

function statusLabelClass(status: SprReportAreaCardStatus) {
  if (status === 'complete') return 'text-[#3a9b3a]';
  if (status === 'consolidating') return 'text-[#24588b]';
  if (status === 'estimated') return 'text-[#7b4fbf]';
  return 'text-[#bd3b5b]';
}

function timelineProgressWidth(status: SprReportTimelineStepStatus, progress: number) {
  if (status === 'done') return '100%';
  if (status === 'active') return `${Math.round(progress * 100)}%`;
  return '0%';
}

function timelineAccentClass(accent: SprReportTimelineAccent) {
  if (accent === 'rose') return 'border-t-[#e8728a]';
  if (accent === 'teal') return 'border-t-[#00b398]';
  if (accent === 'amber') return 'border-t-[#e8720c]';
  if (accent === 'navy') return 'border-t-[#24588b]';
  return 'border-t-[#5b8def]';
}

function kpiValueClass(tone: SprReportKpiValueTone = 'navy') {
  if (tone === 'amber') return 'text-[#e8a820] text-[16px] leading-[16px]';
  if (tone === 'teal') return 'text-[#00b398]';
  return 'text-[#001e39]';
}

function kpiHelperClass(tone: SprReportKpiHelperTone, advanced = false) {
  if (tone === 'teal') return advanced ? 'text-[#3a9b3a]' : 'text-[#006153]';
  if (tone === 'purple') return 'text-[#7b4fbf]';
  if (tone === 'amber') return 'text-[#8e6e3e]';
  if (tone === 'navy') return 'text-[#001e39]';
  return advanced ? 'text-[#acacac]' : 'text-[#646464]';
}

function statusBadgeClass(tone: 'success' | 'muted') {
  if (tone === 'success') return 'bg-[#e0ffd3] text-[#2a5c16]';
  return 'bg-[#f2f2f2] text-[#646464]';
}

function cycleBannerBadgeClass(tone: 'teal' | 'purple' | 'success') {
  if (tone === 'purple') return 'bg-[#f3eeff] text-[#7b4fbf]';
  if (tone === 'success') return 'bg-[#e0ffd3] text-[#2a5c16]';
  return 'bg-[#e6f3ff] text-[#0d3862] font-semibold text-[8.5px]';
}

function areaBadgeClass(badge: string, status: SprReportAreaCardStatus) {
  if (badge.includes('Consolidado')) return 'bg-[#c5fff6] text-[#006153]';
  if (badge.includes('Consol.')) return 'bg-[#e6f3ff] text-[#0d3862]';
  if (badge.includes('✓')) return 'bg-[#e0ffd3] text-[#2a5c16]';
  if (badge.includes('→')) return 'bg-[#ffeab8] text-[#8e6e3e]';
  if (status === 'estimated' && badge.includes('Estimados')) return 'bg-[#f3e8ff] text-[#7b4fbf]';
  return 'bg-[#f7f7f7] text-[#646464]';
}

function closureStatusBadgeClass(tone: 'danger' | 'success') {
  if (tone === 'success') return 'bg-[#e0ffd3] text-[#2a5c16]';
  return 'bg-[#ffd0db] text-[#570b1d]';
}

function closureItemBadgeClass(status: 'pending' | 'completed') {
  if (status === 'completed') return 'bg-[#e0ffd3] text-[#2a5c16]';
  return 'bg-[#ffd0db] text-[#570b1d]';
}

/**
 * Vista consolidada SPR para Especialista (Figma 2109:45162 / 49560 / 1797:46981 / 2109:49077).
 * KPIs + Estado por área: datos reales (assignments + monthly-records del ciclo).
 * Si el fetch falla: mensaje de error (nunca mock de KPIs/cards).
 * Chrome closed / validation_approved: desde cycle.status (sin ?estado=) o mock vía ?estado=.
 * Real: KPIs/cards + countdown día 9 desde spr_cycles + filas Consolidado N/8 y Envío SAC (honestas).
 */
export function SprReportView({ cycle, flow }: { cycle: SprReportCycle; flow: SprReportFlowId }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sprCycleQuery = useSprCycle(cycle.periodYear, cycle.periodMonth);
  const effectiveFlow = resolveSprReportEffectiveFlow(
    flow,
    searchParams.has(SPR_REPORT_FLOW_QUERY),
    sprCycleQuery.cycle?.status,
  );
  const config = getSprReportDashboardConfig(effectiveFlow);
  const isAdvancedFlow = effectiveFlow !== 'en-curso';
  const cycleLabel = sprCycleQuery.cycle?.label ?? cycle.label;
  const realDashboard = useSprReportDashboardReal(cycle.periodYear, cycle.periodMonth);
  const sacQuery = useSprCycleSacSubmission(sprCycleQuery.cycle?.id);
  const signersQuery = useSprSigners();
  const day9Countdown = sprCycleQuery.countdown;
  const sacBannerMessage = resolveSprCycleSacBannerMessage(day9Countdown, sacQuery.submission);

  const dashboardDataError = realDashboard.isError;
  const dashboardDataLoading = realDashboard.isLoading && !dashboardDataError;
  const kpiCards = realDashboard.kpiCards;
  const areaCards = realDashboard.areaCards;

  const consolidadoHref = appendSprReportCycleToHref(
    effectiveFlow === 'en-curso'
      ? '/spr/reporte/consolidado?estado=en-curso'
      : `/spr/reporte/consolidado?estado=${effectiveFlow}`,
    cycle.id,
  );

  const statusRows = useMemo(
    () =>
      buildSprReportHonestStatusRows({
        areaCards,
        day9: day9Countdown,
        sacSubmission: sacQuery.submission,
        consolidadoHref,
        consolidadoActionVariant: isAdvancedFlow ? 'primary' : 'outline',
        specialists: signersQuery.specialists,
        managers: signersQuery.managers,
      }),
    [
      areaCards,
      day9Countdown,
      sacQuery.submission,
      consolidadoHref,
      isAdvancedFlow,
      signersQuery.specialists,
      signersQuery.managers,
    ],
  );

  const timelineSteps = useMemo(
    () =>
      SPR_REPORT_TIMELINE_STEPS.map((step) =>
        step.step === 4
          ? {
              ...step,
              description: buildFirmaTimelineDescription(
                signersQuery.specialists,
                signersQuery.managers,
              ),
            }
          : step,
      ),
    [signersQuery.specialists, signersQuery.managers],
  );

  return (
    <div className="h-[calc(100vh-56px)] w-full overflow-y-auto bg-[#f7f7f7]">
      <div className="flex flex-col gap-[14px] px-[22px] py-[18px]">
        {config.cycleBanner.variant === 'navy' ? (
          <div className="flex items-center justify-between rounded-[9px] bg-[#001e39] px-[16px] py-[11px]">
            <div className="flex items-center gap-[10px]">
              <span className="size-[7px] rounded-[3.5px] bg-[#00b398]" aria-hidden />
              <div>
                <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-white">
                  {SPR_REPORT_DASHBOARD.cycleBannerTitle(cycleLabel)}
                </p>
                {config.cycleBanner.helper ? (
                  <p className="pt-px font-['Inter:Regular',sans-serif] text-[10px] text-[rgba(255,255,255,0.45)]">
                    {config.cycleBanner.helper}
                  </p>
                ) : null}
                {sprCycleQuery.isLoading || sacQuery.isLoading ? (
                  <p className="pt-[4px] font-['Inter:Regular',sans-serif] text-[10px] text-[rgba(255,255,255,0.55)]">
                    {SPR_REPORT_DASHBOARD.cycleLoadingLabel}
                  </p>
                ) : sprCycleQuery.isError || !sacBannerMessage ? (
                  <p className="pt-[4px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#ffd0db]">
                    {SPR_REPORT_DASHBOARD.cycleLoadErrorDescription}
                  </p>
                ) : (
                  <p className="pt-[4px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#c5fff6]">
                    {sacBannerMessage}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-[12px]">
              {config.cycleBanner.badges.map((badge) => (
                <span
                  key={badge.label}
                  className={`rounded-[4px] px-[6px] py-[2px] font-['Inter:Bold',sans-serif] text-[9px] font-bold ${cycleBannerBadgeClass(badge.tone)}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-[8px] border border-[#e3e3e3] bg-white px-[16px] py-[11px]">
            <div className="flex items-center gap-[10px]">
              <span className="size-[7px] rounded-full bg-[#00b398]" aria-hidden />
              <div>
                <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#131313]">
                  {SPR_REPORT_DASHBOARD.cycleBannerTitle(cycleLabel)}
                </p>
                <p className="pt-px font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
                  {config.cycleBanner.helper}
                </p>
                {sprCycleQuery.isLoading || sacQuery.isLoading ? (
                  <p className="pt-[4px] font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
                    {SPR_REPORT_DASHBOARD.cycleLoadingLabel}
                  </p>
                ) : sprCycleQuery.isError || !sacBannerMessage ? (
                  <p className="pt-[4px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#570b1d]">
                    {SPR_REPORT_DASHBOARD.cycleLoadErrorDescription}
                  </p>
                ) : (
                  <p className="pt-[4px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#0d3862]">
                    {sacBannerMessage}
                  </p>
                )}
              </div>
            </div>
            <span className="rounded-[4px] bg-[#e0ffd3] px-[5px] py-[2px] font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#2a5c16]">
              {config.cycleBanner.badges[0]?.label}
            </span>
          </div>
        )}

        {config.estimateBanner ? (
          <div className="flex items-start gap-[10px] rounded-[9px] border-[1.5px] border-[#c9aeff] bg-[#f3eeff] px-[15.5px] py-[13.5px]">
            <SprWarningTriangleIcon className="mt-px h-[15px] w-[18.75px] shrink-0 text-[#7b4fbf]" />
            <div className="min-w-0">
              <p className="font-['Inter:Bold',sans-serif] text-[11.5px] font-bold text-[#7b4fbf]">
                {config.estimateBanner.title}
              </p>
              <p className="pt-[3px] font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#7b4fbf]">
                {config.estimateBanner.description}
                {config.estimateBanner.descriptionBold ? (
                  <span className="font-['Inter:Bold',sans-serif] font-bold">
                    {config.estimateBanner.descriptionBold}
                  </span>
                ) : null}
                {config.estimateBanner.descriptionAfter ?? null}
              </p>
            </div>
          </div>
        ) : null}

        {/* PLACEHOLDER/MOCK: timeline del ciclo — sin spr_reporting_cycles aún */}
        {config.showTimeline ? (
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[8px] border border-[#e3e3e3] bg-[#e3e3e3] sm:grid-cols-2 lg:grid-cols-5">
            {timelineSteps.map((step) => (
              <div
                key={step.step}
                className={`flex flex-col border-t-[3px] bg-white px-[14px] py-[11px] ${timelineAccentClass(step.accent)}`}
              >
                <div className="flex items-center gap-[6px]">
                  <span
                    className={`flex size-[16px] items-center justify-center rounded-full ${
                      step.status === 'upcoming' ? 'bg-[#f2f2f2] text-[#acacac]' : 'bg-[#001e39] text-white'
                    }`}
                  >
                    <SprTimelineStepIcon stepIndex={step.step - 1} width={10} height={8} className="shrink-0" />
                  </span>
                  <p className="font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#131313]">{step.title}</p>
                </div>
                <p className="pt-[6px] font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#131313]">
                  {step.dateLabel}
                </p>
                <p className="pt-[4px] font-['Inter:Regular',sans-serif] text-[10px] leading-[14px] text-[#646464]">
                  {step.description}
                </p>
                <div className="mt-auto flex items-center gap-[6px] pt-[12px]">
                  <span className="flex size-[22px] items-center justify-center rounded-full bg-[#eef2f7] text-[9px] text-[#24588b]">
                    •
                  </span>
                  <p className="font-['Inter:Semi_Bold',sans-serif] text-[9px] font-semibold text-[#646464]">
                    {step.actorLabel}
                  </p>
                </div>
                <div className="mt-[8px] h-[3px] w-full overflow-hidden rounded-full bg-[#ebebeb]">
                  <div
                    className={`h-full rounded-full ${step.status === 'upcoming' ? 'bg-transparent' : 'bg-[#00b398]'}`}
                    style={{ width: timelineProgressWidth(step.status, step.progress) }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {dashboardDataError ? (
          <div
            role="alert"
            className="rounded-[9px] border border-[#f5c4a0] bg-[#fff0e6] px-[15px] py-[14px]"
          >
            <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#e8720c]">
              {SPR_REPORT_DASHBOARD.dataLoadErrorTitle}
            </p>
            <p className="pt-[4px] font-['Inter:Regular',sans-serif] text-[11px] leading-[16px] text-[#6b3a1f]">
              {SPR_REPORT_DASHBOARD.dataLoadErrorDescription}
            </p>
          </div>
        ) : dashboardDataLoading || !kpiCards ? (
          <div className="rounded-[9px] border border-[#e3e3e3] bg-white px-[15px] py-[18px]">
            <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#646464]">
              {SPR_REPORT_DASHBOARD.dataLoadingLabel}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => (
              <div key={card.label} className="rounded-[9px] border border-[#e3e3e3] bg-white px-[15px] py-[13px]">
                <p
                  className={`font-['Inter:Bold',sans-serif] text-[20px] font-bold leading-[20px] ${kpiValueClass(card.valueTone)}`}
                >
                  {card.value}
                </p>
                {isAdvancedFlow ? (
                  <>
                    <p className="pt-[4px] font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
                      {card.label}
                      {card.labelHighlight ? (
                        <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#7b4fbf]">
                          {card.labelHighlight}
                        </span>
                      ) : null}
                    </p>
                    <p
                      className={`pt-[3px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold ${kpiHelperClass(card.helperTone, true)}`}
                    >
                      {card.helper}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="pt-[4px] font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#131313]">
                      {card.label}
                    </p>
                    <p className={`pt-[3px] font-['Inter:Regular',sans-serif] text-[10px] ${kpiHelperClass(card.helperTone)}`}>
                      {card.helper}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Consolidado N/8 + Envío SAC (countdown) reales; Firma pendiente mock */}
        {config.showReportStatus ? (
          <section className="overflow-hidden rounded-[9px] border border-[#e3e3e3] bg-white">
            <div className="border-b border-[#ebebeb] px-[14px] py-[10px]">
              <p className="font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#001e39]">
                {SPR_REPORT_DASHBOARD.reportSectionTitle(cycleLabel)}
              </p>
            </div>
            {statusRows.map((row) => (
              <div
                key={row.title}
                className="flex flex-wrap items-center justify-between gap-[10px] border-b border-[#f4f6f9] px-[14px] py-[9px] last:border-b-0"
              >
                <div className="flex min-w-0 flex-1 items-center gap-[10px]">
                  {row.badgeTone === 'success' ? (
                    <div className="flex size-[28px] shrink-0 items-center justify-center rounded-[7px] bg-[#e0ffd3]">
                      <SprProcessStatusApprovedIcon className="h-[12px] w-[15px] text-[#2a5c16]" />
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <p className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#131313]">
                      {row.title}
                    </p>
                    <p className="pt-px font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">{row.helper}</p>
                  </div>
                </div>
                <div className="flex items-center gap-[6px]">
                  <span
                    className={`rounded-[4px] px-[6px] py-[2px] font-['Inter:Bold',sans-serif] text-[9px] font-bold ${statusBadgeClass(row.badgeTone)}`}
                  >
                    {row.badge}
                  </span>
                  {row.actionLabel && row.actionHref ? (
                    <button
                      type="button"
                      onClick={() => navigate(appendSprReportCycleToHref(row.actionHref!, cycle.id))}
                      className={`h-[24px] rounded-[5px] px-[10px] font-['Inter:Bold',sans-serif] text-[10px] font-bold ${
                        row.actionVariant === 'primary'
                          ? 'bg-[#001e39] text-white'
                          : 'border border-[#e3e3e3] bg-white text-[#24588b]'
                      }`}
                    >
                      {row.actionLabel}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </section>
        ) : null}

        <section className="overflow-hidden rounded-[9px] border border-[#e3e3e3] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-[8px] border-b border-[#ebebeb] px-[14px] py-[11px]">
            <p className="font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#001e39]">
              {SPR_REPORT_DASHBOARD.areasSectionTitle(cycleLabel)}
            </p>
            {/* PLACEHOLDER: alerta histórica — oculto hasta exista promedio real (opción A auditoría). */}
          </div>
          {dashboardDataError ? (
            <div className="px-[14px] py-[18px]" role="status">
              <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#646464]">
                {SPR_REPORT_DASHBOARD.dataLoadErrorDescription}
              </p>
            </div>
          ) : dashboardDataLoading || !areaCards ? (
            <div className="px-[14px] py-[18px]">
              <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#646464]">
                {SPR_REPORT_DASHBOARD.dataLoadingLabel}
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {areaCards.map((area) => {
              const canOpenDetail = Boolean(area.hasDetailView);
              const estimatedCard = area.status === 'estimated';
              const cardClassName = `border-b border-r border-[#f4f6f9] px-[13px] py-[11px] text-left ${
                estimatedCard ? 'bg-[#faf7ff]' : ''
              } ${canOpenDetail ? 'cursor-pointer transition-colors hover:bg-[#f8fbff]' : ''}`;

              const cardBody = (
                <>
                  <p className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#131313]">
                    {area.name}
                  </p>
                  <div className="flex items-center gap-[5px] pt-[5px]">
                    <span className={`size-[5px] rounded-full ${statusDotClass(area.status)}`} aria-hidden />
                    <p className={`font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold ${statusLabelClass(area.status)}`}>
                      {area.statusLabel}
                    </p>
                  </div>
                  <div className="mt-[8px] h-[3px] w-full overflow-hidden rounded-full bg-[#ebebeb]">
                    <div
                      className={`h-full rounded-full ${
                        area.status === 'pending'
                          ? 'bg-transparent'
                          : area.status === 'estimated'
                            ? 'bg-[#7b4fbf]'
                            : area.status === 'complete'
                              ? 'bg-[#3a9b3a]'
                              : 'bg-[#24588b]'
                      }`}
                      style={{ width: `${Math.round(area.progress * 100)}%` }}
                    />
                  </div>
                  <div className="mt-[8px] flex flex-wrap gap-[4px]">
                    {area.badges.map((badge) => (
                      <span
                        key={badge}
                        className={`rounded-[4px] px-[5px] py-[2px] font-['Inter:Semi_Bold',sans-serif] text-[8.5px] font-semibold ${areaBadgeClass(badge, area.status)}`}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </>
              );

              if (canOpenDetail) {
                return (
                  <button
                    key={area.slug}
                    type="button"
                    className={cardClassName}
                    onClick={() => navigate(buildSprReportAreaHref(area.slug, cycle, flow))}
                  >
                    {cardBody}
                  </button>
                );
              }

              return (
                <div key={area.slug} className={cardClassName} title="Detalle de área pendiente de mock">
                  {cardBody}
                </div>
              );
            })}
          </div>
          )}
        </section>

        {/* PLACEHOLDER/MOCK: cierre de ciclo / firmas Especialista→Gerente MA — sin tablas de firmas de ciclo */}
        <section className="overflow-hidden rounded-[9px] border border-[#e3e3e3] bg-white">
          <div className="flex flex-wrap items-start justify-between gap-[8px] border-b border-[#ebebeb] px-[14px] py-[10px]">
            <div>
              <p className="font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#001e39]">
                {SPR_REPORT_DASHBOARD.closureSectionTitle(cycleLabel)}
              </p>
              <p className="pt-px font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
                {config.closure.helper}
              </p>
            </div>
            <span
              className={`rounded-[4px] px-[6px] py-px font-['Inter:Bold',sans-serif] text-[9px] font-bold ${closureStatusBadgeClass(config.closure.statusTone)}`}
            >
              {config.closure.statusLabel}
            </span>
          </div>
          {config.closure.items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-[10px] border-b border-[#f4f6f9] px-[14px] py-[9px] last:border-b-0"
            >
              <p className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#131313]">{item.label}</p>
              <span
                className={`shrink-0 rounded-[4px] px-[6px] py-px font-['Inter:Bold',sans-serif] text-[9px] font-bold ${closureItemBadgeClass(item.status)}`}
              >
                {item.status === 'completed' ? 'Completado' : 'Pendiente'}
              </span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
