import { useState } from 'react';
import type { WasteExportFormat } from '../../../shared/services/waste-warehouse-export.service';
import type { WasteWithdrawalFilterChip, WasteWithdrawalFilterKey } from '../wasteWithdrawalFilters';
import { WarehouseExportButton, type WarehouseExportOption } from './WarehouseExportButton';
import { WarehouseMonthFilterField } from './WarehouseMonthFilterField';
import { WasteActiveFilterChip, WasteActiveFiltersPanel } from './WasteActiveFiltersPanel';
import { WastePrimaryActionButton } from './WastePrimaryActionButton';

/**
 * Barra de filtros activos y acciones de "Solicitud de retiro" — nodo
 * `3817:55645`.
 *
 *   fila  flex gap-[12px] items-center w-full
 *
 * Es el mismo componente que `3817:57801` en "Ingresos a bodega": panel, pastilla
 * y botón dorado salen de `WasteActiveFiltersPanel`, `WasteActiveFilterChip` y
 * `WastePrimaryActionButton`, y los cuatro iconos son los mismos assets —los SVG
 * que devuelve el nodo son byte a byte idénticos a los que ya viven en
 * `modules/waste/icons/`—.
 *
 * Dos diferencias reales contra la barra de ingresos:
 *
 * 1. El rótulo del botón dorado es "Nueva solicitud" (`3817:55665`).
 * 2. La pastilla filtra por MES, no por fecha: el nodo `3817:55652` dice "Mes
 *    actual [Nombre del mes]", y la columna "PERIODO" de la tabla `3817:55311`
 *    muestra un selector de mes. Por eso el campo que se despliega al editarla
 *    es `WarehouseMonthFilterField` y no `WarehouseDateFilterField`.
 *
 * El resto del comportamiento se mantiene idéntico a propósito, porque el
 * usuario ve la misma barra en las dos vistas: la pastilla es un BOTÓN que
 * despliega su campo en el lugar, la "×" limpia el filtro y deja el campo
 * abierto y vacío —es la única forma de volver a elegir sin reabrirlo—, y el
 * panel azul solo desaparece cuando no hay filtro NI campo abierto.
 */

/** Sin PDF por ahora, igual que "Ingresos a bodega". El caret abre el menú igual. */
const EXPORT_OPTIONS: WarehouseExportOption[] = [{ format: 'xlsx', label: 'Descargar Excel' }];

interface WasteWithdrawalToolbarProps {
  /** Pastillas de filtro aplicadas, en el orden en que se muestran. */
  activeFilters: WasteWithdrawalFilterChip[];
  /** Período aplicado, en mes ISO `yyyy-mm`. */
  period: string | null;
  /** Lectura única de "hoy" de la vista, para los años que ofrece el selector. */
  today: Date;
  onFilterChange: (key: WasteWithdrawalFilterKey, value: string | null) => void;
  onExport?: () => void;
  /** Formato en curso, para bloquear el botón mientras la API responde. */
  exporting?: WasteExportFormat | null;
  /** Mensaje de error de la última exportación fallida. */
  exportError?: string | null;
  /**
   * Bloquea "Exportar" mientras la vista no tenga filas que exportar. Se cae
   * solo cuando entre la tabla `3817:55311`.
   */
  exportDisabled?: boolean;
  onNewRequest?: () => void;
}

export function WasteWithdrawalToolbar({
  activeFilters,
  period,
  today,
  onFilterChange,
  onExport,
  exporting = null,
  exportError = null,
  exportDisabled = false,
  onNewRequest,
}: WasteWithdrawalToolbarProps) {
  const [editingKey, setEditingKey] = useState<WasteWithdrawalFilterKey | null>(null);
  const editingPeriod = editingKey === 'period';

  return (
    <div className="flex w-full flex-wrap items-center gap-[12px]">
      {activeFilters.length > 0 || editingPeriod ? (
        <WasteActiveFiltersPanel>
          {editingPeriod ? (
            <WarehouseMonthFilterField
              className="w-[160px] shrink-0"
              label="Período"
              placeholder="Seleccione período"
              today={today}
              value={period}
              onChange={(value) => {
                onFilterChange('period', value);
                // Elegir un mes repliega el campo; vaciarlo lo deja abierto,
                // que es lo único que queda para volver a filtrar desde acá.
                if (value) setEditingKey(null);
              }}
            />
          ) : null}
          {activeFilters.map((filter) =>
            filter.key === 'period' && editingPeriod ? null : (
              <WasteActiveFilterChip
                key={filter.key}
                label={filter.label}
                onEdit={filter.key === 'period' ? () => setEditingKey(filter.key) : undefined}
                onRemove={() => {
                  onFilterChange(filter.key, null);
                  if (filter.key === 'period') setEditingKey(filter.key);
                }}
              />
            ),
          )}
        </WasteActiveFiltersPanel>
      ) : null}
      <div className="ml-auto flex shrink-0 items-center gap-[8px]">
        <WarehouseExportButton
          options={EXPORT_OPTIONS}
          onExport={() => onExport?.()}
          exporting={exporting}
          disabled={exportDisabled}
          disabledHint="La exportación estará disponible cuando se integre la tabla de retiros."
        />
        <WastePrimaryActionButton label="Nueva solicitud" onClick={onNewRequest} />
      </div>
      {/* `w-full` dentro del `flex-wrap`: el error baja a su propia línea. */}
      {exportError ? (
        <p role="alert" className="w-full font-['Inter:Regular',sans-serif] text-[11.5px] font-normal text-[#bd3b5b]">
          {exportError}
        </p>
      ) : null}
    </div>
  );
}
