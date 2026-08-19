import { useQuery } from '@tanstack/react-query';
import type { InspectionResponse } from '@aurelia/contracts';
import { useMobileBootstrap } from '../../../shared/hooks/useMobileBootstrap';
import { getLocalInspections } from '../../../shared/offline/local-inspections';
import { fetchInspections } from '../../../shared/services/inspections.api';
import { fetchInspectionHomeSummary } from '../../../shared/services/api/inspection-home.api';

async function fetchInspectionsWithLocal(): Promise<InspectionResponse[]> {
  const localRecords = await getLocalInspections();
  try {
    const remote = await fetchInspections();
    const remoteIds = new Set(remote.map((inspection) => inspection.id));
    const local = localRecords
      .filter((record) => !record.remoteId || !remoteIds.has(record.remoteId))
      .map((record) => record.inspection);
    return [...local, ...remote];
  } catch {
    return localRecords.map((record) => record.inspection);
  }
}

export function useInspectionHomeSummary() {
  useMobileBootstrap();

  return useQuery({
    queryKey: ['mobile-inspecciones', 'inspection-home-summary'],
    queryFn: fetchInspectionHomeSummary,
  });
}

export function useMobileInspections() {
  return useQuery({
    queryKey: ['mobile-inspecciones', 'inspections'],
    queryFn: fetchInspectionsWithLocal,
  });
}
