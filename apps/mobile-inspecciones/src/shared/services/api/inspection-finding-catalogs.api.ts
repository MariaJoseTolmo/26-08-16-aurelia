import type { InspectionFindingSeverityResponse, InspectionFindingTypeResponse, InspectionRiskConsequenceResponse, InspectionRiskProbabilityResponse } from '@aurelia/contracts';
import { getMobileBootstrapLocalFirst } from '../../offline/local-catalogs';
import { httpGet } from '../http-client';

export function fetchInspectionFindingTypes(): Promise<InspectionFindingTypeResponse[]> {
  return httpGet<InspectionFindingTypeResponse[]>('/inspections/finding-catalogs/types');
}

export function fetchInspectionFindingSeverities(): Promise<InspectionFindingSeverityResponse[]> {
  return httpGet<InspectionFindingSeverityResponse[]>('/inspections/finding-catalogs/severities');
}

export function fetchInspectionRiskProbabilities(): Promise<InspectionRiskProbabilityResponse[]> {
  return httpGet<InspectionRiskProbabilityResponse[]>('/inspections/finding-catalogs/risk-probabilities');
}

export function fetchInspectionRiskConsequences(): Promise<InspectionRiskConsequenceResponse[]> {
  return httpGet<InspectionRiskConsequenceResponse[]>('/inspections/finding-catalogs/risk-consequences');
}

export async function fetchInspectionFindingTypesLocalFirst(): Promise<InspectionFindingTypeResponse[]> {
  const remote = await fetchInspectionFindingTypes().then(
    (items) => items,
    () => null,
  );

  if (remote) return remote;

  const bootstrap = await getMobileBootstrapLocalFirst();
  return bootstrap.catalogs.findingTypes ?? [];
}

export async function fetchInspectionFindingSeveritiesLocalFirst(): Promise<InspectionFindingSeverityResponse[]> {
  const remote = await fetchInspectionFindingSeverities().then(
    (items) => items,
    () => null,
  );

  if (remote) return remote;

  const bootstrap = await getMobileBootstrapLocalFirst();
  return bootstrap.catalogs.findingSeverities ?? [];
}

export const fetchInspectionFindingTypesFromApi = fetchInspectionFindingTypes;
export const fetchInspectionFindingSeveritiesFromApi = fetchInspectionFindingSeverities;
