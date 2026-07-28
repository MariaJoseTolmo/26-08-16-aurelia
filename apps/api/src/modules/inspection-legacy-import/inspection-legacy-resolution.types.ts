import { NormalizedLegacyInspection } from './inspection-legacy-import.types';

export type LegacyCatalogResolutionStatus =
  | 'DIRECT_MATCH'
  | 'ALIAS_MATCH'
  | 'CREATE_ARCHIVED'
  | 'KEEP_TEXT_ONLY'
  | 'MANUAL_REVIEW'
  | 'BLOCKED';

export interface LegacyCatalogResolution {
  status: LegacyCatalogResolutionStatus;
  sourceValue: string | null;
  entityId: string | null;
  entityName: string | null;
  proposedCode?: string;
  message?: string;
}

export interface ResolvedLegacyInspection {
  normalized: NormalizedLegacyInspection;
  sourceSystem: string;
  alreadyImportedInspectionId: string | null;
  area: LegacyCatalogResolution;
  company: LegacyCatalogResolution;
  inspector: LegacyCatalogResolution;
}
