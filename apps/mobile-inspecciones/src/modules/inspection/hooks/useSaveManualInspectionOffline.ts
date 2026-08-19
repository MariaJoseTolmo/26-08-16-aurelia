import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  InspectionAnswerValue,
  InspectionFindingSeverity,
  type CreateInspectionFindingRequest,
  type CreateInspectionRequest,
  type InspectionChecklistItem,
  type InspectionChecklistTemplateResponse,
  type MobileSyncOperationType,
  type UpsertInspectionAnswerRequest,
} from '@aurelia/contracts';
import { createLocalInspection } from '../../../shared/offline/local-inspections';
import { getOrCreateOfflineDeviceSession } from '../../../shared/offline/offline-device-session';
import { syncPendingOperations } from '../../../shared/sync/sync-engine';
import { syncQueue } from '../../../shared/sync/sync-queue';
import { useMobileSession } from '../../auth/mobileSession.store';
import type { ManualInspectionDraft, ManualSavedInspectionResult } from '../manualInspection.store';

type ManualTemplateItem = InspectionChecklistItem & { index: number };

interface SaveManualInspectionOfflineInput {
  draft: ManualInspectionDraft;
  template: InspectionChecklistTemplateResponse;
  items: ManualTemplateItem[];
  trySyncNow: boolean;
}

const CREATE_INSPECTION = 'CREATE_INSPECTION' as MobileSyncOperationType;
const UPSERT_INSPECTION_ANSWER = 'UPSERT_INSPECTION_ANSWER' as MobileSyncOperationType;
const CREATE_INSPECTION_FINDING = 'CREATE_INSPECTION_FINDING' as MobileSyncOperationType;
const UPLOAD_ATTACHMENT = 'UPLOAD_ATTACHMENT' as MobileSyncOperationType;
const CLOSE_INSPECTION = 'CLOSE_INSPECTION' as MobileSyncOperationType;

interface UploadAttachmentSyncPayload {
  inspectionLocalId: string;
  findingLocalId: string | null;
  localEvidenceId: string;
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

function buildAnswerText(answer: InspectionAnswerValue | undefined, detail: ManualInspectionDraft['detailsByItemId'][string]): string | null {
  if (answer === InspectionAnswerValue.COMPLIANT) return detail?.comment?.trim() || null;
  if (answer === InspectionAnswerValue.NOT_COMPLIANT) return detail?.detectedCondition?.trim() || null;
  return null;
}

function buildAnswerNotes(answer: InspectionAnswerValue | undefined, detail: ManualInspectionDraft['detailsByItemId'][string]): string | null {
  if (answer !== InspectionAnswerValue.NOT_COMPLIANT) return null;
  return [detail?.correctiveAction?.trim() || null, detail?.evidence?.name || null].filter(Boolean).join('\n') || null;
}

function buildFindingDescription(detail: ManualInspectionDraft['detailsByItemId'][string]): string {
  return [detail?.detectedCondition?.trim() || null, detail?.correctiveAction?.trim() || null, detail?.evidence?.name || null].filter(Boolean).join('\n');
}

function getDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
}

function buildEvidenceTitle(item: ManualTemplateItem, detail: ManualInspectionDraft['detailsByItemId'][string]): string {
  const base = detail?.detectedCondition?.trim() || `Obs. ${item.index + 1} · ${item.code}`;
  return `Foto: ${base}`.slice(0, 180);
}

function validateChecklistDraft(draft: ManualInspectionDraft, items: ManualTemplateItem[]): void {
  if (!draft.inspectionDateSelected || !draft.inspectionDate.trim()) {
    throw new Error('La fecha de inspección debe seleccionarse explícitamente.');
  }
  if (!draft.locationCaptured || draft.latitude === null || draft.longitude === null) {
    throw new Error('La ubicación de la inspección es obligatoria.');
  }
  if (!draft.generalPhoto) {
    throw new Error('La fotografía general del checklist es obligatoria.');
  }

  const unanswered = items.find((item) => !draft.answersByItemId[item.id]);
  if (unanswered) {
    throw new Error(`Falta responder el ítem ${unanswered.code}.`);
  }

  const nonCompliantItems = items.filter(
    (item) => draft.answersByItemId[item.id] === InspectionAnswerValue.NOT_COMPLIANT,
  );

  const incompleteFinding = nonCompliantItems.find((item) => {
    const detail = draft.detailsByItemId[item.id];
    return !detail?.detectedCondition?.trim() || !detail.correctiveAction?.trim() || !detail.evidence;
  });
  if (incompleteFinding) {
    throw new Error(
      `El ítem ${incompleteFinding.code} debe incluir condición, medida correctiva y fotografía.`,
    );
  }

  if (nonCompliantItems.length > 0 && (!draft.findingCompanyId || draft.findingResponsibleIds.length === 0)) {
    throw new Error('Los ítems no conformes requieren empresa y al menos un responsable.');
  }
}

export function useSaveManualInspectionOffline() {
  const queryClient = useQueryClient();
  const user = useMobileSession((state) => state.user);

  return useMutation({
    mutationFn: async ({ draft, template, items, trySyncNow }: SaveManualInspectionOfflineInput): Promise<ManualSavedInspectionResult> => {
      validateChecklistDraft(draft, items);
      const generalPhoto = draft.generalPhoto;
      if (!generalPhoto) throw new Error('La fotografía general del checklist es obligatoria.');

      const session = await getOrCreateOfflineDeviceSession();
      const createdBy = user?.id ?? 'local-user';
      const localInspectionId = createId('inspection');
      const scheduledAt = parseInspectionDate(draft.inspectionDate);
      const values = items.map((item) => draft.answersByItemId[item.id]);
      const yesCount = values.filter((value) => value === InspectionAnswerValue.COMPLIANT).length;
      const noCount = values.filter((value) => value === InspectionAnswerValue.NOT_COMPLIANT).length;
      const naCount = values.filter((value) => value === InspectionAnswerValue.NOT_APPLICABLE).length;
      const title = draft.templateName ? `${draft.templateName} · ${draft.inspectionDate}` : `Checklist normativo · ${draft.inspectionDate}`;
      const createPayload: CreateInspectionRequest = {
        inspectionTypeId: template.inspectionTypeId,
        templateId: template.id,
        companyId: draft.findingCompanyId,
        areaId: draft.areaId,
        sectorId: draft.sectorId,
        locationId: null,
        title,
        description: 'Inspección levantada desde mobile-inspecciones',
        scheduledAt,
        latitude: draft.latitude,
        longitude: draft.longitude,
        notes: `Foto general local: ${generalPhoto.name}`,
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

      const localEvidenceId = createId('evidence');
      const inspectionAttachmentPayload: UploadAttachmentSyncPayload = {
        inspectionLocalId: localInspectionId,
        findingLocalId: null,
        localEvidenceId,
        sourceUri: generalPhoto.uri,
        remoteFileId: null,
        fileName: generalPhoto.name,
        mimeType: 'image/jpeg',
        sizeBytes: 0,
        evidenceType: 'photo',
        title: `Foto general: ${title}`.slice(0, 180),
        capturedAt: new Date().toISOString(),
        category: 'finding_evidence',
      };

      await syncQueue.enqueue({
        localId: localEvidenceId,
        operationType: UPLOAD_ATTACHMENT,
        entityType: 'evidence',
        payload: inspectionAttachmentPayload,
        createdBy,
        deviceId: session.deviceId,
        deviceSessionId: session.deviceSessionId,
        evidences: [{ localEvidenceId, localEntityId: localInspectionId, fileName: generalPhoto.name, mimeType: 'image/jpeg', sizeBytes: 0 }],
        dependsOnLocalIds: [localInspectionId],
      });

      for (const item of items) {
        const answer = draft.answersByItemId[item.id];
        if (!answer) throw new Error(`Falta responder el ítem ${item.code}.`);

        const detail = draft.detailsByItemId[item.id] ?? {};
        const answerPayload: UpsertInspectionAnswerRequest = {
          checklistItemId: item.id,
          answerValue: answer,
          answerText: buildAnswerText(answer, detail),
          notes: buildAnswerNotes(answer, detail),
          answeredAt: new Date().toISOString(),
        };
        const answerLocalId = createId('answer');
        await syncQueue.enqueue({
          localId: answerLocalId,
          operationType: UPSERT_INSPECTION_ANSWER,
          entityType: 'inspection_answer',
          payload: { inspectionLocalId: localInspectionId, ...answerPayload },
          createdBy,
          deviceId: session.deviceId,
          deviceSessionId: session.deviceSessionId,
          dependsOnLocalIds: [localInspectionId],
        });
        if (answer === InspectionAnswerValue.NOT_COMPLIANT) {
          const findingLocalId = createId('finding');
          const findingPayload: CreateInspectionFindingRequest = {
            checklistItemId: item.id,
            title: `Obs. ${item.index + 1} · ${item.code}`.slice(0, 200),
            description: buildFindingDescription(detail),
            severity: InspectionFindingSeverity.HIGH,
            ownerUserId: draft.findingResponsibleIds[0] ?? null,
            responsibleCompanyId: draft.findingCompanyId,
            responsibleUserIds: draft.findingResponsibleIds,
            dueAt: getDueDate(),
          };
          await syncQueue.enqueue({
            localId: findingLocalId,
            operationType: CREATE_INSPECTION_FINDING,
            entityType: 'inspection_finding',
            payload: { inspectionLocalId: localInspectionId, ...findingPayload },
            createdBy,
            deviceId: session.deviceId,
            deviceSessionId: session.deviceSessionId,
            dependsOnLocalIds: [localInspectionId, answerLocalId],
          });

          if (detail.evidence) {
            const findingEvidenceLocalId = createId('evidence');
            const uploadPayload: UploadAttachmentSyncPayload = {
              inspectionLocalId: localInspectionId,
              findingLocalId,
              localEvidenceId: findingEvidenceLocalId,
              sourceUri: detail.evidence.uri,
              remoteFileId: null,
              fileName: detail.evidence.name,
              mimeType: 'image/jpeg',
              sizeBytes: 0,
              evidenceType: 'photo',
              title: buildEvidenceTitle(item, detail),
              capturedAt: new Date().toISOString(),
              category: 'finding_evidence',
            };

            await syncQueue.enqueue({
              localId: findingEvidenceLocalId,
              operationType: UPLOAD_ATTACHMENT,
              entityType: 'evidence',
              payload: uploadPayload,
              createdBy,
              deviceId: session.deviceId,
              deviceSessionId: session.deviceSessionId,
              evidences: [{ localEvidenceId: findingEvidenceLocalId, localEntityId: findingLocalId, fileName: detail.evidence.name, mimeType: 'image/jpeg', sizeBytes: 0 }],
              dependsOnLocalIds: [localInspectionId, findingLocalId],
            });
          }
        }
      }

      if (noCount === 0) {
        await syncQueue.enqueue({
          operationType: CLOSE_INSPECTION,
          entityType: 'inspection_close',
          payload: { inspectionLocalId: localInspectionId, reason: 'Checklist sin hallazgos abiertos' },
          createdBy,
          deviceId: session.deviceId,
          deviceSessionId: session.deviceSessionId,
          dependsOnLocalIds: [localInspectionId],
        });
      }

      await createLocalInspection({
        localId: localInspectionId,
        title,
        inspectionTypeId: template.inspectionTypeId,
        templateId: template.id,
        companyId: draft.findingCompanyId,
        areaId: draft.areaId,
        sectorId: draft.sectorId,
        scheduledAt,
        latitude: draft.latitude,
        longitude: draft.longitude,
        notes: createPayload.notes ?? null,
        findingsCount: noCount,
        openFindingsCount: noCount,
        closed: noCount === 0,
      });

      if (trySyncNow) void syncPendingOperations();
      return { mode: 'checklist', inspectionId: localInspectionId, totalCount: items.length, yesCount, noCount, naCount, closed: noCount === 0 };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mobile-inspecciones', 'inspections'] });
    },
  });
}