import { httpGet, httpPost, httpPostForm } from './http-client';

export interface DatabaseMaintenancePlanResponse {
  migration: {
    status: 'ready' | 'noop' | 'review_required';
    filePath: string | null;
    migrationName: string | null;
    upQueries: number;
    downQueries: number;
    riskyQueries: string[];
  };
  availableSeeds: string[];
}

export interface DatabaseMaintenanceRunResponse {
  migration: {
    status: 'applied' | 'noop' | 'review_required' | 'failed';
    filePath: string | null;
    migrationName: string | null;
    upQueries: number;
    downQueries: number;
    riskyQueries: string[];
  };
  seeds: Array<{
    seed: string;
    status: 'applied' | 'skipped' | 'failed';
    error?: string;
    details?: string;
  }>;
  availableSeeds: string[];
  error: {
    phase: 'connect' | 'lock' | 'reset' | 'prerequisites' | 'plan' | 'review' | 'artifact' | 'migration' | 'seed';
    message: string;
    details?: string;
    stack?: string;
  } | null;
}

export interface RunDatabaseMaintenanceRequest {
  seeds?: string[];
  allowRisky?: boolean;
  resetSchema?: boolean;
  resetConfirmation?: string;
  runSeedsOnly?: boolean;
}

export interface LegacyInspectionsPreviewResponse {
  fileName: string;
  sourceSha256: string;
  totalRows: number;
  dispositions: {
    READY: number;
    WARNING: number;
    QUARANTINE: number;
  };
  totals: {
    findingsCount: number;
    closedFindingsCount: number;
    openFindingsCount: number;
    milestoneS1: number;
    milestoneS2: number;
    milestoneS3: number;
  };
  warningCodes: Record<string, number>;
}

export interface LegacyInspectionsImportResponse {
  fileName: string;
  sourceSha256: string;
  totalRows: number;
  dispositions: Record<string, number>;
  importedRows: number;
  alreadyImportedRows: number;
}

export async function getDatabaseMaintenancePlan(): Promise<DatabaseMaintenancePlanResponse> {
  return httpGet<DatabaseMaintenancePlanResponse>('/admin/database/maintenance/plan');
}

export async function runDatabaseMaintenance(payload: RunDatabaseMaintenanceRequest): Promise<DatabaseMaintenanceRunResponse> {
  return httpPost<RunDatabaseMaintenanceRequest, DatabaseMaintenanceRunResponse>('/admin/database/maintenance', payload);
}

export async function previewLegacyInspections(file: File): Promise<LegacyInspectionsPreviewResponse> {
  const body = new FormData();
  body.append('file', file);
  return httpPostForm<LegacyInspectionsPreviewResponse>('/admin/database/maintenance/legacy-inspections/preview', body);
}

export async function importLegacyInspections(
  file: File,
  confirmation: string,
): Promise<LegacyInspectionsImportResponse> {
  const body = new FormData();
  body.append('file', file);
  body.append('confirmation', confirmation);
  return httpPostForm<LegacyInspectionsImportResponse>('/admin/database/maintenance/legacy-inspections/import', body);
}
