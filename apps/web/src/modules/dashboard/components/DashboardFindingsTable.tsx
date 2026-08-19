import type { CSSProperties } from 'react';

interface FindingsRow {
  id: number;
  company: string;
  area: string;
  findings: number;
  age: number;
  critical: boolean;
}

interface DashboardFindingsTableProps {
  rows: FindingsRow[];
}

export function DashboardFindingsTable({ rows }: DashboardFindingsTableProps) {
  return (
    <section style={{ borderRadius: 20, background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 12px 30px rgba(12, 31, 56, 0.05)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', padding: '20px 20px 14px' }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#6a7f95' }}>Hallazgos criticos</p>
          <h2 style={{ margin: '8px 0 0', fontSize: 22, color: '#001e39' }}>Inspecciones con mayor urgencia de cierre</h2>
        </div>
        <span style={{ fontSize: 12, color: '#6a7f95' }}>Vista mock del dashboard</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr style={{ background: '#001e39' }}>
              {['N°', 'Empresa', 'Area', 'Dias abierto', 'Hallazgos', 'Estado'].map((header) => (
                <th key={header} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: '#ffffff' }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} style={{ background: index % 2 === 0 ? '#ffffff' : '#f8fbfd' }}>
                <td style={tableCellStyle}>#{row.id}</td>
                <td style={tableCellStyle}>{row.company}</td>
                <td style={tableCellStyle}>{row.area}</td>
                <td style={tableCellStyle}>{row.age} dias</td>
                <td style={tableCellStyle}>{row.findings}</td>
                <td style={tableCellStyle}>
                  <span style={{ borderRadius: 999, padding: '6px 10px', background: row.critical ? '#fde8ec' : '#e5f7f3', color: row.critical ? '#b42346' : '#027a5f', fontSize: 11, fontWeight: 700 }}>
                    {row.critical ? 'Critico' : 'Seguimiento'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const tableCellStyle: CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid rgba(0,0,0,0.06)',
  fontSize: 14,
  color: '#23384d',
};