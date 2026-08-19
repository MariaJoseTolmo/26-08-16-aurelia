import { useEffect, useState } from 'react';

function MinusIcon() {
  return <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden="true"><path d="M2 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}

export function SlaReassignSheet({
  visible,
  calculatedLabel,
  pending,
  onClose,
  onApply,
}: {
  visible: boolean;
  calculatedLabel: string;
  pending: boolean;
  onClose: () => void;
  onApply: (days: number, reason: string) => Promise<void> | void;
}) {
  const [days, setDays] = useState(0);
  const [reason, setReason] = useState('');
  const canApply = days > 0 && reason.trim().length >= 3 && !pending;

  useEffect(() => {
    if (!visible) return;
    setDays(0);
    setReason('');
  }, [visible]);

  async function apply() {
    if (!canApply) return;
    await onApply(days, reason.trim());
  }

  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-[1200] flex items-end overflow-hidden bg-black/60" onClick={onClose}>
      <div
        className="w-full rounded-t-[16px] bg-white px-[14px] pb-[24px] pt-[12px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sla-reassign-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex w-full flex-col items-center pt-[10px]"><div className="h-[4px] w-[40px] rounded-[2px] bg-[#D1D1D1]" /></div>
        <p id="sla-reassign-title" className="mt-[24px] w-full text-[14px] font-bold leading-none text-[#131313]">Reasignar SLA</p>
        <div className="mt-[24px] flex items-center justify-between border-y border-[#E3E3E3] py-[12px]">
          <span className="text-[12px] font-medium leading-none text-[#646464]">SLA calculado</span>
          <span className="text-right text-[12px] font-bold leading-none text-[#131313]">{calculatedLabel}</span>
        </div>
        <div className="mt-[24px] w-full rounded-[10px] border border-[#E3E3E3] bg-white px-[9px] py-[13px] shadow-[0_1px_1.5px_rgba(0,0,0,0.06)]">
          <p className="text-[10px] font-bold uppercase leading-none tracking-[0.6px] text-[#646464]">Ingrese el nuevo SLA</p>
          <div className="mt-[8px] flex w-full items-end gap-[8px]">
            <button type="button" className="flex h-[50px] w-[52px] shrink-0 items-center justify-center rounded-[10px] border border-[#E3E3E3] bg-white text-[#646464] disabled:opacity-50" onClick={() => setDays((value) => Math.max(0, value - 1))} disabled={pending} aria-label="Disminuir SLA"><MinusIcon /></button>
            <div className="min-w-0 flex-1 pt-[6px]"><input type="number" min={0} max={365} value={days} onChange={(event) => setDays(Math.min(365, Math.max(0, Number(event.target.value) || 0)))} className="h-[50px] w-full rounded-[10px] border-[1.5px] border-[#D1D1D1] bg-[#F6FAFF] text-center text-[14px] font-medium text-[#131313] outline-none" aria-label="Nuevo SLA en días hábiles" disabled={pending} /></div>
            <button type="button" className="flex h-[50px] w-[52px] shrink-0 items-center justify-center rounded-[10px] border border-[#E3E3E3] bg-white text-[24px] font-light leading-none text-[#646464] disabled:opacity-50" onClick={() => setDays((value) => Math.min(365, value + 1))} disabled={pending} aria-label="Aumentar SLA">+</button>
          </div>
          <p className="mt-[2px] text-[11px] leading-[14.3px] text-[#ACACAC]">Este será el SLA final para esta observación</p>
          <label htmlFor="sla-reassign-reason" className="mt-[14px] block text-[12px] font-bold leading-[16px] text-[#131313]">Ingrese el motivo de la modificación</label>
          <textarea id="sla-reassign-reason" value={reason} onChange={(event) => setReason(event.target.value.slice(0, 1000))} placeholder="Escriba el motivo acá..." rows={4} disabled={pending} className="mt-[6px] min-h-[82px] w-full resize-none rounded-[10px] border-[1.5px] border-[#D1D1D1] bg-[#F6FAFF] px-[12px] py-[10px] text-[13px] leading-[18px] text-[#131313] outline-none placeholder:text-[#8A8A8A]" />
        </div>
        <div className="mt-[24px] flex w-full gap-[8px]">
          <button type="button" className="h-[44px] flex-1 rounded-[14px] border-2 border-[#C8A064] bg-white px-[20px] text-[13px] font-bold text-[#C8A064] disabled:opacity-50" onClick={onClose} disabled={pending}>Cancelar</button>
          <button type="button" className={`h-[44px] flex-1 rounded-[14px] px-[12px] text-[15px] font-bold shadow-[0_2px_5px_rgba(200,160,100,0.3)] ${canApply ? 'bg-[#C8A064] text-white' : 'bg-[#D1D1D1] text-[#ACACAC]'}`} onClick={() => { void apply(); }} disabled={!canApply}>{pending ? 'Guardando...' : 'Reasignar SLA'}</button>
        </div>
      </div>
    </div>
  );
}
