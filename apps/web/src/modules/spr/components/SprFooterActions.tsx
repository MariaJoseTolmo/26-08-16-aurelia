import { SprFooterInfoIcon, SprSaveDraftIcon, SprSubmitIcon } from '../icons/SprIcons';
import { SPR_CORRECTION_MODE } from '../spr.constants';
import { SPR_HISTORICAL_RANGE_COPY } from '../sprHistoricalRange';

interface SprFooterActionsProps {
  remainingCount: number;
  missingDeviationNoteCount?: number;
  unsavedDeviationNoteCount?: number;
  canSubmit: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  saveErrorMessage: string | null;
  correctionMode?: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
}

export function SprFooterActions({
  remainingCount,
  missingDeviationNoteCount = 0,
  unsavedDeviationNoteCount = 0,
  canSubmit,
  isSaving,
  isSubmitting,
  saveErrorMessage,
  correctionMode = false,
  onSaveDraft,
  onSubmit,
}: SprFooterActionsProps) {
  const statusMessage = saveErrorMessage
    ? saveErrorMessage
    : remainingCount > 0
      ? `Completa los ${remainingCount} parámetros restantes para poder firmar y enviar`
      : missingDeviationNoteCount > 0
        ? SPR_HISTORICAL_RANGE_COPY.submitBlockedByNotes
        : unsavedDeviationNoteCount > 0
          ? 'Guarda el borrador de los parámetros con desviación para poder firmar y enviar'
          : correctionMode
            ? SPR_CORRECTION_MODE.footerReadyMessage
            : 'Todos los parámetros están completos. Ya puedes firmar y enviar.';

  const submitEnabled = canSubmit && !isSubmitting;

  return (
    <div className="flex flex-wrap items-center justify-between gap-[10px] border-t border-[#e3e3e3] bg-white px-[22px] py-[12px]">
      <div className="flex items-center gap-[6px]">
        <SprFooterInfoIcon className="h-[11px] w-[13.75px] shrink-0 text-[#646464]" />
        <p className={`font-['Inter:Regular',sans-serif] text-[11px] ${saveErrorMessage ? 'text-[#bd3b5b]' : 'text-[#646464]'}`}>
          {statusMessage}
        </p>
      </div>
      <div className="flex items-center gap-[10px]">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSaving}
          className="flex h-[36px] items-center gap-[6px] rounded-[8px] border-[1.5px] border-[#e3e3e3] bg-white px-[19.5px] font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#646464] transition-colors hover:bg-[#fafafa] disabled:opacity-50"
        >
          <SprSaveDraftIcon className="h-[12px] w-[15px] shrink-0 text-[#646464]" />
          {isSaving ? 'Guardando…' : 'Guardar borrador'}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!submitEnabled}
          className={`flex h-[36px] items-center gap-[6px] rounded-[8px] px-[22px] font-['Inter:Bold',sans-serif] text-[12px] font-bold transition-colors ${
            submitEnabled
              ? correctionMode
                ? 'bg-[#c8a064] text-[#001e39] hover:bg-[#b89158]'
                : 'bg-[#00b398] text-white hover:bg-[#009e86]'
              : 'cursor-not-allowed bg-[#e3e3e3] text-[#acacac]'
          }`}
        >
          <SprSubmitIcon
            className={`h-[13px] w-[16.25px] shrink-0 ${
              submitEnabled ? (correctionMode ? 'text-[#001e39]' : 'text-white') : 'text-[#acacac]'
            }`}
          />
          {isSubmitting ? 'Enviando…' : 'Firmar y enviar'}
        </button>
      </div>
    </div>
  );
}
