import { getMobileBootstrapLocalFirst } from '../../offline/local-catalogs';

export interface InspectionTypeResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
}

export async function fetchInspectionTypes(): Promise<InspectionTypeResponse[]> {
  const bootstrap = await getMobileBootstrapLocalFirst();
  return bootstrap.catalogs.inspectionTypes.map((type) => ({
    id: type.id,
    code: type.code,
    name: type.name,
    description: type.description,
    status: type.status,
  }));
}
