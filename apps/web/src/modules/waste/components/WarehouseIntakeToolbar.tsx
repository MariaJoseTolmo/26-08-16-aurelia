import { useState } from 'react';
import { WarehouseExportCaretIcon, WarehouseExportIcon } from '../icons/WarehouseControlIcons';
import { WarehouseActiveFiltersIcon, WarehouseIntakeNewIcon } from '../icons/WarehouseIntakeIcons';
import type { WasteIntakeFilterChip, WasteIntakeFilterKey } from '../wasteIntakeFilters';
import { WarehouseDateFilterField } from './WarehouseDateFilterField';

/**
 * Barra de filtros activos y acciones — nodo `3817:57801`.
 *
 * Geometría del nodo:
 *
 *   fila        flex gap-[12px] items-center w-full
 *   panel izq.  `3817:57802` bg #eff4ff · flex-[1_0_0] · h-[38px]
 *               interior flex gap-[10px] items-center px-[14px] py-[10px]
 *               embudo 12.5 × 10 (#24588b) + "Filtros activos:"
 *               Inter Semi Bold 11px #0d3862
 *   pastilla    `3817:57807` bg #e6f3ff · border #b4d1ed · rounded-[4px]
 *               flex gap-[5px] items-center px-[9px] py-[3px]
 *               texto Inter Semi Bold 10px #0d3862
 *               "×" Arial Regular 10px · leading-[10px] · caja 6 × 10
 *   acciones    `3817:57811` flex gap-[8px] items-center
 *   Exportar    `3817:57812` bg white · border-[1.5px] #d1d1d1 · rounded-[8px]
 *               h-[36px] · flex gap-[6px] items-center px-[13.5px] py-[1.5px]
 *               iconos 15 × 12 y 12.5 × 10 · label Inter Semi Bold 12px #333
 *   Nueva rec.  `3817:57823` bg #c8a064 · rounded-[6px]
 *               flex gap-[7px] items-center px-[16px] py-[10.5px]
 *               icono 15 × 12 · label Inter Bold 12px white
 *
 * El panel izquierdo no lleva radio en el nodo: es un rectángulo a sangre que
 * ocupa el ancho restante.
 *
 * La pastilla de fecha (`3817:57807`) es un BOTÓN: al hacer click despliega, en
 * su lugar, el campo de fecha que filtra la tabla. La "×" limpia el filtro y deja
 * el campo desplegado y vacío, no esconde la barra.
 *
 * El panel azul solo desaparece cuando no hay filtro NI campo abierto —el estado
 * en que también lo esconde `ActiveFiltersBar` de `InspectionsManagementView`, el
 * mismo patrón de esta app—, y a esa altura el filtro de la columna "Fecha de
 * ingreso" sigue siendo la otra vía para volver a filtrar.
 */

interface WarehouseIntakeToolbarProps {
  /** Pastillas de filtro aplicadas, en el orden en que se muestran. */
  activeFilters: WasteIntakeFilterChip[];
  /** Fecha de ingreso aplicada, en ISO `yyyy-mm-dd`. */
  entryDate: string | null;
  onFilterChange: (key: WasteIntakeFilterKey, value: string | null) => void;
  onExport?: () => void;
  onNewIntake?: () => void;
}

export function WarehouseIntakeToolbar({
  activeFilters,
  entryDate,
  onFilterChange,
  onExport,
  onNewIntake,
}: WarehouseIntakeToolbarProps) {
  const [editingKey, setEditingKey] = useState<WasteIntakeFilterChip['key'] | null>(null);
  const editingDate = editingKey === 'entryDate';

  /**
   * El campo desplegado se repliega solo si quedó una fecha aplicada. Con el
   * filtro vacío se queda abierto a propósito: es lo único que hay para elegir
   * otra fecha, y esconderlo dejaría al usuario sin manera de volver a filtrar
   * desde esta barra.
   */
  function collapseIfApplied() {
    if (entryDate) setEditingKey(null);
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-[12px]">
      {activeFilters.length > 0 || editingDate ? (
        <div className="flex min-w-0 flex-1 items-center gap-[10px] bg-[#eff4ff] px-[14px] py-[10px]">
          <div className="flex shrink-0 items-center gap-[6px]">
            <WarehouseActiveFiltersIcon className="block h-[10px] w-[12.5px] shrink-0 text-[#24588b]" />
            <p className="whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold not-italic leading-[normal] text-[#0d3862]">
              Filtros activos:
            </p>
          </div>
          {editingDate ? (
            <WarehouseDateFilterField
              autoFocus
              className="w-[140px] shrink-0"
              label="Fecha de ingreso"
              value={entryDate}
              onChange={(value) => {
                onFilterChange('entryDate', value);
                if (value) setEditingKey(null);
              }}
              onDismiss={collapseIfApplied}
              onKeyDown={(event) => {
                if (event.key === 'Escape' || event.key === 'Enter') collapseIfApplied();
              }}
            />
          ) : null}
          {activeFilters.map((filter) =>
            /*
             * La pastilla de fecha se reemplaza por su campo mientras se edita;
             * las demás se limpian con la "×" y se cambian desde el selector de
             * su columna, que es donde el diseño pone las alternativas.
             */
            filter.key === 'entryDate' && editingDate ? null : (
              <WarehouseActiveFilterChip
                key={filter.key}
                label={filter.label}
                onEdit={filter.key === 'entryDate' ? () => setEditingKey(filter.key) : undefined}
                onRemove={() => {
                  onFilterChange(filter.key, null);
                  // La "×" de la fecha deja el campo desplegado y vacío, para
                  // elegir otra sin tener que volver a abrirlo.
                  if (filter.key === 'entryDate') setEditingKey(filter.key);
                }}
              />
            ),
          )}
        </div>
      ) : null}
      <div className="ml-auto flex shrink-0 items-center gap-[8px]">
        <button
          type="button"
          onClick={onExport}
          className="flex h-[36px] shrink-0 items-center gap-[6px] rounded-[8px] border-[1.5px] border-solid border-[#d1d1d1] bg-white px-[13.5px] py-[1.5px] transition-colors hover:bg-[#f7f7f7]"
        >
          {/*
            Alto natural del asset (12.4219) en vez de los 12px de la caja: con 12px
            `preserveAspectRatio` encogería el glifo a 14.49px de ancho. El nodo
            `3817:57813` también lo desborda, con `inset-[0_0_-3.52%_0]`.
          */}
          <WarehouseExportIcon className="block h-[12.4219px] w-[15px] shrink-0 text-[#333333]" />
          <span className="whitespace-nowrap text-center font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold not-italic leading-[normal] text-[#333333]">
            Exportar
          </span>
          <WarehouseExportCaretIcon className="block h-[10px] w-[12.5px] shrink-0 text-[#131313]" />
        </button>
        <button
          type="button"
          onClick={onNewIntake}
          className="flex shrink-0 items-center gap-[7px] rounded-[6px] bg-[#c8a064] px-[16px] py-[10.5px] transition-colors hover:bg-[#bb9057]"
        >
          <WarehouseIntakeNewIcon className="block h-[12px] w-[15px] shrink-0 text-white" />
          <span className="whitespace-nowrap text-center font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] text-white">
            Nueva recepción a bodega
          </span>
        </button>
      </div>
    </div>
  );
}

function WarehouseActiveFilterChip({
  label,
  onEdit,
  onRemove,
}: {
  label: string;
  /** Sin `onEdit` la etiqueta es texto: solo los filtros editables en la barra lo traen. */
  onEdit?: () => void;
  onRemove: () => void;
}) {
  const labelClass =
    "whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold not-italic leading-[normal] text-[#0d3862]";

  return (
    <span className="flex shrink-0 items-center gap-[5px] rounded-[4px] border border-solid border-[#b4d1ed] bg-[#e6f3ff] px-[9px] py-[3px]">
      {onEdit ? (
        <button type="button" onClick={onEdit} className={labelClass}>
          {label}
        </button>
      ) : (
        <span className={labelClass}>{label}</span>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar filtro ${label}`}
        className="flex w-[6px] shrink-0 flex-col items-center justify-center"
      >
        {/*
          El nodo `3817:57810` usa Arial y no Inter: es el glifo "×" del set del
          sistema, con leading igual a su tamaño para que quede centrado en 10px.
        */}
        <span aria-hidden className="whitespace-nowrap text-center font-['Arial',sans-serif] text-[10px] font-normal not-italic leading-[10px] text-[#0d3862]">
          ×
        </span>
      </button>
    </span>
  );
}
