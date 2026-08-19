import { useState } from 'react';
import type { WasteExportFormat } from '../../../shared/services/waste-warehouse-export.service';
import type { WasteIntakeFilterChip, WasteIntakeFilterKey } from '../wasteIntakeFilters';
import { WarehouseDateFilterField } from './WarehouseDateFilterField';
import { WarehouseExportButton, type WarehouseExportOption } from './WarehouseExportButton';
import { WasteActiveFilterChip, WasteActiveFiltersPanel } from './WasteActiveFiltersPanel';
import { WastePrimaryActionButton } from './WastePrimaryActionButton';

/**
 * Barra de filtros activos y acciones — nodo `3817:57801`.
 *
 * La maqueta está repartida en tres piezas compartidas con "Solicitud de retiro"
 * (nodo `3817:55645`, que es el mismo componente): `WasteActiveFiltersPanel`,
 * `WasteActiveFilterChip` y `WastePrimaryActionButton`. Acá queda la fila que las
 * ordena y, sobre todo, la lógica propia de esta vista.
 *
 *   fila  flex gap-[12px] items-center w-full
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

/**
 * Una sola alternativa: esta vista todavía no tiene versión PDF. El caret del
 * diseño igual abre el menú, y sumar el PDF será agregar una línea acá.
 */
const EXPORT_OPTIONS: WarehouseExportOption[] = [{ format: 'xlsx' }];

interface WarehouseIntakeToolbarProps {
  /** Pastillas de filtro aplicadas, en el orden en que se muestran. */
  activeFilters: WasteIntakeFilterChip[];
  /** Fecha de ingreso aplicada, en ISO `yyyy-mm-dd`. */
  entryDate: string | null;
  onFilterChange: (key: WasteIntakeFilterKey, value: string | null) => void;
  /** Exporta a Excel las filas que están pasando el filtro. */
  onExport?: () => void;
  /** Formato en curso, para bloquear el botón mientras la API responde. */
  exporting?: WasteExportFormat | null;
  /** Mensaje de error de la última exportación fallida. */
  exportError?: string | null;
  onNewIntake?: () => void;
}

export function WarehouseIntakeToolbar({
  activeFilters,
  entryDate,
  onFilterChange,
  onExport,
  exporting = null,
  exportError = null,
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
        <WasteActiveFiltersPanel>
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
              <WasteActiveFilterChip
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
        </WasteActiveFiltersPanel>
      ) : null}
      <div className="ml-auto flex shrink-0 items-center gap-[8px]">
        <WarehouseExportButton options={EXPORT_OPTIONS} onExport={() => onExport?.()} exporting={exporting} />
        <WastePrimaryActionButton label="Nueva recepción a bodega" onClick={onNewIntake} />
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
