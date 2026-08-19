import { useRef } from 'react';
import type { EvidenceResponse } from '@aurelia/contracts';
import { SprAttachDocumentIcon, SprExcelFileIcon, SprPdfFileIcon } from '../icons/SprIcons';
import { formatSprAttachmentSize, inferSprAttachmentType, validateSprAttachmentFile } from '../sprEvidence';

function FileTypeIcon({ fileName }: { fileName: string }) {
  if (inferSprAttachmentType(fileName) === 'pdf') {
    return <SprPdfFileIcon className="h-[11px] w-[13.75px] text-[#24588b]" />;
  }
  return <SprExcelFileIcon className="h-[11px] w-[13.75px] text-[#24588b]" />;
}

interface SprDocumentsSectionProps {
  recordId: string | null;
  requiresEvidence: boolean;
  evidences: EvidenceResponse[];
  isLoading: boolean;
  isUploading: boolean;
  uploadErrorMessage: string | null;
  onUpload: (file: File) => void;
  readOnly?: boolean;
}

export function SprDocumentsSection({
  recordId,
  requiresEvidence,
  evidences,
  isLoading,
  isUploading,
  uploadErrorMessage,
  onUpload,
  readOnly = false,
}: SprDocumentsSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handlePickFile() {
    inputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validationError = validateSprAttachmentFile(file);
    if (validationError) {
      window.alert(validationError);
      return;
    }

    onUpload(file);
  }

  const helperMessage = !recordId
    ? 'Guarda el borrador del parámetro seleccionado antes de adjuntar documentos.'
    : requiresEvidence
      ? 'Este parámetro requiere al menos un documento vinculado antes de firmar y enviar.'
      : 'Los documentos se vinculan al parámetro seleccionado.';

  return (
    <div className="flex flex-col px-[12px] pb-[14px]">
      <p className="pt-[12px] font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.72px] text-[#acacac]">
        Documentación adjunta
      </p>

      {isLoading ? (
        <p className="pt-[7px] font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">Cargando documentos…</p>
      ) : evidences.length > 0 ? (
        <ul className="flex w-full flex-col">
          {evidences.map((evidence, index) => {
            const fileName = evidence.title ?? 'Documento adjunto';
            return (
              <li key={evidence.id} className={`w-full ${index === 0 ? 'pt-[7px]' : 'pt-[4px]'}`}>
                <div className="flex w-full items-center gap-[7px] rounded-[6px] bg-[#f9fafb] px-[8px] py-[6px]">
                  <div className="flex size-[24px] shrink-0 items-center justify-center rounded-[5px] bg-[#e6f3ff]">
                    <FileTypeIcon fileName={fileName} />
                  </div>
                  <span className="min-w-0 flex-1 truncate font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#131313]">
                    {fileName}
                  </span>
                  <span className="shrink-0 font-['Inter:Regular',sans-serif] text-[9px] text-[#acacac]">Vinculado</span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="pt-[7px] font-['Inter:Regular',sans-serif] text-[10px] text-[#acacac]">Sin documentos adjuntos</p>
      )}

      {!readOnly ? (
        <>
          <div className="w-full pt-[4px]">
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.xlsx,.xls,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={handlePickFile}
              disabled={!recordId || isUploading}
              className="flex w-full flex-col items-start rounded-[7px] border-[1.5px] border-dashed border-[#d1d1d1] p-[11.5px] text-left transition-colors hover:border-[#acacac] hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SprAttachDocumentIcon className="h-[16px] w-[20px] shrink-0 text-[#acacac]" />
              <p className="w-full pt-[4px] text-center font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#646464]">
                {isUploading ? 'Adjuntando documento…' : 'Adjuntar documento'}
              </p>
              <p className="w-full pt-[2px] text-center font-['Inter:Regular',sans-serif] text-[9.5px] text-[#acacac]">
                PDF, Excel, Word · Máx. {formatSprAttachmentSize(10 * 1024 * 1024)}
              </p>
            </button>
          </div>

          <p className={`pt-[6px] font-['Inter:Regular',sans-serif] text-[9.5px] ${uploadErrorMessage ? 'text-[#bd3b5b]' : 'text-[#646464]'}`}>
            {uploadErrorMessage ?? helperMessage}
          </p>
        </>
      ) : null}
    </div>
  );
}
