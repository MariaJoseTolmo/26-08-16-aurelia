import { WasteKpiCard, type WasteKpi } from './WasteKpiCard';

/**
 * Fila de KPIs de "Control de bodega" — nodos `3686:25707` (contenedor) y
 * `3686:25708` / `25713` / `25720` / `25727` (tarjetas).
 *
 *   contenedor  flex gap-[16px] items-start w-full
 *   tarjeta     ver `WasteKpiCard`, que la comparte con el Dashboard Residuos
 *
 * Lo único propio de esta fila es la grilla: `gap-[16px]`. El Dashboard usa
 * `gap-[14px]` (nodo `3086:13811`), así que cada vista declara su grilla y las dos
 * comparten la tarjeta.
 */

export const WAREHOUSE_KPI_DEFAULTS: WasteKpi[] = [
  { label: 'Lotes en bodega', value: '14' },
  {
    label: 'Cerca del límite (5 meses)',
    value: '2',
    note: 'requieren retiro pronto',
    valueTone: '#e8720c',
  },
  {
    label: 'Vencidos (6 meses)',
    value: '1',
    note: 'acción inmediata',
    valueTone: '#bd3b5b',
    noteTone: '#570b1d',
  },
  {
    label: 'Ingresos vs. retiros (mes)',
    value: '9',
    secondaryValue: '7',
    note: '+2 acumulando',
    // Los números van neutros: solo la nota se colorea.
    noteTone: '#e8720c',
  },
];

interface WarehouseControlKpisProps {
  kpis?: WasteKpi[];
}

export function WarehouseControlKpis({ kpis = WAREHOUSE_KPI_DEFAULTS }: WarehouseControlKpisProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-[16px] sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <WasteKpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  );
}
