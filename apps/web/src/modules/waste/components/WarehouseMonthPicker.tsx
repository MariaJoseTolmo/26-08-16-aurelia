import { useState } from 'react';
import { WarehouseMonthPickerChevronIcon } from '../icons/WarehouseMonthPickerIcons';
import {
  buildIsoMonth,
  buildPickerYears,
  formatIsoMonthLabel,
  parseIsoMonth,
  WASTE_MONTH_SHORT_LABELS,
} from '../wasteMonthFilter';

/**
 * Selector de período — nodo Figma `4068:75846`.
 *
 * Geometría del nodo:
 *
 *   tarjeta     bg white · rounded-[8px] · p-[16px] · gap-[12px]
 *               drop-shadow-[0px_4px_7.5px_#cfd8de] · 280 × 334
 *   encabezado  `4068:75847` flex items-center w-full
 *               `4068:75848` flex gap-[8px] items-center
 *               "Mayo 2026" Inter Semi Bold 14px #00082d
 *               chevron `4068:75850` caja 24 × 24 · rounded-[4px] · glifo 12 × 7.41
 *   cuerpo      `4068:75851` flex flex-col gap-[8px] w-full
 *   barra año   `4068:75852` bg #eceff2 · border-b #cfd8de · p-[7.5px] · w-full
 *               Inter Semi Bold 14px #27323a
 *   grilla      `4068:75856` flex flex-col gap-[8px]
 *               fila   flex gap-[4px] · 248px
 *               celda  flex-[1_0_0] · min-w-px · p-[7.5px] · 59 × 30
 *                      Inter Bold 12px #27323a
 *   seleccionado `4068:75898` bg #07f · border-2 #0062d3 · rounded-[2px] · texto white
 *
 * OJO, NO ES UN CALENDARIO DE DÍAS. Los subcomponentes se llaman "Días del mes",
 * "Semanas" y "01-Días", pero su contenido son MESES: el diseño reutilizó la
 * celda de día del UI Kit para dibujar la grilla de meses. Por eso el valor de
 * este control es un mes ISO `yyyy-mm` y no una fecha.
 *
 * ACORDEÓN POR AÑO: el nodo muestra 2026 desplegado —el año del valor
 * seleccionado— y 2025 / 2024 / 2023 colapsados como barras. Solo hay un año
 * abierto a la vez; es lo único compatible con el alto de 334px del nodo.
 *
 * POR QUÉ EL BORDE VA COMO `outline`: en Figma el trazo del mes seleccionado es
 * interior y la celda mide 30px de alto igual que las demás. Un `border-2` de
 * Tailwind se come 4px del padding y desalinea la fila, así que el anillo se
 * dibuja con `outline` + `-outline-offset-2`, que no ocupa espacio de layout.
 *
 * Es un componente controlado y sin estado de datos: recibe el mes aplicado y
 * avisa el nuevo. Quién lo abre y dónde se posiciona es problema de quien lo use
 * (ver `WarehouseMonthFilterField`).
 */

/** Las 12 celdas del nodo se dibujan en 3 filas de 4. */
const MONTHS_PER_ROW = 4;

const MONTH_ROWS = Array.from({ length: WASTE_MONTH_SHORT_LABELS.length / MONTHS_PER_ROW }, (_, rowIndex) =>
  WASTE_MONTH_SHORT_LABELS.slice(rowIndex * MONTHS_PER_ROW, rowIndex * MONTHS_PER_ROW + MONTHS_PER_ROW),
);

interface WarehouseMonthPickerProps {
  /** Mes aplicado en ISO `yyyy-mm`, o `null` cuando el filtro está vacío. */
  value: string | null;
  onChange: (value: string) => void;
  /**
   * Fecha desde la que se cuentan los años ofrecidos. Se recibe en vez de leer
   * el reloj acá: `new Date()` en render es impuro y la vista ya tiene UNA
   * lectura de "hoy" que manda sobre todo lo demás.
   */
  today: Date;
  /** Cierra el selector. Es lo que dispara el chevron del encabezado. */
  onClose?: () => void;
  /** Texto del encabezado cuando todavía no hay mes elegido. */
  emptyLabel?: string;
  className?: string;
}

export function WarehouseMonthPicker({
  value,
  onChange,
  today,
  onClose,
  emptyLabel = 'Seleccione período',
  className = '',
}: WarehouseMonthPickerProps) {
  const selected = value ? parseIsoMonth(value) : null;
  const years = buildPickerYears(today);

  /**
   * Arranca desplegado el año del valor aplicado, como el nodo. Si el valor no
   * cae en el rango ofrecido —o no hay valor— se despliega el año más reciente,
   * que es el que el usuario va a querer casi siempre.
   */
  const [expandedYear, setExpandedYear] = useState(() =>
    selected && years.includes(selected.year) ? selected.year : years[0],
  );

  const headerLabel = formatIsoMonthLabel(value) ?? emptyLabel;

  return (
    <div
      data-name="Selector de período"
      className={`flex w-[280px] flex-col items-start gap-[12px] rounded-[8px] bg-white p-[16px] drop-shadow-[0px_4px_7.5px_#cfd8de] ${className}`}
    >
      <div className="flex w-full items-center">
        <div className="flex shrink-0 items-center justify-center gap-[8px]">
          <p className="whitespace-nowrap text-center font-['Inter:Semi_Bold',sans-serif] text-[14px] font-semibold not-italic leading-[normal] text-[#00082d]">
            {headerLabel}
          </p>
          {/*
            El chevron del nodo apunta hacia abajo y es la única affordance de
            cierre que dibuja el diseño. Sin `onClose` no se renderiza como botón
            para no ofrecer un control que no hace nada.
          */}
          <button
            type="button"
            onClick={onClose}
            disabled={!onClose}
            aria-label="Cerrar selector de período"
            className="flex size-[24px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] transition-colors enabled:hover:bg-[#eceff2] disabled:cursor-default"
          >
            <WarehouseMonthPickerChevronIcon className="block h-[7.41px] w-[12px] shrink-0 text-[#00082d]" />
          </button>
        </div>
      </div>

      <div data-name="Meses del año" className="flex w-full flex-col items-start gap-[8px]">
        {years.map((year) => (
          <YearSection
            key={year}
            year={year}
            expanded={year === expandedYear}
            selectedMonthIndex={selected?.year === year ? selected.monthIndex : null}
            onToggle={() => setExpandedYear(year)}
            onSelectMonth={(monthIndex) => onChange(buildIsoMonth(year, monthIndex))}
          />
        ))}
      </div>
    </div>
  );
}

function YearSection({
  year,
  expanded,
  selectedMonthIndex,
  onToggle,
  onSelectMonth,
}: {
  year: number;
  expanded: boolean;
  /** Índice base 0 del mes elegido, solo si cae en ESTE año. */
  selectedMonthIndex: number | null;
  onToggle: () => void;
  onSelectMonth: (monthIndex: number) => void;
}) {
  const gridId = `waste-month-picker-${year}`;

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={expanded ? gridId : undefined}
        className="flex w-full flex-col items-start justify-center border-b border-solid border-[#cfd8de] bg-[#eceff2] p-[7.5px] transition-colors hover:bg-[#e2e6ea]"
      >
        <span className="whitespace-nowrap text-center font-['Inter:Semi_Bold',sans-serif] text-[14px] font-semibold not-italic leading-[normal] text-[#27323a]">
          {year}
        </span>
      </button>

      {expanded ? (
        <div id={gridId} className="flex w-full flex-col items-start gap-[8px]">
          {MONTH_ROWS.map((row, rowIndex) => (
            <div key={row[0]} className="flex w-full items-start gap-[4px]">
              {row.map((label, columnIndex) => {
                const monthIndex = rowIndex * MONTHS_PER_ROW + columnIndex;
                const isSelected = monthIndex === selectedMonthIndex;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onSelectMonth(monthIndex)}
                    aria-pressed={isSelected}
                    aria-label={`${label} ${year}`}
                    className={`flex min-w-px flex-[1_0_0] flex-col items-center justify-center rounded-[2px] p-[7.5px] transition-colors ${
                      isSelected
                        ? 'bg-[#07f] outline outline-2 -outline-offset-2 outline-[#0062d3]'
                        : 'hover:bg-[#eceff2]'
                    }`}
                  >
                    <span
                      className={`whitespace-nowrap text-center font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] ${
                        isSelected ? 'text-white' : 'text-[#27323a]'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
