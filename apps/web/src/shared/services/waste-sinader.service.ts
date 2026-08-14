import type { ID, ISODateString, WasteType, WasteUnit } from '@aurelia/contracts';
import { httpGet } from './http-client';

/**
 * Lecturas del "Reporte SINADER" (nodo Figma `3830:65385`).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A DIFERENCIA DEL DASHBOARD, ESTOS ENDPOINTS SÍ EXISTEN
 *
 * `apps/api/src/modules/waste/waste.controller.ts` ya expone:
 *
 *   `GET /waste/sinader/periods`      → lista, filtrable por unidad, año, mes y estado
 *   `GET /waste/sinader/periods/:id`  → el período con sus líneas consolidadas
 *
 * Por eso este archivo NO trae un `.mock.ts` al lado, al revés que
 * `waste-dashboard.service.ts`: no hay nada que simular, y un mock acá sólo
 * serviría para tapar un error real del servidor.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * LOS TIPOS DE ABAJO VAN A `@aurelia/contracts`. Viven acá porque
 * `CONTRACTS_GUIDELINES.md` pide PROPONER un contrato nuevo, no agregarlo
 * unilateralmente. Se derivaron de las entidades `WasteSinaderPeriodEntity` y
 * `WasteSinaderPeriodLineEntity` y del `enum WasteSinaderPeriodStatus` de
 * `apps/api/src/modules/waste/waste.enums.ts` —leídas, NO importadas: la web tiene
 * prohibido depender de la API—. Destino sugerido:
 *
 *   `enums/waste-sinader-period-status.enum.ts`
 *   `interfaces/waste-sinader.interface.ts`
 *   `dtos/waste/waste-sinader-period.response.ts`
 */

/**
 * Estado del período. Son los tres valores del enum `waste_sinader_period_status`
 * de Postgres, en minúscula porque así los persiste TypeORM.
 *
 * Es un `type` de strings y no un `enum` de TS a propósito: mientras el contrato no
 * esté en `@aurelia/contracts`, declarar un `enum` acá emitiría un objeto en
 * runtime que después habría que borrar. La unión de literales se borra al
 * compilar y se reemplaza sin migración.
 */
export type WasteSinaderPeriodStatus = 'in_progress' | 'pending_declaration' | 'declared';

/**
 * Referencia a una empresa —transportista o destino— tal como la devuelven los
 * `leftJoin` del endpoint.
 *
 * Es una PROYECCIÓN mínima y no la entidad `Company` completa: el paquete de
 * contratos todavía no modela empresas, y la tabla sólo muestra el nombre. Cuando
 * `Company` entre a `interfaces/`, este alias se reemplaza por él.
 */
export interface WasteSinaderCompanyRef {
  id: ID;
  name: string;
}

/**
 * Una línea del consolidado: la combinación única de residuo, transportista y
 * destino dentro del período. Es una fila de la tabla `3830:65642`.
 */
export interface WasteSinaderPeriodLineResponse {
  id: ID;
  sinaderPeriodId: ID;
  wasteTypeId: ID;
  /**
   * El residuo, del `leftJoinAndSelect` del endpoint. De acá salen el `sinaderCode`
   * y el `name` que arman la segunda línea de la primera columna.
   */
  wasteType: WasteType & {
    /**
     * OPCIONAL porque hoy el endpoint NO la trae: `findSinaderPeriod` pide
     * `relations: { wasteType: true }` sin anidar la categoría. Es lo que dibuja la
     * pastilla de la primera columna (`3830:65648`), así que hay que pedirle al
     * backend que agregue el join. Mientras no llegue, la vista cae a `code`.
     */
    operationalCategory?: { id: ID; code: string; name: string };
  };
  unitId: ID;
  unit: WasteUnit;
  /**
   * `numeric` de Postgres: llega como STRING, no como `number`. Misma razón que en
   * el resto del módulo —el driver preserva la precisión en texto— y acá pesa
   * doble, porque esta cifra va a una declaración reglamentaria.
   */
  quantity: string;
  treatmentType: string | null;
  destinationCompanyId: ID | null;
  destinationCompany: WasteSinaderCompanyRef | null;
  destinationLocationId: ID | null;
  transportCompanyId: ID | null;
  transportCompany: WasteSinaderCompanyRef | null;
  /** Cuántos movimientos se consolidaron en esta línea. */
  movementCount: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** El período, sin sus líneas. Es lo que devuelve el listado. */
export interface WasteSinaderPeriodResponse {
  id: ID;
  businessUnitId: ID;
  periodYear: number;
  /** Mes 1–12, no índice base 0. Así lo guarda la columna `period_month`. */
  periodMonth: number;
  status: WasteSinaderPeriodStatus;
  /** Total del período en kilogramos. String numérico, mismo criterio que `quantity`. */
  totalQuantityKg: string;
  movementCount: number;
  categoryCount: number;
  declaredFolio: string | null;
  declaredAt: ISODateString | null;
  declaredByUserId: ID | null;
  /**
   * Nombre de quien declaró, para el banner del período cerrado (`3830:66121`,
   * "Declarado por Catalina Cortés").
   *
   * OPCIONAL porque hoy el endpoint NO lo trae: la entidad tiene la relación
   * `declaredByUser`, pero ni `findSinaderPeriods` ni `findSinaderPeriod` la
   * incluyen en sus `relations`. Hay que pedirle al backend ese join. Mientras no
   * llegue, la frase del banner arranca "Declarado el …" en vez de "Declarado por
   * …", que sigue siendo cierta.
   */
  declaredByName?: string | null;
  createdAt: ISODateString;
  /**
   * De acá sale el "Última actualización: 28 jul 2026, 08:40" del pie
   * (`3830:65722`): el consolidado se recalcula con cada movimiento, así que el
   * `updatedAt` del período ES la hora del último recálculo.
   */
  updatedAt: ISODateString;
}

/** El período con sus líneas — lo que devuelve `GET /waste/sinader/periods/:id`. */
export interface WasteSinaderPeriodDetailResponse extends WasteSinaderPeriodResponse {
  lines: WasteSinaderPeriodLineResponse[];
}

export interface WasteSinaderPeriodFilters {
  businessUnitId?: ID;
  year?: number;
  /** Mes 1–12. */
  month?: number;
  status?: WasteSinaderPeriodStatus;
}

function buildPeriodsQuery(filters: WasteSinaderPeriodFilters): string {
  const params = new URLSearchParams();
  if (filters.businessUnitId) params.set('businessUnitId', filters.businessUnitId);
  if (filters.year !== undefined) params.set('year', `${filters.year}`);
  if (filters.month !== undefined) params.set('month', `${filters.month}`);
  if (filters.status) params.set('status', filters.status);

  const query = params.toString();
  return query ? `?${query}` : '';
}

/**
 * Períodos SINADER, del más reciente al más antiguo (lo ordena el servidor).
 *
 * El filtro por año y mes lo resuelve el SERVIDOR y no el cliente: el selector de
 * período apunta a un mes concreto, y traerse el histórico completo para descartar
 * todo menos uno sería pedir de más a una tabla que crece un registro por mes y por
 * unidad de negocio.
 */
export const getWasteSinaderPeriods = (filters: WasteSinaderPeriodFilters = {}) =>
  httpGet<WasteSinaderPeriodResponse[]>(`/waste/sinader/periods${buildPeriodsQuery(filters)}`);

/** El período con sus líneas consolidadas. */
export const getWasteSinaderPeriod = (periodId: ID) =>
  httpGet<WasteSinaderPeriodDetailResponse>(
    `/waste/sinader/periods/${encodeURIComponent(periodId)}`,
  );
