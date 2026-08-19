import { InspectionAnswerValue, InspectionType } from '@aurelia/contracts';
import { useNewInspectionDraftStore } from '../state/newInspectionDraft.store';
import type { AssistantChecklistRow } from './assistant-chat-options';

function answerLabel(value?: InspectionAnswerValue) {
  if (value === InspectionAnswerValue.COMPLIANT) return 'SÍ';
  if (value === InspectionAnswerValue.NOT_COMPLIANT) return 'NO';
  if (value === InspectionAnswerValue.NOT_APPLICABLE) return 'N/A';
  return 'Pendiente';
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex border-b border-[#E3E3E3] px-[12px] py-[8px]"><span className="w-[96px] text-[12px] text-[#646464]">{label}</span><span className="flex-1 text-[12px] font-bold text-[#131313]">{value || '—'}</span></div>;
}

export function SummaryCard({ rows, onSave, saving, errorMessage, saveLabel }: { rows: AssistantChecklistRow[]; onSave: () => void; saving: boolean; errorMessage: string | null; saveLabel: string }) {
  const state = useNewInspectionDraftStore();
  const noCount = rows.filter((row) => state.answersByItemId[row.id] === InspectionAnswerValue.NOT_COMPLIANT).length;

  return (
    <div className="mb-[10px] ml-[33px] mr-[12px] grid gap-[10px]">
      <div className="overflow-hidden rounded-[12px] border border-[#E3E3E3] bg-white">
        <div className="flex items-center justify-between bg-[#002659] px-[12px] py-[7px] text-white">
          <p className="text-[12px] font-bold">Datos generales</p>
          <span className="rounded bg-[#DDF7F3] px-[6px] py-[2px] text-[9px] font-bold text-[#006153]">{state.inspectionType === InspectionType.ENVIRONMENTAL ? 'Hallazgo' : 'Checklist'}</span>
        </div>
        <SummaryRow label="Inspector" value={state.inspectorName} />
        <SummaryRow label="Área · Sector" value={[state.areaName, state.sectorName].filter(Boolean).join(' · ')} />
        <SummaryRow label="Fecha" value={state.inspectionDate} />
        <SummaryRow label="Ubicación" value={state.locationLabel} />
        <SummaryRow label="Registro" value={state.findingTypeLabel ?? state.templateName ?? '—'} />
        <SummaryRow label="Empresa EECC" value={state.findingCompanyName ?? (noCount ? 'Pendiente' : 'No aplica')} />
        <SummaryRow label="Responsables" value={state.findingResponsibleIds.length ? `${state.findingResponsibleIds.length} seleccionados` : '—'} />
      </div>
      {state.inspectionType !== InspectionType.ENVIRONMENTAL ? (
        <div className="overflow-hidden rounded-[12px] border border-[#E3E3E3] bg-white">
          <div className="bg-[#002659] px-[12px] py-[7px] text-white"><p className="text-[12px] font-bold">{rows.length} Ítems · {noCount} hallazgos</p></div>
          <div className="grid gap-[6px] p-[12px]">{rows.map((row) => <div key={row.id} className="flex justify-between gap-[8px] text-[12px]"><span className="flex-1 text-[#131313]">{row.index + 1}. {row.code}</span><span className="font-bold text-[#002659]">{answerLabel(state.answersByItemId[row.id])}</span></div>)}</div>
        </div>
      ) : null}
      {errorMessage ? <p className="rounded-[8px] bg-[#FFD4E0] px-[10px] py-[8px] text-[12px] font-semibold text-[#7A0E23]">{errorMessage}</p> : null}
      <button type="button" onClick={onSave} disabled={saving} className="h-[48px] rounded-[14px] bg-[#35A137] text-[15px] font-bold text-white disabled:opacity-70">{saving ? 'Guardando…' : saveLabel}</button>
    </div>
  );
}
