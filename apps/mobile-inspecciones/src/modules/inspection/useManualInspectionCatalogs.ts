import { MISSING_MOBILE_BOOTSTRAP_MESSAGE } from '../../shared/offline/local-catalogs';
import { useMobileBootstrap } from '../../shared/hooks/useMobileBootstrap';
import { useManualInspectionDraft } from './manualInspection.store';

export const manualInspectionCatalogKeys = {
  bootstrap: ['manual-inspection', 'mobile-bootstrap'] as const,
  areas: ['manual-inspection', 'areas'] as const,
  sectors: (areaId: string | null) => ['manual-inspection', 'sectors', areaId] as const,
};

function getCatalogErrorMessage(error: unknown): string | null {
  if (error instanceof Error && error.message) return error.message;
  return MISSING_MOBILE_BOOTSTRAP_MESSAGE;
}

export function useManualInspectionCatalogs() {
  const areaId = useManualInspectionDraft((state) => state.areaId);
  const bootstrapQuery = useMobileBootstrap();
  const areas = bootstrapQuery.data?.catalogs.areas ?? [];
  const sectors = areaId
    ? (bootstrapQuery.data?.catalogs.sectors ?? []).filter((sector) => sector.areaId === areaId)
    : [];
  const catalogErrorMessage = bootstrapQuery.isError ? getCatalogErrorMessage(bootstrapQuery.error) : null;

  return {
    areasQuery: bootstrapQuery,
    sectorsQuery: bootstrapQuery,
    areas,
    sectors,
    loadingAreas: bootstrapQuery.isLoading,
    loadingSectors: Boolean(areaId && bootstrapQuery.isLoading),
    catalogErrorMessage,
  };
}
