import { useState } from 'react';
import { SprCycleValidationDecision } from '@aurelia/contracts';
import { useCreateSprCycleValidation } from '../../../shared/hooks/useSprCycleValidations';

type DecisionMode = 'approved' | 'discrepancy_reported';

/**
 * Modal de decisión SOX (área completa) — POST /spr/cycles/:id/validations.
 * Usado desde Mi formulario del Responsable (no desde consolidado).
 */
export function SprSoxValidationDecisionModal({
  open,
  cycleId,
  areaId,
  areaName,
  onClose,
  onSuccess,
}: {
  open: boolean;
  cycleId: string;
  areaId: string;
  areaName: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const createValidation = useCreateSprCycleValidation(cycleId);
  const [mode, setMode] = useState<DecisionMode | null>(null);
  const [comments, setComments] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!open) return null;

  function resetAndClose() {
    setMode(null);
    setComments('');
    setErrorMessage(null);
    onClose();
  }

  async function confirmDecision() {
    if (!mode) return;
    if (mode === 'discrepancy_reported' && !comments.trim()) {
      setErrorMessage('Debes explicar la discrepancia antes de confirmar.');
      return;
    }
    setErrorMessage(null);
    try {
      await createValidation.mutateAsync({
        areaId,
        decision:
          mode === 'approved'
            ? SprCycleValidationDecision.APPROVED
            : SprCycleValidationDecision.DISCREPANCY_REPORTED,
        comments: mode === 'discrepancy_reported' ? comments.trim() : null,
      });
      setMode(null);
      setComments('');
      onSuccess?.();
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo registrar la validación SOX',
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(19,19,19,0.75)] p-[16px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="spr-sox-validation-title"
        className="w-full max-w-[440px] rounded-[12px] bg-white p-[24px] shadow-[0px_20px_30px_rgba(0,0,0,0.25)]"
      >
        {!mode ? (
          <>
            <p
              id="spr-sox-validation-title"
              className="font-['Inter:Bold',sans-serif] text-[15px] font-bold text-[#001e39]"
            >
              Validación de KPIs — {areaName}
            </p>
            <p className="pt-[6px] font-['Inter:Regular',sans-serif] text-[11px] leading-[16.5px] text-[#646464]">
              Confirma que los KPIs calculados del reporte SPR para tu área son correctos, o reporta
              una discrepancia.
            </p>
            <div className="flex flex-wrap gap-[8px] pt-[16px]">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setMode('approved');
                }}
                className="flex h-[34px] items-center rounded-[7px] bg-[#00b398] px-[14px] font-['Inter:Bold',sans-serif] text-[12px] font-bold text-white"
              >
                Aprobar
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setComments('');
                  setMode('discrepancy_reported');
                }}
                className="flex h-[34px] items-center rounded-[7px] border border-[#e8a4b8] bg-[#fff5f7] px-[14px] font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#570b1d]"
              >
                Reportar discrepancia
              </button>
            </div>
            <div className="flex justify-end pt-[16px]">
              <button
                type="button"
                onClick={resetAndClose}
                className="flex h-[34px] items-center rounded-[7px] border border-[#e3e3e3] bg-white px-[17px] font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#646464]"
              >
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <>
            <p
              id="spr-sox-validation-title"
              className="font-['Inter:Bold',sans-serif] text-[15px] font-bold text-[#001e39]"
            >
              {mode === 'approved'
                ? `Aprobar validación — ${areaName}`
                : `Reportar discrepancia — ${areaName}`}
            </p>
            <p className="pt-[6px] font-['Inter:Regular',sans-serif] text-[11px] leading-[16.5px] text-[#646464]">
              {mode === 'approved'
                ? 'Confirmas que los valores calculados del reporte SPR para tu área son correctos.'
                : 'Explica qué no cuadra con tu base de datos. El Especialista podrá reabrir el proceso solo para esta área.'}
            </p>

            {mode === 'discrepancy_reported' ? (
              <label className="mt-[14px] block">
                <span className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#131313]">
                  Explicación
                </span>
                <textarea
                  value={comments}
                  onChange={(event) => setComments(event.target.value)}
                  rows={4}
                  className="mt-[6px] w-full rounded-[8px] border border-[#e3e3e3] bg-[#f9fafb] px-[12px] py-[10px] font-['Inter:Regular',sans-serif] text-[12px] text-[#131313]"
                  placeholder="Ej.: Esperaba un valor cercano a…"
                />
              </label>
            ) : null}

            {errorMessage ? (
              <p className="pt-[12px] font-['Inter:Regular',sans-serif] text-[11px] text-[#b42318]" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-[10px] pt-[16px]">
              <button
                type="button"
                disabled={createValidation.isPending}
                onClick={() => {
                  setMode(null);
                  setComments('');
                  setErrorMessage(null);
                }}
                className="flex h-[34px] items-center rounded-[7px] border border-[#e3e3e3] bg-white px-[17px] font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#646464]"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={createValidation.isPending}
                onClick={() => void confirmDecision()}
                className="flex h-[34px] items-center rounded-[7px] bg-[#c8a064] px-[16px] font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#001e39] disabled:opacity-50"
              >
                {createValidation.isPending ? 'Guardando…' : 'Confirmar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
