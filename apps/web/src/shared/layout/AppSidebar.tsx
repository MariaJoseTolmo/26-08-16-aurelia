import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Role } from '@aurelia/contracts';
import { DashboardSidebarTopBrandBar } from '../../modules/dashboard/components/DashboardSections';
import {
  canAccessSprArea,
  canAccessSprForm,
  canAccessSprReport,
  resolveSessionUserRoles,
  resolveSprDefaultRoute,
  resolveSprSidebarRole,
} from '../../modules/spr/sprAccess';
import { useNotifications } from '../hooks/useNotifications';
import { logout } from '../services/auth.service';
import { useSessionStore } from '../stores/session.store';
import { formatPrimaryRoleLabel, formatUserInitials, roleLabel } from '../utils/roles';
import { AppNotificationsPanel } from './AppNotificationsPanel';
import { sidebarIconSvgs, type SidebarIconName } from './AppSidebarIcons';

type SidebarTone = 'green' | 'gold';
type SidebarLineMode = 'single' | 'double';

type SidebarChildItem = {
  label: string;
  to?: string;
  end?: boolean;
  icon?: SidebarIconName;
  disabled?: boolean;
  lineMode?: SidebarLineMode;
  tone?: SidebarTone;
};

type SidebarItem = {
  label: string;
  icon: SidebarIconName;
  to?: string;
  end?: boolean;
  disabled?: boolean;
  badge?: string;
  children?: SidebarChildItem[];
};

const SIDEBAR_EXPANDED_MODULES_STORAGE_KEY = 'aurelia.sidebar.expanded-modules';

function readExpandedModules(): Set<string> {
  if (typeof window === 'undefined') return new Set();

  try {
    const stored = window.sessionStorage.getItem(SIDEBAR_EXPANDED_MODULES_STORAGE_KEY);
    if (!stored) return new Set();

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return new Set();

    return new Set(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return new Set();
  }
}

function persistExpandedModules(modules: Set<string>) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(SIDEBAR_EXPANDED_MODULES_STORAGE_KEY, JSON.stringify([...modules]));
  } catch {
    // El sidebar sigue funcionando aunque el navegador bloquee sessionStorage.
  }
}

function clearPersistedExpandedModules() {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(SIDEBAR_EXPANDED_MODULES_STORAGE_KEY);
  } catch {
    // No bloqueamos el cierre de sesión por un fallo de almacenamiento local.
  }
}

const mainItems: SidebarItem[] = [
  { label: 'Dashboard', icon: 'dashboard', to: '/', end: true },
  {
    label: 'Inspecciones',
    icon: 'inspections',
    to: '/inspections',
    children: [
      { label: 'Dashboard', to: '/inspections/dashboard', end: true, lineMode: 'single' },
      { label: 'Gestión de inspecciones', to: '/inspections', end: true, lineMode: 'double' },
      { label: 'Historial', to: '/inspections/history', end: true, lineMode: 'single' },
      { label: 'Administración', to: '/inspections/admin', icon: 'admin', disabled: true, lineMode: 'single', tone: 'gold' },
    ],
  },
  { label: 'Incidentes', icon: 'incidents', disabled: true, badge: 'Próximo' },
  {
    label: 'SPR',
    icon: 'spr',
    to: '/spr',
    children: [],
  },
  { label: 'Impuesto verde', icon: 'greenTax', disabled: true, badge: 'Próximo' },
  { label: 'Residuos', icon: 'waste', disabled: true, badge: 'Próximo' },
  { label: 'Controles críticos', icon: 'criticalControls', disabled: true, badge: 'Próximo' },
  { label: 'Monitoreo de agua', icon: 'waterMonitoring', disabled: true, badge: 'Próximo' },
  { label: 'Material particulado', icon: 'particulateMatter', disabled: true, badge: 'Próximo' },
  { label: 'Meteorológico', icon: 'weather', disabled: true, badge: 'Próximo' },
  { label: 'Sustancias peligrosas', icon: 'hazardousSubstances', disabled: true, badge: 'Próximo' },
  { label: 'Gestión del cambio', icon: 'changeManagement', disabled: true, badge: 'Próximo' },
  { label: 'Catastro de agua', icon: 'waterCadastre', disabled: true, badge: 'Próximo' },
  { label: 'Incumplimientos', icon: 'nonCompliances', disabled: true, badge: 'Próximo' },
  { label: 'Workflow contratos', icon: 'contractWorkflow', disabled: true, badge: 'Próximo' },
];

function isRouteActive(pathname: string, to: string, end?: boolean) {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function SidebarIcon({ name, className = '' }: { name: SidebarIconName; className?: string }) {
  return <span aria-hidden className={`block shrink-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full ${className}`} dangerouslySetInnerHTML={{ __html: sidebarIconSvgs[name] }} />;
}

function getModuleIconSize(icon: SidebarIconName) {
  if (icon === 'inspections') return 'h-[14px] w-[18px]';
  if (icon === 'spr' || icon === 'waste' || icon === 'waterMonitoring' || icon === 'weather') return 'h-[13px] w-[17px] overflow-visible';
  return 'h-[13px] w-[17px]';
}

function SidebarSectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full items-center gap-[6px] px-[8px] pb-[4px] pt-[10px]">
      <p className="shrink-0 font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase leading-none tracking-[1.08px] text-[rgba(255,255,255,0.25)]">{children}</p>
      <div className="h-px min-w-0 flex-1 bg-[rgba(255,255,255,0.06)]" />
    </div>
  );
}

function ComingSoonBadge() {
  return <span className="flex h-[14px] shrink-0 items-center rounded-[4px] bg-[rgba(255,255,255,0.07)] px-[6px] font-['Inter:Semi_Bold',sans-serif] text-[8.5px] font-semibold leading-none text-[rgba(255,255,255,0.32)]">Próximo</span>;
}

function SidebarModuleItem({
  item,
  expanded,
  controlsId,
  onToggle,
}: {
  item: SidebarItem;
  expanded: boolean;
  controlsId?: string;
  onToggle?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const hasChildren = Boolean(item.children?.length);
  const activeByRoute = item.to ? isRouteActive(location.pathname, item.to, item.end) : false;
  const activeByChild = item.children?.some((child) => child.to && isRouteActive(location.pathname, child.to, child.end)) ?? false;
  const isActive = activeByRoute || activeByChild;
  const baseClass = `group flex h-[32px] w-full items-center rounded-[7px] text-left transition-colors duration-150 ${isActive ? 'bg-[rgba(255,255,255,0.1)]' : item.disabled ? '' : 'hover:bg-[rgba(255,255,255,0.055)]'} ${item.icon === 'inspections' ? 'gap-[10px] px-[10px] py-[8px]' : 'gap-[9px] px-[10px] py-[7px]'}`;

  function handleClick() {
    if (hasChildren) {
      onToggle?.();
      return;
    }
    if (item.to && !item.disabled) navigate(item.to);
  }

  return (
    <button
      aria-controls={hasChildren ? controlsId : undefined}
      aria-current={isActive ? 'page' : undefined}
      aria-expanded={hasChildren ? expanded : undefined}
      className={baseClass}
      disabled={item.disabled && !item.to}
      onClick={handleClick}
      type="button"
    >
      <SidebarIcon name={item.icon} className={getModuleIconSize(item.icon)} />
      <span className={`min-w-0 flex-1 truncate font-['Inter:Medium',sans-serif] font-medium leading-[15px] ${isActive ? 'text-white' : 'text-[rgba(255,255,255,0.55)]'} ${item.icon === 'inspections' ? 'text-[13px]' : 'text-[12.5px]'}`}>{item.label}</span>
      {item.badge ? <ComingSoonBadge /> : null}
      {hasChildren ? <SidebarIcon name="chevron" className={`h-[13px] w-[13px] transition-transform duration-150 ${expanded ? 'rotate-0' : '-rotate-90'}`} /> : null}
    </button>
  );
}

function SidebarSubItem({ item }: { item: SidebarChildItem }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = item.to ? isRouteActive(location.pathname, item.to, item.end) : false;
  const hasIcon = Boolean(item.icon);
  const isDoubleLine = item.lineMode === 'double';
  const tone = item.tone ?? 'green';
  const activeColor = tone === 'gold' ? '#c8a064' : '#00b398';
  const activeBg = tone === 'gold' ? 'bg-[rgba(200,160,100,0.07)]' : 'bg-[rgba(0,179,152,0.09)]';
  const activeHeight = hasIcon ? 'h-[25px]' : isDoubleLine ? 'h-[41px]' : 'h-[26.5px]';
  const inactiveHeight = hasIcon ? 'h-[25px]' : 'h-[26.5px]';
  const className = `relative block w-full rounded-[6px] text-left transition-colors duration-150 ${isActive ? `${activeHeight} ${activeBg}` : `${inactiveHeight} hover:bg-[rgba(255,255,255,0.04)]`}`;

  function handleLinkClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    if (!item.to) return;
    event.preventDefault();
    navigate(item.to);
  }

  const content = hasIcon ? (
    <>
      {isActive ? <span className="absolute left-[23px] top-[6px] h-[13px] w-[2.5px] rounded-[2px]" style={{ backgroundColor: activeColor }} /> : null}
      <SidebarIcon name={item.icon as SidebarIconName} className="absolute left-[40.5px] top-[7.5px] h-[10px] w-[12px]" />
      <span className="absolute left-[60.5px] top-[10.5px] size-[4px] rounded-[2px] bg-[rgba(255,255,255,0.12)]" />
      <span className={`absolute left-[72.5px] top-[6px] truncate font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold leading-[normal] ${isActive ? 'text-[#c8a064]' : 'text-[rgba(255,255,255,0.32)]'}`}>{item.label}</span>
    </>
  ) : (
    <>
      {isActive ? <span className={`absolute left-[23px] ${isDoubleLine ? 'top-[14px]' : 'top-[6.75px]'} h-[13px] w-[2.5px] rounded-[2px] bg-[#00b398]`} /> : null}
      <span className={`absolute left-[39.5px] ${isActive ? isDoubleLine ? 'top-[18.5px]' : 'top-[11.25px]' : 'top-[11.25px]'} size-[4px] rounded-[2px] ${isActive ? 'bg-[#00b398]' : 'bg-[rgba(255,255,255,0.2)]'}`} />
      <span className={`absolute left-[50.5px] top-[6px] max-w-[140px] font-['Inter:Semi_Bold',sans-serif] text-[12px] leading-[14px] ${isActive ? 'font-semibold text-[#00b398]' : 'font-normal text-[rgba(255,255,255,0.44)]'} ${isDoubleLine ? 'whitespace-normal' : 'whitespace-nowrap'}`}>{item.label}</span>
    </>
  );

  if (item.to && !item.disabled) return <a aria-current={isActive ? 'page' : undefined} className={className} href={item.to} onClick={handleLinkClick}>{content}</a>;
  return <button aria-current={isActive ? 'page' : undefined} className={className} disabled={item.disabled} type="button">{content}</button>;
}

function SidebarChildren({ children, id }: { children: SidebarChildItem[]; id: string }) {
  return (
    <div id={id} className="flex max-h-[400px] w-full flex-col overflow-hidden">
      {children.slice(0, 3).map((item) => <SidebarSubItem key={item.label} item={item} />)}
      <div className="w-full pl-[38px] pr-[10px] pt-[4px]"><div className="h-px w-full bg-[rgba(255,255,255,0.06)]" /></div>
      {children.slice(3).map((item) => <div key={item.label} className="w-full pt-[4px]"><SidebarSubItem item={item} /></div>)}
    </div>
  );
}

function SidebarFooterRow({ icon, label, right, onClick, active = false }: { icon: SidebarIconName; label: string; right?: ReactNode; onClick?: () => void; active?: boolean }) {
  const className = `flex w-full items-center justify-between rounded-[6px] px-[8px] pb-[6px] pt-[2px] ${active ? 'bg-[rgba(255,255,255,0.06)]' : ''}`;
  const content = (
    <>
      <div className="relative h-[13px] w-[120px] shrink-0">
        <SidebarIcon name={icon} className="absolute left-0 top-[0.88px] h-[11px] w-[13.75px]" />
        <p className="absolute left-[17.75px] top-0 whitespace-nowrap font-['Inter:Regular',sans-serif] text-[11px] font-normal leading-[normal] text-[rgba(255,255,255,0.28)]">{label}</p>
      </div>
      {right}
    </>
  );
  if (onClick) return <button className={`${className} bg-transparent text-left hover:bg-[rgba(255,255,255,0.055)]`} onClick={onClick} type="button">{content}</button>;
  return <div className={className}>{content}</div>;
}

function SidebarNotificationsBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className="flex size-[16px] shrink-0 items-center justify-center rounded-[8px] bg-[#c4365a] px-[4px] font-['Inter:Bold',sans-serif] text-[9px] font-bold leading-[normal] text-white">{count > 99 ? '99+' : count}</span>;
}

function SidebarLanguageSwitch() {
  return (
    <div className="relative h-[18px] w-[60.32px] shrink-0 rounded-[20px] border border-[rgba(255,255,255,0.1)]">
      <div className="flex size-full items-start overflow-hidden rounded-[inherit] p-px">
        <div className="relative h-full w-[29.695px] shrink-0"><p className="absolute left-[8px] top-[2px] whitespace-nowrap font-['Inter:Bold',sans-serif] text-[10px] font-bold leading-[normal] text-[rgba(255,255,255,0.3)]">EN</p></div>
        <div className="relative h-full w-[28.625px] shrink-0 bg-[#00b398]"><p className="absolute left-[8px] top-[2px] whitespace-nowrap font-['Inter:Bold',sans-serif] text-[10px] font-bold leading-[normal] text-white">ES</p></div>
      </div>
    </div>
  );
}

function SidebarFooterOptions({ onNotificationsClick, unreadCount, notificationsOpen }: { onNotificationsClick: () => void; unreadCount: number; notificationsOpen: boolean }) {
  return (
    <div className="flex w-full flex-col gap-[8px]">
      <SidebarFooterRow icon="notifications" label="Notificaciones" right={<SidebarNotificationsBadge count={unreadCount} />} onClick={onNotificationsClick} active={notificationsOpen} />
      <SidebarFooterRow icon="language" label="Idioma" right={<SidebarLanguageSwitch />} />
    </div>
  );
}

function SidebarUser() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSessionStore((state) => state.user);
  const clearSession = useSessionStore((state) => state.clearSession);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fullName = user?.fullName?.trim() || 'Usuario';
  const initials = formatUserInitials(fullName);
  const userRoles = resolveSessionUserRoles(user);
  const sprSidebarRole = resolveSprSidebarRole(userRoles, location.pathname);
  const roleLabelText = sprSidebarRole ? roleLabel(sprSidebarRole) : formatPrimaryRoleLabel(userRoles);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [menuOpen]);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setMenuOpen(false);

    try {
      await logout();
    } catch {
      // Aunque falle el backend, igual limpiamos sesión local para no dejar al usuario atrapado.
    } finally {
      clearPersistedExpandedModules();
      clearSession();
      navigate('/login', { replace: true });
    }
  }

  return (
    <div ref={containerRef} className="relative w-full shrink-0 rounded-[7px]">
      <div className="flex size-full items-center gap-[8px] px-[8px] py-[6px]">
        <div className="flex size-[28px] shrink-0 items-center justify-center rounded-[14px] bg-[#c8a064]">
          <p className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[11px] font-bold leading-[normal] text-[#001e39]">
            {initials}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex w-full flex-col items-start">
            <p
              className="w-full truncate font-['Inter:Semi_Bold',sans-serif] text-[11.5px] font-semibold leading-[normal] text-[rgba(255,255,255,0.75)]"
              title={fullName}
            >
              {fullName}
            </p>
            <div className="flex w-full items-center gap-[4px]">
              <SidebarIcon name="role" className="h-[8px] w-[10px]" />
              <p className="truncate whitespace-nowrap font-['Inter:Regular',sans-serif] text-[10px] font-normal leading-[normal] text-[rgba(255,255,255,0.32)]">
                {roleLabelText}
              </p>
            </div>
          </div>
        </div>
        <div className="relative shrink-0">
          <button
            type="button"
            aria-label="Opciones de usuario"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            disabled={isLoggingOut}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex size-[22px] items-center justify-center rounded-[5px] transition-colors hover:bg-[rgba(255,255,255,0.08)] disabled:opacity-50"
          >
            <SidebarIcon name="more" className="h-[11px] w-[13.75px]" />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute bottom-[calc(100%+6px)] right-0 z-[90] min-w-[140px] overflow-hidden rounded-[8px] border border-[rgba(255,255,255,0.12)] bg-[#001e39] py-[4px] shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
            >
              <button
                type="button"
                role="menuitem"
                disabled={isLoggingOut}
                onClick={() => void handleLogout()}
                className="flex w-full items-center px-[12px] py-[8px] text-left font-['Inter:Semi_Bold',sans-serif] text-[11.5px] font-semibold text-[rgba(255,255,255,0.85)] transition-colors hover:bg-[rgba(255,255,255,0.08)] disabled:opacity-50"
              >
                {isLoggingOut ? 'Cerrando…' : 'Cerrar sesión'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function buildSprSidebarChildren(roles: Role[]): SidebarChildItem[] {
  const children: SidebarChildItem[] = [];

  if (canAccessSprReport(roles)) {
    children.push({ label: 'Dashboard', to: '/spr/reporte', end: true, lineMode: 'single' });
    children.push({ label: 'Reporte SPR', to: '/spr/reporte/consolidado', end: true, lineMode: 'single' });
    children.push({ label: 'Monitoreo de KPIs', to: '/spr/monitoreo-kpis', end: true, lineMode: 'single', tone: 'gold' });
    return children;
  }

  if (canAccessSprForm(roles)) {
    children.push({ label: 'Mi formulario', to: '/spr', end: true, lineMode: 'single' });
  }

  if (canAccessSprArea(roles)) {
    children.push({ label: 'Mi área', to: '/spr/mi-area', end: true, lineMode: 'single' });
  }

  children.push({ label: 'Administración', disabled: true, icon: 'admin', lineMode: 'single', tone: 'gold' });
  return children;
}

function resolveSidebarItems(roles: Role[]): SidebarItem[] {
  return mainItems.map((item) => {
    if (item.label !== 'SPR') return item;

    const children = buildSprSidebarChildren(roles);
    return {
      ...item,
      to: resolveSprDefaultRoute(roles),
      children,
    };
  });
}

export function AppSidebar() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(readExpandedModules);
  const notificationsQuery = useNotifications();
  const unreadCount = notificationsQuery.data?.filter((notification) => !notification.readAt).length ?? 0;
  const user = useSessionStore((state) => state.user);
  const userRoles = resolveSessionUserRoles(user);
  const sidebarItems = resolveSidebarItems(userRoles);

  function toggleModule(label: string) {
    setExpandedModules((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      persistExpandedModules(next);
      return next;
    });
  }

  return (
    <>
      <DashboardSidebarTopBrandBar />
      <aside aria-label="Navegación lateral" className="fixed bottom-0 left-0 top-[56px] z-[80] flex w-[220px] flex-col overflow-hidden bg-gradient-to-b from-[#002659] to-[#004a3a]">
        <div className="min-h-0 flex-1 overflow-hidden pb-[4px]">
          <div className="flex w-full flex-col items-start px-[10px] pb-[6px] pt-[8px]">
            <SidebarSectionTitle>Módulos</SidebarSectionTitle>
            <div className="flex w-full flex-col items-start">
              {sidebarItems.map((item, index) => {
                const hasChildren = Boolean(item.children?.length);
                const expanded = hasChildren && expandedModules.has(item.label);
                const controlsId = `sidebar-module-${index}-children`;

                return (
                  <div key={item.label} className="w-full">
                    <SidebarModuleItem
                      item={item}
                      expanded={expanded}
                      controlsId={hasChildren ? controlsId : undefined}
                      onToggle={hasChildren ? () => toggleModule(item.label) : undefined}
                    />
                    {hasChildren && expanded ? <SidebarChildren id={controlsId}>{item.children as SidebarChildItem[]}</SidebarChildren> : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex w-[220px] shrink-0 flex-col items-start border-t border-[rgba(255,255,255,0.08)] bg-[rgba(0,38,89,0.6)] px-[10px] pb-[10px] pt-[9px]">
          <SidebarFooterOptions onNotificationsClick={() => setNotificationsOpen((current) => !current)} unreadCount={unreadCount} notificationsOpen={notificationsOpen} />
          <SidebarUser />
        </div>
      </aside>
      <AppNotificationsPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  );
}
