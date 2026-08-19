import { InspectionAnswerValue, type InspectionChecklistItem, type InspectionFindingSeverityResponse } from '@aurelia/contracts';

export type AssistantChecklistRow = InspectionChecklistItem & { index: number; sectionTitle: string };

export function ChipRow({ chips, selected, onSelect, variant = 'gold' }: { chips: string[]; selected?: string | null; onSelect: (label: string) => void; variant?: 'gold' | 'navy' }) {
  return (
    <div className="mb-[10px] ml-[33px] flex flex-wrap gap-[8px]">
      {chips.map((chip) => {
        const active = selected === chip;
        const activeClass = variant === 'navy' ? 'border-[#052B63] bg-[#052B63] text-white' : 'border-[#C8A064] bg-[#C8A064] text-[#052B63]';
        return <button key={chip} type="button" onClick={() => onSelect(chip)} className={`rounded-full border-[1.5px] px-[12px] py-[6px] text-[11px] font-semibold ${active ? activeClass : 'border-[#D1D1D1] bg-white text-[#646464]'}`}>{chip}</button>;
      })}
    </div>
  );
}

export function QuickOpts({ options, selected, onSelect }: { options: Array<{ value: string; label: string; icon?: string }>; selected?: string | null; onSelect: (value: string) => void }) {
  return (
    <div className="mb-[10px] ml-[33px] flex flex-wrap gap-[6px]">
      {options.map((option) => {
        const active = selected === option.value || selected === option.label;
        const prefix = option.icon === 'check' ? '✓ ' : option.icon === 'plus' ? '+ ' : option.icon === 'list' ? '☰ ' : '';
        return <button key={option.value} type="button" onClick={() => onSelect(option.value)} className={`rounded-[9999px] border-[1.5px] px-[14px] py-[7px] text-[12px] font-semibold ${active ? 'border-[#002659] bg-[#002659] text-white' : 'border-[#D1D1D1] bg-white text-[#24588B]'}`}>{prefix}{option.label}</button>;
      })}
    </div>
  );
}

export function QuestionCard({ row, selected, resolved, onAnswer }: { row: AssistantChecklistRow; selected?: InspectionAnswerValue; resolved: boolean; onAnswer: (value: InspectionAnswerValue) => void }) {
  const options = [{ value: InspectionAnswerValue.COMPLIANT, label: 'SÍ' }, { value: InspectionAnswerValue.NOT_COMPLIANT, label: 'NO' }, { value: InspectionAnswerValue.NOT_APPLICABLE, label: 'N/A' }];
  return <div className="mb-[10px] ml-[33px] mr-[12px] overflow-hidden rounded-[12px] border border-[#E3E3E3] bg-white"><div className="flex items-center justify-between gap-[8px] bg-[#002659] px-[12px] py-[7px] text-white"><p className="min-w-0 flex-1 truncate text-[12px] font-bold">{row.sectionTitle}</p><p className="text-[11px] font-bold">{row.code}</p></div><div className="p-[12px]"><div className="flex items-start gap-[8px]"><span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#001E39] text-[11px] font-bold text-white">{row.index + 1}</span><p className="flex-1 text-[13px] font-semibold leading-[19px] text-[#131313]">{row.question}</p></div>{row.guidance ? <p className="mt-[8px] text-[11px] leading-[16px] text-[#646464]">{row.guidance}</p> : null}<div className="mt-[10px] flex gap-[8px]">{options.map((option) => { const active = selected === option.value; return <button key={option.value} type="button" disabled={resolved || Boolean(selected)} onClick={() => onAnswer(option.value)} className={`h-[36px] flex-1 rounded-full border-[1.5px] text-[13px] font-bold ${active ? 'border-[#002659] bg-[#002659] text-white' : 'border-[#D1D1D1] bg-white text-[#24588B] disabled:opacity-45'}`}>{option.label}</button>; })}</div></div></div>;
}

export function CriticalityCard({ severities, resolved, onSelect }: { severities: InspectionFindingSeverityResponse[]; resolved: boolean; onSelect: (severity: InspectionFindingSeverityResponse) => void }) {
  return <div className="mb-[10px] ml-[33px] mr-[12px] rounded-[12px] border border-[#E3E3E3] bg-white p-[12px]"><p className="text-[14px] font-bold text-[#131313]">Criticidad</p><div className="mt-[8px] grid gap-[8px]">{severities.slice().sort((left, right) => left.sortOrder - right.sortOrder).map((severity) => <button key={severity.id} type="button" disabled={resolved} onClick={() => onSelect(severity)} className="rounded-[10px] border border-[#E3E3E3] bg-[#F6FAFF] px-[12px] py-[10px] text-left disabled:opacity-50"><span className="block text-[13px] font-bold text-[#131313]">{severity.name}</span><span className="mt-[2px] block text-[11px] leading-[15px] text-[#646464]">{severity.description ?? 'Sin descripción'}</span></button>)}</div></div>;
}
