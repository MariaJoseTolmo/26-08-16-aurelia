import {
  InspectionAnswerValue,
  type InspectionDetailChecklistItemResponse,
  type InspectionDetailChecklistResultResponse,
} from '@aurelia/contracts';

function answerLabel(value: string | null | undefined) {
  if (value === InspectionAnswerValue.COMPLIANT) return 'SÍ';
  if (value === InspectionAnswerValue.NOT_COMPLIANT) return 'NO';
  if (value === InspectionAnswerValue.NOT_APPLICABLE) return 'N/A';
  if (value === InspectionAnswerValue.PARTIAL) return 'PARCIAL';
  if (value === InspectionAnswerValue.NOT_OBSERVED) return 'N/O';
  return '—';
}

function answerTone(value: string | null | undefined) {
  if (value === InspectionAnswerValue.NOT_COMPLIANT) return 'bg-[#ffd0db] text-[#570b1d]';
  if (value === InspectionAnswerValue.PARTIAL) return 'bg-[#ffeab8] text-[#463100]';
  if (value === InspectionAnswerValue.NOT_APPLICABLE || value === InspectionAnswerValue.NOT_OBSERVED) {
    return 'bg-[#f7f7f7] text-[#646464]';
  }
  if (value === InspectionAnswerValue.COMPLIANT) return 'bg-[#e0ffd3] text-[#2a5c16]';
  return 'bg-[#f1f1f1] text-[#8a8a8a]';
}

function SummaryMetric({ value, label, tone, last = false }: { value: number; label: string; tone: string; last?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-[2px] ${last ? '' : 'border-r border-[#e3e3e3]'}`}>
      <p className={`text-[18px] font-bold leading-[22px] ${tone}`}>{value}</p>
      <p className={`text-[11px] font-normal leading-[13px] ${tone}`}>{label}</p>
    </div>
  );
}

function ResultItem({ item, index, last }: { item: InspectionDetailChecklistItemResponse; index: number; last: boolean }) {
  const value = item.answer?.value ?? null;
  const isNo = value === InspectionAnswerValue.NOT_COMPLIANT;
  const comment = item.answer?.text ?? item.answer?.notes ?? '';
  return (
    <div className={`${isNo ? 'bg-[#ffd0db]' : 'bg-white'} ${last ? '' : 'border-b border-[#e3e3e3]'}`}>
      <div className="flex gap-[10px] px-[12px] py-[9px]">
        <p className={`shrink-0 pt-px text-[10px] font-bold leading-none ${isNo ? 'text-[#bd3b5b]' : 'text-[#acacac]'}`}>{index + 1}</p>
        <div className="min-w-0 flex-1">
          <p className={`text-[12px] leading-[16.8px] ${isNo ? 'font-semibold text-[#570b1d]' : 'font-normal text-[#333]'}`}>{item.question}</p>
          {comment.trim() ? <p className="pt-[8px] text-[12px] font-semibold leading-[16.8px] text-[#333]">Comentario:<br />{comment}</p> : null}
        </div>
        <span className={`inline-flex min-h-[16px] shrink-0 items-center rounded-[6px] px-[8px] py-[2px] text-[10px] font-bold leading-none ${answerTone(value)}`}>
          {answerLabel(value)}
        </span>
      </div>
    </div>
  );
}

export function InspectionChecklistResultPanel({ result }: { result: InspectionDetailChecklistResultResponse | null }) {
  if (!result) {
    return <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-white px-[24px]"><p className="text-center text-[12px] font-semibold leading-[18px] text-[#646464]">No hay resultado de checklist disponible.</p></div>;
  }

  const items = result.sections.flatMap((section) => section.items);
  const neutral = result.summary.notApplicable + result.summary.notObserved + result.summary.unanswered;
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white">
      <div className="flex h-[70px] items-start border-b border-[#e3e3e3] bg-white px-[14px] pb-[13px] pt-[12px]">
        <SummaryMetric value={result.summary.compliant} label="✓ SÍ" tone="text-[#2a5c16]" />
        <SummaryMetric value={result.summary.notCompliant} label="× NO" tone="text-[#570b1d]" />
        <SummaryMetric value={neutral} label="N/A" tone="text-[#646464]" last />
      </div>
      <div className="py-[20px]">
        <div className="flex items-center gap-[6px] px-[14px]">
          <span aria-hidden="true" className="text-[13px] text-[#24588b]">☷</span>
          <p className="text-[11px] font-bold uppercase leading-none tracking-[0.55px] text-[#646464]">Detalle ítem a ítem</p>
        </div>
        <div className="pt-[10px]">
          <div className="border-y border-[#e3e3e3] bg-white">
            {items.length ? items.map((item, index) => <ResultItem key={item.checklistItemId} item={item} index={index} last={index === items.length - 1} />) : <div className="flex min-h-[120px] items-center justify-center px-[24px]"><p className="text-center text-[12px] font-semibold leading-[18px] text-[#646464]">No hay ítems de checklist para mostrar.</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
