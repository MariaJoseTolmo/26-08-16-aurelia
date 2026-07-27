import { useEffect, useState } from 'react';
import { InspectionAnswerValue, InspectionType } from '@aurelia/contracts';
import { useSessionStore } from '../../../../shared/stores/session.store';
import { useNewInspectionDraftStore } from '../state/newInspectionDraft.store';

interface SavedStepProps {
  onClose: () => void;
  onCreateAnother: () => void;
}

function useOnlineStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
    }

    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}

function OfflineIcon() {
  return <svg width="13" height="11" viewBox="0 0 13 11" fill="none" aria-hidden="true"><path d="m1 1 11 9M2.2 4.1c2.5-1.8 5.8-1.8 8.3 0M4.5 6.1c1.2-.7 2.7-.7 3.9 0" stroke="#C8A064" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}

function CheckIcon() {
  return <svg width="35" height="28" viewBox="0 0 35 28" fill="none" aria-hidden="true"><path d="m4 14.6 8.4 8.4L31 4" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function PlusIcon() {
  return <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true"><path d="M9 2v10M4 7h10" stroke="#001E39" strokeWidth="2" strokeLinecap="round" /></svg>;
}

export function SavedStep({ onClose, onCreateAnother }: SavedStepProps) {
  const user = useSessionStore((state) => state.user);
  const online = useOnlineStatus();
  const draft = useNewInspectionDraftStore();
  const isFinding = draft.inspectionType === InspectionType.ENVIRONMENTAL;
  const checklistFindings = Object.values(draft.answersByItemId).filter((value) => value === InspectionAnswerValue.NOT_COMPLIANT).length;
  const findingObservations = draft.findingObservations.filter((item) => item.saved).length;
  const count = isFinding ? findingObservations : checklistFindings;
  const countLabel = isFinding
    ? `${count} observación${count === 1 ? '' : 'es'}`
    : `${count} hallazgo${count === 1 ? '' : 's'}`;
  const showOfflineBanner = !online || !user;

  return (
    <>
      <div className="h-[56px] shrink-0 bg-[#002659] text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
        <div className="flex h-full items-center gap-[4px] px-[4px]">
          <div className="min-w-0 flex-1 px-[4px]">
            <p className="truncate text-[14px] font-semibold leading-[17px] text-white">Guardado</p>
            <p className="mt-[1px] truncate text-[11px] leading-[14px] text-[rgba(255,255,255,0.55)]">SGA · Gold Fields Salares Norte</p>
          </div>
          <div className="pr-[4px]"><div className="flex h-[20px] w-[56px] items-center justify-center rounded-[16px] bg-[#C8A064]"><span className="text-[10px] font-bold leading-none text-[#001E39]">GF HSE</span></div></div>
        </div>
      </div>

      {showOfflineBanner ? <div className="flex h-[23px] shrink-0 items-center gap-[7px] border-b border-[#C8A064] bg-[#2A1A04] px-[16px] pb-[6px] pt-[5px]"><OfflineIcon /><span className="text-[11px] font-semibold leading-none text-[#C8A064]">Sin red · guardando localmente</span></div> : null}

      <div className="shrink-0 border-b border-[#E3E3E3] bg-white px-[14px] pb-[9px] pt-[10px]"><div className="h-[2px] w-full overflow-hidden rounded-[2px] bg-[#E3E3E3]"><div className="h-[2px] w-full rounded-[2px] bg-gradient-to-r from-[#8E6E3E] to-[#C8A064]" /></div></div>

      <div className="flex-1 overflow-hidden bg-[#F7F7F7] px-[14px] pt-[14px]">
        <div className="flex h-full w-full flex-col items-center justify-center gap-[12px] p-[24px] text-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#3A9B3A]"><CheckIcon /></div>
          <p className="text-[18px] font-bold leading-none text-[#3A9B3A]">Inspección guardada</p>
          <p className="max-w-[260px] text-center text-[13px] leading-[19.5px] text-[#646464]">Guardada con {countLabel}. La EECC asignada será notificada.</p>
          <button type="button" onClick={onCreateAnother} className="mt-[8px] flex h-[50px] w-[280px] items-center justify-center gap-[8px] rounded-[14px] bg-[#C8A064] text-[14px] font-bold text-[#001E39]"><PlusIcon />Nueva inspección</button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-[40px] w-[280px] items-center justify-center rounded-[8px] border border-[#C8A064] bg-white px-[16px] py-[8px] text-[14px] font-bold leading-[22.7px] tracking-[0.28px] text-[#C8A064]"
          >
            Salir
          </button>
        </div>
      </div>

      <div className="shrink-0 border-t border-[#E3E3E3] bg-white pt-px"><div className="h-[18px] w-full" /><div className="flex h-[20px] w-full items-center justify-center"><div className="h-[4px] w-[120px] rounded-[2px] bg-[#D1D1D1]" /></div></div>
    </>
  );
}
