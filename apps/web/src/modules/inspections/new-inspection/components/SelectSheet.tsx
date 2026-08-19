export interface SelectSheetOption {
  id: string;
  label: string;
  description?: string;
}

interface SelectSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: SelectSheetOption[];
  selectedId?: string | null;
  emptyText?: string;
  loading?: boolean;
  onClose: () => void;
  onSelect: (option: SelectSheetOption) => void;
}

export function SelectSheet({
  visible,
  title,
  subtitle,
  options,
  selectedId,
  emptyText = 'Sin opciones disponibles',
  loading = false,
  onClose,
  onSelect,
}: SelectSheetProps) {
  if (!visible) return null;

  const displayTitle = title.toLowerCase().includes('criticidad') ? 'Criticidad' : title;

  return (
    <div className="fixed bottom-[16px] right-[20px] top-[16px] z-[1100] flex w-[360px] max-w-[calc(100vw-40px)] items-end overflow-hidden rounded-[22px] bg-black/70" onClick={onClose}>
      <div className="max-h-[76%] w-full overflow-hidden rounded-t-[16px] bg-white shadow-[0_-12px_32px_rgba(0,0,0,0.22)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex min-h-[56px] w-full items-center gap-[12px] rounded-t-[16px] bg-white px-[14px] py-[12px]">
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <p className="text-[16px] font-bold leading-[22px] tracking-[0.32px] text-[#2A2A2A]">{displayTitle}</p>
            {subtitle ? <p className="mt-[2px] text-[12px] leading-[16px] text-[#646464]">{subtitle}</p> : null}
          </div>
          <button type="button" className="flex h-[32px] w-[32px] shrink-0 items-center justify-center bg-transparent text-[32px] font-light leading-none text-[#131313]" onClick={onClose} aria-label="Cerrar selector">
            ×
          </button>
        </div>

        <div className="max-h-[calc(76vh-76px)] overflow-y-auto">
          {loading ? <p className="border-b border-[#E3E3E3] px-[22px] py-[28px] text-[14px] leading-[22.7px] tracking-[0.28px] text-[#646464]">Cargando...</p> : null}
          {!loading && options.length === 0 ? <p className="border-b border-[#E3E3E3] px-[22px] py-[28px] text-[14px] leading-[22.7px] tracking-[0.28px] text-[#646464]">{emptyText}</p> : null}
          {!loading
            ? options.map((option) => {
                const selected = option.id === selectedId;
                return (
                  <button key={option.id} type="button" className={`flex w-full flex-col items-start border-b border-[#E3E3E3] px-[14px] py-[16px] text-left ${selected ? 'bg-[#F6FAFF]' : 'bg-white'}`} onClick={() => onSelect(option)}>
                    <div className="flex w-full flex-col items-start justify-center gap-[8px] rounded-[8px] bg-white px-[8px] py-[12px] text-[#131313]">
                      <p className="min-w-full text-[14px] font-bold leading-[22.7px] tracking-[0.28px] text-[#131313]">{option.label}</p>
                      {option.description ? <p className="min-w-full whitespace-pre-wrap text-[14px] font-normal leading-[22.7px] tracking-[0.28px] text-[#131313]">{option.description}</p> : null}
                    </div>
                  </button>
                );
              })
            : null}
        </div>
      </div>
    </div>
  );
}
