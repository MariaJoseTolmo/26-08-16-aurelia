import { useQuery } from '@tanstack/react-query';
import { getOrganizationAreas } from '../services/inspections.service';
import {
  getSprAssignments,
  getSprGroups,
  getSprMonthlyRecords,
  getSprParameters,
  getSprUnits,
} from '../services/spr.service';
import { buildSprConsolidatedTableFromCatalog } from '../../modules/spr/sprReportConsolidated.real';

/**
 * Tabla consolidado En curso: assignments × records del ciclo (?ciclo=).
 * Si falla el fetch: isError=true y table=null — nunca caer a mock Figma.
 */
export function useSprReportConsolidatedReal(periodYear: number, periodMonth: number) {
  const areasQuery = useQuery({
    queryKey: ['organization', 'areas'],
    queryFn: getOrganizationAreas,
    staleTime: 300_000,
  });
  const parametersQuery = useQuery({
    queryKey: ['spr', 'parameters', 'all'],
    queryFn: () => getSprParameters(),
    staleTime: 300_000,
  });
  const unitsQuery = useQuery({
    queryKey: ['spr', 'units'],
    queryFn: getSprUnits,
    staleTime: 300_000,
  });
  const groupsQuery = useQuery({
    queryKey: ['spr', 'groups'],
    queryFn: getSprGroups,
    staleTime: 300_000,
  });
  const assignmentsQuery = useQuery({
    queryKey: ['spr', 'assignments', 'all'],
    queryFn: () => getSprAssignments(),
  });
  const recordsQuery = useQuery({
    queryKey: ['spr', 'monthly-records', 'consolidated', periodYear, periodMonth],
    queryFn: () => getSprMonthlyRecords({ periodYear, periodMonth }),
  });

  const isLoading =
    areasQuery.isLoading ||
    parametersQuery.isLoading ||
    unitsQuery.isLoading ||
    groupsQuery.isLoading ||
    assignmentsQuery.isLoading ||
    recordsQuery.isLoading;

  const isError =
    areasQuery.isError ||
    parametersQuery.isError ||
    unitsQuery.isError ||
    groupsQuery.isError ||
    assignmentsQuery.isError ||
    recordsQuery.isError;

  const table =
    !isLoading && !isError
      ? buildSprConsolidatedTableFromCatalog({
          areas: areasQuery.data,
          parameters: parametersQuery.data,
          units: unitsQuery.data,
          groups: groupsQuery.data,
          assignments: assignmentsQuery.data,
          records: recordsQuery.data,
        })
      : null;

  return {
    isLoading,
    isError,
    table,
  };
}
