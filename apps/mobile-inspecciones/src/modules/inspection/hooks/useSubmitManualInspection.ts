import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InspectionAnswerValue, InspectionFindingSeverity, type InspectionChecklistTemplateResponse } from '@aurelia/contracts';
import { closeInspection, submitInspection, submitInspectionAnswer, submitInspectionFinding } from '../../../shared/services/inspections.api';
import type { ManualInspectionDraft, ManualSavedInspectionResult } from '../manualInspection.store';

type ManualTemplateItem = InspectionChecklistTemplateResponse['sections'][number]['items'][number];

type ManualTemplateItemWithIndex = ManualTemplateItem & { index: number };

interface SubmitManualInspectionInput {
  draft: ManualInspectionDraft;
  template: InspectionChecklistTemplateResponse;
  items: ManualTemplateItemWithIndex[];
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
  if (answer === InspectionAnswerValue.NOT_COMPLIANT) {
    const correctiveAction = detail?.correctiveAction?.trim();
    const evidenceName = detail?.evidence?.name;
    return [correctiveAction ? `Medida correctiva: ${correctiveAction}` : null, evidenceName ? `Evidencia local: ${evidenceName}` : null]
      .filter(Boolean)
      .join('\n') || null;
  }
  return null;
}

function buildFindingDescription(detail: ManualInspectionDraft['detailsByItemId'][string]): string {
  return [
    detail?.detectedCondition?.trim() ? `Condición detectada: ${detail.detectedCondition.trim()}` : null,
    detail?.correctiveAction?.trim() ? `Medida correctiva propuesta: ${detail.correctiveAction.trim()}` : null,
    detail?.evidence?.name ? `Evidencia local: ${detail.evidence.name}` : null,
  ].filter(Boolean).join('\n');
}

function getDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
}

export function useSubmitManualInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ draft, template, items }: SubmitManualInspectionInput): Promise<ManualSavedInspectionResult> => {
      const inspection = await submitInspection({
        inspectionTypeId: template.inspectionTypeId,
        templateId: template.id,
        companyId: draft.findingCompanyId,
        areaId: draft.areaId,
        sectorId: draft.sectorId,
        locationId: null,
        title: draft.templateName ? `${draft.templateName} · ${draft.inspectionDate}` : `Checklist normativo · ${draft.inspectionDate}`,
        description: 'Inspección levantada desde mobile-inspecciones',
        scheduledAt: parseInspectionDate(draft.inspectionDate),
        latitude: draft.latitude,
        longitude: draft.longitude,
        notes: draft.generalPhoto?.name ? `Foto general local: ${draft.generalPhoto.name}` : null,
      });

      let yesCount = 0;
      let noCount = 0;
      let naCount = 0;

      for (const item of items) {
        const answer = draft.answersByItemId[item.id];
        const detail = draft.detailsByItemId[item.id] ?? {};
        if (!answer) continue;
        if (answer === InspectionAnswerValue.COMPLIANT) yesCount += 1;
        if (answer === InspectionAnswerValue.NOT_COMPLIANT) noCount += 1;
        if (answer === InspectionAnswerValue.NOT_APPLICABLE) naCount += 1;

        await submitInspectionAnswer(inspection.id, {
          checklistItemId: item.id,
          answerValue: answer,
          answerText: buildAnswerText(answer, detail),
          notes: buildAnswerNotes(answer, detail),
          answeredAt: new Date().toISOString(),
        });

        if (answer === InspectionAnswerValue.NOT_COMPLIANT) {
          await submitInspectionFinding(inspection.id, {
            checklistItemId: item.id,
            title: `Obs. ${item.index + 1} · ${item.code}`.slice(0, 200),
            description: buildFindingDescription(detail),
            severity: InspectionFindingSeverity.HIGH,
            ownerUserId: null,
            dueAt: getDueDate(),
          });
        }
      }

      let closed = false;
      if (noCount === 0) {
        await closeInspection(inspection.id, 'Checklist sin hallazgos abiertos');
        closed = true;
      }

      return { mode: 'checklist', inspectionId: inspection.id, totalCount: items.length, yesCount, noCount, naCount, closed };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['mobile-inspecciones', 'inspections'] }),
        queryClient.invalidateQueries({ queryKey: ['mobile-inspecciones', 'inspection-home-summary'] }),
      ]);
    },
  });
}
