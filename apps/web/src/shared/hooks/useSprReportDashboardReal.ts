import { useQuery } from '@tanstack/react-query';
import { getOrganizationAreas } from '../services/inspections.service';
import { getSprAssignments, getSprMonthlyRecords } from '../services/spr.service';
import { buildSprReportDashboardFromRecords } from '../../modules/spr/sprReportDashboard.real';

/**
 * KPIs + estado por área desde assignments + monthly-records del ciclo seleccionado.
 * Si falla el fetch: isError=true y kpiCards/areaCards=null — el consumidor debe mostrar
 * error (nunca caer a mock Figma).
 */
export function useSprReportDashboardReal(periodYear: number, periodMonth: number) {
  const areasQuery = useQuery({
    queryKey: ['organization', 'areas'],
    queryFn: getOrganizationAreas,
    staleTime: 300_000,
  });
  const assignmentsQuery = useQuery({
    queryKey: ['spr', 'assignments', 'all'],
    queryFn: () => getSprAssignments(),
  });
  const recordsQuery = useQuery({
    queryKey: ['spr', 'monthly-records', 'dashboard', periodYear, periodMonth],
    queryFn: () => getSprMonthlyRecords({ periodYear, periodMonth }),
  });

  const isLoading = areasQuery.isLoading || assignmentsQuery.isLoading || recordsQuery.isLoading;
  const isError = areasQuery.isError || assignmentsQuery.isError || recordsQuery.isError;

  const summary =
    !isLoading && !isError
      ? buildSprReportDashboardFromRecords({
          areas: areasQuery.data,
          assignments: assignmentsQuery.data,
          records: recordsQuery.data,
        })
      : null;

  return {
    isLoading,
    isError,
    areas: areasQuery.data ?? null,
    kpiCards: summary?.kpiCards ?? null,
    areaCards: summary?.areaCards ?? null,
  };
}
