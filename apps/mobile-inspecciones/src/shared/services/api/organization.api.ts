import type { AreaResponse, CompanyResponse, SectorResponse } from '@aurelia/contracts';
import { getMobileBootstrapLocalFirst } from '../../offline/local-catalogs';

export type { AreaResponse, CompanyResponse, SectorResponse };

export async function fetchAreas(): Promise<AreaResponse[]> {
  const bootstrap = await getMobileBootstrapLocalFirst();
  return bootstrap.catalogs.areas;
}

export async function fetchSectors(areaId: string): Promise<SectorResponse[]> {
  const bootstrap = await getMobileBootstrapLocalFirst();
  return bootstrap.catalogs.sectors.filter((sector) => sector.areaId === areaId);
}

export async function fetchCompanies(isContractor?: boolean): Promise<CompanyResponse[]> {
  const bootstrap = await getMobileBootstrapLocalFirst();
  if (isContractor === undefined) return bootstrap.catalogs.companies;
  return bootstrap.catalogs.companies.filter((company) => company.isContractor === isContractor);
}
