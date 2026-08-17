import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DeclareWasteSinaderPeriodRequest, WasteSinaderExportRequest } from '@aurelia/contracts';
import {
  downloadWasteSinaderExport,
  type WasteExportFormat,
} from '../services/waste-warehouse-export.service';
import {
  declareWasteSinaderPeriod,
  getWasteSinaderPeriod,
  getWasteSinaderPeriods,
  type WasteSinaderPeriodFilters,
} from '../services/waste-sinader.service';

/**
 * Lecturas del "Reporte SINADER" (nodo Figma `3830:65385`).
 *
 * Son DOS queries y no una porque son dos endpoints: el listado resuelve qué
 * período corresponde al mes elegido y el detalle trae sus líneas. La segunda
 * depende de la primera, así que va con `enabled`.
 *
 * Podría haber sido una sola lectura encadenada dentro de un `queryFn`, pero
 * entonces el listado —que es el mismo para cualquier mes del año y cambia poco—
 * se volvería a pedir con cada cambio de selector. Separadas, TanStack Query
 * cachea cada una por su cuenta.
 */

/**
 * Períodos del mes indicado.
 *
 * `isoMonth` es `yyyy-mm`, el mismo formato que usa el filtro "Período" del resto
 * del módulo (`wasteMonthFilter`). Se parte acá y no en el componente porque lo que
 * viaja al servidor son dos números.
 */
export function useWasteSinaderPeriods(filters: WasteSinaderPeriodFilters) {
  return useQuery({
    queryKey: ['waste', 'sinader', 'periods', filters],
    queryFn: () => getWasteSinaderPeriods(filters),
  });
}

/**
 * El período con sus líneas.
 *
 * SIN `staleTime`, al revés de las lecturas mensuales cerradas del dashboard: el
 * consolidado del mes en curso sube con cada movimiento no peligroso que se
 * registra, y es justo el número que el aprobador va a declarar. Un dato cacheado
 * acá le mostraría un total que ya no es el que va al informe.
 *
 * `periodId` puede venir `undefined` mientras el listado resuelve, o quedar así
 * para siempre si el mes elegido todavía no tiene período abierto. `enabled` evita
 * la llamada en los dos casos.
 */
export function useWasteSinaderPeriod(periodId: string | undefined) {
  return useQuery({
    queryKey: ['waste', 'sinader', 'period', periodId],
    queryFn: () => getWasteSinaderPeriod(periodId as string),
    enabled: periodId !== undefined,
  });
}

interface WasteSinaderExportInput {
  format: WasteExportFormat;
  payload: WasteSinaderExportRequest;
}

/**
 * Exporta el consolidado a PDF o Excel.
 *
 * `useMutation` y no `useQuery`, igual que `useWarehouseControlExport`: no hay
 * estado del servidor que cachear ni revalidar, es una acción del usuario. El hook
 * aporta `isPending`, `variables` y `error`, que el botón usa para su estado de
 * "generando" y para el mensaje de fallo. No invalida nada porque exportar no
 * modifica datos.
 */
export function useWasteSinaderExport() {
  return useMutation({
    mutationFn: ({ format, payload }: WasteSinaderExportInput) =>
      downloadWasteSinaderExport(format, payload),
  });
}

/**
 * Marca el período como declarado.
 *
 * Invalida las DOS lecturas y no sólo el detalle: el listado trae el `status` que
 * decide el estado de toda la vista —descripción, banner, KPIs, botón—, así que si
 * quedara cacheado la pantalla seguiría mostrándose pendiente con el período ya
 * cerrado en la base.
 */
export function useDeclareWasteSinaderPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ periodId, input }: { periodId: string; input: DeclareWasteSinaderPeriodRequest }) =>
      declareWasteSinaderPeriod(periodId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['waste', 'sinader'] });
    },
  });
}
