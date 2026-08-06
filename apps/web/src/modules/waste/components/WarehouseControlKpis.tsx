/**
 * Fila de KPIs — nodos `3686:25707` (contenedor) y `3686:25708` / `25713` /
 * `25720` / `25727` (tarjetas).
 *
 *   contenedor  flex gap-[16px] items-start w-full
 *   tarjeta     bg white · border #e3e3e3 · rounded-[10px] · flex-[1_0_0]
 *               interior px-[19px] py-[17px]
 *   rótulo      Inter Semi Bold 11px · #646464
 *   valor       Inter Bold 24px · wrapper pt-[6px]
 *   nota        Inter Semi Bold 11px
 *
 * El número y la nota llevan colores INDEPENDIENTES, y no siempre coinciden:
 *
 *   Lotes en bodega             valor #131313
 *   Cerca del límite (5 meses)  valor #e8720c · nota #e8720c
 *   Vencidos (6 meses)          valor #bd3b5b · nota #570b1d   (red/500 vs red/900)
 *   Ingresos vs. retiros (mes)  valor #131313 · separador #acacac · nota #e8720c
 *
 * En Figma el valor y la nota van con posición absoluta (`left-0 top-0` y
 * `left-[23.12px] top-[13px]`). Acá se resuelven con `flex items-baseline`,
 * que reproduce la misma alineación sin anclar píxeles.
 */

const NEUTRAL_VALUE_COLOR = '#131313';
/** `gray/500` del nodo `3686:25733`, para el separador "/". */
const SEPARATOR_COLOR = '#acacac';

export interface WarehouseKpi {
  label: string;
  value: string;
  /** Segundo valor, para la tarjeta "Ingresos vs. retiros (mes)": 9 / 7. */
  secondaryValue?: string;
  /** Texto secundario junto al valor. Ausente en la primera tarjeta. */
  note?: string;
  /** Color de los números. Por defecto el gris del diseño. */
  valueTone?: string;
  /** Color de la nota. Por defecto hereda el de los números. */
  noteTone?: string;
}

export const WAREHOUSE_KPI_DEFAULTS: WarehouseKpi[] = [
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
  kpis?: WarehouseKpi[];
}

export function WarehouseControlKpis({ kpis = WAREHOUSE_KPI_DEFAULTS }: WarehouseControlKpisProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-[16px] sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <WarehouseKpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  );
}

function WarehouseKpiCard({ kpi }: { kpi: WarehouseKpi }) {
  const valueColor = kpi.valueTone ?? NEUTRAL_VALUE_COLOR;
  const noteColor = kpi.noteTone ?? valueColor;

  return (
    <div className="flex flex-col items-start rounded-[10px] border border-solid border-[#e3e3e3] bg-white px-[19px] py-[17px]">
      <p className="w-full whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold not-italic leading-[normal] text-[#646464]">
        {kpi.label}
      </p>
      <div className="flex w-full flex-wrap items-baseline gap-[6px] pt-[6px]">
        <span
          className="font-['Inter:Bold',sans-serif] text-[24px] font-bold not-italic leading-[normal]"
          style={{ color: valueColor }}
        >
          {kpi.value}
        </span>
        {kpi.secondaryValue ? (
          <>
            <span
              className="font-['Inter:Regular',sans-serif] text-[14px] font-normal leading-[normal]"
              style={{ color: SEPARATOR_COLOR }}
            >
              /
            </span>
            <span
              className="font-['Inter:Bold',sans-serif] text-[24px] font-bold not-italic leading-[normal]"
              style={{ color: valueColor }}
            >
              {kpi.secondaryValue}
            </span>
          </>
        ) : null}
        {kpi.note ? (
          <span
            className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold not-italic leading-[normal]"
            style={{ color: noteColor }}
          >
            {kpi.note}
          </span>
        ) : null}
      </div>
    </div>
  );
}
