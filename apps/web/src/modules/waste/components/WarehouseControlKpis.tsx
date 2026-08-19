import { WasteKpiRow, type WasteKpi } from './WasteKpiCard';

/**
 * Fila de KPIs de "Control de bodega" — nodos `3686:25707` (contenedor) y
 * `3686:25708` / `25713` / `25720` / `25727` (tarjetas).
 *
 *   contenedor  flex gap-[16px] items-start w-full → `WasteKpiRow` con gap 16
 *   tarjeta     ver `WasteKpiCard`
 *
 * Lo único propio de esta fila es el gap de 16px; el Dashboard y el Histórico
 * usan 14. Lo demás queda acá: las cuatro tarjetas por defecto de la vista.
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
  return <WasteKpiRow kpis={kpis} gap={16} />;
}
