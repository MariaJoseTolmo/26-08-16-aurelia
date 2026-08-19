import type { CreateInspectionRequest, MobileSyncOperationType } from '@aurelia/contracts';
import { createLocalInspection, incrementLocalInspectionFindings } from '../../offline/local-inspections';
import { getOrCreateOfflineDeviceSession } from '../../offline/offline-device-session';
import { syncPendingOperations } from '../../sync/sync-engine';
import { syncQueue } from '../../sync/sync-queue';

const CREATE_INSPECTION = 'CREATE_INSPECTION' as MobileSyncOperationType;
const CREATE_INSPECTION_FINDING = 'CREATE_INSPECTION_FINDING' as MobileSyncOperationType;

const SEVERITY_MAP: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
  Bajo: 'low',
  Medio: 'medium',
  Alto: 'high',
  Crítico: 'critical',
};

export function mapSeverity(nivel: string | null): 'low' | 'medium' | 'high' | 'critical' {
  return SEVERITY_MAP[nivel ?? ''] ?? 'medium';
}

export function slaToIso(slaDays: number): string {
  return new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000).toISOString();
}

export interface CreateInspectionDto {
  inspectionTypeId: string;
  companyId?: string | null;
  areaId?: string | null;
  sectorId?: string | null;
  title: string;
  description?: string | null;
}

export interface CreateFindingDto {
  title: string;
  description?: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ownerUserId?: string | null;
  dueAt?: string | null;
}

export interface InspectionResponse {
  id: string;
  title: string;
  status: string;
  findingsCount: number;
  createdAt: string;
}

export interface FindingResponse {
  id: string;
  inspectionId: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createInspection(dto: CreateInspectionDto): Promise<InspectionResponse> {
  const session = await getOrCreateOfflineDeviceSession();
  const localId = createId('inspection');
  const createdAt = new Date().toISOString();
  const payload: CreateInspectionRequest = {
    inspectionTypeId: dto.inspectionTypeId,
    templateId: null,
    companyId: dto.companyId ?? null,
    areaId: dto.areaId ?? null,
    sectorId: dto.sectorId ?? null,
    locationId: null,
    title: dto.title,
    description: dto.description ?? 'Inspección levantada desde asistente AurelIA',
    scheduledAt: createdAt,
    latitude: null,
    longitude: null,
    notes: null,
  };

  await syncQueue.enqueue({
    localId,
    operationType: CREATE_INSPECTION,
    entityType: 'inspection',
    payload,
    createdBy: 'local-user',
    deviceId: session.deviceId,
    deviceSessionId: session.deviceSessionId,
  });

  await createLocalInspection({
    localId,
    title: dto.title,
    inspectionTypeId: dto.inspectionTypeId,
    templateId: null,
    companyId: dto.companyId ?? null,
    areaId: dto.areaId ?? null,
    sectorId: dto.sectorId ?? null,
    scheduledAt: createdAt,
    latitude: null,
    longitude: null,
    notes: 'Inspección creada desde asistente AurelIA',
    findingsCount: 0,
    openFindingsCount: 0,
    closed: false,
  });

  return {
    id: localId,
    title: dto.title,
    status: 'in_progress',
    findingsCount: 0,
    createdAt,
  };
}

export async function createFinding(inspectionId: string, dto: CreateFindingDto): Promise<FindingResponse> {
  const session = await getOrCreateOfflineDeviceSession();
  const localId = createId('finding');
  const createdAt = new Date().toISOString();
  const payload = {
    inspectionLocalId: inspectionId,
    checklistItemId: null,
    title: dto.title,
    description: dto.description ?? null,
    severity: dto.severity,
    ownerUserId: dto.ownerUserId ?? null,
    dueAt: dto.dueAt ?? null,
  };

  await syncQueue.enqueue({
    localId,
    operationType: CREATE_INSPECTION_FINDING,
    entityType: 'inspection_finding',
    payload,
    createdBy: 'local-user',
    deviceId: session.deviceId,
    deviceSessionId: session.deviceSessionId,
    dependsOnLocalIds: [inspectionId],
  });

  await incrementLocalInspectionFindings(inspectionId);
  void syncPendingOperations({ ignoreRetryDelay: true });

  return {
    id: localId,
    inspectionId,
    title: dto.title,
    severity: dto.severity,
    status: 'open',
    createdAt,
  };
}
