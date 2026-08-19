import { useEffect, useMemo, useRef, useState } from 'react';

type CompanyFilterOption = {
  id: string;
  name: string;
};

type Props = {
  companies: CompanyFilterOption[];
  selectedCompanyId: string | null;
  onChange: (companyId: string | null) => void;
  clearIconPath: string;
  caretIconPath: string;
};

type DropdownOptionProps = {
  selected: boolean;
  children: string;
  onClick: () => void;
};

function Icon({ path, fill }: { path: string; fill: string }) {
  return <path d={path} fill={fill} />;
}

function DropdownOption({ selected, children, onClick }: DropdownOptionProps) {
  return (
    <button
      className={`flex h-[40px] min-h-[40px] w-full shrink-0 items-center overflow-hidden rounded-[8px] px-[8px] py-[12px] text-left font-['Inter:Regular',sans-serif] text-[13px] font-normal leading-[22.7px] text-[#131313] ${selected ? 'bg-[#e3e3e3]' : 'bg-white hover:bg-[#e3e3e3]'}`}
      type="button"
      onClick={onClick}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}

export function DashboardCompanyFilter({ companies, selectedCompanyId, onChange, clearIconPath, caretIconPath }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const options = useMemo(
    () => companies
      .map((company) => ({ id: company.id.trim(), name: company.name.trim() }))
      .filter((company) => company.id.length > 0 && company.name.length > 0),
    [companies],
  );
  const selectedCompany = options.find((company) => company.id === selectedCompanyId);
  const label = selectedCompany?.name ?? 'Todas las empresas';

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, []);

  return (
    <div ref={rootRef} className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0">
      <div className="relative shrink-0">
        <button className="bg-white border border-[#d1d1d1] border-solid flex h-[36px] w-[166px] items-center justify-between rounded-[8px] px-[14px]" type="button" onClick={() => setOpen((current) => !current)}>
          <span className="font-['Inter:Regular',sans-serif] font-normal text-[#131313] text-[13px] truncate max-w-[126px]">{label}</span>
          <svg className="h-[10px] w-[12.5px] shrink-0" fill="none" preserveAspectRatio="none" viewBox="0 0 12.5 10"><Icon path={caretIconPath} fill="#131313" /></svg>
        </button>
        {open ? (
          <div className="absolute right-0 top-[44px] z-50 flex max-h-[280px] w-[220px] flex-col items-start overflow-y-auto rounded-[12px] border border-[#d1d1d1] bg-white p-[8px] shadow-[0px_4px_8px_rgba(19,19,19,0.24)]">
            <DropdownOption selected={!selectedCompanyId} onClick={() => { onChange(null); setOpen(false); }}>
              Todas las empresas
            </DropdownOption>
            {options.map((company) => (
              <DropdownOption key={company.id} selected={company.id === selectedCompanyId} onClick={() => { onChange(company.id); setOpen(false); }}>
                {company.name}
              </DropdownOption>
            ))}
          </div>
        ) : null}
      </div>

      <button className="bg-white border border-[#d1d1d1] border-solid content-stretch flex gap-[5px] h-[34px] items-center px-[13px] py-px relative rounded-[7px] shrink-0" type="button" onClick={() => { onChange(null); setOpen(false); }}>
        <svg className="h-[11px] w-[13.75px]" fill="none" preserveAspectRatio="none" viewBox="0 0 13.75 11.0005"><Icon path={clearIconPath} fill="#646464" /></svg>
        <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#646464] text-[11px] text-center whitespace-nowrap"> Limpiar</span>
      </button>
    </div>
  );
}
