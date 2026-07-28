import {
  LegacyImportDisposition,
  NormalizedLegacyInspection,
} from './inspection-legacy-import.types';

export type LegacyCatalogResolutionStatus =
  | 'DIRECT_MATCH'
  | 'ALIAS_MATCH'
  | 'CREATE_ACTIVE'
  | 'KEEP_TEXT_ONLY'
  | 'MANUAL_REVIEW'
  | 'BLOCKED';

export interface LegacyCatalogResolution {
  status: LegacyCatalogResolutionStatus;
  sourceValue: string | null;
  entityId: string | null;
  entityName: string | null;
  proposedCode?: string;
  proposedEmail?: string;
  proposedCompanyCode?: string;
  proposedRoleCode?: string;
  message?: string;
}

export interface ResolvedLegacyInspection {
  normalized: NormalizedLegacyInspection;
  sourceSystem: string;
  alreadyImportedInspectionId: string | null;
  area: LegacyCatalogResolution;
  company: LegacyCatalogResolution;
  inspector: LegacyCatalogResolution;
  inspectors: LegacyCatalogResolution[];
}

export interface ValidatedLegacyInspection extends ResolvedLegacyInspection {
  finalDisposition: LegacyImportDisposition;
  validationMessages: string[];
}
