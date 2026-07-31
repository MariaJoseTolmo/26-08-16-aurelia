import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SprConfirmSendIcon,
  SprHistoricalAlertIcon,
  SprInfoCircleIcon,
  SprProcessStatusBellIcon,
  SprProcessStatusRejectedIcon,
  SprTraceabilityIcon,
} from './icons/SprIcons';
import type {
  SprReportAreaDetailData,
  SprReportAreaDetailParameter,
  SprReportAreaDetailTone,
} from './spr.constants';
import { SPR_CYCLE_TRACEABILITY_ROUTE } from './sprCycleTraceability.constants';

interface SprReportAreaViewProps {
  areaName: string;
  detail: SprReportAreaDetailData;
  /** Vuelta al Dashboard preservando ?ciclo= (default /spr/reporte). */
  backHref?: string;
}

function BackArrowIcon() {
  return (
    <svg width="16" height="13" viewBox="0 0 16 13" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M15 6.5H1M1 6.5L6.5 1M1 6.5L6.5 12"
        stroke="#131313"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function toneClass(tone: SprReportAreaDetailTone | 'purple') {
  if (tone === 'teal') return 'text-[#006153]';
  if (tone === 'blue') return 'text-[#24588b]';
  if (tone === 'danger') return 'text-[#bd3b5b]';
  if (tone === 'purple') return 'text-[#7b4fbf]';
  return 'text-[#131313]';
}

function ProcessRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: SprReportAreaDetailTone;
}) {
  return (
    <div className="flex items-center justify-between gap-[8px] border-b border-[#f4f6f9] py-[5px] last:border-b-0">
      <p className="shrink-0 font-['Inter:Medium',sans-serif] text-[10px] font-medium text-[#646464]">{label}</p>
      <p className={`text-right font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold ${toneClass(tone)}`}>
        {value}
      </p>
    </div>
  );
}

function ParameterListItem({
  parameter,
  selected,
  showSoxBadges,
  emptyMode,
  onSelect,
}: {
  parameter: SprReportAreaDetailParameter;
  selected: boolean;
  showSoxBadges: boolean;
  emptyMode: boolean;
  onSelect: () => void;
}) {
  if (emptyMode) {
    return (
      <div className="flex w-full items-center gap-[6px] rounded-[7px] border border-dashed border-[#d1d1d1] bg-[#f7f7f7] p-[9px]">
        <span className="size-[8px] shrink-0 rounded-[4px] border-[1.5px] border-[#d1d1d1] bg-white" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold text-[#acacac]">
          {parameter.name}
        </span>
        <span className="shrink-0 rounded-[3px] border border-[#e3e3e3] bg-[#f7f7f7] px-[6px] py-[2px] font-['Inter:Semi_Bold',sans-serif] text-[8px] font-semibold text-[#acacac]">
          Sin valor
        </span>
      </div>
    );
  }

  const selectedClass = selected
    ? parameter.estimated
      ? 'border-[#c4b5fd] bg-[#faf7ff]'
      : 'border-[#c8a064] bg-[#f6faff]'
    : 'border-transparent hover:bg-[#fafafa]';
  const dotClass = parameter.estimated
    ? selected
      ? 'border-[#7b4fbf] bg-[#7b4fbf]'
      : 'border-[#c4b5fd] bg-[#c4b5fd]'
    : 'border-[#00b398] bg-[#00b398]';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-[6px] rounded-[7px] border p-[9px] text-left ${selectedClass}`}
    >
      <span className={`size-[8px] shrink-0 rounded-[4px] border-[1.5px] ${dotClass}`} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold text-[#131313]">
          {parameter.name}
        </span>
        <span
          className={`block truncate pt-px font-['Inter:Regular',sans-serif] text-[9.5px] ${
            parameter.needsHistoricalReview ? 'font-semibold text-[#e8720c]' : 'text-[#646464]'
          }`}
        >
          {parameter.needsHistoricalReview ? `⚠ ${parameter.valueLabel} · Revisar` : parameter.valueLabel}
        </span>
      </span>
      {parameter.needsHistoricalReview ? (
        <span className="flex size-[15px] shrink-0 items-center justify-center rounded-[7.5px] bg-[#e8720c] font-['Inter:Bold',sans-serif] text-[8px] font-bold text-white">
          !
        </span>
      ) : null}
      {parameter.estimated ? (
        <span className="shrink-0 rounded-[3px] bg-[#f3e8ff] px-[5px] py-px font-['Inter:Bold',sans-serif] text-[8px] font-bold text-[#7b4fbf]">
          Estimado
        </span>
      ) : null}
      {showSoxBadges ? (
        parameter.isSox ? (
          <span className="shrink-0 rounded-[3px] bg-[#ffeab8] px-[5px] py-px font-['Inter:Bold',sans-serif] text-[8px] font-bold text-[#8e6e3e]">
            SOX
          </span>
        ) : (
          <span className="shrink-0 rounded-[3px] bg-[#f7f7f7] px-[5px] py-px font-['Inter:Semi_Bold',sans-serif] text-[8px] font-semibold text-[#acacac]">
            No SOX
          </span>
        )
      ) : null}
    </button>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-[6px] bg-[rgba(232,114,12,0.08)] px-[10px] py-[7px]">
      <p className="text-center font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.54px] text-[#e8720c] opacity-70">
        {label}
      </p>
      <p className="pt-[2px] text-center font-['Inter:Bold',sans-serif] text-[13px] font-bold text-[#e8720c]">{value}</p>
    </div>
  );
}

function EmptyAreaState({ detail }: { detail: SprReportAreaDetailData }) {
  if (!detail.emptyState) return null;

  return (
    <div className="flex h-full flex-col items-center justify-center px-[24px] py-[20px]">
      <div className="flex w-full max-w-[280px] flex-col items-center">
        <div className="flex size-[56px] items-center justify-center rounded-[28px] bg-[#ffd0db]">
          <SprTraceabilityIcon className="h-[22px] w-[28px] text-[#570b1d]" />
        </div>
        <p className="pt-[14px] text-center font-['Inter:Bold',sans-serif] text-[15px] font-bold text-[#001e39]">
          {detail.emptyState.title}
        </p>
        <p className="pt-[8px] pb-[14px] text-center font-['Inter:Regular',sans-serif] text-[11px] leading-[17.6px] text-[#646464]">
          {detail.emptyState.description}
        </p>
        <button
          type="button"
          title="Pendiente de integración con recordatorio al Responsable"
          className="inline-flex h-[32px] items-center gap-[6px] rounded-[7px] bg-[#001e39] px-[16px] font-['Inter:Bold',sans-serif] text-[11px] font-bold text-white"
        >
          <SprConfirmSendIcon className="text-white" />
          {detail.emptyState.ctaLabel}
        </button>
      </div>
    </div>
  );
}

function ParameterDetail({
  parameter,
  detail,
}: {
  parameter: SprReportAreaDetailParameter;
  detail: SprReportAreaDetailData;
}) {
  return (
    <div className="flex flex-col gap-[16px] px-[24px] py-[20px]">
      <div>
        <p className="font-['Inter:Semi_Bold',sans-serif] text-[9.5px] font-semibold text-[#acacac]">
          Indicador seleccionado
        </p>
        <h2 className="pt-[3px] font-['Inter:Bold',sans-serif] text-[17px] font-bold text-[#001e39]">{parameter.name}</h2>
        <p className="pt-[2px] font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">{parameter.subtitle}</p>
      </div>

      {detail.pendingManagerNotice ? (
        <div className="flex items-start gap-[10px] rounded-[9px] border-[1.5px] border-[#f0d080] bg-[#ffeab8] px-[15px] py-[13px]">
          <SprInfoCircleIcon className="mt-px size-[16px] shrink-0 text-[#463100]" />
          <div>
            <p className="font-['Inter:Bold',sans-serif] text-[11.5px] font-bold text-[#463100]">
              {detail.pendingManagerNotice.title}
            </p>
            <p className="pt-[3px] font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#463100]">
              {detail.pendingManagerNotice.description}
            </p>
          </div>
        </div>
      ) : null}

      {detail.estimateNotice ? (
        <div className="flex items-start gap-[10px] rounded-[9px] border-[1.5px] border-[#e8d4f5] bg-[#f7edfc] px-[15px] py-[13px]">
          <SprInfoCircleIcon className="mt-px size-[16px] shrink-0 text-[#7b4fbf]" />
          <div>
            <p className="font-['Inter:Bold',sans-serif] text-[11.5px] font-bold text-[#7b4fbf]">
              {detail.estimateNotice.title}
            </p>
            <p className="pt-[3px] font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#7b4fbf]">
              {detail.estimateNotice.description}
              {detail.estimateNotice.descriptionBold ? (
                <span className="font-['Inter:Bold',sans-serif] font-bold">{detail.estimateNotice.descriptionBold}</span>
              ) : null}
              {detail.estimateNotice.descriptionAfter ?? null}
            </p>
          </div>
        </div>
      ) : null}

      <div>
        <p className="border-b border-[#ebebeb] pb-[7px] font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.72px] text-[#acacac]">
          Valor reportado
        </p>
        <div className="flex flex-wrap items-end gap-[8px] pt-[8px]">
          <p
            className={`font-['Inter:Bold',sans-serif] text-[24px] font-bold ${
              parameter.estimated
                ? 'text-[#7b4fbf]'
                : parameter.needsHistoricalReview
                  ? 'text-[#e8720c]'
                  : 'text-[#131313]'
            }`}
          >
            {parameter.valueLabel}
          </p>
          {parameter.estimated ? (
            <span className="mb-[4px] inline-flex items-center rounded-[4px] bg-[#f3e8ff] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#7b4fbf]">
              {parameter.dataSource}
            </span>
          ) : (
            <p className="pb-[2px] font-['Inter:Medium',sans-serif] text-[11px] font-medium text-[#646464]">
              · {parameter.dataSource}
            </p>
          )}
        </div>
      </div>

      {parameter.historical ? (
        <div className="flex flex-col gap-[10px] rounded-[9px] border-[1.5px] border-[#f5c4a0] bg-[#fff0e6] px-[15px] py-[14px]">
          <div className="flex items-start gap-[8px]">
            <SprHistoricalAlertIcon className="mt-px size-[16px] shrink-0 text-[#e8720c]" />
            <div>
              <p className="font-['Inter:Bold',sans-serif] text-[11.5px] font-bold text-[#e8720c]">
                {detail.historicalAlertTitle}
              </p>
              <p className="pt-[3px] font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#6b3a1f]">
                {detail.historicalAlertDescription}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-[10px]">
            <DetailMetric label="Valor ingresado" value={parameter.historical.enteredValueLabel} />
            <DetailMetric label="Promedio 6 meses" value={parameter.historical.averageValueLabel} />
            <DetailMetric label="Desviación" value={parameter.historical.deviationLabel} />
          </div>
        </div>
      ) : null}

      <div>
        <p className="border-b border-[#ebebeb] pb-[7px] font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.72px] text-[#acacac]">
          Nota del Responsable
        </p>
        {parameter.note ? (
          <div className="mt-[8px] rounded-[8px] border border-[rgba(36,88,139,0.18)] bg-[#e6f3ff] px-[14px] py-[12px]">
            <p className="font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.54px] text-[#0d3862]">
              Responsable de Área
            </p>
            <p className="pt-[4px] font-['Inter:Italic',sans-serif] text-[11px] italic leading-[17px] text-[#24588b]">
              &quot;{parameter.note}&quot;
            </p>
          </div>
        ) : (
          <div className="mt-[8px] rounded-[8px] border border-dashed border-[#d1d1d1] bg-[#f7f7f7] px-[14px] py-[12px]">
            <p className="font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.54px] text-[#acacac]">
              {detail.emptyNoteTitle}
            </p>
            <p className="pt-[3px] font-['Inter:Regular',sans-serif] text-[11px] text-[#acacac]">{detail.emptyNoteHelper}</p>
          </div>
        )}
      </div>

      <div>
        <p className="border-b border-[#ebebeb] pb-[7px] font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.72px] text-[#acacac]">
          Detalle del dato
        </p>
        <div className="mt-[8px] overflow-hidden rounded-[8px] border border-[#e3e3e3] bg-white">
          {parameter.detailRows.map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-[12px] border-b border-[#f4f6f9] px-[12px] py-[8px] last:border-b-0"
            >
              <p className="font-['Inter:Medium',sans-serif] text-[10px] font-medium text-[#646464]">{row.label}</p>
              {row.tone === 'sox' ? (
                <span className="rounded-[4px] bg-[#ffeab8] px-[7px] py-px font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#8e6e3e]">
                  {row.value}
                </span>
              ) : row.tone === 'purple' ? (
                <span className="rounded-[4px] bg-[#f3e8ff] px-[7px] py-px font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#7b4fbf]">
                  {row.value}
                </span>
              ) : (
                <p className={`max-w-[70%] text-right font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold ${toneClass(row.tone)}`}>
                  {row.value}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="border-b border-[#ebebeb] pb-[7px] font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.72px] text-[#acacac]">
          Firmas del área
        </p>
        <div className="mt-[8px] flex flex-col gap-[6px]">
          {detail.signatures.map((signature) => {
            const muted = Boolean(signature.muted);
            const avatarBg =
              signature.avatarTone === 'green'
                ? 'bg-[#e0ffd3]'
                : signature.avatarTone === 'muted'
                  ? 'bg-[#f0f0f0]'
                  : 'bg-[#e6f3ff]';
            const avatarText =
              signature.avatarTone === 'green'
                ? 'text-[#2a5c16]'
                : signature.avatarTone === 'muted'
                  ? 'text-[#acacac]'
                  : 'text-[#0d3862]';
            const badgeClass =
              signature.badgeTone === 'pending'
                ? 'bg-[#ffeab8] text-[#8e6e3e]'
                : 'bg-[#e0ffd3] text-[#2a5c16]';

            return (
              <div
                key={signature.roleLabel}
                className={`flex items-center gap-[10px] rounded-[8px] border px-[12px] py-[10px] ${
                  muted
                    ? 'border-dashed border-[#e3e3e3] bg-[#f7f7f7] opacity-70'
                    : 'border-solid border-[#e3e3e3] bg-[#f9fafb]'
                }`}
              >
                <div className={`flex size-[30px] shrink-0 items-center justify-center rounded-[15px] ${avatarBg}`}>
                  <span className={`font-['Inter:Bold',sans-serif] text-[10px] font-bold ${avatarText}`}>
                    {signature.roleLabel.startsWith('Gerente') ? 'GA' : 'RA'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold ${
                      muted ? 'text-[#acacac]' : 'text-[#131313]'
                    }`}
                  >
                    {signature.roleLabel}
                  </p>
                  <p className={`pt-px font-['Inter:Regular',sans-serif] text-[9.5px] ${muted ? 'text-[#acacac]' : 'text-[#646464]'}`}>
                    {signature.helperPrefix}
                    {signature.helperHighlight ? (
                      <span className="font-['Inter:Bold',sans-serif] font-bold text-[#006153]">
                        {signature.helperHighlight}
                      </span>
                    ) : null}
                  </p>
                </div>
                <span className={`shrink-0 rounded-[4px] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[9px] font-bold ${badgeClass}`}>
                  {signature.badge}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {detail.footerNotice ? (
        <div className="flex items-start gap-[9px] rounded-[8px] border border-[#e3e3e3] bg-[#f7f7f7] px-[14px] py-[11px]">
          <SprInfoCircleIcon className="mt-px size-[14px] shrink-0 text-[#acacac]" />
          <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#acacac]">
            {detail.footerNotice}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function SprReportAreaView({ areaName, detail, backHref = '/spr/reporte' }: SprReportAreaViewProps) {
  const navigate = useNavigate();
  const isEmptyMode = detail.viewMode === 'empty';
  const defaultParameterId =
    detail.parameters.find((parameter) => parameter.needsHistoricalReview)?.id ?? detail.parameters[0]?.id ?? null;
  const [selectedParameterId, setSelectedParameterId] = useState<string | null>(defaultParameterId);

  const selectedParameter = useMemo(
    () => detail.parameters.find((parameter) => parameter.id === (selectedParameterId ?? defaultParameterId)) ?? null,
    [defaultParameterId, detail.parameters, selectedParameterId],
  );

  const alertCount = detail.parameters.filter((parameter) => parameter.needsHistoricalReview).length;
  const headerBadgeClass =
    detail.headerBadgeTone === 'danger'
      ? 'bg-[#ffd0db] text-[#570b1d]'
      : detail.headerBadgeTone === 'pending'
        ? 'bg-[#e6f3ff] text-[#0d3862]'
        : 'bg-[#e0ffd3] text-[#2a5c16]';
  const statusLabelClass =
    detail.statusLabelTone === 'danger' ? 'text-[#570b1d]' : 'text-[#006153]';

  return (
    <div className="flex h-[calc(100vh-56px)] w-full flex-col bg-[#f7f7f7]">
      <div className="flex h-[48px] shrink-0 items-center justify-between gap-[12px] border-b border-[#e3e3e3] bg-white px-[20px]">
        <div className="flex min-w-0 flex-wrap items-center gap-[10px]">
          <button
            type="button"
            onClick={() => navigate(backHref)}
            className="flex size-[28px] shrink-0 items-center justify-center rounded-[6px] border border-[#e3e3e3] bg-white"
            aria-label="Volver al reporte SPR"
          >
            <BackArrowIcon />
          </button>
          <p className="font-['Inter:Bold',sans-serif] text-[14px] font-bold text-[#001e39]">Área: {areaName}</p>
          <span className={`rounded-[5px] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[10px] font-bold ${headerBadgeClass}`}>
            {detail.headerBadge}
          </span>
          {alertCount > 0 ? (
            <span className="inline-flex items-center gap-[5px] rounded-[5px] border border-[#f5c4a0] bg-[#fff0e6] px-[10px] py-[4px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#e8720c]">
              <span className="flex size-[12px] items-center justify-center rounded-[6px] bg-[#e8720c] text-[8px] font-bold text-white">
                !
              </span>
              {detail.historicalAlertCountLabel(alertCount)}
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-[8px]">
          {detail.statusLabel ? (
            <span className={`font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold ${statusLabelClass}`}>
              {detail.statusLabel}
            </span>
          ) : null}
          {detail.reminderLabel ? (
            <button
              type="button"
              title="Pendiente de integración con notificaciones al Gerente"
              className="flex h-[27px] items-center gap-[5px] rounded-[6px] border border-[#e3e3e3] bg-white px-[12px] font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold text-[#646464]"
            >
              <SprProcessStatusBellIcon className="text-[#646464]" />
              {detail.reminderLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => navigate(SPR_CYCLE_TRACEABILITY_ROUTE)}
            className="flex h-[27px] items-center gap-[5px] rounded-[6px] border border-[#e3e3e3] bg-white px-[12px] font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold text-[#24588b] hover:bg-[#fafafa]"
          >
            <SprTraceabilityIcon className="text-[#24588b]" />
            {detail.traceabilityLabel}
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(240px,272px)_1fr]">
        <aside className="min-h-0 overflow-y-auto border-b border-[#e3e3e3] bg-white px-[13px] py-[14px] lg:border-b-0 lg:border-r">
          <p className="font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.72px] text-[#acacac]">
            {detail.processStatusTitle}
          </p>
          <div className="pt-[7px]">
            {detail.processRows.map((row) => (
              <ProcessRow key={row.label} label={row.label} value={row.value} tone={row.tone} />
            ))}
          </div>

          <p className="pt-[12px] font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.72px] text-[#acacac]">
            {detail.parametersTitle}
          </p>
          {detail.parametersSidebarAlert ? (
            <div className="mt-[7px] flex items-start gap-[8px] rounded-[7px] bg-[#ffd0db] px-[9px] py-[8px]">
              <SprProcessStatusRejectedIcon className="mt-px h-[12px] w-[15px] shrink-0 text-[#570b1d]" />
              <p className="font-['Inter:Regular',sans-serif] text-[10px] leading-[14px] text-[#570b1d]">
                {detail.parametersSidebarAlert}
              </p>
            </div>
          ) : null}
          <div className={`flex flex-col gap-[2px] ${detail.parametersSidebarAlert ? 'pt-[8px]' : 'pt-[7px]'}`}>
            {detail.parameters.map((parameter) => (
              <ParameterListItem
                key={parameter.id}
                parameter={parameter}
                selected={!isEmptyMode && parameter.id === (selectedParameterId ?? defaultParameterId)}
                showSoxBadges={detail.showParameterSoxBadges}
                emptyMode={isEmptyMode}
                onSelect={() => setSelectedParameterId(parameter.id)}
              />
            ))}
          </div>

          <p className="pt-[12px] font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.72px] text-[#acacac]">
            {detail.documentsTitle}
          </p>
          <div className="flex flex-col gap-[4px] pt-[7px]">
            {detail.documents.length > 0 ? (
              detail.documents.map((document) => (
                <div
                  key={document.name}
                  className="flex items-center gap-[7px] rounded-[6px] bg-[#f9fafb] px-[8px] py-[6px]"
                >
                  <span className="flex size-[24px] shrink-0 items-center justify-center rounded-[5px] bg-[#e6f3ff] font-['Inter:Bold',sans-serif] text-[8px] font-bold text-[#0d3862]">
                    ··
                  </span>
                  <p className="min-w-0 flex-1 truncate font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#131313]">
                    {document.name}
                  </p>
                  <p className="shrink-0 font-['Inter:Regular',sans-serif] text-[9px] text-[#acacac]">{document.size}</p>
                </div>
              ))
            ) : detail.documentsDropzone ? (
              <div className="rounded-[6px] border border-dashed border-[#d1d1d1] bg-[#f7f7f7] px-[11px] py-[14px] text-center">
                <p className="font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#646464]">
                  {detail.documentsDropzone.title}
                </p>
                <p className="pt-[2px] font-['Inter:Regular',sans-serif] text-[9px] text-[#acacac]">
                  {detail.documentsDropzone.helper}
                </p>
              </div>
            ) : (
              <div className="rounded-[6px] border border-dashed border-[#d1d1d1] bg-[#f7f7f7] px-[11px] py-[11px] text-center">
                <p className="font-['Inter:Regular',sans-serif] text-[10px] text-[#acacac]">
                  {detail.emptyDocumentsLabel ?? 'Sin documentos adjuntos'}
                </p>
              </div>
            )}
          </div>
        </aside>

        <section className="min-h-0 overflow-y-auto bg-[#fafbfc]">
          {isEmptyMode ? (
            <EmptyAreaState detail={detail} />
          ) : selectedParameter ? (
            <ParameterDetail parameter={selectedParameter} detail={detail} />
          ) : (
            <div className="flex h-full items-center justify-center px-[22px]">
              <p className="font-['Inter:Regular',sans-serif] text-[13px] text-[#646464]">
                Selecciona un parámetro para ver su detalle.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
