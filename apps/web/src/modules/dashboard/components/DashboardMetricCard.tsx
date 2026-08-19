interface DashboardMetricCardProps {
  accent: string;
  detail: string;
  label: string;
  value: string;
}

export function DashboardMetricCard({ accent, detail, label, value }: DashboardMetricCardProps) {
  return (
    <article style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 12px 30px rgba(12, 31, 56, 0.05)' }}>
      <div style={{ position: 'absolute', inset: '1px auto 1px 1px', width: 4, borderRadius: 999, background: accent }} />
      <div style={{ padding: 20 }}>
        <p style={{ margin: '0 0 18px', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#6a7f95' }}>{label}</p>
        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1, color: '#131313' }}>{value}</div>
        <p style={{ margin: '10px 0 0', color: '#617183', fontSize: 13, lineHeight: 1.5 }}>{detail}</p>
      </div>
    </article>
  );
}