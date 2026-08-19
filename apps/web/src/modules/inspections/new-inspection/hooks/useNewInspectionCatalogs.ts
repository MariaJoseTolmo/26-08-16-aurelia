import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrganizationAreas, getOrganizationSectors } from '../../../../shared/services/inspections.service';
import { useNewInspectionDraftStore } from '../state/newInspectionDraft.store';

export function useNewInspectionCatalogs() {
  const areaId = useNewInspectionDraftStore((state) => state.areaId);

  const areasQuery = useQuery({
    queryKey: ['inspections', 'new-inspection', 'areas'],
    queryFn: getOrganizationAreas,
  });

  const sectorsQuery = useQuery({
    queryKey: ['inspections', 'new-inspection', 'sectors', areaId],
    queryFn: () => getOrganizationSectors(areaId),
    enabled: Boolean(areaId),
  });

  const areas = areasQuery.data ?? [];
  const sectors = sectorsQuery.data ?? [];

  const catalogErrorMessage = useMemo(() => {
    const error = areasQuery.error ?? sectorsQuery.error;
    if (error instanceof Error && error.message) return error.message;
    return null;
  }, [areasQuery.error, sectorsQuery.error]);

  return {
    areas,
    sectors,
    loadingAreas: areasQuery.isLoading,
    loadingSectors: Boolean(areaId && sectorsQuery.isLoading),
    catalogErrorMessage,
  };
}
