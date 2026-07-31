import {
  Role,
  SprCycleStatus,
  SprCycleValidationStatus,
  type SprCycleValidationResponse,
} from '@aurelia/contracts';
import type { SprConsolidatedTabBadgeTone, SprConsolidatedTimelineStatus } from './spr.constants';
import type { SprConsolidatedStatusTabView, SprConsolidatedTimelineStepView } from './sprConsolidatedSacLayout';

/** Áreas SOX del paso 5 (mismo criterio que API SPR_SOX_AREA_CODES). */
export const SPR_SOX_AREA_DEFS = [
  { code: 'AREA-STECNICOS', name: 'Servicios Técnicos' },
  { code: 'AREA-OPTACTIVOS', name: 'Optimización de Activos' },
] as const;

export type SprSoxAreaCode = (typeof SPR_SOX_AREA_DEFS)[number]['code'];

const SOX_CODE_SET = new Set<string>(SPR_SOX_AREA_DEFS.map((def) => def.code));

export function isSprSoxAreaCode(code: string | null | undefined): boolean {
  return Boolean(code && SOX_CODE_SET.has(code));
}

export type SprSoxResponsibleValidationGate =
  | { kind: 'idle' }
  | {
      kind: 'pending';
      areaId: string;
      areaName: string;
      areaCode: SprSoxAreaCode;
    }
  | {
      kind: 'decided';
      areaId: string;
      areaName: string;
      areaCode: SprSoxAreaCode;
      validation: SprCycleValidationResponse;
    }
  | {
      kind: 'correction_requested';
      areaId: string;
      areaName: string;
      areaCode: SprSoxAreaCode;
      validation: SprCycleValidationResponse;
    };

/**
 * Gate Mi formulario Responsable SOX (Figma 1672:14978 / 27156).
 * pending → fila Validación de KPIs + revisión.
 * correction_requested → área reabierta (Figma 1760:27156).
 */
export function resolveSoxResponsibleValidationGate(args: {
  cycleStatus: SprCycleStatus | null | undefined;
  roles: Role[] | null | undefined;
  userAreaId: string | null | undefined;
  areas: Array<{ id: string; code: string; name: string }> | null | undefined;
  validations: SprCycleValidationResponse[];
}): SprSoxResponsibleValidationGate {
  const roles = args.roles ?? [];
  if (!roles.includes(Role.SPR_RESPONSIBLE)) return { kind: 'idle' };
  if (!args.userAreaId) return { kind: 'idle' };

  const area = (args.areas ?? []).find((row) => row.id === args.userAreaId);
  if (!area || !isSprSoxAreaCode(area.code)) return { kind: 'idle' };

  const validation =
    args.validations.find((row) => row.areaId === args.userAreaId) ??
    args.validations.find((row) => row.areaCode === area.code) ??
    null;

  const base = {
    areaId: area.id,
    areaName: area.name,
    areaCode: area.code as SprSoxAreaCode,
  };

  // Tras reopen: ciclo suele estar en signing; records rejected.
  if (validation?.status === SprCycleValidationStatus.REOPENED) {
    return { kind: 'correction_requested', ...base, validation };
  }

  if (
    args.cycleStatus !== SprCycleStatus.VALIDATING &&
    args.cycleStatus !== SprCycleStatus.VALIDATION_APPROVED &&
    args.cycleStatus !== SprCycleStatus.CLOSED
  ) {
    return { kind: 'idle' };
  }

  if (validation) {
    return { kind: 'decided', ...base, validation };
  }

  if (args.cycleStatus !== SprCycleStatus.VALIDATING) return { kind: 'idle' };

  return { kind: 'pending', ...base };
}

export type SprSoxValidationSlot = {
  code: SprSoxAreaCode;
  name: string;
  areaId: string | null;
  validation: SprCycleValidationResponse | null;
  statusLabel: 'Pendiente' | 'Aprobado' | 'Discrepancia' | 'Reabierto';
};

export type SprSoxValidationPhase =
  | 'awaiting-signatures'
  | 'awaiting-sox'
  | 'has-discrepancy'
  | 'awaiting-correction'
  | 'validation-approved'
  | 'cycle-closed';

export function resolveSprSoxValidationPhase(args: {
  bothSignaturesDone: boolean;
  validations: SprCycleValidationResponse[];
  cycleStatus: SprCycleStatus | null | undefined;
}): SprSoxValidationPhase {
  if (args.cycleStatus === SprCycleStatus.CLOSED) {
    return 'cycle-closed';
  }
  if (args.cycleStatus === SprCycleStatus.VALIDATION_APPROVED) {
    return 'validation-approved';
  }
  if (
    args.validations.some((row) => row.status === SprCycleValidationStatus.REOPENED)
  ) {
    return 'awaiting-correction';
  }
  if (!args.bothSignaturesDone) return 'awaiting-signatures';
  if (
    args.validations.some(
      (row) => row.status === SprCycleValidationStatus.DISCREPANCY_REPORTED,
    )
  ) {
    return 'has-discrepancy';
  }
  const approvedCount = args.validations.filter(
    (row) => row.status === SprCycleValidationStatus.APPROVED,
  ).length;
  if (approvedCount >= SPR_SOX_AREA_DEFS.length) return 'validation-approved';
  return 'awaiting-sox';
}

export function buildSoxValidationSlots(
  areas: Array<{ id: string; code: string; name: string }> | null | undefined,
  validations: SprCycleValidationResponse[],
): SprSoxValidationSlot[] {
  const byCode = new Map((areas ?? []).map((area) => [area.code, area]));
  const validationByAreaId = new Map(validations.map((row) => [row.areaId, row]));
  const validationByCode = new Map(validations.map((row) => [row.areaCode, row]));

  return SPR_SOX_AREA_DEFS.map((def) => {
    const area = byCode.get(def.code);
    const validation =
      (area ? validationByAreaId.get(area.id) : undefined) ??
      validationByCode.get(def.code) ??
      null;
    return {
      code: def.code,
      name: area?.name ?? def.name,
      areaId: area?.id ?? validation?.areaId ?? null,
      validation,
      statusLabel: statusLabelForValidation(validation),
    };
  });
}

function statusLabelForValidation(
  validation: SprCycleValidationResponse | null,
): SprSoxValidationSlot['statusLabel'] {
  if (!validation) return 'Pendiente';
  if (validation.status === SprCycleValidationStatus.APPROVED) return 'Aprobado';
  if (validation.status === SprCycleValidationStatus.DISCREPANCY_REPORTED) return 'Discrepancia';
  if (validation.status === SprCycleValidationStatus.REOPENED) return 'Reabierto';
  return 'Pendiente';
}

/** Ajusta timeline post-firmas con progreso real de validaciones SOX. */
export function applySoxValidationToTimeline(
  steps: SprConsolidatedTimelineStepView[],
  phase: SprSoxValidationPhase,
  validations: SprCycleValidationResponse[],
): SprConsolidatedTimelineStepView[] {
  if (phase === 'awaiting-signatures') return steps;

  const approvedCount = validations.filter(
    (row) => row.status === SprCycleValidationStatus.APPROVED,
  ).length;

  return steps.map((step) => {
    if (step.id !== 'validation') return step;
    if (phase === 'validation-approved' || phase === 'cycle-closed') {
      return { ...step, badge: 'Completado', status: 'done' as SprConsolidatedTimelineStatus };
    }
    if (phase === 'has-discrepancy') {
      return {
        ...step,
        badge: 'Discrepancia',
        status: 'discrepancy' as SprConsolidatedTimelineStatus,
      };
    }
    if (phase === 'awaiting-correction') {
      return {
        ...step,
        badge: 'En corrección',
        status: 'discrepancy' as SprConsolidatedTimelineStatus,
      };
    }
    return {
      ...step,
      badge: approvedCount > 0 ? `${approvedCount}/${SPR_SOX_AREA_DEFS.length}` : 'En curso',
      status: 'active' as SprConsolidatedTimelineStatus,
    };
  });
}

export function applySoxValidationToStatusTabs(
  tabs: SprConsolidatedStatusTabView[],
  phase: SprSoxValidationPhase,
  validations: SprCycleValidationResponse[],
): SprConsolidatedStatusTabView[] {
  if (phase === 'awaiting-signatures') return tabs;

  const approvedCount = validations.filter(
    (row) => row.status === SprCycleValidationStatus.APPROVED,
  ).length;

  return tabs.map((tab) => {
    if (tab.id !== 'validacion') return tab;
    if (phase === 'validation-approved' || phase === 'cycle-closed') {
      return { ...tab, badge: 'Completado', badgeTone: 'teal' as SprConsolidatedTabBadgeTone };
    }
    if (phase === 'has-discrepancy') {
      return { ...tab, badge: 'Discrepancia', badgeTone: 'rose' as SprConsolidatedTabBadgeTone };
    }
    if (phase === 'awaiting-correction') {
      return { ...tab, badge: 'En corrección', badgeTone: 'rose' as SprConsolidatedTabBadgeTone };
    }
    return {
      ...tab,
      badge: approvedCount > 0 ? `${approvedCount}/${SPR_SOX_AREA_DEFS.length}` : 'Pendiente',
      badgeTone: 'amber' as SprConsolidatedTabBadgeTone,
    };
  });
}

/** Fecha/hora legible para cards de discrepancia SOX (Figma 23481). */
export function formatSoxValidationDecidedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} · ${hours}:${minutes}`;
}

/** Primera validación SOX en estado reopened (proceso en corrección). */
export function findReopenedSoxValidation(
  validations: SprCycleValidationResponse[],
): SprCycleValidationResponse | null {
  return (
    validations.find((row) => row.status === SprCycleValidationStatus.REOPENED) ?? null
  );
}

/**
 * Firma bloqueada solo mientras hay área reopened Y sus records del ciclo
 * aún no están todos approved (criterio Figma post-reopen).
 * Si Laura corrigió y Pedro aprobó → firma habilitada aunque validation siga reopened.
 */
export function isSprSignatureBlockedByReopenCorrection(args: {
  validations: SprCycleValidationResponse[];
  areas: Array<{ id: string; code: string }> | null | undefined;
  /** Cards del Dashboard real (`complete` = todos los assignments approved). */
  areaCards: Array<{ slug: string; status: string }> | null | undefined;
}): boolean {
  const reopened = args.validations.filter(
    (row) => row.status === SprCycleValidationStatus.REOPENED,
  );
  if (reopened.length === 0) return false;

  const codeByAreaId = new Map((args.areas ?? []).map((area) => [area.id, area.code]));
  const slugByCode = new Map(
    [
      ['AREA-STECNICOS', 'servicios-tecnicos'],
      ['AREA-OPTACTIVOS', 'optimizacion-de-activos'],
    ] as const,
  );

  for (const validation of reopened) {
    const code = validation.areaCode || codeByAreaId.get(validation.areaId) || '';
    const slug = slugByCode.get(code as 'AREA-STECNICOS' | 'AREA-OPTACTIVOS');
    if (!slug) return true;
    const card = (args.areaCards ?? []).find((row) => row.slug === slug);
    if (!card || card.status !== 'complete') return true;
  }
  return false;
}

export type SprReopenElapsedAvailability = {
  /** Etiqueta corta a la derecha del banner (p. ej. "En corrección"). */
  elapsedLabel: string;
  /** Días transcurridos desde reopenedAt ("Hoy" | "1 día" | "N días"). */
  daysLabel: string;
  daysElapsed: number;
};

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Countdown transcurrido desde reopen (Figma 1760:24680 / 25200).
 * No es deadline: cuenta días desde reopenedAt hasta hoy.
 */
export function buildSprReopenElapsedAvailability(
  reopenedAt: string | null | undefined,
  now: Date = new Date(),
): SprReopenElapsedAvailability | null {
  if (!reopenedAt) return null;
  const reopened = new Date(reopenedAt);
  if (Number.isNaN(reopened.getTime())) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysElapsed = Math.max(
    0,
    Math.round((startOfLocalDay(now).getTime() - startOfLocalDay(reopened).getTime()) / msPerDay),
  );
  if (daysElapsed === 0) {
    return { elapsedLabel: 'En corrección', daysLabel: 'Hoy', daysElapsed };
  }
  if (daysElapsed === 1) {
    return { elapsedLabel: 'En corrección', daysLabel: '1 día', daysElapsed };
  }
  return { elapsedLabel: 'En corrección', daysLabel: `${daysElapsed} días`, daysElapsed };
}

/**
 * Tras reopen: el consolidado vuelve a verse parcial (N/8) y SAC/firmas dejan de
 * afirmarse como "listos", aunque el submission SAC siga sent en backend.
 */
export function applyProcesoReabiertoToTimeline(
  steps: readonly SprConsolidatedTimelineStepView[],
  args: { withData: number | null; total: number | null },
): SprConsolidatedTimelineStepView[] {
  const areasBadge =
    args.withData != null && args.total != null
      ? `${args.withData}/${args.total} áreas`
      : '7/8 áreas';

  return steps.map((step) => {
    if (step.id === 'areas') {
      return { ...step, badge: areasBadge, status: 'partial' as SprConsolidatedTimelineStatus };
    }
    if (step.id === 'sac-send') {
      return { ...step, badge: 'En proceso', status: 'active' as SprConsolidatedTimelineStatus };
    }
    if (step.id === 'esp' || step.id === 'gte-ma') {
      return { ...step, badge: 'Pendiente', status: 'upcoming' as SprConsolidatedTimelineStatus };
    }
    if (step.id === 'validation') {
      return {
        ...step,
        badge: 'En corrección',
        status: 'discrepancy' as SprConsolidatedTimelineStatus,
      };
    }
    return { ...step };
  });
}

export function applyProcesoReabiertoToStatusTabs(
  tabs: readonly SprConsolidatedStatusTabView[],
  args: { withData: number | null; total: number | null },
): SprConsolidatedStatusTabView[] {
  const consolidadoBadge =
    args.withData != null && args.total != null ? `${args.withData}/${args.total}` : '7/8';

  return tabs.map((tab) => {
    if (tab.id === 'consolidado') {
      return {
        ...tab,
        label: 'Consolidado en curso',
        badge: consolidadoBadge,
        badgeTone: 'teal' as SprConsolidatedTabBadgeTone,
      };
    }
    if (tab.id === 'sac') {
      return { ...tab, badge: 'En proceso', badgeTone: 'amber' as SprConsolidatedTabBadgeTone };
    }
    if (tab.id === 'firma') {
      return { ...tab, badge: 'Pendiente', badgeTone: 'muted' as SprConsolidatedTabBadgeTone };
    }
    if (tab.id === 'validacion') {
      return {
        ...tab,
        badge: 'En corrección',
        badgeTone: 'rose' as SprConsolidatedTabBadgeTone,
      };
    }
    return { ...tab };
  });
}

