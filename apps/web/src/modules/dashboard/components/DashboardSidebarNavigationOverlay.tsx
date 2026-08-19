import { useLocation, useNavigate } from 'react-router-dom';

type SubmenuItemProps = {
  to?: string;
  top: number;
  height: number;
  label: string;
  multiline?: boolean;
  end?: boolean;
};

function isRouteActive(pathname: string, to: string, end: boolean) {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function SubmenuItem({ to, top, height, label, multiline = false, end = false }: SubmenuItemProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = to ? isRouteActive(location.pathname, to, end) : false;

  function handleClick() {
    if (to && location.pathname !== to) navigate(to);
  }

  return (
    <button
      aria-label={`Ir a ${label}`}
      className="absolute left-0 w-full pointer-events-auto text-left"
      disabled={!to}
      onClick={handleClick}
      style={{ top, height }}
      type="button"
    >
      <div className={`relative h-full w-full rounded-[6px] transition-all duration-150 ease-out ${isActive ? 'bg-[rgba(0,179,152,0.09)]' : 'hover:bg-[rgba(255,255,255,0.055)] hover:translate-x-[1px]'}`}>
        {isActive ? <div className="absolute left-[23px] w-[2.5px] rounded-[2px] bg-[#00b398]" style={{ top: height > 30 ? 14 : 6.75, height: 13 }} /> : null}
        <div className={`absolute left-[39.5px] size-[4px] rounded-[2px] ${isActive ? 'bg-[#00b398]' : 'bg-[rgba(255,255,255,0.2)]'}`} style={{ top: height > 30 ? 18.5 : 11.25 }} />
        <span className={`absolute left-[50.5px] max-w-[140px] font-['Inter:Semi_Bold',sans-serif] text-[12px] leading-[14px] ${isActive ? 'font-semibold text-[#00b398]' : 'font-normal text-[rgba(255,255,255,0.44)]'} ${multiline ? 'whitespace-normal' : 'whitespace-nowrap'}`} style={{ top: 6 }}>{label}</span>
      </div>
    </button>
  );
}

function SubmenuPanel() {
  return (
    <div className="absolute left-[10px] top-[151px] z-[1] h-[116px] w-[200px] bg-[#003154] pointer-events-auto">
      <SubmenuItem to="/" top={0} height={26.5} label="Dashboard" end />
      <SubmenuItem to="/inspections" top={26.5} height={41} label="Gestión de inspecciones" multiline end />
      <SubmenuItem top={67.5} height={26.5} label="Historial" />
      <div className="absolute left-[38px] right-[10px] top-[96px] h-px bg-[rgba(255,255,255,0.06)]" />
      <div className="absolute left-0 top-[99px] h-[17px] w-full rounded-[6px] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.04)]">
        <div className="absolute left-[38px] top-[4px] h-[9px] w-[12px] opacity-30">
          <svg className="block size-full" fill="none" viewBox="0 0 12 10" aria-hidden>
            <path d="M2 8h8M3 5h6M4 2h4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="absolute left-[58px] top-[6.5px] size-[4px] rounded-[2px] bg-[rgba(255,255,255,0.12)]" />
        <span className="absolute left-[70px] top-[1.5px] font-['Inter:Medium',sans-serif] text-[11px] font-medium leading-[14px] text-[rgba(255,255,255,0.32)]">Administración</span>
      </div>
    </div>
  );
}

export function DashboardSidebarNavigationOverlay() {
  const location = useLocation();
  const navigate = useNavigate();

  function navigateDashboard() {
    if (location.pathname !== '/') navigate('/');
  }

  return (
    <div className="fixed left-0 top-0 z-[90] h-screen w-[220px] pointer-events-none" aria-label="Navegación lateral" data-current-path={location.pathname}>
      <button className="absolute left-[10px] top-[101px] h-[32px] w-[200px] rounded-[7px] pointer-events-auto transition-colors duration-150 hover:bg-[rgba(255,255,255,0.055)]" onClick={navigateDashboard} type="button" aria-label="Ir a Dashboard" />
      <SubmenuPanel />
    </div>
  );
}
