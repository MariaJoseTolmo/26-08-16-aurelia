import type { RecordStatus } from '../enums';
import type { ID } from '../types/common';
import type { BaseEntity } from './entity.interface';

/**
 * Catálogos del módulo de residuos.
 *
 * Son la forma de las tablas `waste_units`, `waste_operational_categories` y
 * `waste_types`, que hoy sirven `GET /waste/units`, `/waste/categories` y
 * `/waste/types`. Hasta ahora el paquete solo tenía los request de exportación
 * de residuos, así que la web no podía tipar esas tres lecturas sin redefinir
 * los modelos por su cuenta.
 */

export interface WasteUnit extends BaseEntity {
  code: string;
  name: string;
  symbol: string | null;
  /**
   * `numeric` de Postgres. Llega como STRING, no como `number`: la columna no
   * tiene transformer en TypeORM y el driver preserva la precisión en texto.
   */
  conversionToKg: string | null;
  status: RecordStatus;
}

export interface WasteOperationalCategory extends BaseEntity {
  code: string;
  name: string;
  description: string | null;
  /**
   * Peligrosidad por defecto de la categoría. La peligrosidad efectiva de un
   * ingreso la manda `WasteType.isHazardous`, que es propiedad del residuo.
   */
  defaultHazardous: boolean;
  sortOrder: number;
  status: RecordStatus;
}

export interface WasteType extends BaseEntity {
  operationalCategoryId: ID;
  defaultUnitId: ID | null;
  code: string;
  name: string;
  description: string | null;
  isHazardous: boolean;
  sidrepCode: string | null;
  sinaderCode: string | null;
  storageLimitDays: number | null;
  warningBeforeDays: number;
  requiresSidrep: boolean;
  requiresSinader: boolean;
  requiresHds: boolean;
  requiresVehiclePhotos: boolean;
  metadata: Record<string, unknown> | null;
  status: RecordStatus;
}
