import { useState } from 'react';
import type { InspectionDetailFindingItemResponse } from '@aurelia/contracts';
import { FindingAssistantExecutionView } from './FindingAssistantExecutionView';
import { FindingManualExecutionView } from './FindingManualExecutionView';

function BackIcon() {
  return <svg width="23" height="19" viewBox="0 0 23 19" fill="none" aria-hidden="true"><path d="M9.5 1.75 1.75 9.5l7.75 7.75M2.5 9.5h18.75" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function AiChipIcon() {
  return <svg width="28" height="24" viewBox="0 0 28 24" fill="none" aria-hidden="true"><rect x="7" y="5" width="14" height="14" rx="2.5" stroke="white" strokeWidth="2" /><path d="M3 8h4M3 12h4M3 16h4M21 8h4M21 12h4M21 16h4M10 1v4M14 1v4M18 1v4M10 19v4M14 19v4M18 19v4" stroke="white" strokeWidth="2" strokeLinecap="round" /><path d="M10.8 15.2 13 8.8h2l2.2 6.4M11.6 13.3h4.8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function SparkIcon() {
  return <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true"><path d="M6.5 1.5 7.8 5l3.4 1.3-3.4 1.3-1.3 3.5-1.3-3.5-3.4-1.3L5.2 5 6.5 1.5ZM13.5 0l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1Z" fill="#001E39" /></svg>;
}

function ManualIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="6.5" y="4" width="11" height="16" rx="2" fill="#646464" /><rect x="9" y="7" width="6" height="2" rx="1" fill="#F4F6F9" /><rect x="9" y="11" width="6" height="1.6" rx="0.8" fill="#F4F6F9" /><rect x="9" y="14.5" width="6" height="1.6" rx="0.8" fill="#F4F6F9" /></svg>;
}

function FeatureRow({ children }: { children: string }) {
  return <div className="flex items-center gap-[5px]"><span className="text-[13px] leading-none text-[#2A5C16]">✓</span><span className="text-[11px] leading-[15px] text-[#2A5C16]">{children}</span></div>;
}

type FindingExecutionModeViewProps = {
  subtitle: string;
  inspectionLabel?: string;
  item?: InspectionDetailFindingItemResponse | null;
  index?: number;
  isSubmitting?: boolean;
  onBack: () => void;
  onStartAssistant: () => void;
  onStartManual: (description: string, file: File) => void | Promise<void>;
  onCancel: () => void;
};

export function FindingExecutionModeView(props: FindingExecutionModeViewProps) {
  const { subtitle, inspectionLabel, item = null, index = 1, isSubmitting = false, onBack, onStartManual, onCancel } = props;
  const rejectedFlow = item?.statusGroup === 'rejected';
  const [manualOpen, setManualOpen] = useState(rejectedFlow);
  const [assistantOpen, setAssistantOpen] = useState(false);

  if (manualOpen) return <FindingManualExecutionView subtitle={subtitle} item={item} index={index} isSubmitting={isSubmitting} onBack={rejectedFlow ? onBack : () => setManualOpen(false)} onCancel={onCancel} onSubmit={onStartManual} />;
  if (assistantOpen) return <FindingAssistantExecutionView subtitle={subtitle} inspectionLabel={inspectionLabel} item={item} index={index} isSubmitting={isSubmitting} onBack={() => setAssistantOpen(false)} onCancel={onCancel} />;

  return (
    <div className="absolute inset-0 z-30 flex flex-col overflow-hidden bg-[#F4F6F9]">
      <div className="h-[56px] shrink-0 bg-[#002659] text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
        <div className="flex h-full items-center gap-[4px] px-[4px]">
          <button type="button" onClick={onBack} className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full text-[rgba(255,255,255,0.92)]" aria-label="Volver"><BackIcon /></button>
          <div className="min-w-0 flex-1 px-[4px]"><p className="truncate text-[14px] font-semibold leading-[17px] text-white">Hallazgo</p><p className="mt-[1px] truncate text-[11px] leading-[14px] text-[rgba(255,255,255,0.55)]">{subtitle}</p></div>
          <div className="h-0 w-[48px] shrink-0" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#F4F6F9] px-[20px] py-[24px]">
        <div className="pb-[4px] pt-[8px] text-center"><p className="mx-auto max-w-[320px] text-[18px] font-bold leading-[23.4px] text-[#131313]">¿Cómo deseas ejecutar este hallazgo?</p><p className="mt-[6px] whitespace-nowrap text-[13px] leading-[18.2px] text-[#646464]">Puedes usar el asistente IA o el formulario manual</p></div>

        <div className="mt-[20px] w-full rounded-[16px] border-[2px] border-[#C8A064] bg-white p-[22px] shadow-[0_4px_8px_rgba(200,160,100,0.2)]">
          <div className="flex items-center gap-[12px]"><div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#C8A064] to-[#8E6E3E]"><AiChipIcon /></div><div className="min-w-0 flex-1"><p className="text-[15px] font-bold leading-[17px] text-[#8E6E3E]">Asistente AurelIA</p><p className="mt-[2px] text-[11px] leading-[13px] text-[#646464]">Modo conversacional con IA</p></div><div className="rounded-[4px] bg-[#C8A064] px-[8px] py-[3px]"><span className="text-[9px] font-bold leading-none text-[#001E39]">RECOMENDADO</span></div></div>
          <p className="mt-[12px] text-[12px] leading-[19.2px] text-[#333]">El asistente te guía con preguntas simples, propone acción correctiva basada en el historial de la faena y reduce el tiempo de registro.</p>
          <div className="mt-[12px] flex flex-col gap-[5px]"><FeatureRow>Acción correctiva sugerida por IA</FeatureRow><FeatureRow>Funciona online y offline</FeatureRow></div>
          <button type="button" onClick={() => setAssistantOpen(true)} className="mt-[14px] flex h-[46px] w-full items-center justify-center gap-[8px] rounded-[12px] bg-[#C8A064] text-[14px] font-bold text-[#001E39]" disabled={isSubmitting}><SparkIcon />Iniciar con asistente</button>
        </div>

        <div className="mt-[20px] rounded-[16px] border-[1.5px] border-[#E3E3E3] bg-white p-[21.5px]">
          <div className="flex items-center gap-[12px]"><div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[12px] border border-[#E3E3E3] bg-[#F4F6F9]"><ManualIcon /></div><div className="min-w-0 flex-1"><p className="text-[15px] font-bold leading-[17px] text-[#131313]">Formulario manual</p><p className="mt-[2px] text-[11px] leading-[14px] text-[#646464]">Wizard de 5 pasos</p></div></div>
          <p className="mt-[10px] pb-[12px] text-[12px] leading-[18px] text-[#646464]">Completa el formulario paso a paso como siempre. Sin asistencia de IA.</p>
          <button type="button" onClick={() => setManualOpen(true)} className="h-[42px] w-full rounded-[12px] border-[2px] border-[#D1D1D1] bg-white text-[13px] font-semibold text-[#333]" disabled={isSubmitting}>Usar formulario manual</button>
        </div>
      </div>

      <div className="shrink-0 border-t border-[#E3E3E3] bg-white pb-[8px] pt-[10px]"><div className="px-[14px]"><button type="button" className="flex h-[50px] w-full items-center justify-center rounded-[14px] border-[2px] border-[#C8A064] bg-white px-[20px] text-center text-[14px] font-bold text-[#C8A064]" onClick={onCancel} disabled={isSubmitting}>Cancelar inspección</button></div><div className="mx-auto mb-[4px] mt-[12px] h-[4px] w-[120px] rounded-[2px] bg-[#D1D1D1]" /></div>
    </div>
  );
}
