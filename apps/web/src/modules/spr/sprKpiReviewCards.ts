import type {
  SprMonthlyRecordResponse,
  SprParameterResponse,
  SprUnitResponse,
} from '@aurelia/contracts';
import { SprCycleValidationDecision } from '@aurelia/contracts';
import {
  SPR_KPI_REVIEW,
  type SprKpiReviewCardConfig,
} from './spr.constants';

export type SprKpiReviewDirectCard = Extract<SprKpiReviewCardConfig, { type: 'direct' }> & {
  parameterId: string;
  sacUnavailable: true;
};

export type SprKpiReviewCardResponse = 'pending' | 'confirmed' | 'discrepancy';

const numberFormatter = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });

function formatNumericValue(value: number): string {
  return numberFormatter.format(value);
}

function buildUnitSymbolMap(units: SprUnitResponse[] | undefined): Map<string, string> {
  const map = new Map<string, string>();
  (units ?? []).forEach((unit) => {
    if (unit.symbol) map.set(unit.id, unit.symbol);
  });
  return map;
}

function resolveYouEntered(
  record: SprMonthlyRecordResponse | undefined,
  unitSymbol: string,
): { value: string; unit: string } {
  if (!record) {
    return { value: '—', unit: unitSymbol };
  }
  if (record.numericValue !== null && record.numericValue !== undefined) {
    return { value: formatNumericValue(record.numericValue), unit: unitSymbol };
  }
  if (record.textValue !== null && record.textValue.trim() !== '') {
    return { value: record.textValue.trim(), unit: unitSymbol };
  }
  return { value: '—', unit: unitSymbol };
}

/**
 * Cards SOX reales para revisión KPI (Figma 2653:2078).
 * Solo parámetros isSox del área; SAC siempre placeholder (sin integración).
 */
export function buildSoxKpiReviewCards(
  parameters: SprParameterResponse[] | undefined,
  records: SprMonthlyRecordResponse[] | undefined,
  units: SprUnitResponse[] | undefined,
): SprKpiReviewDirectCard[] {
  const unitSymbolMap = buildUnitSymbolMap(units);
  const recordByParameterId = new Map((records ?? []).map((record) => [record.parameterId, record]));

  return (parameters ?? [])
    .filter((parameter) => parameter.isSox)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code))
    .map((parameter) => {
      const unitSymbol = parameter.unitId ? (unitSymbolMap.get(parameter.unitId) ?? '') : '';
      const record = recordByParameterId.get(parameter.id);
      const youEntered = resolveYouEntered(record, unitSymbol);

      return {
        id: parameter.code,
        parameterId: parameter.id,
        type: 'direct' as const,
        title: parameter.name,
        subtitle: parameter.description?.trim() || SPR_KPI_REVIEW.soxCardSubtitleFallback,
        youEntered,
        sacReceived: {
          value: SPR_KPI_REVIEW.sacUnavailableValue,
          unit: '',
        },
        matchMessage: '',
        sacUnavailable: true as const,
      };
    });
}

export function buildKpiReviewMetaLabel(areaName: string, signDateLabel: string | null): string {
  if (signDateLabel) return `${areaName} · Firmado · ${signDateLabel}`;
  return areaName;
}

/**
 * Agrega decisiones por card al payload del POST actual (área completa, sin schema nuevo).
 */
export function buildSoxValidationPayload(
  cards: Array<Pick<SprKpiReviewCardConfig, 'id' | 'title'>>,
  responses: Record<string, SprKpiReviewCardResponse>,
  discrepancyComments: Record<string, string>,
): {
  decision: SprCycleValidationDecision;
  comments: string | null;
} {
  const discrepancies = cards.filter((card) => responses[card.id] === 'discrepancy');
  if (discrepancies.length === 0) {
    return { decision: SprCycleValidationDecision.APPROVED, comments: null };
  }

  return {
    decision: SprCycleValidationDecision.DISCREPANCY_REPORTED,
    comments: discrepancies
      .map((card) => {
        const comment = discrepancyComments[card.id]?.trim() ?? '';
        return `${card.title}: ${comment}`;
      })
      .join('\n\n'),
  };
}
