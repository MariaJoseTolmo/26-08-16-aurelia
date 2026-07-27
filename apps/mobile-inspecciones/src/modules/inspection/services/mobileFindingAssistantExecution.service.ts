import type { InspectionDetailFindingItemResponse } from '@aurelia/contracts';

type SuggestFindingExecutionActionInput = {
  item: InspectionDetailFindingItemResponse | null | undefined;
  areaLabel: string;
};

export type MobileFindingAssistantSuggestionPayload = {
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

type SuggestionRule = {
  matchSeverity: string[];
  text: string;
};

const defaultText = 'Se ejecutó la medida correctiva solicitada: {{proposedCorrectiveAction}}. Se verificó el estado posterior de la condición detectada y se adjunta evidencia fotográfica de cierre para revisión del Admin GF HSE.';

const rules: SuggestionRule[] = [
  {
    matchSeverity: ['Crítico', 'Critico', 'Grave', 'Alto'],
    text: 'Se implementó la medida correctiva prioritaria indicada para controlar la condición detectada en {{areaLabel}}: {{proposedCorrectiveAction}}. Se verificó el estado posterior y se adjunta evidencia fotográfica para revisión del Admin GF HSE.',
  },
  {
    matchSeverity: ['Moderado', 'Moderada', 'Medio'],
    text: 'Se ejecutó la acción correctiva indicada para regularizar la observación en {{areaLabel}}. La intervención tomó como referencia la medida solicitada: {{proposedCorrectiveAction}}, y se adjunta evidencia fotográfica de respaldo.',
  },
  {
    matchSeverity: ['Menor', 'Bajo', 'Baja'],
    text: 'Se corrigió la condición observada en {{areaLabel}} aplicando la medida solicitada: {{proposedCorrectiveAction}}. La evidencia posterior queda disponible para validación del equipo Admin GF HSE.',
  },
];

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function interpolate(template: string, payload: MobileFindingAssistantSuggestionPayload): string {
  return template
    .replaceAll('{{areaLabel}}', payload.areaLabel)
    .replaceAll('{{condition}}', payload.condition)
    .replaceAll('{{proposedCorrectiveAction}}', payload.proposedCorrectiveAction)
    .replaceAll('{{severityLabel}}', payload.severityLabel)
    .replaceAll('{{responsibleCompanyName}}', payload.responsibleCompanyName ?? 'la empresa responsable');
}

export function buildMobileFindingAssistantSuggestionPayload(
  input: SuggestFindingExecutionActionInput,
): MobileFindingAssistantSuggestionPayload {
  const item = input.item;
  return {
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

export async function suggestMobileFindingExecutionAction(
  input: SuggestFindingExecutionActionInput,
): Promise<string> {
  const payload = buildMobileFindingAssistantSuggestionPayload(input);
  const severity = normalize(payload.severityLabel);
  const rule = rules.find((candidate) => candidate.matchSeverity.some((value) => severity.includes(normalize(value))));
  return interpolate(rule?.text ?? defaultText, payload);
}
