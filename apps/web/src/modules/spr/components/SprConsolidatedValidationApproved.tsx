import { Fragment, useState } from 'react';
import type { SprCycleValidationResponse } from '@aurelia/contracts';
import { SprConfirmSendIcon, SprProcessStatusDocumentIcon, SprWarningTriangleIcon } from '../icons/SprIcons';
import {
  SPR_CONSOLIDATED_REPORT,
  type SprKpiValidationRowStatus,
  type SprReportKpiCard,
  type SprReportKpiHelperTone,
  type SprReportKpiValueTone,
} from '../spr.constants';
import {
  buildSoxValidationSlots,
  formatSoxValidationDecidedAt,
  type SprSoxValidationSlot,
} from '../sprConsolidatedValidationLayout';

const copy = SPR_CONSOLIDATED_REPORT.validacionAprobada;
const kpiRows = SPR_CONSOLIDATED_REPORT.validacionAprobadaKpiRows;

type OrgArea = { id: string; code: string; name: string };

function areaPillClass(tone: 'blue' | 'amber') {
  return tone === 'blue' ? 'bg-[#e6f3ff] text-[#0d3862]' : 'bg-[#fdf3e3] text-[#8e6e3e]';
}

function avatarClass(tone: 'blue' | 'amber') {
  return tone === 'blue' ? 'bg-[#e6f3ff] text-[#0d3862]' : 'bg-[#fdf3e3] text-[#8e6e3e]';
}

function kpiValueClass(tone: SprReportKpiValueTone = 'navy') {
  if (tone === 'amber') return 'text-[#e8a820]';
  if (tone === 'teal') return 'text-[#00b398]';
  return 'text-[#001e39]';
}

function kpiHelperClass(tone: SprReportKpiHelperTone) {
  if (tone === 'teal') return 'text-[#006153]';
  if (tone === 'purple') return 'text-[#7b4fbf]';
  if (tone === 'amber') return 'text-[#8e6e3e]';
  if (tone === 'navy') return 'text-[#001e39]';
  return 'text-[#646464]';
}

function slotBadgeClass(statusLabel: SprSoxValidationSlot['statusLabel']): string {
  if (statusLabel === 'Aprobado') return 'bg-[#e0ffd3] text-[#2a5c16]';
  if (statusLabel === 'Discrepancia') return 'bg-[#ffd0db] text-[#570b1d]';
  if (statusLabel === 'Reabierto') return 'bg-[#ffeab8] text-[#8e6e3e]';
  return 'bg-[#ffeab8] text-[#8e6e3e]';
}

function StatusBadge({ status }: { status: SprKpiValidationRowStatus }) {
  if (status === 'confirmedWithDiscrepancy') {
    return (
      <span className="inline-flex items-center gap-[4px] rounded-[4px] bg-[#e0ffd3] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#2a5c16]">
        <span aria-hidden>✓</span>
        Confirmado con 1 discrepancia
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-[4px] rounded-[4px] bg-[#e0ffd3] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#2a5c16]">
      <span aria-hidden>✓</span>
      Confirmado
    </span>
  );
}

function DiscrepancyBadge() {
  return (
    <span className="inline-flex items-center gap-[4px] rounded-[4px] bg-[#ffd0db] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#570b1d]">
      <SprWarningTriangleIcon className="h-[8px] w-[10px] shrink-0" />
      Discrepancia
    </span>
  );
}

function ValidacionAprobadaInfoBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-[9px] rounded-[8px] border border-[rgba(42,92,22,0.2)] bg-[#e0ffd3] px-[15px] py-[11px]">
      <span className="mt-px flex h-[14px] w-[17.5px] shrink-0 items-center justify-center text-[#2a5c16]" aria-hidden>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6.25" stroke="currentColor" strokeWidth="1.25" />
          <path
            d="M4.25 7.25L6.25 9.25L9.75 4.75"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#2a5c16]">
        {message}
      </p>
    </div>
  );
}

function DashboardKpiCards({ cards }: { cards: SprReportKpiCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-[9px] border border-[#e3e3e3] bg-white px-[15px] py-[13px]">
          <p
            className={`font-['Inter:Bold',sans-serif] text-[20px] font-bold leading-[20px] ${kpiValueClass(card.valueTone)}`}
          >
            {card.value}
          </p>
          <p className="pt-[4px] font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#131313]">
            {card.label}
            {card.labelHighlight ? (
              <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#7b4fbf]">
                {card.labelHighlight}
              </span>
            ) : null}
          </p>
          <p className={`pt-[3px] font-['Inter:Regular',sans-serif] text-[10px] ${kpiHelperClass(card.helperTone)}`}>
            {card.helper}
          </p>
        </div>
      ))}
    </div>
  );
}

function SoxApprovedSlotsSection({ slots }: { slots: SprSoxValidationSlot[] }) {
  const approvedCount = slots.filter((slot) => slot.statusLabel === 'Aprobado').length;

  return (
    <section className="overflow-hidden rounded-[9px] border border-[#e3e3e3] bg-white">
      <div className="flex items-center justify-between gap-[12px] bg-[#001e39] px-[16px] py-[11px]">
        <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-white">
          Validación SOX del Reporte SPR
        </p>
        <span className="rounded-[5px] border border-white/15 bg-white/10 px-[8px] py-[3px] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-white/80">
          {approvedCount}/{slots.length} áreas
        </span>
      </div>
      <div className="flex flex-col gap-[12px] p-[16px]">
        {slots.map((slot) => {
          const decidedLabel = formatSoxValidationDecidedAt(slot.validation?.decidedAt);
          return (
            <div
              key={slot.code}
              className="overflow-hidden rounded-[9px] border border-[#e3e3e3] bg-[#f9fafb]"
            >
              <div className="flex items-center gap-[10px] px-[14px] py-[10px]">
                <p className="min-w-0 flex-1 font-['Inter:Bold',sans-serif] text-[11.5px] font-bold text-[#001e39]">
                  {slot.name}
                </p>
                <span
                  className={`rounded-[5px] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[10px] font-bold ${slotBadgeClass(slot.statusLabel)}`}
                >
                  {slot.statusLabel}
                </span>
              </div>
              <div className="px-[14px] pb-[14px]">
                {slot.validation ? (
                  <p className="font-['Inter:Regular',sans-serif] text-[10.5px] text-[#646464]">
                    Decidido por{' '}
                    <span className="font-semibold text-[#131313]">
                      {slot.validation.actorFullName ?? 'Responsable de área'}
                    </span>
                    {decidedLabel ? ` · ${decidedLabel}` : ''}
                  </p>
                ) : (
                  <p className="font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
                    Sin decisión registrada.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MockKpiValidationTable({ defaultExpandedRowId }: { defaultExpandedRowId?: string | null }) {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(defaultExpandedRowId ?? null);

  return (
    <section className="overflow-hidden rounded-[9px] border border-[#e3e3e3] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-[8px] border-b border-[#e3e3e3] px-[14px] py-[10px]">
        <div className="flex items-center gap-[7px]">
          <SprProcessStatusDocumentIcon className="h-[12px] w-[15px] shrink-0 text-[#001e39]" />
          <p className="font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#001e39]">
            {copy.kpiTableTitle}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse">
          <thead>
            <tr className="bg-[#f7f7f7]">
              {['KPI', 'Área', 'Responsable', 'Valor SAC', 'Estado', 'Comentario'].map((header) => (
                <th
                  key={header}
                  className="border-b border-[#e3e3e3] px-[12px] py-[8px] text-left font-['Inter:Bold',sans-serif] text-[9.5px] font-bold uppercase tracking-[0.48px] text-[#646464]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kpiRows.map((row) => {
              const isExpandable = 'expandable' in row && row.expandable;
              const isExpanded = expandedRowId === row.id;
              const discrepancyComment =
                'discrepancyComment' in row && row.discrepancyComment
                  ? row.discrepancyComment
                  : SPR_CONSOLIDATED_REPORT.validacionDiscrepancia.commentFallback;

              return (
                <Fragment key={row.id}>
                  <tr className="border-b border-[#f4f6f9]">
                    <td
                      className="px-[12px] py-[10px] font-['Inter:Regular',sans-serif] text-[11px] text-[#333]"
                      rowSpan={isExpandable && isExpanded ? 2 : 1}
                    >
                      {row.kpi}
                    </td>
                    <td
                      className="px-[12px] py-[10px]"
                      rowSpan={isExpandable && isExpanded ? 2 : 1}
                    >
                      <span
                        className={`rounded-[4px] px-[6px] py-[2px] font-['Inter:Semi_Bold',sans-serif] text-[9px] font-semibold ${areaPillClass(row.areaTone)}`}
                      >
                        {row.area}
                      </span>
                    </td>
                    <td
                      className="px-[12px] py-[10px]"
                      rowSpan={isExpandable && isExpanded ? 2 : 1}
                    >
                      <div className="flex items-center gap-[7px]">
                        <span
                          className={`flex size-[24px] items-center justify-center rounded-full font-['Inter:Bold',sans-serif] text-[9px] font-bold ${avatarClass(row.responsibleTone)}`}
                        >
                          {row.responsibleInitials}
                        </span>
                        <span className="font-['Inter:Regular',sans-serif] text-[11px] text-[#333]">
                          {row.responsibleName}
                        </span>
                      </div>
                    </td>
                    <td className="px-[12px] py-[10px] font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#333]">
                      {row.sacValue}
                    </td>
                    <td className="px-[12px] py-[10px]">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="max-w-[280px] px-[12px] py-[10px]">
                      {isExpandable ? (
                        <button
                          type="button"
                          onClick={() => setExpandedRowId(isExpanded ? null : row.id)}
                          className="flex w-full items-center justify-between gap-[8px] text-left"
                          aria-expanded={isExpanded}
                        >
                          <span className="font-['Inter:Regular',sans-serif] text-[10px] text-[#acacac]">
                            {row.comment}
                          </span>
                          <svg
                            className={`size-[16px] shrink-0 text-[#646464] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            viewBox="0 0 16 16"
                            fill="none"
                            aria-hidden
                          >
                            <path
                              d="M4 6L8 10L12 6"
                              stroke="currentColor"
                              strokeWidth="1.25"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      ) : (
                        <p className="font-['Inter:Regular',sans-serif] text-[10px] text-[#acacac]">{row.comment}</p>
                      )}
                    </td>
                  </tr>
                  {isExpandable && isExpanded ? (
                    <tr key={`${row.id}-detail`} className="border-b border-[#f4f6f9]">
                      <td className="px-[12px] py-[10px] font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#333]">
                        {copy.previousSacValueLabel}
                      </td>
                      <td className="px-[12px] py-[10px]">
                        <DiscrepancyBadge />
                      </td>
                      <td className="max-w-[280px] px-[12px] py-[10px]">
                        <p className="rounded-[5px] bg-[#ffd0db] px-[8px] py-[6px] font-['Inter:Italic',sans-serif] text-[10.5px] italic leading-[15.75px] text-[#570b1d]">
                          {discrepancyComment}
                        </p>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-[10px] border-t border-[#e3e3e3] bg-[#f7f7f7] px-[14px] py-[10px]">
        <p className="font-['Inter:Regular',sans-serif] text-[11px] text-[#646464]">{copy.footerSummary}</p>
        <button
          type="button"
          className="flex h-[27px] items-center gap-[5px] rounded-[6px] border border-[#e3e3e3] bg-white px-[12px] font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold text-[#646464]"
        >
          <SprConfirmSendIcon className="h-[10px] w-[12.5px] shrink-0 text-[#646464]" />
          {copy.resendReminderLabel}
        </button>
      </div>
    </section>
  );
}

/**
 * Validación SOX aprobada (`validation_approved`) o ciclo cerrado (`closed`).
 * - Mock: tabla KPI Figma 2035:*.
 * - Real: KPIs del Dashboard (`useSprReportDashboardReal`) + slots SOX approved.
 * El banner de “cerrado exitosamente” lo pone el wrapper `CicloCerradoValidacionPanel`.
 */
export function SprConsolidatedValidationApproved({
  hideInfoBanner = false,
  defaultExpandedRowId = null,
  kpiCards = null,
  areas = null,
  validations = null,
  dashboardLoading = false,
  dashboardError = false,
}: {
  hideInfoBanner?: boolean;
  defaultExpandedRowId?: string | null;
  /**
   * null → mock Figma.
   * array (incluso vacío) → modo real con KPIs del Dashboard.
   * undefined → cargando (solo real).
   */
  kpiCards?: SprReportKpiCard[] | null;
  areas?: OrgArea[] | null;
  validations?: SprCycleValidationResponse[] | null;
  dashboardLoading?: boolean;
  dashboardError?: boolean;
}) {
  const isRealMode = kpiCards !== null && kpiCards !== undefined;
  const slots = buildSoxValidationSlots(areas, validations ?? []);
  const bannerMessage = isRealMode ? copy.realApprovedBanner : copy.sacTabInfoBanner;

  return (
    <div className="flex flex-col gap-[14px]">
      {hideInfoBanner ? null : <ValidacionAprobadaInfoBanner message={bannerMessage} />}

      {dashboardError ? (
        <div role="alert" className="rounded-[9px] border border-[#f5c4a0] bg-[#fff0e6] px-[15px] py-[14px]">
          <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#e8720c]">
            No se pudieron cargar los KPIs del Dashboard
          </p>
          <p className="pt-[4px] font-['Inter:Regular',sans-serif] text-[11px] leading-[16px] text-[#6b3a1f]">
            Revisa la API de áreas / assignments / monthly-records e intenta de nuevo.
          </p>
        </div>
      ) : dashboardLoading || kpiCards === undefined ? (
        <div className="rounded-[9px] border border-[#e3e3e3] bg-white px-[15px] py-[18px]">
          <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#646464]">
            Cargando KPIs del ciclo…
          </p>
        </div>
      ) : isRealMode ? (
        <>
          <DashboardKpiCards cards={kpiCards} />
          <SoxApprovedSlotsSection slots={slots} />
        </>
      ) : (
        <MockKpiValidationTable defaultExpandedRowId={defaultExpandedRowId} />
      )}
    </div>
  );
}
