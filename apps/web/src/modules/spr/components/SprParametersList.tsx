import type { SprParameterCompletion, SprParameterRow } from '../spr.types';
import { SPR_FORM_ESTIMATES_MODE } from '../sprFormCycles';

interface SprParametersListProps {
  rows: SprParameterRow[];
  selectedParameterId: string | null;
  isLoading: boolean;
  isError: boolean;
  onSelect: (parameterId: string) => void;
  title?: string;
  listVariant?: 'entry' | 'review';
}

function StatusDot({
  completion,
  needsHistoricalReview,
  isEstimated,
}: {
  completion: SprParameterCompletion;
  needsHistoricalReview: boolean;
  isEstimated: boolean;
}) {
  if (isEstimated) {
    return <span className="mt-[4px] size-[8px] shrink-0 rounded-[4px] border-[1.5px] border-[#7b4fbf] bg-[#7b4fbf]" aria-hidden />;
  }
  if (needsHistoricalReview) {
    return <span className="mt-[4px] size-[8px] shrink-0 rounded-[4px] bg-[#00b398]" aria-hidden />;
  }
  if (completion === 'completed') return <span className="mt-[4px] size-[8px] shrink-0 rounded-full bg-[#00b398]" aria-hidden />;
  if (completion === 'not-applicable') return <span className="mt-[4px] size-[8px] shrink-0 rounded-full bg-[#e8a820]" aria-hidden />;
  return <span className="mt-[4px] size-[8px] shrink-0 rounded-full border-[1.5px] border-[#c4c4c4] bg-white" aria-hidden />;
}

function SoxBadge({ isSox, needsHistoricalReview }: { isSox: boolean; needsHistoricalReview: boolean }) {
  if (isSox) {
    if (needsHistoricalReview) {
      return <span className="shrink-0 rounded-[3px] bg-[#ffeab8] px-[5px] py-px font-['Inter:Bold',sans-serif] text-[8px] font-bold text-[#8e6e3e]">SOX</span>;
    }
    return <span className="shrink-0 rounded-[4px] bg-[#eef2f7] px-[6px] py-[2px] font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#24588b]">SOX</span>;
  }
  return <span className="shrink-0 rounded-[4px] bg-[#f2f2f2] px-[6px] py-[2px] font-['Inter:Semi_Bold',sans-serif] text-[9px] font-semibold text-[#8a8a8a]">No SOX</span>;
}

function EstimatedBadge() {
  return (
    <span className="flex shrink-0 items-center gap-[3px] rounded-[3px] border border-[#c9aeff] bg-[#f3eeff] px-[6px] py-[2px] font-['Inter:Bold',sans-serif] text-[8.5px] font-bold text-[#7b4fbf]">
      {SPR_FORM_ESTIMATES_MODE.listBadgeLabel}
    </span>
  );
}

function AlertBadge() {
  return (
    <span className="flex size-[15px] shrink-0 items-center justify-center rounded-[7.5px] bg-[#e8720c] font-['Inter:Bold',sans-serif] text-[8px] font-bold text-white" aria-hidden>
      !
    </span>
  );
}

function getRowButtonClass(
  selected: boolean,
  needsHistoricalReview: boolean,
  isEstimated: boolean,
  listVariant: 'entry' | 'review',
) {
  if (listVariant === 'review' && selected) return 'border-[#24588b] bg-[#f6faff]';
  if (selected && isEstimated) return 'border-[#c8a064] bg-[#f6faff]';
  if (selected && needsHistoricalReview) return 'border-[#c8a064] bg-[#f6faff]';
  if (selected) return 'border-[#00b398] bg-[#f0fbf8]';
  if (isEstimated) return 'border-transparent bg-transparent hover:bg-[#fafafa]';
  return 'border-[#e9e9e9] bg-white hover:bg-[#fafafa]';
}

function getValueLabelClass(
  completion: SprParameterCompletion,
  needsHistoricalReview: boolean,
  isEstimated: boolean,
) {
  if (isEstimated) return 'text-[#7b4fbf]';
  if (needsHistoricalReview) return 'text-[#e8720c] font-semibold';
  if (completion === 'pending') return 'text-[#acacac]';
  return 'text-[#646464]';
}

export function SprParametersList({
  rows,
  selectedParameterId,
  isLoading,
  isError,
  onSelect,
  title = 'Parámetros a completar',
  listVariant = 'entry',
}: SprParametersListProps) {
  return (
    <div className="flex flex-col">
      <p className="px-[12px] pb-[4px] pt-[14px] font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.63px] text-[#acacac]">
        {title}
      </p>

      {isLoading ? (
        <p className="px-[12px] py-[16px] font-['Inter:Regular',sans-serif] text-[12px] text-[#646464]">Cargando parámetros...</p>
      ) : isError ? (
        <p className="px-[12px] py-[16px] font-['Inter:Regular',sans-serif] text-[12px] text-[#570b1d]">No fue posible cargar los parámetros.</p>
      ) : rows.length === 0 ? (
        <p className="px-[12px] py-[16px] font-['Inter:Regular',sans-serif] text-[12px] text-[#646464]">No hay parámetros asignados para este período.</p>
      ) : (
        <ul className="flex flex-col gap-[2px] px-[12px] pb-[8px]">
          {rows.map((row, index) => {
            const selected = row.parameter.id === selectedParameterId;
            const { needsHistoricalReview, isEstimated } = row;
            const displayValue = needsHistoricalReview && !isEstimated ? `⚠ ${row.valueLabel} · Revisar` : row.valueLabel;
            const orderPrefix = listVariant === 'review' ? `${String(index + 1).padStart(2, '0')} ` : '';

            return (
              <li key={row.parameter.id}>
                <button
                  type="button"
                  onClick={() => onSelect(row.parameter.id)}
                  className={`flex w-full items-start gap-[9px] rounded-[8px] border px-[9px] py-[9px] text-left transition-colors ${getRowButtonClass(selected, needsHistoricalReview, isEstimated, listVariant)}`}
                >
                  <StatusDot
                    completion={row.completion}
                    needsHistoricalReview={needsHistoricalReview}
                    isEstimated={isEstimated}
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#131313]">
                      {orderPrefix}
                      {row.parameter.name}
                    </span>
                    <span
                      className={`truncate font-['Inter:Regular',sans-serif] text-[10px] ${getValueLabelClass(row.completion, needsHistoricalReview, isEstimated)}`}
                    >
                      {displayValue}
                    </span>
                  </span>
                  {isEstimated ? <EstimatedBadge /> : null}
                  {!isEstimated && needsHistoricalReview ? <AlertBadge /> : null}
                  {!isEstimated ? (
                    <SoxBadge isSox={row.parameter.isSox} needsHistoricalReview={needsHistoricalReview} />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
