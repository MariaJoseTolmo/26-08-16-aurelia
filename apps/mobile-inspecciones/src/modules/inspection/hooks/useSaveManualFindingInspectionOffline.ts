import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  InspectionFindingSeverity,
  InspectionType,
  type CreateInspectionFindingRequest,
  type CreateInspectionRequest,
  type MobileSyncOperationType,
} from '@aurelia/contracts';
import { createLocalInspection } from '../../../shared/offline/local-inspections';
import { getOrCreateOfflineDeviceSession } from '../../../shared/offline/offline-device-session';
import { fetchInspectionTypes } from '../../../shared/services/api/inspection-types.api';
import { syncPendingOperations } from '../../../shared/sync/sync-engine';
import { syncQueue } from '../../../shared/sync/sync-queue';
import { useMobileSession } from '../../auth/mobileSession.store';
import type { ManualFindingObservationDraft, ManualInspectionDraft, ManualSavedInspectionResult } from '../manualInspection.store';

interface SaveManualFindingInspectionOfflineInput {
  draft: ManualInspectionDraft;
  trySyncNow: boolean;
}

type FindingSyncPayload = CreateInspectionFindingRequest & {
  inspectionLocalId: string;
  checklistItemId: null;
  localObservationId: string;
};

interface UploadAttachmentSyncPayload {
  inspectionLocalId: string;
  findingLocalId: string;
  localEvidenceId: string;
  localObservationId: string;
  sourceUri: string | null;
  remoteFileId: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  evidenceType: 'photo';
  title: string;
  capturedAt: string;
  category: 'finding_evidence';
}

const CREATE_INSPECTION = 'CREATE_INSPECTION' as MobileSyncOperationType;
const CREATE_INSPECTION_FINDING = 'CREATE_INSPECTION_FINDING' as MobileSyncOperationType;
const UPLOAD_ATTACHMENT = 'UPLOAD_ATTACHMENT' as MobileSyncOperationType;

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
}

function parseInspectionDate(value: string): string {
  const parts = value.includes('-') ? value.split('-') : value.split('/');
  if (parts.length !== 3) return new Date().toISOString();
  const [day, month, year] = parts.map((part) => Number(part));
  if (!day || !month || !year) return new Date().toISOString();
  return new Date(year, month - 1, day, 12, 0, 0).toISOString();
}

function mapSeverity(label: string | null | undefined): InspectionFindingSeverity {
  const value = (label ?? '').trim().toLowerCase();
  if (value.includes('crít')) return InspectionFindingSeverity.CRITICAL;
  if (value.includes('alto') || value.includes('grave')) return InspectionFindingSeverity.HIGH;
  if (value.includes('medio') || value.includes('moder')) return InspectionFindingSeverity.MEDIUM;
  if (value.includes('bajo') || value.includes('leve')) return InspectionFindingSeverity.LOW;
  return InspectionFindingSeverity.MEDIUM;
}

function observationDueAt(observation: ManualFindingObservationDraft): string | null {
  const label = observation.severityClosureTimeLabel ?? '';
  const match = label.match(/(\d+)/);
  const days = match ? Number(match[1]) : 7;
  const due = new Date();
  due.setDate(due.getDate() + days);
  return due.toISOString();
}

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

function buildFindingTitle(draft: ManualInspectionDraft, observation: ManualFindingObservationDraft, index: number): string {
  const base = draft.findingTypeLabel ?? 'Hallazgo';
  const suffix = observation.severityLabel ? ` · ${observation.severityLabel}` : '';
  return `${base} ${index + 1}${suffix}`.slice(0, 200);
}

function buildFindingDescription(observation: ManualFindingObservationDraft): string | null {
  const detectedCondition = trimOrNull(observation.detectedCondition);
  const correctiveAction = trimOrNull(observation.correctiveAction);
  const lines = [
    detectedCondition,
    correctiveAction ? `Medida correctiva: ${correctiveAction}` : null,
    observation.evidence?.name ? `Evidencia local: ${observation.evidence.name}` : null,
  ].filter(Boolean);
  return lines.length > 0 ? lines.join('\n') : null;
}

function buildInspectionTitle(draft: ManualInspectionDraft): string {
  const typeLabel = draft.findingTypeLabel ?? 'Hallazgo';
  const areaLabel = draft.areaName ?? 'Sin área';
  return `${typeLabel} · ${areaLabel} · ${draft.inspectionDate}`.slice(0, 180);
}

function buildEvidenceTitle(observation: ManualFindingObservationDraft, index: number): string {
  const base = observation.detectedCondition.trim() || `Hallazgo ${index + 1}`;
  return `Foto: ${base}`.slice(0, 180);
}

export function useSaveManualFindingInspectionOffline() {
  const queryClient = useQueryClient();
  const user = useMobileSession((state) => state.user);

  return useMutation({
    mutationFn: async ({ draft, trySyncNow }: SaveManualFindingInspectionOfflineInput): Promise<ManualSavedInspectionResult> => {
      const observations = draft.findingObservations.filter((item) => item.saved);
      if (observations.length === 0) throw new Error('Debes registrar al menos una observación.');

      const inspectionTypes = await fetchInspectionTypes();
      const inspectionType = inspectionTypes.find((item) => item.code === InspectionType.ENVIRONMENTAL);
      if (!inspectionType) throw new Error('No existe el tipo de inspección Hallazgo en catálogos offline.');

      const session = await getOrCreateOfflineDeviceSession();
      const createdBy = user?.id ?? 'local-user';
      const localInspectionId = createId('inspection');
      const scheduledAt = parseInspectionDate(draft.inspectionDate);
      const title = buildInspectionTitle(draft);
      const responsibleSummary = draft.findingResponsibleIds.length > 0
        ? `Responsables seleccionados: ${draft.findingResponsibleIds.length}`
        : 'Responsables seleccionados: 0';

      const createPayload: CreateInspectionRequest = {
        inspectionTypeId: inspectionType.id,
        templateId: null,
        companyId: draft.findingCompanyId,
        areaId: draft.areaId,
        sectorId: draft.sectorId,
        locationId: null,
        title,
        description: `Inspección tipo Hallazgo levantada desde mobile-inspecciones${draft.findingTypeLabel ? ` · ${draft.findingTypeLabel}` : ''}`,
        scheduledAt,
        latitude: draft.latitude,
        longitude: draft.longitude,
        notes: [draft.locationLabel, responsibleSummary].filter(Boolean).join('\n') || null,
      };

      await syncQueue.enqueue({
        localId: localInspectionId,
        operationType: CREATE_INSPECTION,
        entityType: 'inspection',
        payload: createPayload,
        createdBy,
        deviceId: session.deviceId,
        deviceSessionId: session.deviceSessionId,
      });

      for (const [index, observation] of observations.entries()) {
        const findingLocalId = createId('finding');
        const findingPayload: FindingSyncPayload = {
          inspectionLocalId: localInspectionId,
          checklistItemId: null,
          title: buildFindingTitle(draft, observation, index),
          description: buildFindingDescription(observation),
          detectedCondition: trimOrNull(observation.detectedCondition),
          proposedCorrectiveAction: trimOrNull(observation.correctiveAction),
          severity: mapSeverity(observation.severityLabel),
          ownerUserId: draft.findingResponsibleIds[0] ?? null,
          dueAt: observationDueAt(observation),
          findingTypeId: draft.findingTypeId,
          severityId: observation.severityId,
          responsibleCompanyId: draft.findingCompanyId,
          responsibleUserIds: draft.findingResponsibleIds,
          localObservationId: observation.id,
        };

        await syncQueue.enqueue({
          localId: findingLocalId,
          operationType: CREATE_INSPECTION_FINDING,
          entityType: 'inspection_finding',
          payload: findingPayload,
          createdBy,
          deviceId: session.deviceId,
          deviceSessionId: session.deviceSessionId,
          dependsOnLocalIds: [localInspectionId],
        });

        if (observation.evidence) {
          const localEvidenceId = createId('evidence');
          const uploadPayload: UploadAttachmentSyncPayload = {
            inspectionLocalId: localInspectionId,
            findingLocalId,
            localEvidenceId,
            localObservationId: observation.id,
            sourceUri: observation.evidence.uri,
            remoteFileId: null,
            fileName: observation.evidence.name,
            mimeType: 'image/jpeg',
            sizeBytes: 0,
            evidenceType: 'photo',
            title: buildEvidenceTitle(observation, index),
            capturedAt: new Date().toISOString(),
            category: 'finding_evidence',
          };

          await syncQueue.enqueue({
            localId: localEvidenceId,
            operationType: UPLOAD_ATTACHMENT,
            entityType: 'evidence',
            payload: uploadPayload,
            createdBy,
            deviceId: session.deviceId,
            deviceSessionId: session.deviceSessionId,
            evidences: [{
              localEvidenceId,
              localEntityId: findingLocalId,
              fileName: observation.evidence.name,
              mimeType: 'image/jpeg',
              sizeBytes: 0,
            }],
            dependsOnLocalIds: [localInspectionId, findingLocalId],
          });
        }
      }

      await createLocalInspection({
        localId: localInspectionId,
        title,
        inspectionTypeId: inspectionType.id,
        templateId: null,
        companyId: draft.findingCompanyId,
        areaId: draft.areaId,
        sectorId: draft.sectorId,
        scheduledAt,
        latitude: draft.latitude,
        longitude: draft.longitude,
        notes: createPayload.notes ?? null,
        findingsCount: observations.length,
        openFindingsCount: observations.length,
        closed: false,
      });

      if (trySyncNow) void syncPendingOperations();

      return {
        mode: 'finding',
        inspectionId: localInspectionId,
        totalCount: observations.length,
        yesCount: 0,
        noCount: observations.length,
        naCount: 0,
        closed: false,
      };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['mobile-inspecciones', 'inspections'] }),
        queryClient.invalidateQueries({ queryKey: ['mobile-inspecciones', 'inspection-home-summary'] }),
      ]);
    },
  });
}
