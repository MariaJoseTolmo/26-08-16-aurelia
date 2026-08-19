import { SPR_FORM_ESTIMATES_MODE } from '../sprFormCycles';
import { SPR_FORM_FLOW_COPY } from '../sprFormFlow.constants';
import { SPR_HISTORICAL_RANGE_COPY } from '../sprHistoricalRange';
import { SprHistoricalRangeAlert } from './SprHistoricalRangeAlert';
import { SprInfoCircleIcon, SprSoxShieldIcon } from '../icons/SprIcons';
import type { SprParameterFormEntry } from '../state/sprMonthlyForm.store';
import type { SprParameterRow } from '../spr.types';

interface SprParameterDetailFormProps {
  row: SprParameterRow | null;
  entry: SprParameterFormEntry;
  dataSources: readonly string[];
  onValueChange: (value: string) => void;
  onNotApplicableChange: (value: boolean) => void;
  onSourceChange: (value: string) => void;
  onNoteChange: (value: string) => void;
}

function FieldLabel({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className={`font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#131313]`}>
      {children}
      {required ? <span className="text-[#bd3b5b]"> *</span> : null}
    </p>
  );
}

export function SprParameterDetailForm({
  row,
  entry,
  dataSources,
  onValueChange,
  onNotApplicableChange,
  onSourceChange,
  onNoteChange,
}: SprParameterDetailFormProps) {
  if (!row) {
    return (
      <div className="flex h-full items-center justify-center px-[22px] py-[40px]">
        <p className="font-['Inter:Regular',sans-serif] text-[13px] text-[#646464]">Selecciona un parámetro para ingresar su valor.</p>
      </div>
    );
  }

  const { parameter, unitSymbol, needsHistoricalReview, historicalRange, isEstimated } = row;
  const showHistoricalAlert = needsHistoricalReview && historicalRange?.isOutOfRange && !isEstimated;
  const requiresValueAndSource = !entry.notApplicable;

  return (
    <div className="flex flex-col gap-[14px] px-[22px] py-[18px]">
      <div className="flex flex-col gap-[2px]">
        <p className="font-['Inter:Semi_Bold',sans-serif] text-[9.5px] font-semibold text-[#acacac]">Parámetro seleccionado</p>
        <div className="flex flex-wrap items-center gap-[8px]">
          <h2 className="font-['Inter:Bold',sans-serif] text-[17px] font-bold text-[#001e39]">{parameter.name}</h2>
          {isEstimated ? (
            <span className="rounded-[3px] border border-[#c9aeff] bg-[#f3eeff] px-[6px] py-[2px] font-['Inter:Bold',sans-serif] text-[8.5px] font-bold text-[#7b4fbf]">
              {SPR_FORM_ESTIMATES_MODE.detailBadgeLabel}
            </span>
          ) : null}
        </div>
        <p className="font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
          {parameter.description ?? 'Sin descripción'}
          {parameter.isSox ? ` · Control SOX: ${parameter.code}` : ''}
        </p>
      </div>

      <div className="flex flex-col gap-[5px]">
        <FieldLabel required={requiresValueAndSource}>Valor reportado</FieldLabel>
        <div className="flex items-center gap-[8px]">
          <input
            type="text"
            inputMode="decimal"
            value={entry.value}
            disabled={entry.notApplicable}
            onChange={(event) => onValueChange(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            placeholder="0"
            className={`h-[38px] flex-1 rounded-[8px] border-[1.5px] px-[13.5px] font-['Inter:Semi_Bold',sans-serif] text-[13px] font-semibold text-[#131313] outline-none disabled:bg-[#f2f2f2] disabled:text-[#acacac] ${
              showHistoricalAlert
                ? 'border-[#e8720c] bg-[#fff7f3] focus:border-[#e8720c]'
                : isEstimated
                  ? 'border-[#c9aeff] bg-[#faf7ff] focus:border-[#7b4fbf]'
                  : 'border-[#d1d1d1] bg-[#e6f3ff] focus:border-[#24588b]'
            }`}
          />
          {unitSymbol ? <span className="min-w-[40px] font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#646464]">{unitSymbol}</span> : null}
        </div>
        <p className="font-['Inter:Regular',sans-serif] text-[10px] text-[#acacac]">
          Ingresa el valor numérico según la unidad de medida del parámetro
        </p>
      </div>

      {showHistoricalAlert && historicalRange ? (
        <SprHistoricalRangeAlert historicalRange={historicalRange} unitSymbol={unitSymbol} />
      ) : null}

      {/* PLACEHOLDER: flag "Sin consumo / No aplica" sin campo dedicado en backend */}
      <label className="flex items-center gap-[8px] rounded-[8px] border border-[#e3e3e3] bg-[#f7f7f7] px-[13px] py-[10px]">
        <input
          type="checkbox"
          checked={entry.notApplicable}
          onChange={(event) => onNotApplicableChange(event.target.checked)}
          className="size-[16px] shrink-0 rounded-[4px] border-[1.5px] border-[#d1d1d1]"
        />
        <span className="flex flex-col">
          <span className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#646464]">
            Sin consumo / No aplica en este período
          </span>
          <span className="font-['Inter:Regular',sans-serif] text-[9.5px] text-[#acacac]">
            {SPR_FORM_FLOW_COPY.noAplicaHelper}
          </span>
        </span>
      </label>

      {/* PLACEHOLDER: "Fuente del dato" sin persistencia en backend. Oculta si No aplica (Figma 2606:5127). */}
      {requiresValueAndSource ? (
        <div className="flex flex-col gap-[5px]">
          <FieldLabel required>Fuente del dato</FieldLabel>
          <select
            value={entry.source}
            onChange={(event) => onSourceChange(event.target.value)}
            className="h-[36px] w-full rounded-[8px] border-[1.5px] border-[#d1d1d1] bg-white px-[11px] font-['Inter:Regular',sans-serif] text-[12px] text-[#131313] outline-none focus:border-[#24588b]"
          >
            <option value="">Selecciona una fuente…</option>
            {dataSources.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex flex-col gap-[5px]">
        {showHistoricalAlert ? (
          <p className="font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#131313]">
            Notas para el gerente de área <span className="text-[#bd3b5b]">*</span>{' '}
            <span className="text-[#e8720c]">— Explica el motivo de la diferencia</span>
          </p>
        ) : (
          <FieldLabel>{SPR_FORM_FLOW_COPY.notesLabel}</FieldLabel>
        )}
        <textarea
          value={entry.note}
          onChange={(event) => onNoteChange(event.target.value)}
          rows={3}
          required={showHistoricalAlert}
          aria-required={showHistoricalAlert}
          placeholder={
            showHistoricalAlert
              ? "Explica por qué el valor difiere del promedio histórico. Ej: 'En mayo se activó el pozo norte por mayor demanda operacional...'"
              : SPR_FORM_FLOW_COPY.notesPlaceholder
          }
          className={`w-full resize-none rounded-[8px] border-[1.5px] px-[13.5px] py-[10.5px] font-['Inter:Regular',sans-serif] text-[12px] text-[#131313] outline-none ${showHistoricalAlert ? 'border-[#e8720c] bg-[#fffaf5] focus:border-[#e8720c]' : 'border-[#d1d1d1] bg-white focus:border-[#24588b]'}`}
        />
        {showHistoricalAlert ? (
          <div className="flex items-center gap-[5px]">
            <SprInfoCircleIcon className="h-[9px] w-[11.25px] shrink-0 text-[#e8720c]" />
            <p className="font-['Inter:Regular',sans-serif] text-[10px] text-[#e8720c]">
              {SPR_HISTORICAL_RANGE_COPY.notesRequiredHint}
            </p>
          </div>
        ) : null}
      </div>

      {parameter.isSox ? (
        <div className="flex items-start gap-[8px] rounded-[8px] border border-[#f0d080] bg-[#fff8e1] px-[14px] py-[11px]">
          <SprSoxShieldIcon className="mt-[1px] size-[16px] shrink-0 text-[#5c3c00]" />
          <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#5c3c00]">
            Este parámetro está asociado al control SOX <span className="font-bold">{parameter.code}</span>. Una vez que el
            Gerente de Área apruebe el formulario, AurelIA generará automáticamente la evidencia SOX correspondiente para
            firma del Gerente MA.
          </p>
        </div>
      ) : null}
    </div>
  );
}
