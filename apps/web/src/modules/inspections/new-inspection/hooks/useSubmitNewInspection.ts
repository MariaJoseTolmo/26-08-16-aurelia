import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  InspectionAnswerValue,
  InspectionEvidenceRelationType,
  InspectionFindingSeverity,
  InspectionType,
  type CreateEvidenceRequest,
  type CreateInspectionRequest,
  type InspectionChecklistItem,
  type InspectionChecklistTemplateResponse,
  type UpsertInspectionAnswerRequest,
} from '@aurelia/contracts';
import { finalizeInspectionForm } from '../../../../shared/services/inspection-finalization.service';
import {
  closeInspection,
  createEvidence,
  createInspection,
  createInspectionFinding,
  getInspectionTypes,
  getInspectionTemplates,
  linkEvidence,
  uploadFile,
  upsertInspectionAnswer,
} from '../../../../shared/services/inspections.service';
import type { NewInspectionDraft } from '../state/newInspectionDraft.store';

type ChecklistItemRow = InspectionChecklistItem & { index: number };
type EvidenceEntityType = 'inspection' | 'inspection_finding' | 'inspection_followup';

function parseInspectionDate(value: string): string {
  const parts = value.includes('-') ? value.split('-') : value.split('/');
  if (parts.length !== 3) return new Date().toISOString();
  const [day, month, year] = parts.map((part) => Number(part));
  if (!day || !month || !year) return new Date().toISOString();
  return new Date(year, month - 1, day, 12, 0, 0).toISOString();
}

function mapSeverity(label: string | null | undefined): InspectionFindingSeverity {
  const value = (label ?? '').trim().toLowerCase();
  if (value.includes('crit')) return InspectionFindingSeverity.CRITICAL;
  if (value.includes('alto') || value.includes('grave')) return InspectionFindingSeverity.HIGH;
  if (value.includes('medio') || value.includes('moder')) return InspectionFindingSeverity.MEDIUM;
  if (value.includes('bajo') || value.includes('leve')) return InspectionFindingSeverity.LOW;
  return InspectionFindingSeverity.MEDIUM;
}

function getDueDate(daysAhead = 7): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString();
}

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

function checklistItems(template: InspectionChecklistTemplateResponse): ChecklistItemRow[] {
  return template.sections
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((section) =>
      section.items
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item, index) => ({ ...item, index })),
    );
}

function buildChecklistTitle(draft: NewInspectionDraft): string {
  return `${draft.templateName ?? 'Checklist normativo'} · ${draft.inspectionDate}`.slice(0, 180);
}

function buildFindingTitle(draft: NewInspectionDraft, index: number): string {
  return `${draft.findingTypeLabel ?? 'Hallazgo'} ${index + 1}`.slice(0, 180);
}

async function createAndLinkEvidence(input: {
  file: File;
  title: string;
  description: string | null;
  relationType: InspectionEvidenceRelationType;
  entityType: EvidenceEntityType;
  entityId: string;
  latitude: number | null;
  longitude: number | null;
}) {
  const fileResponse = await uploadFile(input.file, null);
  const evidencePayload: CreateEvidenceRequest = {
    fileId: fileResponse.id,
    title: input.title,
    description: input.description ?? undefined,
    evidenceType: 'photo',
    capturedAt: new Date().toISOString(),
    latitude: input.latitude ?? undefined,
    longitude: input.longitude ?? undefined,
  };
  const evidence = await createEvidence(evidencePayload);
  await linkEvidence(evidence.id, {
    entityType: input.entityType,
    entityId: input.entityId,
    relationType: input.relationType,
  });
  return evidence;
}

async function submitChecklistFlow(draft: NewInspectionDraft) {
  const templates = await getInspectionTemplates();
  const template = templates.find((item) => item.id === draft.templateId);
  if (!template) throw new Error('No se encontro la plantilla seleccionada.');
  const inspectionDate = parseInspectionDate(draft.inspectionDate);

  const createPayload: CreateInspectionRequest = {
    inspectionTypeId: template.inspectionTypeId,
    templateId: template.id,
    companyId: draft.findingCompanyId,
    areaId: draft.areaId,
    sectorId: draft.sectorId,
    locationId: null,
    title: buildChecklistTitle(draft),
    description: 'Inspeccion checklist registrada desde web.',
    scheduledAt: inspectionDate,
    latitude: draft.latitude,
    longitude: draft.longitude,
    notes: draft.generalPhoto?.name ? `Foto general: ${draft.generalPhoto.name}` : null,
  };

  const inspection = await createInspection(createPayload);
  const items = checklistItems(template);

  if (draft.generalPhoto?.file) {
    await createAndLinkEvidence({
      file: draft.generalPhoto.file,
      title: `Foto general: ${buildChecklistTitle(draft)}`.slice(0, 180),
      description: 'Evidencia general de checklist',
      relationType: InspectionEvidenceRelationType.GENERAL_PHOTO,
      entityType: 'inspection',
      entityId: inspection.id,
      latitude: draft.latitude,
      longitude: draft.longitude,
    });
  }

  let notCompliantCount = 0;
  for (const item of items) {
    const answer = draft.answersByItemId[item.id];
    if (!answer) continue;

    const detail = draft.detailsByItemId[item.id] ?? {};
    const detectedCondition = trimOrNull(detail.detectedCondition);
    const correctiveAction = trimOrNull(detail.correctiveAction);
    const answerPayload: UpsertInspectionAnswerRequest = {
      checklistItemId: item.id,
      answerValue: answer,
      answerText: answer === InspectionAnswerValue.NOT_COMPLIANT ? detectedCondition : trimOrNull(detail.comment),
      notes:
        answer === InspectionAnswerValue.NOT_COMPLIANT
          ? [correctiveAction, detail.evidence?.name ?? null].filter(Boolean).join('\n') || null
          : null,
      answeredAt: new Date().toISOString(),
    };

    await upsertInspectionAnswer(inspection.id, answerPayload);

    if (answer === InspectionAnswerValue.NOT_COMPLIANT) {
      notCompliantCount += 1;
      const finding = await createInspectionFinding(inspection.id, {
        checklistItemId: item.id,
        findingTypeId: null,
        severityId: null,
        responsibleCompanyId: draft.findingCompanyId,
        responsibleUserIds: draft.findingResponsibleIds,
        title: `Obs. ${item.index + 1} · ${item.code}`.slice(0, 200),
        description: [detectedCondition, correctiveAction ? `Medida correctiva: ${correctiveAction}` : null, detail.evidence?.name ? `Evidencia: ${detail.evidence.name}` : null]
          .filter(Boolean)
          .join('\n'),
        detectedCondition,
        proposedCorrectiveAction: correctiveAction,
        severity: InspectionFindingSeverity.HIGH,
        ownerUserId: draft.findingResponsibleIds[0] ?? null,
        dueAt: getDueDate(7),
      });

      if (detail.evidence?.file) {
        await createAndLinkEvidence({
          file: detail.evidence.file,
          title: `Evidencia obs. ${item.index + 1} · ${item.code}`.slice(0, 180),
          description: detectedCondition,
          relationType: InspectionEvidenceRelationType.BEFORE_PHOTO,
          entityType: 'inspection_finding',
          entityId: finding.id,
          latitude: draft.latitude,
          longitude: draft.longitude,
        });
      }
    }
  }

  if (notCompliantCount === 0) {
    await closeInspection(inspection.id, 'Checklist sin hallazgos abiertos');
  } else {
    await finalizeInspectionForm(inspection.id, inspectionDate);
  }

  return inspection.id;
}

async function submitFindingFlow(draft: NewInspectionDraft) {
  const inspectionTypes = await getInspectionTypes();
  const type = inspectionTypes.find((item) => item.code === InspectionType.ENVIRONMENTAL);
  if (!type) throw new Error('No se encontro el tipo de inspeccion Hallazgo.');
  const inspectionDate = parseInspectionDate(draft.inspectionDate);

  const createPayload: CreateInspectionRequest = {
    inspectionTypeId: type.id,
    templateId: null,
    companyId: draft.findingCompanyId,
    areaId: draft.areaId,
    sectorId: draft.sectorId,
    locationId: null,
    title: `${draft.findingTypeLabel ?? 'Hallazgo'} · ${draft.areaName ?? 'Sin area'} · ${draft.inspectionDate}`.slice(0, 180),
    description: 'Inspeccion tipo hallazgo registrada desde web.',
    scheduledAt: inspectionDate,
    latitude: draft.latitude,
    longitude: draft.longitude,
    notes: draft.locationLabel,
  };

  const inspection = await createInspection(createPayload);
  const observations = draft.findingObservations.filter((item) => item.saved);

  if (draft.generalPhoto?.file) {
    await createAndLinkEvidence({
      file: draft.generalPhoto.file,
      title: `Foto general: ${createPayload.title}`.slice(0, 180),
      description: 'Evidencia general de inspeccion tipo hallazgo',
      relationType: InspectionEvidenceRelationType.GENERAL_PHOTO,
      entityType: 'inspection',
      entityId: inspection.id,
      latitude: draft.latitude,
      longitude: draft.longitude,
    });
  }

  for (const [index, observation] of observations.entries()) {
    const matchDays = (observation.severityClosureTimeLabel ?? '').match(/(\d+)/);
    const dueDays = matchDays ? Number(matchDays[1]) : 7;
    const detectedCondition = trimOrNull(observation.detectedCondition);
    const correctiveAction = trimOrNull(observation.correctiveAction);

    const finding = await createInspectionFinding(inspection.id, {
      checklistItemId: null,
      findingTypeId: draft.findingTypeId,
      severityId: observation.severityId,
      responsibleCompanyId: draft.findingCompanyId,
      responsibleUserIds: draft.findingResponsibleIds,
      title: buildFindingTitle(draft, index),
      description: [
        detectedCondition,
        correctiveAction ? `Medida correctiva: ${correctiveAction}` : null,
        observation.evidence?.name ? `Evidencia: ${observation.evidence.name}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      detectedCondition,
      proposedCorrectiveAction: correctiveAction,
      severity: mapSeverity(observation.severityLabel),
      ownerUserId: draft.findingResponsibleIds[0] ?? null,
      dueAt: getDueDate(dueDays),
    });

    if (observation.evidence?.file) {
      await createAndLinkEvidence({
        file: observation.evidence.file,
        title: `Evidencia hallazgo ${index + 1}`,
        description: detectedCondition,
        relationType: InspectionEvidenceRelationType.BEFORE_PHOTO,
        entityType: 'inspection_finding',
        entityId: finding.id,
        latitude: draft.latitude,
        longitude: draft.longitude,
      });
    }
  }

  await finalizeInspectionForm(inspection.id, inspectionDate);

  return inspection.id;
}

export function useSubmitNewInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: NewInspectionDraft) => {
      if (draft.inspectionType === InspectionType.ENVIRONMENTAL) {
        return submitFindingFlow(draft);
      }
      return submitChecklistFlow(draft);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['inspections', 'management'] }),
        queryClient.invalidateQueries({ queryKey: ['inspections', 'dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['inspections'] }),
      ]);
    },
  });
}
