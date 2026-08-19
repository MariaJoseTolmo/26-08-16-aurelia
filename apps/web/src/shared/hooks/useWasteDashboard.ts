import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  dismissWasteDashboardAlert,
  getWasteDashboardAlerts,
  getWasteDashboardKpis,
  getWasteNonHazardousWithdrawals,
  getWasteRcaThresholds,
} from '../services/waste-dashboard.service';

/**
 * Lecturas del "Dashboard Residuos" (nodo Figma `3086:13957`).
 *
 * Un hook por bloque de la pantalla, con la query key describiendo recurso +
 * filtros, como el resto de `shared/hooks`.
 */

/**
 * Meses que muestra la tarjeta de retiros no peligrosos.
 *
 * Son las cinco columnas del nodo `3086:13933` (Mar → Jul). Vive acá y no dentro
 * del componente porque es lo que se le pide al servidor, no una decisión de
 * maquetación.
 */
export const WASTE_NON_HAZARDOUS_WITHDRAWALS_MONTHS = 5;

/**
 * `staleTime` de una hora: el consolidado de Servicios Generales se cierra el día
 * 5 de cada mes. Refetchear en cada navegación haría parpadear la tarjeta a
 * "Cargando…" con el dato del mes ya en cache, y el dato no cambia entre visitas.
 */
const MONTHLY_CONSOLIDATION_STALE_TIME_MS = 60 * 60 * 1000;

export function useWasteNonHazardousWithdrawals(
  months: number = WASTE_NON_HAZARDOUS_WITHDRAWALS_MONTHS,
) {
  return useQuery({
    queryKey: ['waste', 'dashboard', 'non-hazardous-withdrawals', { months }],
    queryFn: () => getWasteNonHazardousWithdrawals(months),
    staleTime: MONTHLY_CONSOLIDATION_STALE_TIME_MS,
  });
}

/**
 * Los cuatro KPIs de la fila superior (nodo `3086:13811`).
 *
 * SIN `staleTime`, al revés de la serie mensual: folios abiertos, folios sobre SLA
 * y alertas activas cambian durante la jornada, y son justamente los números que
 * el aprobador mira para decidir qué atender. Un dato cacheado acá le esconde
 * trabajo que ya entró.
 */
export function useWasteDashboardKpis() {
  return useQuery({
    queryKey: ['waste', 'dashboard', 'kpis'],
    queryFn: getWasteDashboardKpis,
  });
}

/**
 * Acumulado del mes por categoría contra su umbral RCA (nodo `3086:13843`).
 *
 * Sin `staleTime`, por el mismo motivo que los KPIs: el acumulado sube con cada
 * recepción a bodega del día, y es el número que define si una barra pasa a
 * "Crítico".
 */
export function useWasteRcaThresholds() {
  return useQuery({
    queryKey: ['waste', 'dashboard', 'rca-thresholds'],
    queryFn: getWasteRcaThresholds,
  });
}

const WASTE_DASHBOARD_ALERTS_QUERY_KEY = ['waste', 'dashboard', 'alerts'] as const;

/**
 * Alertas activas (nodo `3086:13892`). Sin `staleTime`: es la bandeja de lo que hay
 * que atender ahora.
 */
export function useWasteDashboardAlerts() {
  return useQuery({
    queryKey: WASTE_DASHBOARD_ALERTS_QUERY_KEY,
    queryFn: getWasteDashboardAlerts,
  });
}

/**
 * Descarta una alerta.
 *
 * Invalida la lista en vez de sacar la fila de la cache a mano: el contador del
 * título y el KPI "Alertas activas" salen del servidor, y editar la cache dejaría
 * los tres números discrepando hasta el próximo refetch.
 *
 * Por eso invalida TAMBIÉN los KPIs: la tarjeta `3086:13835` muestra el mismo
 * conteo, y sin esto quedaría diciendo 3 con dos alertas en pantalla.
 */
export function useDismissWasteDashboardAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => dismissWasteDashboardAlert(alertId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WASTE_DASHBOARD_ALERTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['waste', 'dashboard', 'kpis'] });
    },
  });
}
