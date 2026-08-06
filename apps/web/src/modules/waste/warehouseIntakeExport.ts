import type { WarehouseIntakeExportRequest } from '@aurelia/contracts';
import { formatIsoAsDdMmYyyy, type WasteIntakeFilterChip } from './wasteIntakeFilters';
import type { WarehouseIntakeRow } from './wasteIntakeRows';

/**
 * Modelo de la vista "Ingresos a bodega" y su traducción al payload de
 * exportación.
 *
 * Mismo criterio que `warehouseControlExport`: la página compone UN objeto y lo
 * usa para dos cosas —alimentar los componentes y armar el request—, así que la
 * planilla no puede decir algo distinto de la pantalla.
 *
 * Lo que se exporta son las filas YA FILTRADAS, junto con las pastillas de
 * filtro tal como se leen. Sin esa lista, un Excel con 4 de 6 ingresos no
 * explica por qué faltan los otros dos.
 */
export interface WarehouseIntakeView {
  title: string;
  description: string;
  activeFilters: WasteIntakeFilterChip[];
  rows: WarehouseIntakeRow[];
}

export function buildWarehouseIntakeExportRequest(view: WarehouseIntakeView): WarehouseIntakeExportRequest {
  return {
    title: view.title,
    description: view.description,
    activeFilters: view.activeFilters.map((chip) => chip.label),
    rows: view.rows.map((row) => ({
      // La fecha se formatea acá, no en el servidor: el Excel muestra el mismo
      // `dd-mm-aaaa` que la tabla, sin depender del locale del proceso Node.
      entryDate: formatIsoAsDdMmYyyy(row.entryDate),
      category: row.category,
      wasteType: row.wasteType,
      quantity: toExportQuantity(row.quantity),
      unit: row.unit,
      origin: row.origin,
      plate: row.plate,
      driver: row.driver,
      hazardous: row.isHazardous,
    })),
  };
}

/**
 * La cantidad viaja como NÚMERO —no como el texto que se ve en pantalla— para
 * que la columna se pueda sumar y ordenar en la planilla. Es la misma excepción
 * que hace "Control de bodega" con el porcentaje de sus barras.
 *
 * `0` ante un valor no numérico en vez de romper la exportación: el dato llega
 * como string desde la API (`numeric` de Postgres) y un registro corrupto no
 * debería impedir bajar el resto de la tabla. El `@IsNumber()` del DTO rechaza
 * `NaN`, así que sin esta red la descarga entera fallaría con un 400.
 */
function toExportQuantity(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
