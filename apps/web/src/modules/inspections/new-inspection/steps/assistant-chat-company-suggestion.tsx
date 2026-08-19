import type { CompanyResponse } from '@aurelia/contracts';

function normalizeText(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function CompanySuggestionCard({ company, suggestion, fallback, accepted, onAccept, onOther }: { company: CompanyResponse; suggestion: string; fallback: boolean; accepted: boolean; onAccept: () => void; onOther: () => void }) {
  return (
    <div className="mb-[10px] ml-[33px] mr-[12px] rounded-[14px] border border-[#D8E0EA] bg-white p-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between gap-[8px]">
        <p className="text-[12px] font-bold text-[#002659]">Empresa responsable sugerida</p>
        {fallback ? <span className="rounded-full bg-[#FFF4DA] px-[8px] py-[3px] text-[10px] font-bold text-[#8E6E3E]">Base</span> : <span className="rounded-full bg-[#DDF7F3] px-[8px] py-[3px] text-[10px] font-bold text-[#006153]">IA</span>}
      </div>
      <p className="mt-[8px] text-[15px] font-bold leading-[20px] text-[#131313]">{company.name}</p>
      {suggestion && normalizeText(suggestion) !== normalizeText(company.name) ? <p className="mt-[5px] text-[11px] leading-[16px] text-[#646464]">Sugerencia IA: {suggestion}</p> : null}
      <div className="mt-[10px] flex gap-[8px]">
        <button type="button" disabled={accepted} onClick={onAccept} className="h-[38px] flex-1 rounded-[10px] bg-[#35A137] text-[12px] font-bold text-white disabled:opacity-50">Confirmar empresa</button>
        <button type="button" disabled={accepted} onClick={onOther} className="h-[38px] flex-1 rounded-[10px] border border-[#C8A064] bg-white text-[12px] font-bold text-[#8E6E3E] disabled:opacity-50">Elegir otra</button>
      </div>
    </div>
  );
}
