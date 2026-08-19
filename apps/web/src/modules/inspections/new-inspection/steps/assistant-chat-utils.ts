import { InspectionAnswerValue, InspectionType, type InspectionChecklistTemplateResponse, type InspectionTypeResponse, type UserResponse } from '@aurelia/contracts';
import { type AssistantChecklistRow } from './assistant-chat-options';

export function normalizeAssistantText(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function assistantDates() {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - index);
    return `${String(day.getDate()).padStart(2, '0')}-${String(day.getMonth() + 1).padStart(2, '0')}-${day.getFullYear()}`;
  });
}

export function assistantRowsOf(template: InspectionChecklistTemplateResponse | null): AssistantChecklistRow[] {
  if (!template) return [];
  return template.sections
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .flatMap((section) =>
      section.items
        .slice()
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((item) => ({ ...item, sectionTitle: section.title, index: 0 })),
    )
    .map((item, index) => ({ ...item, index }));
}

export function assistantChecklistTypeId(types: InspectionTypeResponse[]) {
  return types.find((item) => item.code === InspectionType.REGULATORY)?.id ?? null;
}

export function assistantAnswerLabel(value?: InspectionAnswerValue) {
  if (value === InspectionAnswerValue.COMPLIANT) return 'SÍ';
  if (value === InspectionAnswerValue.NOT_COMPLIANT) return 'NO';
  if (value === InspectionAnswerValue.NOT_APPLICABLE) return 'N/A';
  return 'Pendiente';
}

export function parseAssistantSlaDays(label: string | null | undefined, fallback = 7) {
  const value = Number((label ?? '').match(/(\d+)/)?.[1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function assistantReceiptText(fileName: string) {
  const now = new Date();
  return `${fileName} · GPS ok · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function defaultAssistantSlaLabel(days: number) {
  return `${days} Días`;
}

export function suggestedAssistantResponsible(users: UserResponse[]) {
  return users.find((user) => (user.position ?? '').toLowerCase().includes('supervisor')) ?? users[0] ?? null;
}
