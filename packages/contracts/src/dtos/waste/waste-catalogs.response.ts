import type { WasteOperationalCategory, WasteType, WasteUnit } from '../../interfaces';

/**
 * Respuestas de los tres catálogos de residuos.
 *
 * `GET /waste/types` hace `leftJoinAndSelect` de la categoría y de la unidad por
 * defecto, así que las trae anidadas. Van OPCIONALES porque el join es del
 * endpoint, no del modelo: quien consuma otra lectura de `waste_types` no tiene
 * por qué recibirlas.
 */

export type WasteUnitResponse = WasteUnit;

export type WasteOperationalCategoryResponse = WasteOperationalCategory;

export interface WasteTypeResponse extends WasteType {
  operationalCategory?: WasteOperationalCategoryResponse;
  defaultUnit?: WasteUnitResponse | null;
}
