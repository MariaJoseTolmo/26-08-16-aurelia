import { SprHistoricalRangeAlert } from './SprHistoricalRangeAlert';
import { SprSoxShieldIcon } from '../icons/SprIcons';
import { SPR_ACTIVE_CYCLE, SPR_AREA_REVIEW, SPR_DATA_SOURCE_OPTIONS } from '../spr.constants';
import type { SprAreaReviewContext } from '../sprAreaReview';
import { formatSprRecordEntryDateTime } from '../sprAreaReview';
import type { SprParameterRow } from '../spr.types';

interface SprAreaReviewParameterDetailProps {
  row: SprParameterRow | null;
  reviewContext: SprAreaReviewContext;
}

function DetailTableRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between border-b border-[#f4f6f9] px-[12px] py-[8px] last:border-b-0">
      <p className="font-['Inter:Medium',sans-serif] text-[10px] font-medium text-[#646464]">{label}</p>
      <div className="max-w-[65%] text-right font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#131313]">
        {value}
      </div>
    </div>
  );
}

// Panel derecho de revision del gerente (Figma 1399:13951).
export function SprAreaReviewParameterDetail({ row, reviewContext }: SprAreaReviewParameterDetailProps) {
  if (!row) {
    return (
      <div className="flex h-full items-center justify-center px-[22px] py-[40px]">
        <p className="font-['Inter:Regular',sans-serif] text-[13px] text-[#646464]">
          Selecciona un parámetro para revisar su detalle.
        </p>
      </div>
    );
  }

  const { parameter, record, unitSymbol, valueLabel, needsHistoricalReview, historicalRange } = row;
  const note = record?.notes?.trim();
  const showHistoricalAlert = needsHistoricalReview && historicalRange?.isOutOfRange;
  const dataSource = SPR_DATA_SOURCE_OPTIONS[0] ?? SPR_AREA_REVIEW.dataSourcePlaceholder;
  const entryDateTime = formatSprRecordEntryDateTime(record);
  const parameterSubtitle = [
    parameter.description ?? 'Sin descripción',
    parameter.isSox ? `Control SOX: ${parameter.code}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex flex-col gap-[16px] px-[24px] py-[20px]">
      <div className="flex flex-col gap-[2px]">
        <p className="font-['Inter:Semi_Bold',sans-serif] text-[9.5px] font-semibold text-[#acacac]">Parámetro seleccionado</p>
        <h2 className="font-['Inter:Bold',sans-serif] text-[17px] font-bold text-[#001e39]">{parameter.name}</h2>
        <p className="font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">{parameterSubtitle}</p>
      </div>

      <div className="flex flex-col gap-[5px]">
        <p className="font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.72px] text-[#acacac]">
          Valor reportado
        </p>
        <div className="flex flex-wrap items-end gap-[8px]">
          <p className="font-['Inter:Bold',sans-serif] text-[24px] font-bold text-[#131313]">{valueLabel}</p>
          <p className="pb-[2px] font-['Inter:Medium',sans-serif] text-[11px] font-medium text-[#646464]">· {dataSource}</p>
        </div>
      </div>

      {showHistoricalAlert && historicalRange ? (
        <SprHistoricalRangeAlert historicalRange={historicalRange} unitSymbol={unitSymbol} variant="review" />
      ) : null}

      {note ? (
        <div className="flex flex-col gap-[8px]">
          <p className="border-b border-[#ebebeb] pb-[7px] font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.72px] text-[#acacac]">
            {SPR_AREA_REVIEW.responsibleNoteSectionTitle}
          </p>
          <div className="rounded-[8px] border border-[rgba(36,88,139,0.18)] bg-[#e6f3ff] px-[15px] py-[13px]">
            {showHistoricalAlert ? (
              <p className="font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.54px] text-[#0d3862]">
                {SPR_AREA_REVIEW.justificationHeader}
              </p>
            ) : null}
            <p
              className={`font-['Inter:Italic',sans-serif] text-[11px] italic leading-[17px] text-[#24588b] ${showHistoricalAlert ? 'pt-[5px]' : ''}`}
            >
              &quot;{note}&quot;
            </p>
            <p className="pt-[5px] font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
              {reviewContext.responsibleLabel} · {reviewContext.signedDateTimeLabel}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-[8px]">
        <p className="border-b border-[#ebebeb] pb-[7px] font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.72px] text-[#acacac]">
          Detalle del dato
        </p>
        <div className="overflow-hidden rounded-[8px] border border-[#e3e3e3] bg-white">
          <DetailTableRow label="Fuente declarada" value={dataSource} />
          <DetailTableRow label="Período reportado" value={SPR_ACTIVE_CYCLE.label} />
          <DetailTableRow
            label="Control SOX"
            value={
              parameter.isSox ? (
                <span className="inline-flex rounded-[4px] bg-[#ffeab8] px-[7px] py-px font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#8e6e3e]">
                  {parameter.code}
                </span>
              ) : (
                'No aplica'
              )
            }
          />
          <DetailTableRow label="Fecha de ingreso" value={entryDateTime} />
        </div>
      </div>

      <div className="flex flex-col gap-[8px]">
        <p className="border-b border-[#ebebeb] pb-[7px] font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.72px] text-[#acacac]">
          Firmado por
        </p>
        <div className="flex items-center gap-[10px] rounded-[8px] border border-[#e3e3e3] bg-[#f9fafb] px-[13px] py-[11px]">
          <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[15px] bg-[#e6f3ff]">
            <span className="font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#0d3862]">
              {reviewContext.responsibleInitials || 'RA'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-['Inter:Bold',sans-serif] text-[11.5px] font-bold text-[#131313]">
              {reviewContext.responsibleLabel}
            </p>
            <p className="pt-px font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
              Responsable de Área · {reviewContext.signedDateTimeLabel}
            </p>
          </div>
          <span className="shrink-0 rounded-[4px] bg-[#e0ffd3] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#2a5c16]">
            Firmado ✓
          </span>
        </div>
      </div>

      {parameter.isSox ? (
        <div className="flex items-start gap-[8px] rounded-[8px] border border-[#f0d080] bg-[#fff8e1] px-[14px] py-[11px]">
          <SprSoxShieldIcon className="mt-px size-[16px] shrink-0 text-[#8e6e3e]" />
          <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#5c3c00]">
            Al aprobar este formulario, AurelIA generará automáticamente la evidencia SOX{' '}
            <span className="font-['Inter:Bold',sans-serif] font-bold">{parameter.code}</span> para firma del Gerente MA.
            Esta evidencia incluirá el valor reportado y la alerta de desviación como antecedente.
          </p>
        </div>
      ) : null}
    </div>
  );
}
