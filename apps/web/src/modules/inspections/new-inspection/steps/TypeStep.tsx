import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { InspectionType } from '@aurelia/contracts';
import { useSessionStore } from '../../../../shared/stores/session.store';
import { useNewInspectionDraftStore } from '../state/newInspectionDraft.store';
import { getInspectionTemplates } from '../../../../shared/services/inspections.service';

interface TypeStepProps {
  onBack: () => void;
  onNext: () => void;
}

type ManualTypeOption = {
  type: InspectionType;
  title: string;
  description: string;
};

function buildTypeOptions(templateCount: number | null, templatesLoading: boolean): ManualTypeOption[] {
  const templateText = templatesLoading
    ? 'Cargando plantillas · ítems NO generan hallazgo automático'
    : `${templateCount ?? 0} plantillas disponibles · ítems NO generan hallazgo automático`;

  return [
    {
      type: InspectionType.ENVIRONMENTAL,
      title: 'Hallazgo',
      description: 'Condición subestándar detectada · cada observación se registra individualmente con foto',
    },
    {
      type: InspectionType.REGULATORY,
      title: 'Checklist normativo',
      description: templateText,
    },
  ];
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

function BackIcon() {
  return (
    <svg width="23" height="19" viewBox="0 0 23 19" fill="none" aria-hidden="true">
      <path d="M9.5 1.75 1.75 9.5l7.75 7.75M2.5 9.5h18.75" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OfflineIcon() {
  return (
    <svg width="13" height="11" viewBox="0 0 13 11" fill="none" aria-hidden="true">
      <path d="m1 1 11 9M2.2 4.1c2.5-1.8 5.8-1.8 8.3 0M4.5 6.1c1.2-.7 2.7-.7 3.9 0" stroke="#C8A064" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
      <path d="M17 7H2M7.5 1.5 2 7l5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
      <path d="M1 7h15M10.5 1.5 16 7l-5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TypeIcon({ selected, optionType }: { selected: boolean; optionType: InspectionType }) {
  const fill = selected ? '#C8A064' : '#646464';
  const bg = selected ? '#FDF0DC' : '#F7F7F7';

  return (
    <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[8px]" style={{ backgroundColor: bg }}>
      <svg width="20" height="16" viewBox="0 0 20 16" fill="none" aria-hidden="true">
        {optionType === InspectionType.ENVIRONMENTAL ? (
          <>
            <rect x="2" y="2" width="16" height="12" rx="3" fill={fill} />
            <path d="m7 8 2 2.1L13.5 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : (
          <>
            <rect x="4" y="1.5" width="12" height="13" rx="2" fill={fill} />
            <path d="m7 8 1.8 1.8L13 5.8M7.5 12h5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </svg>
    </div>
  );
}

function ManualStepper() {
  const steps = [
    { label: 'Datos', complete: true, active: false },
    { label: 'Tipo', complete: false, active: true },
    { label: 'Obs.', complete: false, active: false },
    { label: 'Resumen', complete: false, active: false },
  ];

  return (
    <div className="shrink-0 border-b border-[#E3E3E3] bg-white px-[14px] pb-[9px] pt-[10px]">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <div key={step.label} className="relative h-[35px] w-[83px] shrink-0">
            {index < steps.length - 1 ? <div className={`absolute left-[33px] top-[11px] h-[2px] w-[73px] ${step.complete ? 'bg-[#C8A064]' : 'bg-[#D1D1D1]'}`} /> : null}
            <div className={`absolute left-[22.2px] top-0 flex h-[22px] w-[22px] items-center justify-center rounded-full text-[9px] font-bold ${step.complete ? 'border-[1.5px] border-[#C8A064] bg-[#C8A064] text-white' : step.active ? 'border-[2px] border-[#C8A064] bg-white text-[#C8A064]' : 'border-[1.5px] border-[#D1D1D1] bg-white text-[#ACACAC]'}`}>{step.complete ? '✓' : index + 1}</div>
            <p className={`absolute top-[25px] w-full text-center text-[8px] leading-[9.6px] ${step.complete || step.active ? 'font-semibold text-[#8E6E3E]' : 'text-[#ACACAC]'}`}>{step.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-[6px] h-[2px] w-full overflow-hidden rounded-[2px] bg-[#E3E3E3]">
        <div className="h-[2px] w-[83px] rounded-[2px] bg-gradient-to-r from-[#8E6E3E] to-[#C8A064]" />
      </div>
    </div>
  );
}

function TypeOptionCard({ option, selected, onPress }: { option: ManualTypeOption; selected: boolean; onPress: () => void }) {
  return (
    <button
      type="button"
      className={`flex min-h-[68px] w-full items-center gap-[12px] rounded-[12px] border-[1.5px] p-[15.5px] text-left shadow-[0_1px_1.5px_rgba(0,0,0,0.06)] ${
        selected ? 'border-[#C8A064] bg-[#FDF8F1]' : 'border-[#E3E3E3] bg-white'
      }`}
      onClick={onPress}
    >
      <TypeIcon selected={selected} optionType={option.type} />
      <div className="min-w-0 flex-1">
        <p className={`text-[14px] font-bold leading-[17px] ${selected ? 'text-[#8E6E3E]' : 'text-[#131313]'}`}>{option.title}</p>
        <p className="mt-[2px] text-[11px] leading-[14.3px] text-[#646464]">{option.description}</p>
      </div>
    </button>
  );
}

export function TypeStep({ onBack, onNext }: TypeStepProps) {
  const user = useSessionStore((state) => state.user);
  const online = useOnlineStatus();
  const draft = useNewInspectionDraftStore();
  const setInspectionType = useNewInspectionDraftStore((state) => state.setInspectionType);
  const templatesQuery = useQuery({
    queryKey: ['inspections', 'new-inspection', 'templates'],
    queryFn: getInspectionTemplates,
  });

  const templateCount = templatesQuery.data?.length ?? null;
  const typeOptions = useMemo(
    () => buildTypeOptions(templateCount, templatesQuery.isLoading),
    [templateCount, templatesQuery.isLoading],
  );
  const canContinue = Boolean(draft.inspectionType);
  const showOfflineBanner = !online || !user;

  function selectType(option: ManualTypeOption) {
    setInspectionType(option.type, option.title);
  }

  function handleNext() {
    if (!canContinue) return;
    onNext();
  }

  return (
    <>
      <div className="h-[56px] shrink-0 bg-[#002659] text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
        <div className="flex h-full items-center gap-[4px] px-[4px]">
          <button type="button" className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full text-[rgba(255,255,255,0.92)]" onClick={onBack} aria-label="Atrás">
            <BackIcon />
          </button>
          <div className="min-w-0 flex-1 px-[4px]">
            <p className="truncate text-[14px] font-semibold leading-[17px] text-white">Tipo de inspección</p>
            <p className="mt-[1px] truncate text-[11px] leading-[14px] text-[rgba(255,255,255,0.55)]">Paso 2 de 5</p>
          </div>
          <div className="pr-[4px]">
            <div className="flex h-[20px] w-[56px] items-center justify-center rounded-[16px] bg-[#C8A064]">
              <span className="text-[10px] font-bold leading-none text-[#001E39]">GF HSE</span>
            </div>
          </div>
        </div>
      </div>

      {showOfflineBanner ? (
        <div className="flex h-[23px] shrink-0 items-center gap-[7px] border-b border-[#C8A064] bg-[#2A1A04] px-[16px] pb-[6px] pt-[5px]">
          <OfflineIcon />
          <span className="text-[11px] font-semibold leading-none text-[#C8A064]">Sin red · guardando localmente</span>
        </div>
      ) : null}

      <ManualStepper />

      <div className="flex-1 overflow-y-auto bg-[#F7F7F7] px-[14px] pb-[24px] pt-[14px]">
        <div>
          <p className="text-[18px] font-bold leading-[21.6px] text-[#131313]">Tipo de inspección</p>
          <p className="mt-[4px] w-[332px] text-[12px] leading-[16.8px] text-[#646464]">
            Define la naturaleza del registro que realizarás en esta visita
          </p>
        </div>

        <div className="mt-[12px] grid gap-[12px]">
          {typeOptions.map((option) => (
            <TypeOptionCard
              key={option.type}
              option={option}
              selected={draft.inspectionType === option.type}
              onPress={() => selectType(option)}
            />
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#E3E3E3] bg-white pb-[8px] pt-[10px]">
        <div className="flex w-full gap-[10px] px-[14px]">
          <button
            type="button"
            className="!flex !h-[50px] !w-auto !min-w-0 !shrink-0 !items-center !justify-center !gap-[8px] !rounded-[14px] !border-[2px] !border-[#C8A064] !bg-white !px-[20px] !text-[14px] !font-bold !text-[#C8A064]"
            onClick={onBack}
          >
            <ArrowLeftIcon />
            Atrás
          </button>
          <button
            type="button"
            className={`!flex !h-[50px] !w-auto !min-w-0 !flex-1 !items-center !justify-center !gap-[8px] !rounded-[14px] !text-[14px] !font-bold !shadow-[0_2px_4px_rgba(200,160,100,0.25)] ${
              canContinue ? '!bg-[#C8A064] !text-white' : '!bg-[#E3E3E3] !text-[#9AA0A6] !shadow-none'
            }`}
            onClick={handleNext}
            disabled={!canContinue}
          >
            Continuar
            <ArrowRightIcon />
          </button>
        </div>
        <div className="mx-auto mb-[4px] mt-[14px] h-[4px] w-[120px] rounded-[2px] bg-[#D1D1D1]" />
      </div>
    </>
  );
}
