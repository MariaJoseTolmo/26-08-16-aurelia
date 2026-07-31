import {
  SprCycleSacSubmissionStatus,
  type SprCycleSacSubmissionResponse,
  type SprCycleStatus,
} from '@aurelia/contracts';
import {
  SPR_CONSOLIDATED_FLOW,
  SPR_CONSOLIDATED_REPORT,
  type SprConsolidatedFlowId,
  type SprConsolidatedTabBadgeTone,
  type SprConsolidatedTimelineStatus,
} from '../../modules/spr/spr.constants';

export type SprConsolidatedSacLayoutMode = 'en-curso' | 'preparing' | 'enviado';

/** Flujos mock de fases posteriores: ?estado= sigue mandando (no sobrescribir con SAC). */
const LEGACY_DEMO_FLOWS = new Set<SprConsolidatedFlowId>([
  SPR_CONSOLIDATED_FLOW.consolidadoSieteAreas,
  SPR_CONSOLIDATED_FLOW.sacPreparando,
  SPR_CONSOLIDATED_FLOW.sacReabierto,
  SPR_CONSOLIDATED_FLOW.sacDisponible,
  SPR_CONSOLIDATED_FLOW.firmaGerente,
  SPR_CONSOLIDATED_FLOW.firmasCompletas,
  SPR_CONSOLIDATED_FLOW.validacionDiscrepancia,
  SPR_CONSOLIDATED_FLOW.validacionDiscrepanciaPostFirma,
  SPR_CONSOLIDATED_FLOW.validacionAprobada,
  SPR_CONSOLIDATED_FLOW.cicloCerrado,
]);

export function isSprSacSubmissionSent(
  status: SprCycleSacSubmissionStatus | null | undefined,
): boolean {
  return (
    status === SprCycleSacSubmissionStatus.SENT ||
    status === SprCycleSacSubmissionStatus.REPORT_READY
  );
}

export function isSprSacSubmissionPreparing(
  status: SprCycleSacSubmissionStatus | null | undefined,
): boolean {
  return status === SprCycleSacSubmissionStatus.PREPARING;
}

/** Mismo criterio que Dashboard KPI “En consolidado” / status rows N/8. */
export function countSprAreasInConsolidado(
  areaCards: Array<{ status: string }> | null | undefined,
): { withData: number; total: number } | null {
  if (!areaCards || areaCards.length === 0) return null;
  return {
    total: areaCards.length,
    withData: areaCards.filter((card) => card.status === 'consolidating' || card.status === 'complete')
      .length,
  };
}

/**
 * ¿Este ?estado= se resuelve con cycle + SAC reales?
 * en-curso, preparing y consolidado-enviado: sí (honesto).
 * Otros demos Figma: no (siguen mock).
 */
export function isConsolidatedFlowDrivenBySac(flow: SprConsolidatedFlowId): boolean {
  return !LEGACY_DEMO_FLOWS.has(flow);
}

/**
 * Layout del consolidado según SAC real.
 *
 * Fase 4 (pendiente): mientras status === preparing es el momento en que debe
 * calcularse el promedio histórico de 6 meses para áreas sin dato real.
 * Ese cálculo NO está implementado aún — vive en el job/día-9 / prepare del API.
 */
export function resolveConsolidatedSacLayoutMode(
  submission: SprCycleSacSubmissionResponse | null,
): SprConsolidatedSacLayoutMode {
  if (isSprSacSubmissionSent(submission?.status)) return 'enviado';
  if (isSprSacSubmissionPreparing(submission?.status)) return 'preparing';
  return 'en-curso';
}

function formatSprTimelineDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const day = iso.slice(0, 10);
  const [y, m, d] = day.split('-');
  if (!y || !m || !d) return '—';
  return `${d}-${m}-${y}`;
}

export type SprConsolidatedTimelineStepView = {
  id: string;
  title: string;
  badge: string;
  status: SprConsolidatedTimelineStatus;
};

export type SprConsolidatedStatusTabView = {
  id: 'consolidado' | 'sac' | 'firma' | 'validacion';
  label: string;
  badge: string;
  badgeTone: SprConsolidatedTabBadgeTone;
};

/**
 * Timeline consolidado “en curso” — mismo criterio que Dashboard
 * (`buildSprReportHonestStatusRows`): day9At real, sin afirmar envío si no hay SAC sent.
 */
export function buildConsolidadoEnCursoTimeline(args: {
  withData: number | null;
  total: number | null;
  day9: { daysUntil: number; day9Label: string } | null;
}): SprConsolidatedTimelineStepView[] {
  const areasBadge =
    args.withData != null && args.total != null
      ? `${args.withData}/${args.total} áreas`
      : '…';
  const areasStatus: SprConsolidatedTimelineStatus =
    args.withData != null && args.total != null && args.withData > 0 && args.withData < args.total
      ? 'partial'
      : args.withData != null && args.total != null && args.withData >= args.total
        ? 'done'
        : 'partial';

  let sacSend: SprConsolidatedTimelineStepView;
  if (!args.day9) {
    sacSend = {
      id: 'sac-send',
      title: 'Envío al SAC',
      badge: '…',
      status: 'upcoming',
    };
  } else if (args.day9.daysUntil > 0) {
    sacSend = {
      id: 'sac-send',
      title: 'Envío automático\nal SAC',
      badge: args.day9.day9Label,
      status: 'upcoming',
    };
  } else {
    // daysUntil <= 0: día 9 hoy o ya pasó, sin submission sent (este builder es solo en-curso).
    sacSend = {
      id: 'sac-send',
      title: 'Día 9 cumplido\nenvío no registrado',
      badge: 'Pendiente',
      status: 'upcoming',
    };
  }

  return [
    {
      id: 'areas',
      title: 'Consolidado\nen curso',
      badge: areasBadge,
      status: areasStatus,
    },
    sacSend,
    {
      id: 'esp',
      title: 'Firma\nEspecialista',
      badge: 'Pendiente',
      status: 'upcoming',
    },
    {
      id: 'gte-ma',
      title: 'Firma\nGerente MA',
      badge: 'Pendiente',
      status: 'upcoming',
    },
    {
      id: 'validation',
      title: 'Validación de\nresponsables',
      badge: 'Pendiente',
      status: 'upcoming',
    },
  ];
}

/**
 * Timeline/tabs mientras SAC está preparing (disparo día 9; copy sin tiempos).
 * Paso “Envío al SAC” → En curso (no Pendiente ni Completado).
 */
export function buildConsolidadoPreparingTimelineFromSac(): SprConsolidatedTimelineStepView[] {
  return [
    {
      id: 'areas',
      title: 'Consolidado\ncompleto',
      badge: 'Enviado',
      status: 'done',
    },
    {
      id: 'sac-send',
      title: 'Envío al SAC\ncompletado',
      badge: 'En curso',
      status: 'active',
    },
    {
      id: 'esp',
      title: 'Firma\nEspecialista',
      badge: 'Pendiente',
      status: 'upcoming',
    },
    {
      id: 'gte-ma',
      title: 'Firma\nGerente MA',
      badge: 'Pendiente',
      status: 'upcoming',
    },
    {
      id: 'validation',
      title: 'Validación de\nresponsables',
      badge: 'Pendiente',
      status: 'upcoming',
    },
  ];
}

export function buildConsolidadoPreparingStatusTabs(): SprConsolidatedStatusTabView[] {
  return [
    {
      id: 'consolidado',
      label: 'Consolidado enviado',
      badge: 'OK',
      badgeTone: 'teal',
    },
    {
      id: 'sac',
      label: 'Reporte SAC',
      badge: 'En curso',
      badgeTone: 'amber',
    },
    {
      id: 'firma',
      label: 'Firma del reporte',
      badge: 'Pendiente',
      badgeTone: 'muted',
    },
    {
      id: 'validacion',
      label: 'Validación de responsables',
      badge: 'Pendiente',
      badgeTone: 'muted',
    },
  ];
}

/**
 * Timeline/tabs Figma 2109:30986 a partir de SAC real.
 * Sin firmas → especialista/gerente pendientes; con firmas usar builders de
 * `sprConsolidatedSignatureLayout` (Fase 3).
 */
export function buildConsolidadoEnviadoTimelineFromSac(
  submission: SprCycleSacSubmissionResponse,
): SprConsolidatedTimelineStepView[] {
  const sentBadge = formatSprTimelineDate(submission.sentAt ?? submission.reportReadyAt);
  return [
    {
      id: 'areas',
      title: 'Consolidado\ncompleto',
      badge: 'Enviado',
      status: 'done',
    },
    {
      id: 'sac-send',
      title: 'Envío al SAC\ncompletado',
      badge: sentBadge,
      status: 'done',
    },
    {
      id: 'esp',
      title: 'Firma\nEspecialista',
      badge: 'Pendiente',
      status: 'upcoming',
    },
    {
      id: 'gte-ma',
      title: 'Firma\nGerente MA',
      badge: 'Pendiente',
      status: 'upcoming',
    },
    {
      id: 'validation',
      title: 'Validación de\nresponsables',
      badge: 'Pendiente',
      status: 'upcoming',
    },
  ];
}

export function buildConsolidadoEnviadoStatusTabsFromSac(
  submission: SprCycleSacSubmissionResponse,
): SprConsolidatedStatusTabView[] {
  const sacBadge =
    submission.status === SprCycleSacSubmissionStatus.REPORT_READY ? 'Envío OK' : 'Enviado';
  const sacTone: SprConsolidatedTabBadgeTone = 'teal';
  return [
    {
      id: 'consolidado',
      label: 'Consolidado enviado',
      badge: 'OK',
      badgeTone: 'teal',
    },
    {
      id: 'sac',
      label: 'Reporte SAC',
      badge: sacBadge,
      badgeTone: sacTone,
    },
    {
      id: 'firma',
      label: 'Firma del reporte',
      badge: 'Pendiente',
      badgeTone: 'amber',
    },
    {
      id: 'validacion',
      label: 'Validación de responsables',
      badge: 'Pendiente',
      badgeTone: 'muted',
    },
  ];
}

/** Fallback copy estático si hace falta (tests / demos). */
export function getStaticConsolidadoEnviadoChrome() {
  return {
    timeline: SPR_CONSOLIDATED_REPORT.consolidadoEnviadoTimelineSteps,
    tabs: SPR_CONSOLIDATED_REPORT.consolidadoEnviadoStatusTabs,
  };
}

export function describeCycleSacForDebug(
  cycleStatus: SprCycleStatus | null | undefined,
  sacStatus: SprCycleSacSubmissionStatus | null | undefined,
): string {
  return `cycle=${cycleStatus ?? 'null'} sac=${sacStatus ?? 'null'}`;
}
