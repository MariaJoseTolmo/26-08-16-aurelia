import { useMemo } from 'react';
import type { SprCycleValidationResponse } from '@aurelia/contracts';
import { SPR_CONSOLIDATED_REPORT } from '../spr.constants';
import {
  buildSoxValidationSlots,
  type SprSoxValidationSlot,
} from '../sprConsolidatedValidationLayout';

type OrgArea = { id: string; code: string; name: string };

function slotBadgeClass(statusLabel: SprSoxValidationSlot['statusLabel']): string {
  if (statusLabel === 'Aprobado') return 'bg-[#e0ffd3] text-[#2a5c16]';
  if (statusLabel === 'Discrepancia') return 'bg-[#ffd0db] text-[#570b1d]';
  if (statusLabel === 'Reabierto') return 'bg-[#ffeab8] text-[#8e6e3e]';
  return 'bg-[#ffeab8] text-[#8e6e3e]';
}

/**
 * Tab Validación — consolidado solo lectura (Fase 5 supervisión).
 * Acciones Aprobar/Discrepancia viven en Mi formulario del Responsable SOX.
 */
export function SprSoxValidationPanel({
  areas,
  validations,
}: {
  cycleId?: string;
  areas: OrgArea[] | null | undefined;
  validations: SprCycleValidationResponse[];
}) {
  const copy = SPR_CONSOLIDATED_REPORT.validationAwaitingSox;
  const slots = useMemo(() => buildSoxValidationSlots(areas, validations), [areas, validations]);
  const decidedCount = slots.filter((slot) => slot.validation).length;

  return (
    <>
      <div className="mb-[14px] flex items-start gap-[9px] rounded-[8px] border border-[#f0d080] bg-[#ffeab8] px-[15px] py-[11px]">
        <span className="mt-px text-[12px] text-[#463100]" aria-hidden>
          i
        </span>
        <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#463100]">
          {copy.infoBanner ??
            'Las áreas SOX (Servicios técnicos y Optimización de activos) deben confirmar los valores del reporte o reportar una discrepancia.'}
        </p>
      </div>

      <section className="overflow-hidden rounded-[9px] border border-[#e3e3e3] bg-white">
        <div className="flex items-center justify-between gap-[12px] bg-[#001e39] px-[16px] py-[11px]">
          <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-white">
            {copy.cardTitle ?? 'Validación SOX del Reporte SPR'}
          </p>
          <span className="rounded-[5px] border border-white/15 bg-white/10 px-[8px] py-[3px] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-white/50">
            {decidedCount}/{slots.length} áreas
          </span>
        </div>

        <div className="flex flex-col gap-[12px] p-[16px]">
          <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#646464]">
            {copy.body}
          </p>

          {slots.map((slot) => (
            <div
              key={slot.code}
              className="overflow-hidden rounded-[9px] border border-[#e3e3e3] bg-[#f9fafb]"
            >
              <div className="flex items-center gap-[10px] px-[14px] py-[10px]">
                <p className="min-w-0 flex-1 font-['Inter:Bold',sans-serif] text-[11.5px] font-bold text-[#001e39]">
                  {slot.name}
                </p>
                <span
                  className={`rounded-[5px] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[10px] font-bold ${slotBadgeClass(slot.statusLabel)}`}
                >
                  {slot.statusLabel}
                </span>
              </div>

              <div className="flex flex-col gap-[8px] px-[14px] pb-[14px]">
                {slot.validation ? (
                  <>
                    <p className="font-['Inter:Regular',sans-serif] text-[10.5px] text-[#646464]">
                      Decidido por{' '}
                      <span className="font-semibold text-[#131313]">
                        {slot.validation.actorFullName ?? 'Responsable de área'}
                      </span>
                      {slot.validation.decidedAt
                        ? ` · ${slot.validation.decidedAt.slice(0, 10)}`
                        : ''}
                    </p>
                    {slot.validation.comments ? (
                      <p className="rounded-[8px] border border-[#e3e3e3] bg-white px-[12px] py-[10px] font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#131313]">
                        {slot.validation.comments}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
                    {slot.areaId
                      ? 'A la espera del Responsable de esta área SOX.'
                      : 'Área SOX no encontrada en el catálogo.'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
