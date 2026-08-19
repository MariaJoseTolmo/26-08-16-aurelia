interface ActivityItem {
  id: string;
  company: string;
  area: string;
  age: string;
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface DashboardActivityPanelProps {
  items: ActivityItem[];
}

export function DashboardActivityPanel({ items }: DashboardActivityPanelProps) {
  return (
    <aside style={{ borderRadius: 20, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', padding: 20, boxShadow: '0 10px 30px rgba(12, 31, 56, 0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', marginBottom: 16 }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#6a7f95' }}>Actividad reciente</p>
          <h2 style={{ margin: '8px 0 0', fontSize: 20, color: '#001e39' }}>Registros con mayor criticidad</h2>
        </div>
        <span style={{ fontSize: 12, color: '#6a7f95' }}>Mock data</span>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((activity) => (
          <article key={activity.id} style={{ borderRadius: 14, border: '1px solid rgba(0,0,0,0.08)', padding: 14, background: 'linear-gradient(180deg, #fff 0%, #fbfcfe 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#001e39' }}>#{activity.id} · {activity.company}</div>
                <div style={{ marginTop: 4, fontSize: 13, color: '#617183' }}>{activity.area}</div>
              </div>
              <span style={{ borderRadius: 999, padding: '6px 10px', background: activity.risk === 'CRITICAL' ? '#fde8ec' : activity.risk === 'HIGH' ? '#fff0e7' : activity.risk === 'MEDIUM' ? '#fff7db' : '#e5f7f3', color: activity.risk === 'CRITICAL' ? '#b42346' : activity.risk === 'HIGH' ? '#c65b28' : activity.risk === 'MEDIUM' ? '#9a6b00' : '#027a5f', fontSize: 11, fontWeight: 700 }}>
                {activity.risk}
              </span>
            </div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: '#617183' }}>Antigüedad</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#001e39' }}>{activity.age}</div>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}