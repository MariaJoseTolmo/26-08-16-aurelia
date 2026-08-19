import type {
  SectorResponse,
  WasteOperationalCategoryResponse,
  WasteTypeResponse,
  WasteUnitResponse,
} from '@aurelia/contracts';
import { httpGet } from './http-client';

/**
 * Catálogos que alimentan los selectores del formulario "Registrar ingreso a
 * Bodega" (nodo Figma `3564:1787`).
 *
 * Los cuatro selectores del diseño tienen endpoint real y ninguno inventa datos:
 *
 *   Categoría operativa       → `GET /waste/categories`
 *   Residuo específico        → `GET /waste/types?categoryId=`
 *   Unidad de medida          → `GET /waste/units`
 *   Lugar/sector proveniente  → `GET /organization/sectors`
 *
 * El sector NO sale del módulo de residuos: `waste_receipts.origin_sector_id`
 * apunta a la tabla `sectors` de organización, así que se lee de su endpoint y
 * se tipa con el `SectorResponse` que ya existe en contracts.
 */

export const listWasteCategories = () =>
  httpGet<WasteOperationalCategoryResponse[]>('/waste/categories');

export const listWasteUnits = () => httpGet<WasteUnitResponse[]>('/waste/units');

/**
 * Residuos del catálogo, opcionalmente acotados a una categoría.
 *
 * El filtrado lo hace el servidor y no el cliente a propósito: `waste_types`
 * crece con el catálogo del cliente y traerlo entero para descartar la mayoría
 * en memoria escala mal. El endpoint ya acepta `categoryId`.
 */
export const listWasteTypes = (categoryId?: string | null) =>
  httpGet<WasteTypeResponse[]>(
    categoryId ? `/waste/types?categoryId=${encodeURIComponent(categoryId)}` : '/waste/types',
  );

export const listOriginSectors = () => httpGet<SectorResponse[]>('/organization/sectors');
