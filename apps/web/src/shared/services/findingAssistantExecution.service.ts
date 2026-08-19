import type { InspectionDetailFindingItemResponse } from '@aurelia/contracts';

type AssistantExecutionRule = {
  matchSeverity?: string[];
  text: string;
};

type AssistantExecutionMock = {
  defaultText: string;
  rules: AssistantExecutionRule[];
};

type SuggestFindingExecutionActionInput = {
  item: InspectionDetailFindingItemResponse | null | undefined;
  areaLabel: string;
};

export type FindingAssistantExecutionSuggestionPayload = {
  inspectionId: string | null;
  findingId: string | null;
  areaLabel: string;
  condition: string;
  proposedCorrectiveAction: string;
  severityLabel: string;
  dueAt: string | null;
  responsibleCompanyName: string | null;
  beforeEvidence: Array<{
    fileId: string | null;
    title: string | null;
    description: string | null;
    capturedAt: string | null;
  }>;
};

const fallbackMock: AssistantExecutionMock = {
  defaultText: 'Se ejecutó la medida correctiva solicitada para subsanar la condición detectada. Se verificó el estado posterior y se adjunta evidencia fotográfica de cierre para revisión del Admin GF HSE.',
  rules: [],
};

function normalize(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function buildFindingAssistantExecutionSuggestionPayload(input: SuggestFindingExecutionActionInput): FindingAssistantExecutionSuggestionPayload {
  const item = input.item;
  return {
    inspectionId: null,
    findingId: item?.findingId ?? null,
    areaLabel: input.areaLabel || 'el área inspeccionada',
    condition: item?.condition ?? 'la condición detectada',
    proposedCorrectiveAction: item?.proposedCorrectiveAction ?? 'la medida correctiva solicitada',
    severityLabel: item?.severityLabel ?? 'criticidad registrada',
    dueAt: item?.dueAt ?? null,
    responsibleCompanyName: item?.responsibleCompanyName ?? item?.responsibleUsers[0]?.companyName ?? null,
    beforeEvidence: (item?.beforeEvidence ?? []).map((evidence) => ({
      fileId: evidence.fileId ?? null,
      title: evidence.title ?? null,
      description: evidence.description ?? null,
      capturedAt: evidence.capturedAt ?? null,
    })),
  };
}

function interpolate(template: string, payload: FindingAssistantExecutionSuggestionPayload) {
  return template
    .replaceAll('{{areaLabel}}', payload.areaLabel)
    .replaceAll('{{condition}}', payload.condition)
    .replaceAll('{{proposedCorrectiveAction}}', payload.proposedCorrectiveAction)
    .replaceAll('{{severityLabel}}', payload.severityLabel)
    .replaceAll('{{responsibleCompanyName}}', payload.responsibleCompanyName ?? 'la empresa responsable');
}

async function loadMock(): Promise<AssistantExecutionMock> {
  try {
    const response = await fetch('/mock/finding-assistant-execution-suggestions.json', { cache: 'no-cache' });
    if (!response.ok) return fallbackMock;
    const payload = await response.json() as AssistantExecutionMock;
    if (!payload.defaultText || !Array.isArray(payload.rules)) return fallbackMock;
    return payload;
  } catch {
    return fallbackMock;
  }
}

export async function suggestFindingExecutionAction(input: SuggestFindingExecutionActionInput): Promise<string> {
  const payload = buildFindingAssistantExecutionSuggestionPayload(input);
  const mock = await loadMock();
  const severity = normalize(payload.severityLabel);
  const rule = mock.rules.find((candidate) => candidate.matchSeverity?.some((value) => severity.includes(normalize(value))));
  return interpolate(rule?.text ?? mock.defaultText, payload);
}
