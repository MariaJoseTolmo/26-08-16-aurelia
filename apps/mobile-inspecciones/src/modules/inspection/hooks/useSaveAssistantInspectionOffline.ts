import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateInspectionFindingRequest, CreateInspectionRequest, MobileSyncOperationType } from '@aurelia/contracts';
import { createLocalInspection } from '../../../shared/offline/local-inspections';
import { getOrCreateOfflineDeviceSession } from '../../../shared/offline/offline-device-session';
import { syncPendingOperations } from '../../../shared/sync/sync-engine';
import { syncQueue } from '../../../shared/sync/sync-queue';
import { useMobileSession } from '../../auth/mobileSession.store';
import type { ObservacionDraft } from '../useInspectionFlow';

const CREATE_INSPECTION = 'CREATE_INSPECTION' as MobileSyncOperationType;
const CREATE_INSPECTION_FINDING = 'CREATE_INSPECTION_FINDING' as MobileSyncOperationType;
const UPLOAD_ATTACHMENT = 'UPLOAD_ATTACHMENT' as MobileSyncOperationType;

const SEVERITY_MAP: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
  Bajo: 'low',
  Medio: 'medium',
  Alto: 'high',
  Crítico: 'critical',
};

export interface SaveAssistantInspectionInput {
  inspectionTypeId: string;
  inspectionTypeName: string;
  areaId: string | null;
  areaName: string | null;
  sectorId: string | null;
  sectorName: string | null;
  companyId: string | null;
  observations: ObservacionDraft[];
  ownerUserId: string | null;
  trySyncNow: boolean;
}

export interface SaveAssistantInspectionResult {
  inspectionId: string;
  findingsCount: number;
  evidencesCount: number;
}

interface AttachmentPayload {
  inspectionLocalId: string;
  findingLocalId: string;
  localEvidenceId: string;
  sourceUri: string | null;
  remoteFileId: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  evidenceType: 'photo';
  title: string;
  capturedAt: string;
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function toDueAt(slaDays: number): string {
  return new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000).toISOString();
}

function toSeverity(nivel: string | null): CreateInspectionFindingRequest['severity'] {
  return (SEVERITY_MAP[nivel ?? ''] ?? 'medium') as CreateInspectionFindingRequest['severity'];
}

function buildFindingDescription(observation: ObservacionDraft): string | null {
  const parts = [
    observation.desc ? `Condición detectada: ${observation.desc}` : null,
    observation.medida ? `Medida correctiva: ${observation.medida}` : null,
    observation.fotoUri ? `Evidencia local pendiente: ${observation.fotoUri}` : null,
    observation.fileId ? `Archivo remoto previo: ${observation.fileId}` : null,
  ];
  return parts.filter(Boolean).join('\n') || null;
}

function getPhotoSource(observation: ObservacionDraft): string | null {
  return observation.fotoUri ?? observation.fileId ?? null;
}

function getFileName(source: string | null): string {
  if (!source) return 'evidencia-local.jpg';
  const clean = source.split('?')[0] ?? source;
  const last = clean.split('/').filter(Boolean).pop();
  return last || 'evidencia-local.jpg';
}

export function useSaveAssistantInspectionOffline() {
  const queryClient = useQueryClient();
  const user = useMobileSession((state) => state.user);

  return useMutation({
    mutationFn: async (input: SaveAssistantInspectionInput): Promise<SaveAssistantInspectionResult> => {
      const session = await getOrCreateOfflineDeviceSession();
      const createdBy = user?.id ?? 'local-user';
      const inspectionLocalId = createId('inspection');
      const createdAt = new Date().toISOString();
      const title = `${input.inspectionTypeName} — ${input.areaName ?? 'Área no informada'} · ${input.sectorName ?? 'Sector no informado'}`;
      const evidencesCount = input.observations.filter((observation) => Boolean(getPhotoSource(observation))).length;
      const createPayload: CreateInspectionRequest = {
        inspectionTypeId: input.inspectionTypeId,
        templateId: null,
        companyId: input.companyId,
        areaId: input.areaId,
        sectorId: input.sectorId,
        locationId: null,
        title,
        description: 'Inspección levantada desde asistente AurelIA',
        scheduledAt: createdAt,
        latitude: null,
        longitude: null,
        notes: evidencesCount > 0 ? `${evidencesCount} evidencia(s) local(es) pendiente(s)` : null,
      };

      await syncQueue.enqueue({
        localId: inspectionLocalId,
        operationType: CREATE_INSPECTION,
        entityType: 'inspection',
        payload: createPayload,
        createdBy,
        deviceId: session.deviceId,
        deviceSessionId: session.deviceSessionId,
      });

      await createLocalInspection({
        localId: inspectionLocalId,
        title,
        inspectionTypeId: input.inspectionTypeId,
        templateId: null,
        companyId: input.companyId,
        areaId: input.areaId,
        sectorId: input.sectorId,
        scheduledAt: createdAt,
        latitude: null,
        longitude: null,
        notes: createPayload.notes ?? null,
        findingsCount: input.observations.length,
        openFindingsCount: input.observations.length,
        closed: false,
      });

      for (const observation of input.observations) {
        const findingLocalId = createId('finding');
        const findingPayload: CreateInspectionFindingRequest & { inspectionLocalId: string } = {
          inspectionLocalId,
          checklistItemId: null,
          title: (observation.desc ?? 'Hallazgo').slice(0, 200),
          description: buildFindingDescription(observation),
          severity: toSeverity(observation.nivel),
          ownerUserId: input.ownerUserId,
          dueAt: toDueAt(observation.sla),
        };
        await syncQueue.enqueue({
          localId: findingLocalId,
          operationType: CREATE_INSPECTION_FINDING,
          entityType: 'inspection_finding',
          payload: findingPayload,
          createdBy,
          deviceId: session.deviceId,
          deviceSessionId: session.deviceSessionId,
          dependsOnLocalIds: [inspectionLocalId],
        });

        const photoSource = getPhotoSource(observation);
        if (photoSource) {
          const localEvidenceId = createId('evidence');
          const fileName = getFileName(photoSource);
          const attachmentPayload: AttachmentPayload = {
            inspectionLocalId,
            findingLocalId,
            localEvidenceId,
            sourceUri: observation.fotoUri ?? null,
            remoteFileId: observation.fileId ?? null,
            fileName,
            mimeType: 'image/jpeg',
            sizeBytes: 0,
            evidenceType: 'photo',
            title: `Foto: ${(observation.desc ?? 'hallazgo').slice(0, 80)}`,
            capturedAt: new Date().toISOString(),
          };
          await syncQueue.enqueue({
            localId: localEvidenceId,
            operationType: UPLOAD_ATTACHMENT,
            entityType: 'evidence',
            payload: attachmentPayload,
            createdBy,
            deviceId: session.deviceId,
            deviceSessionId: session.deviceSessionId,
            evidences: [{ localEvidenceId, localEntityId: findingLocalId, fileName, mimeType: 'image/jpeg', sizeBytes: 0 }],
            dependsOnLocalIds: [inspectionLocalId, findingLocalId],
          });
        }
      }

      if (input.trySyncNow) void syncPendingOperations({ ignoreRetryDelay: true });
      return { inspectionId: inspectionLocalId, findingsCount: input.observations.length, evidencesCount };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mobile-inspecciones', 'inspections'] });
      void queryClient.invalidateQueries({ queryKey: ['mobile-inspecciones', 'inspection-home-summary'] });
    },
  });
}
