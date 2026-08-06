import type { WarehouseControlExportRequest } from '@aurelia/contracts';
import type { WarehouseKpi } from './components/WarehouseControlKpis';
import type { WarehouseLotRow } from './components/WarehouseLotsTable';
import type { WarehouseAccumulationBar } from './components/WarehouseMonthlyAccumulated';
import type { WarehouseExpirationItem } from './components/WarehouseUpcomingExpirations';

/**
 * Modelo de la vista "Control de bodega" y su traducción al payload de
 * exportación.
 *
 * La página compone UN objeto `WarehouseControlView` y lo usa para dos cosas:
 * alimentar los componentes y armar el request de exportación. Esa es la razón
 * de que el PDF, el Excel y la pantalla digan lo mismo — no hay dos fuentes de
 * datos que puedan divergir.
 */
export interface WarehouseControlView {
  title: string;
  description: string;
  monthProgressLabel: string;
  kpis: WarehouseKpi[];
  bars: WarehouseAccumulationBar[];
  expirations: WarehouseExpirationItem[];
  lots: WarehouseLotRow[];
}

/**
 * Traduce el modelo de la vista al contrato de exportación.
 *
 * Descarta lo que es puramente presentacional (`valueTone`/`noteTone` de los
 * KPIs, `id` de los lotes): el backend deriva los colores del estado, y el
 * `ValidationPipe` de la API corre con `forbidNonWhitelisted`, así que mandar
 * campos de más devolvería 400.
 */
export function buildWarehouseControlExportRequest(
  view: WarehouseControlView,
): WarehouseControlExportRequest {
  return {
    title: view.title,
    description: view.description,
    monthProgressLabel: view.monthProgressLabel,
    kpis: view.kpis.map((kpi) => ({
      label: kpi.label,
      value: kpi.value,
      ...(kpi.secondaryValue === undefined ? {} : { secondaryValue: kpi.secondaryValue }),
      ...(kpi.note === undefined ? {} : { note: kpi.note }),
    })),
    bars: view.bars.map((bar) => ({
      label: bar.label,
      percentage: bar.percentage,
      deviationLabel: bar.deviationLabel,
      valueLabel: bar.valueLabel,
    })),
    expirations: view.expirations.map((item) => ({
      wasteName: item.wasteName,
      intakeDate: item.intakeDate,
      detail: item.detail,
      overdue: item.isOverdue,
    })),
    lots: view.lots.map((lot) => ({
      hazardous: lot.isHazardous,
      category: lot.category,
      wasteType: lot.wasteType,
      quantity: lot.quantity,
      unit: lot.unit,
      elapsedLabel: lot.elapsedLabel,
      status: lot.status,
    })),
  };
}
