import type { CSSProperties } from 'react';

interface AppShellHeaderProps {
  currentModuleLabel: string;
  email: string;
}

export function AppShellHeader({ currentModuleLabel, email }: AppShellHeaderProps) {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '18px 24px', borderBottom: '1px solid rgba(0, 0, 0, 0.06)', background: 'linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.44) 100%)' }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: '#6a7f95' }}>Modulo activo</div>
        <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700, color: '#001e39' }}>{currentModuleLabel}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <div style={pillStyle}>API Auth conectada</div>
        <div style={pillStyle}>{email}</div>
      </div>
    </header>
  );
}

const pillStyle: CSSProperties = {
  borderRadius: 999,
  padding: '9px 12px',
  background: '#ffffff',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  color: '#4a657f',
  fontSize: 12,
  fontWeight: 700,
};