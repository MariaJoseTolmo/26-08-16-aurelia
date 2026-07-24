import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  SPR_ACTIVE_CYCLE,
  SPR_CONSOLIDATED_DEMO_CASE_QUERY,
  SPR_CONSOLIDATED_DEMO_CASE_SERVICIOS_TECNICOS,
  SPR_CONSOLIDATED_DEMO_DETALLE_QUERY,
  SPR_CONSOLIDATED_DEMO_FASE_QUERY,
  SPR_CONSOLIDATED_DEMO_FIRMA_LISTA_FASE,
  SPR_CONSOLIDATED_DEMO_FIRMAS_COMPLETAS_FASE,
  SPR_CONSOLIDATED_DEMO_MODAL_QUERY,
  SPR_CONSOLIDATED_DEMO_CICLO_INCOMPLETO_MODAL,
  SPR_CONSOLIDATED_DEMO_CICLO_CERRADO_MODAL,
  SPR_CONSOLIDATED_DEMO_DISCREPANCIA_EXPANDIDA_QUERY,
  SPR_CONSOLIDATED_DEMO_DISCREPANCIA_FRESHWATER_INTENSITY,
  SPR_CONSOLIDATED_DEMO_REOPEN_MODAL,
  SPR_CONSOLIDATED_FLOW,
  SPR_CONSOLIDATED_FLOW_QUERY,
  SPR_CONSOLIDATED_REPORT,
  SPR_CONSOLIDATED_SENT_AREA_CARDS,
  SPR_CONSOLIDATED_TABLE_ROWS,
  resolveSprConsolidatedFlow,
  type SprConsolidatedOrigin,
  type SprConsolidatedTabBadgeTone,
  type SprConsolidatedTabId,
  type SprConsolidatedTimelineStatus,
  type SprConsolidatedTrend,
  type SprReportAreaCardStatus,
} from './spr.constants';
import {
  SPR_REPORT_CYCLE_QUERY,
  buildSprReportAreaHref,
  resolveSprReportCycle,
} from './sprReportCycles';
import { SprConsolidatedValidationApproved } from './components/SprConsolidatedValidationApproved';
import { SprConsolidatedValidationDiscrepancy } from './components/SprConsolidatedValidationDiscrepancy';
import { SprCycleClosedModal } from './components/SprCycleClosedModal';
import { SprCycleIncompleteModal } from './components/SprCycleIncompleteModal';
import { SprInfoCircleIcon } from './icons/SprIcons';
import sacReportTableMock from './assets/sac-report-table-mayo-2026.png';

type SentFilter = 'all' | 'real' | 'estimated';

function resolveInitialTab(raw: string | null): SprConsolidatedTabId {
  if (raw === 'sac' || raw === 'firma' || raw === 'validacion' || raw === 'consolidado') return raw;
  return 'consolidado';
}

function trendClass(trend: SprConsolidatedTrend) {
  if (trend === 'up') return 'bg-[#ffd0db] text-[#570b1d]';
  if (trend === 'down') return 'bg-[#e0ffd3] text-[#2a5c16]';
  return 'bg-[#f2f2f2] text-[#646464]';
}

function originLabel(origin: SprConsolidatedOrigin) {
  if (origin === 'automatico') return 'Automático';
  if (origin === 'multiple') return 'Múltiple';
  return 'Formulario';
}

function areaPillClass(area: string) {
  const key = area.toLowerCase();
  if (key.includes('planta')) return 'bg-[#fff0e6] text-[#c45d0a]';
  if (key.includes('mina')) return 'bg-[#e0ffd3] text-[#2a5c16]';
  if (key.includes('técnic') || key.includes('tecnic')) return 'bg-[#e6f3ff] text-[#24588b]';
  if (key.includes('ambiente') || key.includes('med.')) return 'bg-[#f3e8ff] text-[#6b21a8]';
  if (key.includes('optim')) return 'bg-[#eef2f7] text-[#24588b]';
  if (key.includes('finanza')) return 'bg-[#f7f7f7] text-[#646464]';
  return 'bg-[#eef2f7] text-[#24588b]';
}

function tabBadgeClass(tone: SprConsolidatedTabBadgeTone) {
  if (tone === 'teal') return 'bg-[#c5fff6] text-[#006153]';
  if (tone === 'amber') return 'bg-[#ffeab8] text-[#8e6e3e]';
  if (tone === 'rose') return 'bg-[#ffd0db] text-[#570b1d]';
  return 'bg-[#f7f7f7] text-[#acacac] border border-[#e3e3e3]';
}

function timelineDotClass(status: SprConsolidatedTimelineStatus) {
  if (status === 'done') return 'bg-[#00b398] text-white';
  if (status === 'discrepancy') return 'bg-[#ffd0db] text-[#570b1d]';
  if (status === 'active' || status === 'partial') return 'bg-[#001e39] text-white';
  return 'border-2 border-[#d1d1d1] bg-[#f7f7f7] text-[#acacac]';
}

function timelineTitleClass(status: SprConsolidatedTimelineStatus) {
  if (status === 'done') return 'text-[#006153] font-semibold';
  if (status === 'discrepancy') return 'text-[#001e39] font-bold';
  if (status === 'active' || status === 'partial') return 'text-[#001e39] font-bold';
  return 'text-[#acacac] font-bold';
}

function timelineBadgeClass(status: SprConsolidatedTimelineStatus) {
  if (status === 'done') return 'bg-[#c5fff6] text-[#006153]';
  if (status === 'discrepancy') return 'bg-[#ffd0db] text-[#570b1d]';
  if (status === 'active' || status === 'partial') return 'bg-[#ffeab8] text-[#8e6e3e]';
  return 'border border-[#e3e3e3] bg-[#f7f7f7] text-[#acacac]';
}

function timelineConnectorClass(fromStatus: SprConsolidatedTimelineStatus) {
  if (fromStatus === 'done') return 'bg-[#00b398]';
  return 'bg-[#e3e3e3]';
}

function SacPendingPanel() {
  const { sacPending } = SPR_CONSOLIDATED_REPORT;

  return (
    <div className="flex items-start justify-between gap-[16px] rounded-[10px] bg-[#062f2c] px-[18px] py-[16px]">
      <div className="flex min-w-0 flex-1 items-start gap-[12px]">
        <div className="flex size-[36px] shrink-0 items-center justify-center rounded-[8px] bg-[rgba(255,255,255,0.08)]">
          <span className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#c8a064]" aria-hidden>
            ↑
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-white">{sacPending.title}</p>
          <p className="pt-[3px] font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-white/60">
            {sacPending.bodyBefore}
            <span className="font-['Inter:Bold',sans-serif] font-bold text-[#c8a064]">{sacPending.dateLabel}</span>
            {sacPending.bodyAfter}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-['Inter:Regular',sans-serif] text-[10px] text-white/40">{sacPending.availableLabel}</p>
        <p className="pt-[4px] font-['Inter:Bold',sans-serif] text-[22px] font-bold text-[#c8a064]">
          {sacPending.daysLabel}
        </p>
      </div>
    </div>
  );
}

function SacReportPanel() {
  const copy = SPR_CONSOLIDATED_REPORT.consolidadoEnviado;

  return (
    <section className="overflow-hidden rounded-[9px] border border-[#e3e3e3] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-[10px] border-b border-[#e3e3e3] px-[14px] py-[11px]">
        <div className="flex items-center gap-[7px]">
          <span className="text-[12px] text-[#001e39]" aria-hidden>
            ▤
          </span>
          <p className="font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#001e39]">{copy.sacReportTitle}</p>
        </div>
        <div className="flex items-center gap-[12px]">
          <span className="rounded-[5px] bg-[#e0ffd3] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#2a5c16]">
            {copy.sacReportBadge}
          </span>
          <button
            type="button"
            className="flex h-[27px] items-center gap-[5px] rounded-[6px] border border-[#e3e3e3] bg-white px-[12px] font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold text-[#646464]"
          >
            <span aria-hidden>↓</span>
            {copy.sacReportExport}
          </button>
        </div>
      </div>

      <div className="max-h-[402px] overflow-auto">
        {/* Figma 1760:32949 / 1570:5335 — captura del grid SAC como mock hasta API. */}
        <img
          src={sacReportTableMock}
          alt="Tabla mock Reporte SAC Mayo 2026"
          className="block w-full min-w-[980px] object-cover object-left-top"
        />
      </div>

      <div className="flex flex-wrap items-center gap-[12px] border-t border-[#e3e3e3] px-[14px] py-[11px]">
        <div className="flex items-center gap-[5px]">
          <span className="rounded-[3px] bg-[#f7f7f7] px-[5px] py-px font-['Inter:Semi_Bold',sans-serif] text-[9px] font-semibold text-[#acacac] ring-1 ring-[#e3e3e3]">
            {copy.sacReportLegendIngresado}
          </span>
          <p className="font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">{copy.sacReportLegendIngresadoHelper}</p>
        </div>
        <div className="flex items-center gap-[5px]">
          <span className="rounded-[3px] bg-[#e6f3ff] px-[5px] py-px font-['Inter:Semi_Bold',sans-serif] text-[9px] font-semibold text-[#0d3862]">
            {copy.sacReportLegendCalculado}
          </span>
          <p className="font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">{copy.sacReportLegendCalculadoHelper}</p>
        </div>
      </div>
    </section>
  );
}

function SprConsolidatedGreenInfoBanner({ message }: { message: string }) {
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
      <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#2a5c16]">{message}</p>
    </div>
  );
}

function ValidacionAprobadaInfoBanner() {
  return (
    <SprConsolidatedGreenInfoBanner message={SPR_CONSOLIDATED_REPORT.validacionAprobada.sacTabInfoBanner} />
  );
}

function CicloCerradoInfoBanner() {
  return (
    <SprConsolidatedGreenInfoBanner
      message={SPR_CONSOLIDATED_REPORT.cicloCerrado.tabInfoBanner(SPR_ACTIVE_CYCLE.label)}
    />
  );
}

function ValidacionAprobadaSacPanel() {
  return (
    <div className="flex flex-col gap-[14px]">
      <ValidacionAprobadaInfoBanner />
      <SacReportPanel />
    </div>
  );
}

function ValidacionAprobadaFirmaPanel() {
  return (
    <div className="flex flex-col gap-[14px]">
      <ValidacionAprobadaInfoBanner />
      <FirmasCompletasPanel hideInfoBanner />
    </div>
  );
}

function CicloCerradoConsolidadoPanel({ defaultAreaDetailOpen }: { defaultAreaDetailOpen: boolean }) {
  return (
    <div className="flex flex-col gap-[14px]">
      <CicloCerradoInfoBanner />
      <ConsolidadoEnviadoPanel variant="ciclo-cerrado" defaultAreaDetailOpen={defaultAreaDetailOpen} />
    </div>
  );
}

function CicloCerradoFirmaPanel() {
  return (
    <div className="flex flex-col gap-[14px]">
      <CicloCerradoInfoBanner />
      <FirmasCompletasPanel hideInfoBanner />
    </div>
  );
}

function CicloCerradoValidacionPanel({
  defaultExpandedRowId,
}: {
  defaultExpandedRowId?: string | null;
}) {
  return (
    <div className="flex flex-col gap-[14px]">
      <CicloCerradoInfoBanner />
      <SprConsolidatedValidationApproved hideInfoBanner defaultExpandedRowId={defaultExpandedRowId} />
    </div>
  );
}

function SacReabiertoReportPanel() {
  const alert = SPR_CONSOLIDATED_REPORT.sacReabierto;

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="flex items-start gap-[9px] rounded-[8px] border border-[#570b1d] bg-[#ffd0db] px-[15px] py-[11px]">
        <SprInfoCircleIcon className="mt-px size-[17.5px] shrink-0 text-[#570b1d]" />
        <div>
          <p className="font-['Inter:Bold',sans-serif] text-[10.5px] font-bold leading-[15.75px] text-[#570b1d]">
            {alert.alertTitle}
          </p>
          <p className="pt-[2px] font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#570b1d]">
            {alert.alertBody}
          </p>
        </div>
      </div>
      <SacReportPanel />
    </div>
  );
}

function FirmaSacUpdatePendingPanel() {
  const copy = SPR_CONSOLIDATED_REPORT.sacReabierto;

  return (
    <div className="flex items-start gap-[9px] rounded-[8px] border border-[#570b1d] bg-[#ffd0db] px-[15px] py-[11px]">
      <SprInfoCircleIcon className="mt-px size-[17.5px] shrink-0 text-[#570b1d]" />
      <div>
        <p className="font-['Inter:Bold',sans-serif] text-[10.5px] font-bold leading-[15.75px] text-[#570b1d]">
          {copy.firmaPendingTitle}
        </p>
        <p className="pt-[2px] font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#570b1d]">
          {copy.firmaPendingBody}
        </p>
      </div>
    </div>
  );
}

function FirmaPendingPanel() {
  const { firmaPending } = SPR_CONSOLIDATED_REPORT;

  return (
    <div className="flex items-start justify-between gap-[16px] rounded-[10px] bg-[#062f2c] px-[18px] py-[16px]">
      <div className="flex min-w-0 flex-1 items-start gap-[12px]">
        <div className="flex size-[36px] shrink-0 items-center justify-center rounded-[8px] bg-[rgba(255,255,255,0.08)]">
          <span className="font-['Inter:Bold',sans-serif] text-[14px] font-bold text-[#c8a064]" aria-hidden>
            ✎
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-white">{firmaPending.title}</p>
          <p className="pt-[3px] font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-white/60">
            {firmaPending.body}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-['Inter:Regular',sans-serif] text-[10px] text-white/40">{firmaPending.availableLabel}</p>
        <p className="pt-[4px] font-['Inter:Bold',sans-serif] text-[22px] font-bold text-[#c8a064]">
          {firmaPending.daysLabel}
        </p>
      </div>
    </div>
  );
}

function FirmaEspecialistaModal({
  open,
  onClose,
  onConfirmed,
  initiallySigned = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirmed?: () => void;
  initiallySigned?: boolean;
}) {
  const copy = SPR_CONSOLIDATED_REPORT.firmaEspecialistaModal;
  const [signed, setSigned] = useState(initiallySigned);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(19,19,19,0.75)] p-[16px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="spr-firma-especialista-title"
        className="w-full max-w-[440px] rounded-[12px] bg-white p-[24px] shadow-[0px_20px_30px_rgba(0,0,0,0.25)]"
      >
        <p
          id="spr-firma-especialista-title"
          className="font-['Inter:Bold',sans-serif] text-[15px] font-bold text-[#001e39]"
        >
          {copy.title}
        </p>
        <p className="pt-[6px] font-['Inter:Regular',sans-serif] text-[11px] leading-[16.5px] text-[#646464]">
          {copy.body}
        </p>

        <div className="mt-[16px] rounded-[8px] border border-[#a8dfa8] bg-[#e0ffd3] px-[13px] py-[11px]">
          <p className="font-['Inter:Bold',sans-serif] text-[9.5px] font-bold uppercase tracking-[0.57px] text-[#2a5c16]">
            {copy.resumenLabel}
          </p>
          <div className="flex items-start justify-between pt-[5px]">
            <p className="font-['Inter:Regular',sans-serif] text-[11px] text-[#2a5c16]">{copy.areasLabel}</p>
            <p className="font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#2a5c16]">{copy.areasValue}</p>
          </div>
          <div className="flex items-start justify-between pt-[3px]">
            <p className="font-['Inter:Regular',sans-serif] text-[11px] text-[#2a5c16]">{copy.kpisLabel}</p>
            <p className="font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#2a5c16]">{copy.kpisValue}</p>
          </div>
        </div>

        <div className="mt-[12px] rounded-[8px] border border-[#e3e3e3] bg-[#f9fafb] p-[13px]">
          <p className="text-center font-['Inter:Regular',sans-serif] text-[10.5px] text-[#646464]">
            {copy.digitalTitle}
          </p>
          <button
            type="button"
            onClick={() => setSigned(true)}
            className={`mt-[8px] flex h-[52px] w-full items-center justify-center gap-[6px] rounded-[8px] border-[1.5px] border-dashed font-['Inter',sans-serif] text-[11px] ${
              signed
                ? 'border-[#2a5c16] bg-[#e0ffd3] font-semibold text-[#2a5c16]'
                : 'border-[#d1d1d1] font-normal text-[#acacac]'
            }`}
          >
            <span aria-hidden>{signed ? '✓' : '✎'}</span>
            {signed ? copy.digitalSigned : copy.digitalCta}
          </button>
          <p className="pt-[8px] text-center font-['Inter:Regular',sans-serif] text-[9px] text-[#acacac]">
            {copy.digitalMeta}
          </p>
        </div>

        <div className="flex items-center justify-end gap-[10px] pt-[16px]">
          <button
            type="button"
            onClick={() => {
              setSigned(false);
              onClose();
            }}
            className="flex h-[34px] items-center rounded-[7px] border border-[#e3e3e3] bg-white px-[17px] font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#646464]"
          >
            {copy.cancelLabel}
          </button>
          <button
            type="button"
            disabled={!signed}
            onClick={() => {
              setSigned(false);
              onClose();
              onConfirmed?.();
            }}
            className={`flex h-[34px] items-center gap-[6px] rounded-[7px] px-[16px] font-['Inter:Bold',sans-serif] text-[12px] font-bold ${
              signed ? 'bg-[#c8a064] text-[#001e39]' : 'bg-[#e3e3e3] text-[#acacac]'
            }`}
          >
            <span aria-hidden>✓</span>
            {copy.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function FirmasCompletasPanel({ hideInfoBanner = false }: { hideInfoBanner?: boolean }) {
  const base = SPR_CONSOLIDATED_REPORT.firmaReady;
  const copy = SPR_CONSOLIDATED_REPORT.firmasCompletas;
  const specialist = base.specialists.find((person) => person.active) ?? base.specialists[0];
  const manager = base.managers[0];

  return (
    <>
      {!hideInfoBanner ? (
        <div className="mb-[14px] flex items-start gap-[9px] rounded-[8px] border border-[#f0d080] bg-[#ffeab8] px-[15px] py-[11px]">
          <span className="mt-px text-[12px] text-[#463100]" aria-hidden>
            i
          </span>
          <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#463100]">
            {copy.infoBanner}
          </p>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[9px] border border-[#e3e3e3] bg-white">
        <div className="flex items-center justify-between gap-[12px] bg-[#001e39] px-[16px] py-[11px]">
          <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-white">{base.cardTitle}</p>
          <span className="rounded-[5px] border border-white/15 bg-white/10 px-[8px] py-[3px] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-white/50">
            {base.cardBadge}
          </span>
        </div>

        <div className="flex flex-col gap-[12px] p-[16px]">
          <div className="overflow-hidden rounded-[9px] border border-[#a8dfa8]">
            <div className="flex items-center gap-[10px] px-[14px] py-[10px]">
              <span className="flex size-[22px] items-center justify-center rounded-full bg-[#00b398] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-white">
                1
              </span>
              <p className="min-w-0 flex-1 font-['Inter:Bold',sans-serif] text-[11.5px] font-bold text-[#001e39]">
                {base.step1Title}
              </p>
              <span className="rounded-[5px] bg-[#e0ffd3] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#2a5c16]">
                {copy.signedBadge}
              </span>
            </div>
            <div className="flex flex-col gap-[8px] px-[14px] pb-[14px]">
              <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#646464]">
                {copy.signedByLabel}
              </p>
              <div className="flex items-center gap-[10px] rounded-[8px] border border-[#e3e3e3] bg-[#f9fafb] px-[12px] py-[10px]">
                <span className="flex size-[30px] items-center justify-center rounded-full bg-[#c5fff6] font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#006153]">
                  {specialist.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#131313]">
                    {specialist.name}
                  </p>
                  <p className="pt-px font-['Inter:Regular',sans-serif] text-[9.5px] text-[#646464]">
                    {specialist.role}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[9px] border border-[#c8a064]">
            <div className="flex items-center gap-[10px] px-[14px] py-[10px]">
              <span className="flex size-[22px] items-center justify-center rounded-full bg-[#c8a064] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#001e39]">
                2
              </span>
              <p className="min-w-0 flex-1 font-['Inter:Bold',sans-serif] text-[11.5px] font-bold text-[#001e39]">
                {base.step2Title}
              </p>
              <span className="rounded-[5px] bg-[#e0ffd3] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#2a5c16]">
                {copy.signedBadge}
              </span>
            </div>
            <div className="flex flex-col gap-[8px] px-[14px] pb-[14px]">
              <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#646464]">
                {copy.signedByLabel}
              </p>
              <div className="flex items-center gap-[10px] rounded-[8px] border border-[#e3e3e3] bg-[#f9fafb] px-[12px] py-[10px]">
                <span className="flex size-[30px] items-center justify-center rounded-full bg-[#fdf3e3] font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#8e6e3e]">
                  {manager.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#131313]">
                    {manager.name}
                  </p>
                  <p className="pt-px font-['Inter:Regular',sans-serif] text-[9.5px] text-[#646464]">{manager.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function FirmaGerenteModal({
  open,
  onClose,
  onConfirmed,
  initiallySigned = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirmed: () => void;
  initiallySigned?: boolean;
}) {
  const copy = SPR_CONSOLIDATED_REPORT.firmaGerenteModal;
  const [signed, setSigned] = useState(initiallySigned);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(19,19,19,0.75)] p-[16px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="spr-firma-gerente-title"
        className="w-full max-w-[440px] rounded-[12px] bg-white p-[24px] shadow-[0px_20px_30px_rgba(0,0,0,0.25)]"
      >
        <p
          id="spr-firma-gerente-title"
          className="font-['Inter:Bold',sans-serif] text-[15px] font-bold text-[#001e39]"
        >
          {copy.title}
        </p>
        <p className="pt-[6px] font-['Inter:Regular',sans-serif] text-[11px] leading-[16.5px] text-[#646464]">
          {copy.body}
        </p>

        <div className="mt-[16px] rounded-[8px] border border-[#a8dfa8] bg-[#e0ffd3] px-[13px] py-[11px]">
          <p className="font-['Inter:Bold',sans-serif] text-[9.5px] font-bold uppercase tracking-[0.57px] text-[#2a5c16]">
            {copy.resumenLabel}
          </p>
          <div className="flex items-start justify-between pt-[5px]">
            <p className="font-['Inter:Regular',sans-serif] text-[11px] text-[#2a5c16]">{copy.areasLabel}</p>
            <p className="font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#2a5c16]">{copy.areasValue}</p>
          </div>
          <div className="flex items-start justify-between pt-[3px]">
            <p className="font-['Inter:Regular',sans-serif] text-[11px] text-[#2a5c16]">{copy.kpisLabel}</p>
            <p className="font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#2a5c16]">{copy.kpisValue}</p>
          </div>
        </div>

        <div className="mt-[12px] rounded-[8px] border border-[#e3e3e3] bg-[#f9fafb] p-[13px]">
          <p className="text-center font-['Inter:Regular',sans-serif] text-[10.5px] text-[#646464]">
            {copy.digitalTitle}
          </p>
          <button
            type="button"
            onClick={() => setSigned(true)}
            className={`mt-[8px] flex h-[52px] w-full items-center justify-center gap-[6px] rounded-[8px] border-[1.5px] border-dashed font-['Inter',sans-serif] text-[11px] ${
              signed
                ? 'border-[#2a5c16] bg-[#e0ffd3] font-semibold text-[#2a5c16]'
                : 'border-[#d1d1d1] font-normal text-[#acacac]'
            }`}
          >
            <span aria-hidden>{signed ? '✓' : '✎'}</span>
            {signed ? copy.digitalSigned : copy.digitalCta}
          </button>
          <p className="pt-[8px] text-center font-['Inter:Regular',sans-serif] text-[9px] text-[#acacac]">
            {copy.digitalMeta}
          </p>
        </div>

        <div className="flex items-center justify-end gap-[10px] pt-[16px]">
          <button
            type="button"
            onClick={() => {
              setSigned(false);
              onClose();
            }}
            className="flex h-[34px] items-center rounded-[7px] border border-[#e3e3e3] bg-white px-[17px] font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#646464]"
          >
            {copy.cancelLabel}
          </button>
          <button
            type="button"
            disabled={!signed}
            onClick={() => {
              setSigned(false);
              onConfirmed();
            }}
            className={`flex h-[34px] items-center gap-[6px] rounded-[7px] px-[16px] font-['Inter:Bold',sans-serif] text-[12px] font-bold ${
              signed ? 'bg-[#c8a064] text-[#001e39]' : 'bg-[#e3e3e3] text-[#acacac]'
            }`}
          >
            <span aria-hidden>✓</span>
            {copy.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function FirmaGerenteReadyPanel({ onOpenFirmaModal }: { onOpenFirmaModal: () => void }) {
  const base = SPR_CONSOLIDATED_REPORT.firmaReady;
  const copy = SPR_CONSOLIDATED_REPORT.firmaGerente;
  const signer = base.specialists.find((person) => person.active) ?? base.specialists[0];

  return (
    <>
      <div className="mb-[14px] flex items-start gap-[8px] rounded-[8px] border border-[#cfe3f7] bg-[#e6f3ff] px-[15px] py-[11px]">
        <span className="mt-px text-[12px] text-[#0d3862]" aria-hidden>
          i
        </span>
        <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#0d3862]">
          {base.infoBefore}
          <span className="font-['Inter:Bold',sans-serif] font-bold">{base.infoBold}</span>
          {base.infoAfter}
        </p>
      </div>

      <section className="overflow-hidden rounded-[9px] border border-[#e3e3e3] bg-white">
        <div className="flex items-center justify-between gap-[12px] bg-[#001e39] px-[16px] py-[11px]">
          <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-white">{base.cardTitle}</p>
          <span className="rounded-[5px] border border-white/15 bg-white/10 px-[8px] py-[3px] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-white/50">
            {base.cardBadge}
          </span>
        </div>

        <div className="flex flex-col gap-[12px] p-[16px]">
          <div className="overflow-hidden rounded-[9px] border border-[#a8dfa8]">
            <div className="flex items-center gap-[10px] px-[14px] py-[10px]">
              <span className="flex size-[22px] items-center justify-center rounded-full bg-[#00b398] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-white">
                1
              </span>
              <p className="min-w-0 flex-1 font-['Inter:Bold',sans-serif] text-[11.5px] font-bold text-[#001e39]">
                {base.step1Title}
              </p>
              <span className="rounded-[5px] bg-[#e0ffd3] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#2a5c16]">
                {copy.step1Badge}
              </span>
            </div>

            <div className="flex flex-col gap-[8px] px-[14px] pb-[14px]">
              <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#646464]">
                {copy.step1Helper}
              </p>
              <div className="flex items-center gap-[10px] rounded-[8px] border border-[#e3e3e3] bg-[#f9fafb] px-[12px] py-[10px]">
                <span className="flex size-[30px] items-center justify-center rounded-full bg-[#c5fff6] font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#006153]">
                  {signer.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#131313]">
                    {signer.name}
                  </p>
                  <p className="pt-px font-['Inter:Regular',sans-serif] text-[9.5px] text-[#646464]">{signer.role}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-[6px] py-[4px]">
            <span className="text-[10px] text-[#acacac]" aria-hidden>
              ↓
            </span>
            <p className="font-['Inter:Regular',sans-serif] text-[10px] text-[#acacac]">{copy.bridgeHelper}</p>
          </div>

          <div className="overflow-hidden rounded-[9px] border border-[#c8a064]">
            <div className="flex items-center gap-[10px] px-[14px] py-[10px]">
              <span className="flex size-[22px] items-center justify-center rounded-full bg-[#c8a064] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#001e39]">
                2
              </span>
              <p className="min-w-0 flex-1 font-['Inter:Bold',sans-serif] text-[11.5px] font-bold text-[#001e39]">
                {base.step2Title}
              </p>
              <span className="rounded-[5px] bg-[#ffeab8] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#8e6e3e]">
                {copy.step2Badge}
              </span>
            </div>

            <div className="flex flex-col gap-[8px] px-[14px] pb-[14px]">
              <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#646464]">
                {copy.step2Helper}
              </p>

              {base.managers.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center gap-[10px] rounded-[8px] border border-[#e3e3e3] bg-[#f9fafb] px-[12px] py-[10px]"
                >
                  <span className="flex size-[30px] items-center justify-center rounded-full bg-[#fdf3e3] font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#8e6e3e]">
                    {person.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#131313]">
                      {person.name}
                    </p>
                    <p className="pt-px font-['Inter:Regular',sans-serif] text-[9.5px] text-[#646464]">{person.role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenFirmaModal}
                    className="rounded-[4px] bg-[#ffeab8] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#8e6e3e]"
                  >
                    {copy.managerAction}
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={onOpenFirmaModal}
                className="mt-[4px] flex h-[44px] w-full items-center justify-center gap-[6px] rounded-[8px] border border-dashed border-[#c8a064] bg-[#fdf8ef] font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#8e6e3e]"
              >
                <span aria-hidden>✎</span>
                {copy.step2Cta}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function FirmaReadyPanel({ onOpenFirmaModal }: { onOpenFirmaModal: () => void }) {
  const copy = SPR_CONSOLIDATED_REPORT.firmaReady;

  return (
    <>
      <div className="mb-[14px] flex items-start gap-[8px] rounded-[8px] border border-[#cfe3f7] bg-[#e6f3ff] px-[15px] py-[11px]">
        <span className="mt-px text-[12px] text-[#0d3862]" aria-hidden>
          i
        </span>
        <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#0d3862]">
          {copy.infoBefore}
          <span className="font-['Inter:Bold',sans-serif] font-bold">{copy.infoBold}</span>
          {copy.infoAfter}
        </p>
      </div>

      <section className="overflow-hidden rounded-[9px] border border-[#e3e3e3] bg-white">
        <div className="flex items-center justify-between gap-[12px] bg-[#001e39] px-[16px] py-[11px]">
          <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-white">{copy.cardTitle}</p>
          <span className="rounded-[5px] border border-white/15 bg-white/10 px-[8px] py-[3px] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-white/50">
            {copy.cardBadge}
          </span>
        </div>

        <div className="flex flex-col gap-[12px] p-[16px]">
          <div className="overflow-hidden rounded-[9px] border border-[#c8a064]">
            <div className="flex items-center gap-[10px] px-[14px] py-[10px]">
              <span className="flex size-[22px] items-center justify-center rounded-full bg-[#c8a064] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#001e39]">
                1
              </span>
              <p className="min-w-0 flex-1 font-['Inter:Bold',sans-serif] text-[11.5px] font-bold text-[#001e39]">
                {copy.step1Title}
              </p>
              <span className="rounded-[5px] bg-[#ffeab8] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#8e6e3e]">
                {copy.step1Badge}
              </span>
            </div>

            <div className="flex flex-col gap-[8px] px-[14px] pb-[14px]">
              <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#646464]">
                {copy.step1Helper}
              </p>

              {copy.specialists.map((person) => (
                <div
                  key={person.id}
                  className={`flex items-center gap-[10px] rounded-[8px] border px-[12px] py-[10px] ${
                    person.active
                      ? 'border-[#e3e3e3] bg-[#f9fafb]'
                      : 'border-dashed border-[#e3e3e3] bg-[#f7f7f7]'
                  }`}
                >
                  <span
                    className={`flex size-[30px] items-center justify-center rounded-full font-['Inter:Bold',sans-serif] text-[11px] font-bold ${
                      person.active ? 'bg-[#c5fff6] text-[#006153]' : 'bg-[#f7f7f7] text-[#acacac]'
                    }`}
                  >
                    {person.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold ${
                        person.active ? 'text-[#131313]' : 'text-[#acacac]'
                      }`}
                    >
                      {person.name}
                    </p>
                    <p
                      className={`pt-px font-['Inter:Regular',sans-serif] text-[9.5px] ${
                        person.active ? 'text-[#646464]' : 'text-[#acacac]'
                      }`}
                    >
                      {person.role}
                    </p>
                  </div>
                  <span className="rounded-[4px] border border-[#e3e3e3] bg-[#f7f7f7] px-[8px] py-[3px] font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#acacac]">
                    {copy.pendingLabel}
                  </span>
                </div>
              ))}

              <button
                type="button"
                onClick={onOpenFirmaModal}
                className="mt-[4px] flex h-[50px] w-full items-center justify-center gap-[7px] rounded-[8px] border-[1.5px] border-dashed border-[#d1d1d1] font-['Inter:Regular',sans-serif] text-[11px] text-[#acacac] hover:border-[#c8a064] hover:text-[#8e6e3e]"
              >
                <span aria-hidden>✎</span>
                {copy.step1Cta}
              </button>
              <p className="text-center font-['Inter:Regular',sans-serif] text-[9px] text-[#acacac]">{copy.step1Footer}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-[6px] py-[4px]">
            <span className="text-[10px] text-[#acacac]" aria-hidden>
              ↓
            </span>
            <p className="max-w-[860px] text-center font-['Inter:Regular',sans-serif] text-[10px] text-[#acacac]">
              {copy.bridgeHelper}
            </p>
          </div>

          <div className="overflow-hidden rounded-[9px] border border-[#e3e3e3] opacity-55">
            <div className="flex items-center gap-[10px] px-[14px] py-[10px]">
              <span className="flex size-[22px] items-center justify-center rounded-full bg-[#d1d1d1] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-white">
                2
              </span>
              <p className="min-w-0 flex-1 font-['Inter:Bold',sans-serif] text-[11.5px] font-bold text-[#acacac]">
                {copy.step2Title}
              </p>
              <span className="rounded-[5px] border border-[#e3e3e3] bg-[#f7f7f7] px-[8px] py-[3px] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#acacac]">
                {copy.step2Badge}
              </span>
            </div>

            <div className="flex flex-col gap-[8px] px-[14px] pb-[14px]">
              <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#acacac]">
                {copy.step2Helper}
              </p>

              {copy.managers.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center gap-[10px] rounded-[8px] border border-dashed border-[#e3e3e3] bg-[#f7f7f7] px-[12px] py-[10px]"
                >
                  <span className="flex size-[30px] items-center justify-center rounded-full bg-[#f7f7f7] font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#acacac]">
                    {person.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#acacac]">
                      {person.name}
                    </p>
                    <p className="pt-px font-['Inter:Regular',sans-serif] text-[9.5px] text-[#acacac]">{person.role}</p>
                  </div>
                  <span className="rounded-[4px] border border-[#e3e3e3] bg-[#f7f7f7] px-[8px] py-[3px] font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#acacac]">
                    {copy.pendingLabel}
                  </span>
                </div>
              ))}

              <p className="text-center font-['Inter:Regular',sans-serif] text-[9px] text-[#acacac]">{copy.step2Footer}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}


function SacDisponibleValidationPanel() {
  const copy = SPR_CONSOLIDATED_REPORT.sacDisponibleValidacion;

  return (
    <div
      className="rounded-[9px] px-[18px] py-[14px]"
      style={{ backgroundImage: 'linear-gradient(175.61deg, #001e39 0%, #004a3a 100%)' }}
    >
      <div className="flex items-center gap-[12px]">
        <div className="flex size-[42px] shrink-0 items-center justify-center rounded-[9px] bg-white/10">
          <span className="font-['Inter:Bold',sans-serif] text-[14px] font-bold text-[#c8a064]" aria-hidden>
            ✎
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-white">{copy.title}</p>
          <p className="pt-[3px] font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-white/60">
            {copy.body}
          </p>
        </div>
      </div>
    </div>
  );
}

function ValidationPendingPanel() {
  const { validationPending } = SPR_CONSOLIDATED_REPORT;

  return (
    <div className="flex items-start justify-between gap-[16px] rounded-[10px] bg-[#062f2c] px-[18px] py-[16px]">
      <div className="flex min-w-0 flex-1 items-start gap-[12px]">
        <div className="flex size-[36px] shrink-0 items-center justify-center rounded-[8px] bg-[rgba(255,255,255,0.08)]">
          <span className="font-['Inter:Bold',sans-serif] text-[14px] font-bold text-[#c8a064]" aria-hidden>
            ✎
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-white">{validationPending.title}</p>
          <p className="pt-[3px] font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-white/60">
            {validationPending.body}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-['Inter:Regular',sans-serif] text-[10px] text-white/40">{validationPending.availableLabel}</p>
        <p className="pt-[4px] font-['Inter:Bold',sans-serif] text-[22px] font-bold text-[#c8a064]">
          {validationPending.daysLabel}
        </p>
      </div>
    </div>
  );
}

function SacPreparingPanel() {
  const { sacPreparing } = SPR_CONSOLIDATED_REPORT;

  return (
    <div className="flex flex-1 items-center justify-center px-[22px] py-[18px]">
      <div className="flex w-full max-w-[440px] flex-col items-center gap-[12px] rounded-[12px] bg-white p-[24px] shadow-[0px_20px_30px_rgba(0,0,0,0.25)]">
        <div className="flex size-[86px] items-center justify-center rounded-full bg-[#001e39]">
          <svg width="44" height="35" viewBox="0 0 44 35" fill="none" aria-hidden>
            <path
              d="M11.5 27.5C6.25329 27.5 2 23.2467 2 18C2 13.134 5.68629 9.125 10.4 8.55C11.55 4.05 15.75 0.75 20.75 0.75C26.8 0.75 31.75 5.4 32.35 11.3C36.85 11.85 40.25 15.7 40.25 20.35C40.25 25.25 36.25 29.25 31.35 29.25H11.5V27.5Z"
              stroke="white"
              strokeWidth="2.2"
              fill="none"
            />
            <path d="M22 14V26M22 14L17 19M22 14L27 19" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="w-full text-center">
          <p className="font-['Inter:Bold',sans-serif] text-[15px] font-bold text-[#001e39]">{sacPreparing.title}</p>
          <p className="mx-auto max-w-[392px] pt-[6px] font-['Inter:Regular',sans-serif] text-[11px] leading-[16.5px] text-[#646464]">
            {sacPreparing.body}
          </p>
        </div>
        <div className="flex h-[16px] items-center gap-[6px]" aria-hidden>
          <span className="size-[8px] animate-pulse rounded-full bg-[#00b398]" />
          <span className="size-[8px] animate-pulse rounded-full bg-[#00b398] [animation-delay:150ms]" />
          <span className="size-[8px] animate-pulse rounded-full bg-[#7ad9cb] [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function ConsolidadoTablePanel() {
  const dataRowCount = SPR_CONSOLIDATED_TABLE_ROWS.filter((row) => row.kind === 'data').length;

  return (
    <>
      <div className="mb-[14px] flex items-start gap-[10px] rounded-[8px] border border-[#cfe3f7] bg-[#e6f3ff] px-[15px] py-[11px]">
        <span className="mt-px text-[12px] text-[#0d3862]" aria-hidden>
          i
        </span>
        <div>
          <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#0d3862]">
            {SPR_CONSOLIDATED_REPORT.bannerTitle(SPR_ACTIVE_CYCLE.label)}
          </p>
          <p className="pt-[2px] font-['Inter:Regular',sans-serif] text-[11px] leading-[16px] text-[#24588b]">
            {SPR_CONSOLIDATED_REPORT.bannerHelper}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-[8px] border border-[#e3e3e3] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-[8px] border-b border-[#ebebeb] px-[12px] py-[10px]">
          <p className="font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#131313]">
            {SPR_CONSOLIDATED_REPORT.tableTitle}
          </p>
          <span className="inline-flex items-center gap-[6px] rounded-[5px] border border-[#f5c4a0] bg-[#fff0e6] px-[9px] py-[3px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#e8720c]">
            <span className="size-[8px] rounded-full bg-[#e8720c]" aria-hidden />
            {SPR_CONSOLIDATED_REPORT.alertBadge}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1010px] w-full border-collapse">
            <thead>
              <tr className="bg-[#f7f7f7]">
                <th className="w-[253px] px-[10px] py-[7px] text-left font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#646464]">
                  Parámetro
                </th>
                <th className="w-[142px] px-[10px] py-[7px] text-left font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#646464]">
                  Área
                </th>
                <th className="w-[111px] px-[10px] py-[7px] text-left font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#646464]">
                  Categoría
                </th>
                <th className="w-[101px] px-[10px] py-[7px] text-right font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#646464]">
                  Valor
                </th>
                <th className="w-[51px] px-[10px] py-[7px] text-left font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#646464]">
                  Ud.
                </th>
                <th className="w-[192px] px-[10px] py-[7px] text-left font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#646464]">
                  Tendencia vs prom. 6M
                </th>
                <th className="w-[101px] px-[10px] py-[7px] text-left font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#646464]">
                  Origen
                </th>
              </tr>
            </thead>
            <tbody>
              {SPR_CONSOLIDATED_TABLE_ROWS.map((row) => {
                if (row.kind === 'group') {
                  return (
                    <tr key={row.id} className="bg-[#fafbfc]">
                      <td
                        colSpan={7}
                        className="border-b border-[#f0f0f0] px-[10px] py-[6px] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#001e39]"
                      >
                        {row.label}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={row.id}
                    className={`border-b border-[#f4f6f9] ${row.highlight ? 'bg-[#fff8f0]' : 'bg-white'}`}
                  >
                    <td className="px-[10px] py-[8px]">
                      <p className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#131313]">
                        {row.name}
                      </p>
                      {row.subtitle ? (
                        <p className="pt-px font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
                          {row.subtitle}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-[10px] py-[8px]">
                      <span className="inline-flex rounded-[4px] bg-[#eef2f7] px-[7px] py-[3px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#24588b]">
                        {row.area}
                      </span>
                    </td>
                    <td className="px-[10px] py-[8px] font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
                      {row.category}
                    </td>
                    <td className="px-[10px] py-[8px] text-right font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#131313]">
                      {row.value}
                    </td>
                    <td className="px-[10px] py-[8px] font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
                      {row.unit}
                    </td>
                    <td className="px-[10px] py-[8px]">
                      <span
                        className={`inline-flex rounded-[4px] px-[6px] py-[2px] font-['Inter:Bold',sans-serif] text-[10px] font-bold ${trendClass(row.trend)}`}
                      >
                        {row.trendLabel}
                      </span>
                    </td>
                    <td className="px-[10px] py-[8px]">
                      <span className="inline-flex rounded-[4px] border border-[#e3e3e3] bg-[#f9fafb] px-[7px] py-[2px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#646464]">
                        {originLabel(row.origin)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-[10px] border-t border-[#ebebeb] px-[14px] py-[11px]">
          <p className="font-['Inter:Regular',sans-serif] text-[11px] text-[#646464]">
            Mostrando {dataRowCount} de {dataRowCount} parámetros consolidados
          </p>
          <div className="flex flex-wrap items-center gap-[6px]">
            <span className="font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
              {SPR_CONSOLIDATED_REPORT.pendingAreasLabel}
            </span>
            <span className="rounded-[4px] bg-[#ffd0db] px-[7px] py-[2px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#570b1d]">
              {SPR_CONSOLIDATED_REPORT.pendingAreasValue}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

function areaCardStatusDot(status: SprReportAreaCardStatus) {
  if (status === 'complete') return 'bg-[#3a9b3a]';
  if (status === 'consolidating') return 'bg-[#24588b]';
  if (status === 'estimated') return 'bg-[#7b4fbf]';
  return 'bg-[#c4c4c4]';
}

function areaCardStatusLabel(status: SprReportAreaCardStatus) {
  if (status === 'complete') return 'text-[#2a5c16]';
  if (status === 'consolidating') return 'text-[#24588b]';
  if (status === 'estimated') return 'text-[#7b4fbf]';
  return 'text-[#646464]';
}

function areaCardBadgeClass(badge: string) {
  if (badge.includes('✓')) return 'bg-[#e0ffd3] text-[#2a5c16]';
  if (badge.includes('→')) return 'bg-[#ffeab8] text-[#8e6e3e]';
  return 'bg-[#f7f7f7] text-[#646464]';
}

function ConsolidadoEnviadoPanel({
  variant = 'enviado',
  defaultAreaDetailOpen = true,
}: {
  variant?: 'enviado' | 'detalle-7-8' | 'validacion-aprobada' | 'ciclo-cerrado';
  defaultAreaDetailOpen?: boolean;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportCycle = resolveSprReportCycle(searchParams.get(SPR_REPORT_CYCLE_QUERY));
  const copy = SPR_CONSOLIDATED_REPORT.consolidadoEnviado;
  const validacionAprobadaCopy = SPR_CONSOLIDATED_REPORT.validacionAprobada;
  const firmaCopy = SPR_CONSOLIDATED_REPORT.firmaReady;
  const [filter, setFilter] = useState<SentFilter>('all');
  const [areaDetailOpen, setAreaDetailOpen] = useState(defaultAreaDetailOpen);

  const visibleRows = useMemo(() => {
    if (filter === 'all') return SPR_CONSOLIDATED_TABLE_ROWS;

    const keep = new Set<string>();
    for (const row of SPR_CONSOLIDATED_TABLE_ROWS) {
      if (row.kind !== 'data') continue;
      const isEstimated = Boolean(row.estimated);
      if (filter === 'estimated' && isEstimated) keep.add(row.id);
      if (filter === 'real' && !isEstimated) keep.add(row.id);
    }

    const out: typeof SPR_CONSOLIDATED_TABLE_ROWS = [];
    let pendingGroup: (typeof SPR_CONSOLIDATED_TABLE_ROWS)[number] | null = null;
    for (const row of SPR_CONSOLIDATED_TABLE_ROWS) {
      if (row.kind === 'group') {
        pendingGroup = row;
        continue;
      }
      if (!keep.has(row.id)) continue;
      if (pendingGroup) {
        out.push(pendingGroup);
        pendingGroup = null;
      }
      out.push(row);
    }
    return out;
  }, [filter]);

  return (
    <>
      {variant === 'validacion-aprobada' ? (
        <div className="mb-[14px] flex items-start gap-[10px] rounded-[9px] border-[1.5px] border-[#c9aeff] bg-[#f3eeff] px-[15.5px] py-[13.5px]">
          <SprInfoCircleIcon className="mt-px h-[15px] w-[18.75px] shrink-0 text-[#7b4fbf]" />
          <div>
            <p className="font-['Inter:Bold',sans-serif] text-[11.5px] font-bold text-[#7b4fbf]">
              {validacionAprobadaCopy.estimateBannerTitle}
            </p>
            <p className="pt-[3px] font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#7b4fbf]">
              {validacionAprobadaCopy.estimateBannerBodyBefore}
              <span className="font-['Inter:Bold',sans-serif] font-bold">
                {validacionAprobadaCopy.estimateBannerBodyBold}
              </span>
              {validacionAprobadaCopy.estimateBannerBodyAfter}
            </p>
          </div>
        </div>
      ) : variant === 'enviado' ? (
        <div className="mb-[14px] flex items-start gap-[10px] rounded-[8px] border border-[#e8d4f5] bg-[#f7edfc] px-[15px] py-[11px]">
          <span className="mt-px text-[12px] text-[#6b21a8]" aria-hidden>
            !
          </span>
          <div>
            <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#6b21a8]">{copy.estimateBannerTitle}</p>
            <p className="pt-[2px] font-['Inter:Regular',sans-serif] text-[11px] leading-[16px] text-[#7c3aed]">
              {copy.estimateBannerBody}
            </p>
          </div>
        </div>
      ) : variant === 'ciclo-cerrado' ? null : (
        <div className="mb-[14px] flex items-start gap-[8px] rounded-[8px] border border-[#cfe3f7] bg-[#e6f3ff] px-[15px] py-[11px]">
          <span className="mt-px text-[12px] text-[#0d3862]" aria-hidden>
            i
          </span>
          <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#0d3862]">
            {firmaCopy.infoBefore}
            <span className="font-['Inter:Bold',sans-serif] font-bold">{firmaCopy.infoBold}</span>
            {firmaCopy.infoAfter}
          </p>
        </div>
      )}

      <div className="mb-[14px] overflow-hidden rounded-[8px] border border-[#e3e3e3] bg-white px-[12px] py-[10px]">
        <button
          type="button"
          onClick={() => setAreaDetailOpen((open) => !open)}
          className="flex w-full items-center gap-[10px] text-left"
        >
          <span
            className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2f2f2] text-[12px] text-[#646464]"
            aria-hidden
          >
            ▦
          </span>
          <span className="min-w-0 flex-1">
            <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#131313]">{copy.areaDetailTitle}</p>
            <p className="pt-px font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">{copy.areaDetailHelper}</p>
          </span>
          <span className="text-[12px] text-[#646464]" aria-hidden>
            {areaDetailOpen ? '▴' : '▾'}
          </span>
        </button>
        {areaDetailOpen ? (
          <div className="mt-[10px] overflow-hidden rounded-[8px] border border-[#e3e3e3] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-[8px] border-b border-[#f4f6f9] px-[14px] py-[11px]">
              <div className="flex items-center gap-[7px]">
                <span className="text-[12px] text-[#001e39]" aria-hidden>
                  ▤
                </span>
                <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#131313]">
                  {copy.areaDetailSectionTitle(SPR_ACTIVE_CYCLE.label)}
                </p>
              </div>
              <span className="inline-flex items-center gap-[5px] rounded-[5px] border border-[#f5c4a0] bg-[#fff0e6] px-[9px] py-[3px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#e8720c]">
                <span className="size-[8px] rounded-full bg-[#e8720c]" aria-hidden />
                {copy.areaDetailAlertBadge}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
              {SPR_CONSOLIDATED_SENT_AREA_CARDS.map((area) => {
                const hasDetail =
                  area.slug === 'servicios-tecnicos' ||
                  area.slug === 'planta' ||
                  area.slug === 'servicios-generales';
                const className = `border-b border-r border-[#f4f6f9] px-[13px] py-[11px] text-left ${
                  hasDetail ? 'cursor-pointer transition-colors hover:bg-[#f8fbff]' : ''
                }`;
                const body = (
                  <>
                    <p className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#131313]">
                      {area.name}
                    </p>
                    <div className="flex items-center gap-[5px] pt-[5px]">
                      <span className={`size-[5px] rounded-full ${areaCardStatusDot(area.status)}`} aria-hidden />
                      <p
                        className={`font-['Inter:Regular',sans-serif] text-[10px] ${areaCardStatusLabel(area.status)}`}
                      >
                        {area.statusLabel}
                      </p>
                    </div>
                    <div className="mt-[8px] h-[3px] w-full overflow-hidden rounded-full bg-[#ebebeb]">
                      <div
                        className={`h-full rounded-full ${area.status === 'pending' ? 'bg-transparent' : 'bg-[#00b398]'}`}
                        style={{ width: `${Math.round(area.progress * 100)}%` }}
                      />
                    </div>
                    <div className="mt-[8px] flex flex-wrap gap-[4px]">
                      {area.badges.map((badge) => (
                        <span
                          key={badge}
                          className={`rounded-[4px] px-[5px] py-[2px] font-['Inter:Semi_Bold',sans-serif] text-[9px] font-semibold ${areaCardBadgeClass(badge)}`}
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </>
                );

                if (hasDetail) {
                  return (
                    <button
                      key={area.slug}
                      type="button"
                      className={className}
                      onClick={() => navigate(buildSprReportAreaHref(area.slug, reportCycle))}
                    >
                      {body}
                    </button>
                  );
                }

                return (
                  <div key={area.slug} className={className}>
                    {body}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <section className="overflow-hidden rounded-[8px] border border-[#e3e3e3] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-[10px] border-b border-[#ebebeb] px-[12px] py-[10px]">
          <p className="font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#131313]">{copy.tableTitle}</p>
          <div className="flex flex-wrap items-center gap-[8px]">
            <div className="flex items-center gap-[6px]">
              <span className="font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">{copy.filterLabel}</span>
              {(
                [
                  ['all', copy.filterAll],
                  ['real', copy.filterReal],
                  ['estimated', copy.filterEstimated],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`rounded-[6px] px-[10px] py-[5px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold ${
                    filter === id
                      ? 'bg-[#001e39] text-white'
                      : 'border border-[#e3e3e3] bg-white text-[#646464]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="rounded-[6px] border border-[#e3e3e3] bg-white px-[10px] py-[5px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#24588b]"
            >
              {copy.traceabilityLabel}
            </button>
            <button
              type="button"
              className="rounded-[6px] bg-[#001e39] px-[12px] py-[5px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-white"
            >
              {copy.downloadLabel}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1010px] w-full border-collapse">
            <thead>
              <tr className="bg-[#f7f7f7]">
                <th className="w-[253px] px-[10px] py-[7px] text-left font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#646464]">
                  Parámetro
                </th>
                <th className="w-[142px] px-[10px] py-[7px] text-left font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#646464]">
                  Área
                </th>
                <th className="w-[111px] px-[10px] py-[7px] text-left font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#646464]">
                  Categoría
                </th>
                <th className="w-[101px] px-[10px] py-[7px] text-right font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#646464]">
                  {copy.valueColumn}
                </th>
                <th className="w-[51px] px-[10px] py-[7px] text-left font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#646464]">
                  Ud.
                </th>
                <th className="w-[192px] px-[10px] py-[7px] text-left font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#646464]">
                  Tendencia vs prom. 6M
                </th>
                <th className="w-[101px] px-[10px] py-[7px] text-left font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#646464]">
                  Origen
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                if (row.kind === 'group') {
                  return (
                    <tr key={row.id} className="bg-[#fafbfc]">
                      <td
                        colSpan={7}
                        className="border-b border-[#f0f0f0] px-[10px] py-[6px] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#001e39]"
                      >
                        {row.label}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={row.id}
                    className={`border-b border-[#f4f6f9] ${
                      row.estimated ? 'bg-[#faf7ff]' : row.highlight ? 'bg-[#fff8f0]' : 'bg-white'
                    }`}
                  >
                    <td className="px-[10px] py-[8px]">
                      <p className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#131313]">
                        {row.name}
                      </p>
                      {row.subtitle ? (
                        <p className="pt-px font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
                          {row.subtitle}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-[10px] py-[8px]">
                      <span
                        className={`inline-flex rounded-[4px] px-[7px] py-[3px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold ${areaPillClass(row.area)}`}
                      >
                        {row.area}
                      </span>
                    </td>
                    <td className="px-[10px] py-[8px] font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
                      {row.category}
                    </td>
                    <td className="px-[10px] py-[8px] text-right font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#131313]">
                      {row.value}
                    </td>
                    <td className="px-[10px] py-[8px] font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
                      {row.unit}
                    </td>
                    <td className="px-[10px] py-[8px]">
                      <span
                        className={`inline-flex rounded-[4px] px-[6px] py-[2px] font-['Inter:Bold',sans-serif] text-[10px] font-bold ${trendClass(row.trend)}`}
                      >
                        {row.trendLabel}
                      </span>
                    </td>
                    <td className="px-[10px] py-[8px]">
                      <span className="inline-flex rounded-[4px] border border-[#e3e3e3] bg-[#f9fafb] px-[7px] py-[2px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#646464]">
                        {row.estimated ? 'Estimado' : originLabel(row.origin)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-[10px] border-t border-[#ebebeb] px-[14px] py-[11px]">
          <div className="flex flex-wrap items-center gap-[6px]">
            <span className="rounded-[4px] bg-[#e0ffd3] px-[8px] py-[2px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#2a5c16]">
              {copy.footerReales}
            </span>
            <span className="rounded-[4px] bg-[#f3e8ff] px-[8px] py-[2px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#6b21a8]">
              {copy.footerEstimados}
            </span>
          </div>
          <p className="font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">{copy.footerSource}</p>
        </div>
      </section>
    </>
  );
}

// Flujo mock: en-curso | consolidado-7-8 | sac-preparando | consolidado-enviado | ... via ?estado=
export function SprConsolidatedReportView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const flow = resolveSprConsolidatedFlow(searchParams.get(SPR_CONSOLIDATED_FLOW_QUERY));
  const isConsolidadoSieteAreas = flow === SPR_CONSOLIDATED_FLOW.consolidadoSieteAreas;
  const isSacReabierto = flow === SPR_CONSOLIDATED_FLOW.sacReabierto;
  const isSacDisponible = flow === SPR_CONSOLIDATED_FLOW.sacDisponible;
  const isConsolidadoParcial =
    isConsolidadoSieteAreas || isSacReabierto;
  const isSacPreparing = flow === SPR_CONSOLIDATED_FLOW.sacPreparando;
  const isConsolidadoEnviado = flow === SPR_CONSOLIDATED_FLOW.consolidadoEnviado;
  const isFirmaGerente = flow === SPR_CONSOLIDATED_FLOW.firmaGerente;
  const isFirmasCompletas = flow === SPR_CONSOLIDATED_FLOW.firmasCompletas;
  const isValidacionDiscrepancia = flow === SPR_CONSOLIDATED_FLOW.validacionDiscrepancia;
  const isValidacionDiscrepanciaPostFirma = flow === SPR_CONSOLIDATED_FLOW.validacionDiscrepanciaPostFirma;
  const isValidacionAprobada = flow === SPR_CONSOLIDATED_FLOW.validacionAprobada;
  const isCicloCerrado = flow === SPR_CONSOLIDATED_FLOW.cicloCerrado;
  const isCicloCompleto = isValidacionAprobada || isCicloCerrado;
  const showValidationDiscrepancy = isValidacionDiscrepancia || isValidacionDiscrepanciaPostFirma;
  const isPostEnvio =
    isConsolidadoEnviado ||
    isSacDisponible ||
    isFirmaGerente ||
    isFirmasCompletas ||
    isValidacionDiscrepancia ||
    isValidacionDiscrepanciaPostFirma ||
    isValidacionAprobada ||
    isCicloCerrado;
  const showValidationDiscrepancyDetail =
    searchParams.get(SPR_CONSOLIDATED_DEMO_CASE_QUERY) === SPR_CONSOLIDATED_DEMO_CASE_SERVICIOS_TECNICOS;
  const reopenModalOpen = searchParams.get(SPR_CONSOLIDATED_DEMO_MODAL_QUERY) === SPR_CONSOLIDATED_DEMO_REOPEN_MODAL;
  const isFirmaListaProcesoReabierto =
    isSacReabierto && searchParams.get(SPR_CONSOLIDATED_DEMO_FASE_QUERY) === SPR_CONSOLIDATED_DEMO_FIRMA_LISTA_FASE;
  const isSacDisponibleFirmasCompletas =
    isSacDisponible &&
    searchParams.get(SPR_CONSOLIDATED_DEMO_FASE_QUERY) === SPR_CONSOLIDATED_DEMO_FIRMAS_COMPLETAS_FASE;
  const showFirmasCompletasPanel =
    isFirmasCompletas || isValidacionDiscrepanciaPostFirma || isSacDisponibleFirmasCompletas;
  const detalleParam = searchParams.get(SPR_CONSOLIDATED_DEMO_DETALLE_QUERY);
  const consolidadoAreaDetailOpen = detalleParam !== 'cerrado';
  const kpiDiscrepancyExpandedId =
    searchParams.get(SPR_CONSOLIDATED_DEMO_DISCREPANCIA_EXPANDIDA_QUERY) ===
    SPR_CONSOLIDATED_DEMO_DISCREPANCIA_FRESHWATER_INTENSITY
      ? 'freshwater-intensity'
      : null;

  const timelineSteps = isSacPreparing
    ? SPR_CONSOLIDATED_REPORT.sacPreparingTimelineSteps
    : isSacReabierto
      ? SPR_CONSOLIDATED_REPORT.sacReabiertoTimelineSteps
      : isSacDisponibleFirmasCompletas || isFirmasCompletas
        ? SPR_CONSOLIDATED_REPORT.firmasCompletasTimelineSteps
        : isCicloCompleto
          ? SPR_CONSOLIDATED_REPORT.validacionAprobadaTimelineSteps
          : isSacDisponible
          ? SPR_CONSOLIDATED_REPORT.sacDisponibleTimelineSteps
          : isValidacionDiscrepanciaPostFirma
            ? SPR_CONSOLIDATED_REPORT.validacionDiscrepanciaPostFirmaTimelineSteps
            : isValidacionDiscrepancia
              ? SPR_CONSOLIDATED_REPORT.validacionDiscrepanciaTimelineSteps
              : isFirmaGerente
                ? SPR_CONSOLIDATED_REPORT.firmaGerenteTimelineSteps
                : isConsolidadoEnviado
                  ? SPR_CONSOLIDATED_REPORT.consolidadoEnviadoTimelineSteps
                  : isConsolidadoParcial
                    ? SPR_CONSOLIDATED_REPORT.consolidadoSieteAreasTimelineSteps
                    : SPR_CONSOLIDATED_REPORT.timelineSteps;
  const statusTabs = isSacPreparing
    ? SPR_CONSOLIDATED_REPORT.sacPreparingStatusTabs
    : isSacReabierto
      ? SPR_CONSOLIDATED_REPORT.sacReabiertoStatusTabs
      : isSacDisponibleFirmasCompletas
        ? SPR_CONSOLIDATED_REPORT.sacDisponibleFirmasCompletasStatusTabs
        : isFirmasCompletas
          ? SPR_CONSOLIDATED_REPORT.firmasCompletasStatusTabs
          : isCicloCompleto
            ? SPR_CONSOLIDATED_REPORT.validacionAprobadaStatusTabs
            : isSacDisponible
          ? SPR_CONSOLIDATED_REPORT.sacDisponibleStatusTabs
          : isValidacionDiscrepanciaPostFirma
            ? SPR_CONSOLIDATED_REPORT.validacionDiscrepanciaPostFirmaStatusTabs
            : isValidacionDiscrepancia
              ? SPR_CONSOLIDATED_REPORT.validacionDiscrepanciaStatusTabs
              : isPostEnvio
                ? SPR_CONSOLIDATED_REPORT.consolidadoEnviadoStatusTabs
                : isConsolidadoParcial
                  ? SPR_CONSOLIDATED_REPORT.consolidadoSieteAreasStatusTabs
                  : SPR_CONSOLIDATED_REPORT.statusTabs;

  const [activeTab, setActiveTab] = useState<SprConsolidatedTabId>(() => {
    const tabParam = searchParams.get('tab');
    const initialFlow = resolveSprConsolidatedFlow(searchParams.get(SPR_CONSOLIDATED_FLOW_QUERY));
    if (initialFlow === SPR_CONSOLIDATED_FLOW.sacReabierto) {
      return tabParam === 'consolidado' || tabParam === 'firma' || tabParam === 'validacion'
        ? tabParam
        : 'sac';
    }
    if (initialFlow === SPR_CONSOLIDATED_FLOW.sacDisponible) {
      if (searchParams.get(SPR_CONSOLIDATED_DEMO_FASE_QUERY) === SPR_CONSOLIDATED_DEMO_FIRMAS_COMPLETAS_FASE) {
        return tabParam === 'consolidado' || tabParam === 'sac' || tabParam === 'firma' || tabParam === 'validacion'
          ? tabParam
          : 'firma';
      }
      return tabParam === 'consolidado' || tabParam === 'sac' || tabParam === 'firma' || tabParam === 'validacion'
        ? tabParam
        : 'sac';
    }
    if (
      initialFlow === SPR_CONSOLIDATED_FLOW.validacionDiscrepancia ||
      initialFlow === SPR_CONSOLIDATED_FLOW.validacionDiscrepanciaPostFirma
    ) {
      if (!tabParam || tabParam === 'firma') return 'validacion';
    }
    if (initialFlow === SPR_CONSOLIDATED_FLOW.validacionAprobada) {
      return tabParam === 'consolidado' || tabParam === 'sac' || tabParam === 'firma' || tabParam === 'validacion'
        ? tabParam
        : 'sac';
    }
    if (initialFlow === SPR_CONSOLIDATED_FLOW.cicloCerrado) {
      return tabParam === 'consolidado' || tabParam === 'sac' || tabParam === 'firma' || tabParam === 'validacion'
        ? tabParam
        : 'consolidado';
    }
    return resolveInitialTab(tabParam);
  });
  const [firmaModalOpen, setFirmaModalOpen] = useState(
    () =>
      searchParams.get('modal') === 'firma-especialista' ||
      searchParams.get('modal') === 'firma-especialista-firmado',
  );
  const firmaModalInitiallySigned = searchParams.get('modal') === 'firma-especialista-firmado';

  const [firmaGerenteModalOpen, setFirmaGerenteModalOpen] = useState(
    () =>
      searchParams.get('modal') === 'firma-gerente' ||
      searchParams.get('modal') === 'firma-gerente-firmado',
  );
  const firmaGerenteModalInitiallySigned = searchParams.get('modal') === 'firma-gerente-firmado';

  function patchSearchParams(mutate: (params: URLSearchParams) => void) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        mutate(next);
        return next;
      },
      { replace: true },
    );
  }

  function openValidationDetail() {
    patchSearchParams((next) => {
      next.set(SPR_CONSOLIDATED_DEMO_CASE_QUERY, SPR_CONSOLIDATED_DEMO_CASE_SERVICIOS_TECNICOS);
    });
  }

  function closeValidationDetail() {
    patchSearchParams((next) => {
      next.delete(SPR_CONSOLIDATED_DEMO_CASE_QUERY);
    });
  }

  function openReopenModal() {
    patchSearchParams((next) => {
      next.set(SPR_CONSOLIDATED_DEMO_MODAL_QUERY, SPR_CONSOLIDATED_DEMO_REOPEN_MODAL);
    });
  }

  function closeReopenModal() {
    patchSearchParams((next) => {
      next.delete(SPR_CONSOLIDATED_DEMO_MODAL_QUERY);
    });
  }

  const cycleIncompleteModalOpen =
    searchParams.get(SPR_CONSOLIDATED_DEMO_MODAL_QUERY) === SPR_CONSOLIDATED_DEMO_CICLO_INCOMPLETO_MODAL;

  const cycleClosedModalOpen =
    searchParams.get(SPR_CONSOLIDATED_DEMO_MODAL_QUERY) === SPR_CONSOLIDATED_DEMO_CICLO_CERRADO_MODAL;

  function closeCycleClosedModal() {
    patchSearchParams((next) => {
      next.delete(SPR_CONSOLIDATED_DEMO_MODAL_QUERY);
    });
  }

  function closeCycleIncompleteModal() {
    patchSearchParams((next) => {
      next.delete(SPR_CONSOLIDATED_DEMO_MODAL_QUERY);
    });
  }

  const goToFirmasCompletas = () => {
    setFirmaGerenteModalOpen(false);
    setActiveTab('firma');
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const currentFlow = resolveSprConsolidatedFlow(prev.get(SPR_CONSOLIDATED_FLOW_QUERY));
        if (currentFlow === SPR_CONSOLIDATED_FLOW.sacDisponible) {
          next.set(SPR_CONSOLIDATED_FLOW_QUERY, SPR_CONSOLIDATED_FLOW.sacDisponible);
          next.set(SPR_CONSOLIDATED_DEMO_FASE_QUERY, SPR_CONSOLIDATED_DEMO_FIRMAS_COMPLETAS_FASE);
        } else {
          next.set(SPR_CONSOLIDATED_FLOW_QUERY, SPR_CONSOLIDATED_FLOW.firmasCompletas);
          next.delete(SPR_CONSOLIDATED_DEMO_FASE_QUERY);
        }
        next.set('tab', 'firma');
        next.delete('modal');
        return next;
      },
      { replace: true },
    );
  };

  function handleTabChange(tabId: SprConsolidatedTabId) {
    setActiveTab(tabId);
    if (isCicloCompleto) {
      patchSearchParams((next) => {
        next.set('tab', tabId);
      });
    }
  }

  const openFirmaGerenteModal = () => {
    setFirmaModalOpen(false);
    setFirmaGerenteModalOpen(true);
  };

  return (
    <div className="flex h-[calc(100vh-56px)] w-full flex-col overflow-hidden bg-[#f7f7f7]">
      <div className="shrink-0 border-b border-[#e3e3e3] bg-white px-[22px] pb-[0] pt-[14px]">
        <div className="flex items-start justify-between gap-[12px] pb-[14px]">
          {timelineSteps.map((step, index) => (
            <div key={step.id} className="relative flex min-w-0 flex-1 flex-col items-center">
              {index < timelineSteps.length - 1 ? (
                <div
                  aria-hidden
                  className={`absolute left-[calc(50%+20px)] top-[15px] h-[2px] w-[calc(100%-40px)] ${timelineConnectorClass(step.status)}`}
                />
              ) : null}
              <div
                className={`relative z-[1] flex size-[32px] items-center justify-center rounded-full ${timelineDotClass(step.status)}`}
              >
                <span className="font-['Inter:Bold',sans-serif] text-[11px] font-bold">{index + 1}</span>
              </div>
              <p
                className={`mt-[8px] whitespace-pre-line text-center font-['Inter',sans-serif] text-[9px] leading-[12px] ${timelineTitleClass(step.status)}`}
              >
                {step.title}
              </p>
              <span
                className={`mt-[6px] rounded-[4px] px-[6px] py-[1px] font-['Inter:Bold',sans-serif] text-[9px] font-bold ${timelineBadgeClass(step.status)}`}
              >
                {step.badge}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-[2px]">
          {statusTabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`relative flex min-w-0 flex-1 items-center justify-between gap-[8px] px-[16px] py-[10px] ${
                  isActive ? 'text-[#001e39]' : 'text-[#646464]'
                }`}
              >
                <p className="truncate font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold">{tab.label}</p>
                <span
                  className={`shrink-0 rounded-[8px] px-[6px] py-[1px] font-['Inter:Bold',sans-serif] text-[9px] font-bold ${tabBadgeClass(tab.badgeTone)}`}
                >
                  {tab.badge}
                </span>
                {isActive ? (
                  <span
                    aria-hidden
                    className={`absolute inset-x-0 bottom-0 h-[3px] rounded-t-[2px] ${
                      (isValidacionDiscrepanciaPostFirma || isSacReabierto) && tab.id === 'validacion'
                        ? 'bg-[#e8a4b8]'
                        : 'bg-[#c8a064]'
                    }`}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={
          isSacPreparing
            ? 'flex min-h-0 flex-1 flex-col overflow-y-auto'
            : 'min-h-0 flex-1 overflow-y-auto px-[22px] py-[18px]'
        }
      >
        {isSacPreparing ? <SacPreparingPanel /> : null}
        {!isSacPreparing && activeTab === 'consolidado' && isConsolidadoParcial ? (
          <ConsolidadoEnviadoPanel variant="detalle-7-8" />
        ) : null}
        {!isSacPreparing && activeTab === 'consolidado' && isPostEnvio && !isConsolidadoParcial ? (
          isCicloCerrado ? (
            <CicloCerradoConsolidadoPanel defaultAreaDetailOpen={consolidadoAreaDetailOpen} />
          ) : (
            <ConsolidadoEnviadoPanel
              variant={isValidacionAprobada ? 'validacion-aprobada' : 'enviado'}
              defaultAreaDetailOpen={consolidadoAreaDetailOpen}
            />
          )
        ) : null}
        {!isSacPreparing && activeTab === 'consolidado' && !isPostEnvio && !isConsolidadoParcial ? (
          <ConsolidadoTablePanel />
        ) : null}
        {!isSacPreparing && activeTab === 'sac' && isValidacionAprobada ? <ValidacionAprobadaSacPanel /> : null}
        {!isSacPreparing && activeTab === 'sac' && isCicloCerrado ? <SacReportPanel /> : null}
        {!isSacPreparing && activeTab === 'sac' && isSacReabierto ? <SacReabiertoReportPanel /> : null}
        {!isSacPreparing && activeTab === 'sac' && isPostEnvio && !isSacReabierto && !isCicloCompleto ? (
          <SacReportPanel />
        ) : null}
        {!isSacPreparing && activeTab === 'sac' && !isPostEnvio && !isSacReabierto ? <SacPendingPanel /> : null}
        {!isSacPreparing && activeTab === 'firma' && isValidacionDiscrepancia ? (
          <FirmaGerenteReadyPanel onOpenFirmaModal={() => setFirmaGerenteModalOpen(true)} />
        ) : null}
        {!isSacPreparing && activeTab === 'firma' && isValidacionAprobada ? <ValidacionAprobadaFirmaPanel /> : null}
        {!isSacPreparing && activeTab === 'firma' && isCicloCerrado ? <CicloCerradoFirmaPanel /> : null}
        {!isSacPreparing && activeTab === 'firma' && showFirmasCompletasPanel ? (
          <FirmasCompletasPanel />
        ) : null}
        {!isSacPreparing && activeTab === 'firma' && isFirmaGerente ? (
          <FirmaGerenteReadyPanel onOpenFirmaModal={() => setFirmaGerenteModalOpen(true)} />
        ) : null}
        {!isSacPreparing && activeTab === 'firma' && (isConsolidadoEnviado || isSacDisponible) && !showFirmasCompletasPanel ? (
          <FirmaReadyPanel onOpenFirmaModal={() => setFirmaModalOpen(true)} />
        ) : null}
        {!isSacPreparing && activeTab === 'firma' && isSacReabierto && isFirmaListaProcesoReabierto ? (
          <FirmaReadyPanel onOpenFirmaModal={() => setFirmaModalOpen(true)} />
        ) : null}
        {!isSacPreparing && activeTab === 'firma' && isSacReabierto && !isFirmaListaProcesoReabierto ? (
          <FirmaSacUpdatePendingPanel />
        ) : null}
        {!isSacPreparing && activeTab === 'firma' && !isPostEnvio && !isSacReabierto ? (
          <FirmaPendingPanel />
        ) : null}
        {!isSacPreparing && activeTab === 'validacion' && (showValidationDiscrepancy || isSacReabierto) ? (
          <SprConsolidatedValidationDiscrepancy
            variant={isSacReabierto ? 'awaitingCorrection' : 'requiresReview'}
            showDetail={showValidationDiscrepancyDetail}
            reopenModalOpen={reopenModalOpen}
            onOpenDetail={openValidationDetail}
            onCloseDetail={closeValidationDetail}
            onOpenReopenModal={openReopenModal}
            onCloseReopenModal={closeReopenModal}
          />
        ) : null}
        {!isSacPreparing && activeTab === 'validacion' && isSacDisponibleFirmasCompletas ? (
          <SacDisponibleValidationPanel />
        ) : null}
        {!isSacPreparing && activeTab === 'validacion' && isValidacionAprobada ? (
          <SprConsolidatedValidationApproved defaultExpandedRowId={kpiDiscrepancyExpandedId} />
        ) : null}
        {!isSacPreparing && activeTab === 'validacion' && isCicloCerrado ? (
          <CicloCerradoValidacionPanel defaultExpandedRowId={kpiDiscrepancyExpandedId} />
        ) : null}
        {!isSacPreparing &&
        activeTab === 'validacion' &&
        !showValidationDiscrepancy &&
        !isSacReabierto &&
        !isSacDisponibleFirmasCompletas &&
        !isCicloCompleto ? (
          <ValidationPendingPanel />
        ) : null}
      </div>

      <SprCycleIncompleteModal open={cycleIncompleteModalOpen} onClose={closeCycleIncompleteModal} />
      <SprCycleClosedModal open={cycleClosedModalOpen} onClose={closeCycleClosedModal} />

      <FirmaEspecialistaModal
        open={firmaModalOpen}
        initiallySigned={firmaModalInitiallySigned}
        onClose={() => setFirmaModalOpen(false)}
        onConfirmed={
          isConsolidadoEnviado || isSacDisponible ? openFirmaGerenteModal : undefined
        }
      />
      <FirmaGerenteModal
        open={firmaGerenteModalOpen}
        initiallySigned={firmaGerenteModalInitiallySigned}
        onClose={() => setFirmaGerenteModalOpen(false)}
        onConfirmed={goToFirmasCompletas}
      />
    </div>
  );
}
