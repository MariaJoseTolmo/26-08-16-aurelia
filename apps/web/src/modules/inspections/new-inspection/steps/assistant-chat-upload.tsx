import type { ChangeEvent } from 'react';
import type { NewInspectionPickedAsset } from '../state/newInspectionDraft.store';

export type AssistantUploadReceipt = { title: string; sub: string };

function fileToAsset(file: File): NewInspectionPickedAsset {
  return { name: file.name, file };
}

export function AssistantUploadWidget({ resolved, receipt, onCapture, onSkip }: { resolved: boolean; receipt?: AssistantUploadReceipt; onCapture: (asset: NewInspectionPickedAsset) => void; onSkip: () => void }) {
  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    onCapture(fileToAsset(file));
    event.target.value = '';
  }

  return (
    <div className="mb-[10px] ml-[33px] rounded-[12px] border border-[#E3E3E3] bg-white p-[12px]">
      {resolved && receipt ? (
        <div className="flex min-h-[58px] items-center gap-[10px] rounded-[10px] bg-[#35A137] px-[12px] py-[8px] text-white">
          <span className="flex h-[42px] w-[42px] items-center justify-center rounded-[8px] bg-[rgba(255,255,255,0.24)]">OK</span>
          <span className="min-w-0"><span className="block truncate text-[13px] font-bold">{receipt.title}</span><span className="block truncate text-[11px] text-[rgba(255,255,255,0.78)]">{receipt.sub}</span></span>
        </div>
      ) : (
        <div className="grid gap-[8px]">
          <label className="flex min-h-[84px] cursor-pointer items-center rounded-[10px] border-[1.5px] border-dashed border-[#D1D1D1] bg-[#F6FAFF] px-[12px] py-[10px]">
            <input type="file" className="hidden" accept="image/*" disabled={resolved} onChange={handleFile} />
            <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[8px] bg-white text-[12px] font-bold">IMG</span>
            <span className="ml-[10px] flex min-w-0 flex-col"><span className="truncate text-[13px] font-semibold text-[#646464]">Tomar foto o galería</span><span className="mt-[2px] text-[11px] text-[#B7B7B7]">Fecha, hora y ubicación automáticas</span></span>
          </label>
          <button type="button" className="h-[34px] rounded-[10px] border border-[#E3E3E3] text-[12px] font-bold text-[#646464]" onClick={onSkip}>Omitir</button>
        </div>
      )}
    </div>
  );
}

export const PhotoStepWidget = AssistantUploadWidget;
