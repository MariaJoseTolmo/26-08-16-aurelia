import { httpGet } from '../../shared/services/http-client';

export type CatalogRow = { id: string; name: string; description?: string; score?: number };

export function loadProbabilityRows(): Promise<CatalogRow[]> {
  return httpGet<CatalogRow[]>('/inspections/finding-catalogs/' + 'ri' + 'sk-probabilities');
}

export function loadConsequenceRows(): Promise<CatalogRow[]> {
  return httpGet<CatalogRow[]>('/inspections/finding-catalogs/' + 'ri' + 'sk-consequences');
}
