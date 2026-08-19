import type { CSSProperties, ReactNode } from 'react';
import type { LoginResponse } from '@aurelia/contracts';
import { NavLink } from 'react-router-dom';
import type { NavigationItem } from '../navigation';
import { roleLabel } from '../../shared/utils/roles';

interface AppSidebarProps {
  activeModule: string;
  mainNavItems: NavigationItem[];
  settingsNavItems: NavigationItem[];
  onLogout: () => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  user: LoginResponse['user'] | null;
}

interface RouterNavLinkProps {
  children?: ReactNode;
  end?: boolean;
  style?: (state: { isActive: boolean }) => CSSProperties;
  to: string;
}

const RouterNavLink = NavLink as unknown as (props: RouterNavLinkProps) => JSX.Element;

export function AppSidebar({
  activeModule,
  mainNavItems,
  settingsNavItems,
  onLogout,
  onToggleSidebar,
  sidebarCollapsed,
  user,
}: AppSidebarProps) {
  const userName = user?.fullName ?? 'Usuario';
  const primaryRole = user?.roles[0];
  const userRole = primaryRole ? roleLabel(primaryRole) : 'Sin rol';

  return (
    <aside style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #012659 0%, #002143 100%)', color: '#ffffff', padding: 16, display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 0 }}>
      <div style={{ borderRadius: 18, padding: sidebarCollapsed ? '18px 12px' : '18px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 12, letterSpacing: 3.2, color: '#6e87a7', textTransform: 'uppercase' }}>AURELIA</span>
            {!sidebarCollapsed ? <span style={{ marginTop: 4, fontSize: 13, color: '#c8a064' }}>Plataforma ambiental</span> : null}
          </div>
          {!sidebarCollapsed ? (
            <button type="button" onClick={onToggleSidebar} style={iconButtonStyle} aria-label="Colapsar sidebar">
              {'<'}
            </button>
          ) : null}
        </div>
        {sidebarCollapsed ? (
          <button type="button" onClick={onToggleSidebar} style={{ ...iconButtonStyle, marginTop: 12, width: '100%' }} aria-label="Expandir sidebar">
            {'>'}
          </button>
        ) : null}
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SidebarSectionLabel collapsed={sidebarCollapsed} label="Modulos" />
        {mainNavItems.map((item) => (
          <SidebarItem key={item.key} item={item} activeModule={activeModule} sidebarCollapsed={sidebarCollapsed} />
        ))}

        <SidebarSectionLabel collapsed={sidebarCollapsed} label="Configuracion general" />
        {settingsNavItems.map((item) => (
          <SidebarItem key={item.key} item={item} activeModule={activeModule} sidebarCollapsed={sidebarCollapsed} />
        ))}
      </nav>

      <div style={{ marginTop: 'auto', borderRadius: 18, padding: sidebarCollapsed ? 12 : 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {!sidebarCollapsed ? (
          <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
            <FooterMetaRow label="Notificaciones" value="7" tone="alert" />
            <FooterMetaRow label="Idioma" value="ES" tone="neutral" />
          </div>
        ) : null}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 14, background: 'linear-gradient(135deg, #00b398 0%, #24588b 100%)', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
            {userName.slice(0, 2).toUpperCase()}
          </div>
          {!sidebarCollapsed ? (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.62)' }}>{userRole}</div>
            </div>
          ) : null}
        </div>
        {!sidebarCollapsed ? (
          <button type="button" onClick={onLogout} style={{ marginTop: 14, width: '100%', height: 40, borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#ffffff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Cerrar sesion
          </button>
        ) : null}
      </div>
    </aside>
  );
}

function SidebarItem({ item, activeModule, sidebarCollapsed }: { item: NavigationItem; activeModule: string; sidebarCollapsed: boolean }) {
  return (
    <RouterNavLink
      to={item.to}
      end={item.to === '/'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 54,
        padding: sidebarCollapsed ? '0 10px' : '0 14px',
        borderRadius: 14,
        textDecoration: 'none',
        color: '#ffffff',
        background: isActive ? 'rgba(0,179,152,0.14)' : 'transparent',
        border: isActive ? '1px solid rgba(0,179,152,0.28)' : '1px solid transparent',
      })}
    >
      <span style={{ width: 12, height: 12, borderRadius: 999, background: item.key === activeModule ? '#00b398' : 'rgba(255,255,255,0.28)', flexShrink: 0 }} />
      {!sidebarCollapsed ? (
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>{item.label}</span>
          <span style={{ display: 'block', marginTop: 3, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.2 }}>{item.hint}</span>
        </span>
      ) : null}
    </RouterNavLink>
  );
}

function SidebarSectionLabel({ collapsed, label }: { collapsed: boolean; label: string }) {
  if (collapsed) {
    return null;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 4px 2px' }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.08, textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>{label}</span>
      <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.08)' }} />
    </div>
  );
}

function FooterMetaRow({ label, value, tone }: { label: string; value: string; tone: 'alert' | 'neutral' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)' }}>{label}</span>
      <span
        style={{
          minWidth: 24,
          height: 18,
          padding: '0 8px',
          borderRadius: 999,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: tone === 'alert' ? '#c4365a' : 'rgba(255,255,255,0.12)',
          color: '#ffffff',
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        {value}
      </span>
    </div>
  );
}

const iconButtonStyle: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)',
  color: '#ffffff',
  cursor: 'pointer',
  fontSize: 18,
  lineHeight: '32px',
};
