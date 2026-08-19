import { InspectionStatus, type InspectionResponse } from '@aurelia/contracts';
import { localStorageDriver } from '../storage/local-storage';

const LOCAL_INSPECTIONS_KEY = 'local_inspections:v1';

export interface LocalInspectionRecord {
  localId: string;
  remoteId: string | null;
  syncStatus: 'PENDING' | 'SYNCED' | 'ERROR' | 'CONFLICT';
  inspection: InspectionResponse;
  createdAt: string;
  updatedAt: string;
  lastError?: string | null;
}

export interface CreateLocalInspectionInput {
  localId: string;
  title: string;
  inspectionTypeId: string;
  templateId: string | null;
  companyId: string | null;
  areaId: string | null;
  sectorId: string | null;
  scheduledAt: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  findingsCount: number;
  openFindingsCount: number;
  closed: boolean;
}

function now(): string {
  return new Date().toISOString();
}

export async function getLocalInspections(): Promise<LocalInspectionRecord[]> {
  return (await localStorageDriver.get<LocalInspectionRecord[]>(LOCAL_INSPECTIONS_KEY)) ?? [];
}

export async function createLocalInspection(input: CreateLocalInspectionInput): Promise<LocalInspectionRecord> {
  const current = await getLocalInspections();
  const timestamp = now();
  const inspection: InspectionResponse = {
    id: input.localId,
    createdAt: timestamp,
    updatedAt: timestamp,
    inspectionTypeId: input.inspectionTypeId,
    templateId: input.templateId,
    companyId: input.companyId,
    areaId: input.areaId,
    sectorId: input.sectorId,
    locationId: null,
    inspectorId: null,
    title: input.title,
    description: 'Registro local pendiente de sincronización',
    status: input.closed ? InspectionStatus.CLOSED : InspectionStatus.IN_PROGRESS,
    scheduledAt: input.scheduledAt,
    startedAt: timestamp,
    completedAt: timestamp,
    closedAt: input.closed ? timestamp : null,
    latitude: input.latitude == null ? null : String(input.latitude),
    longitude: input.longitude == null ? null : String(input.longitude),
    score: null,
    findingsCount: input.findingsCount,
    openFindingsCount: input.openFindingsCount,
    notes: input.notes,
  };
  const record: LocalInspectionRecord = {
    localId: input.localId,
    remoteId: null,
    syncStatus: 'PENDING',
    inspection,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastError: null,
  };
  await localStorageDriver.set(LOCAL_INSPECTIONS_KEY, [record, ...current.filter((item) => item.localId !== input.localId)]);
  return record;
}

export async function incrementLocalInspectionFindings(localId: string): Promise<void> {
  const timestamp = now();
  const records = await getLocalInspections();
  await localStorageDriver.set(LOCAL_INSPECTIONS_KEY, records.map((record) => {
    if (record.localId !== localId) return record;
    return {
      ...record,
      updatedAt: timestamp,
      inspection: {
        ...record.inspection,
        updatedAt: timestamp,
        findingsCount: record.inspection.findingsCount + 1,
        openFindingsCount: record.inspection.openFindingsCount + 1,
      },
    };
  }));
}

export async function markLocalInspectionSynced(localId: string, remoteId: string): Promise<void> {
  const records = await getLocalInspections();
  await localStorageDriver.set(LOCAL_INSPECTIONS_KEY, records.map((record) => record.localId === localId ? { ...record, remoteId, syncStatus: 'SYNCED', updatedAt: now(), inspection: { ...record.inspection, id: remoteId } } : record));
}

export async function markLocalInspectionError(localId: string, error: string): Promise<void> {
  const records = await getLocalInspections();
  await localStorageDriver.set(LOCAL_INSPECTIONS_KEY, records.map((record) => record.localId === localId ? { ...record, syncStatus: 'ERROR', lastError: error, updatedAt: now() } : record));
}

export async function clearLocalInspections(): Promise<void> {
  await localStorageDriver.remove(LOCAL_INSPECTIONS_KEY);
}
