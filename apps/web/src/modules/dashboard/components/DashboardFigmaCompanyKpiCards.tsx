type CompanyKpiCardProps = {
  iconPath: string;
  iconColor: string;
  accentColor: string;
  title: string;
  value: string;
  subtitle: string;
};

type DashboardCompanyCardProps = {
  iconPath: string;
  value: string;
};

function CompanyKpiCard({ iconPath, iconColor, accentColor, title, value, subtitle }: CompanyKpiCardProps) {
  return (
    <div className="relative h-[93px] w-full overflow-hidden rounded-[8px] bg-white" data-name="Container">
      <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-l-[8px]" data-name="Text" style={{ backgroundColor: accentColor }} />
      <div className="relative flex h-full w-full flex-col items-start justify-start p-[15px] pl-[16px]">
        <div className="flex h-[13px] w-full min-w-0 items-center" data-name="Container">
          <div className="h-[10px] w-[12.5px] shrink-0" data-name="Image">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.5 10">
              <path d={iconPath} fill={iconColor} />
            </svg>
          </div>
          <p className="ml-0 min-w-0 truncate font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold uppercase leading-[13px] tracking-[0.4px] text-[#646464]">
            {title}
          </p>
        </div>
        <p className="mt-[6px] font-['Inter:Bold',sans-serif] text-[26px] font-bold leading-[26px] text-[#131313] whitespace-nowrap">
          {value}
        </p>
        <p className="mt-[5px] font-['Inter:Regular',sans-serif] text-[11px] font-normal leading-[normal] text-[#646464] whitespace-nowrap">
          {subtitle}
        </p>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[8px] border border-[#e3e3e3] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

export function DashboardCompanyCardOpenCompanies({ iconPath, value }: DashboardCompanyCardProps) {
  return <CompanyKpiCard iconPath={iconPath} iconColor="#C8A064" accentColor="#c8a064" title="Empresas con obs. abiertas" value={value} subtitle="EECC en seguimiento" />;
}

export function DashboardCompanyCardOpenFindings({ iconPath, value }: DashboardCompanyCardProps) {
  return <CompanyKpiCard iconPath={iconPath} iconColor="#F9A411" accentColor="#463100" title="Observaciones abiertas" value={value} subtitle="pendientes de cierre" />;
}

export function DashboardCompanyCardOpenInspections({ iconPath, value }: DashboardCompanyCardProps) {
  return <CompanyKpiCard iconPath={iconPath} iconColor="#001E39" accentColor="#001e39" title="Inspecciones abiertas" value={value} subtitle="con obs. sin cerrar" />;
}

export function DashboardCompanyCardOpenDays({ iconPath, value }: DashboardCompanyCardProps) {
  return <CompanyKpiCard iconPath={iconPath} iconColor="#c43f61" accentColor="#463100" title="Días abierto (máx · prom)" value={value} subtitle="urgencia de cierre" />;
}
