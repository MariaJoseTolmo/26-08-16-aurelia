import { useState } from 'react';

export function SlaConfirmWidget({ initialDays, resolved, onSave }: { initialDays: number; resolved: boolean; onSave: (days: number) => void }) {
  const [days, setDays] = useState(String(initialDays));
  const numericDays = Number(days);
  const valid = Number.isFinite(numericDays) && numericDays > 0;
  return <div className="mb-[10px] ml-[33px] mr-[12px] rounded-[12px] border border-[#E3E3E3] bg-white p-[12px]"><p className="text-[13px] font-bold text-[#131313]">Confirma el SLA</p><div className="mt-[8px] flex items-center gap-[8px]"><input value={days} disabled={resolved} onChange={(event) => setDays(event.target.value)} className="h-[40px] w-[90px] rounded-[10px] border-[1.5px] border-[#D1D1D1] bg-[#F6FAFF] px-[10px] text-[13px] font-bold text-[#131313] outline-none" /><span className="text-[12px] text-[#646464]">días</span><button type="button" disabled={resolved || !valid} onClick={() => onSave(numericDays)} className="ml-auto h-[40px] rounded-[10px] bg-[#C8A064] px-[12px] text-[12px] font-bold text-white disabled:opacity-50">Guardar observación</button></div></div>;
}
