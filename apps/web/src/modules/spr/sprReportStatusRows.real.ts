import type { SprCycleSacSubmissionResponse } from '@aurelia/contracts';
import { SprCycleSacSubmissionStatus } from '@aurelia/contracts';
import type { SprReportStatusRow } from './spr.constants';
import { isSprSacSubmissionSent } from './sprConsolidatedSacLayout';
import type { SprReportDay9Countdown } from './sprReportDay9';
import type { SprReportRealAreaCard } from './sprReportDashboard.real';

/** Fila Firma mock en-curso — no afirma envío ni firma completada. */
const FIRMA_PENDING_ROW: SprReportStatusRow = {
  title: 'Firma del reporte oficial — Orden: Tania/Cata/Marjorie → Gabriel/Elisa',
  helper: 'Disponible cuando el SAC genere el reporte · El Especialista firma primero',
  badge: 'Pendiente',
  badgeTone: 'muted',
  actionLabel: null,
  actionHref: null,
};

function formatIsoToDayMonthYear(iso: string | null | undefined): string {
  if (!iso) return '—';
  const day = iso.slice(0, 10);
  const [y, m, d] = day.split('-');
  if (!y || !m || !d) return '—';
  return `${d}-${m}-${y}`;
}

/**
 * Filas "Estado del Reporte SPR" alineadas a datos reales / countdown desde spr_cycles.
 * - Consolidado: N/8 desde areaCards (submitted+|approved).
 * - Envío SAC: sac.status real (misma regla que el banner azul); sin CTA.
 * - Firma: pendiente mock (sin tabla de firmas de ciclo).
 */
export function buildSprReportHonestStatusRows(input: {
  areaCards: SprReportRealAreaCard[] | null;
  day9: SprReportDay9Countdown | null;
  sacSubmission?: SprCycleSacSubmissionResponse | null;
  consolidadoHref: string;
  consolidadoActionVariant?: 'outline' | 'primary';
}): SprReportStatusRow[] {
  const totalAreas = input.areaCards?.length ?? 8;
  const areasInConsolidado = input.areaCards
    ? input.areaCards.filter((card) => card.status === 'consolidating' || card.status === 'complete').length
    : null;

  const consolidadoRow: SprReportStatusRow =
    areasInConsolidado === null
      ? {
          title: 'Consolidado en curso',
          helper:
            'Actualizado al recibir cada formulario del Responsable · La aprobación del Gerente mejora la calidad pero no bloquea el consolidado',
          badge: '…',
          badgeTone: 'muted',
          actionLabel: 'Ver consolidado',
          actionHref: input.consolidadoHref,
          actionVariant: input.consolidadoActionVariant ?? 'outline',
        }
      : {
          title: `Consolidado en curso — ${areasInConsolidado} de ${totalAreas} formularios recibidos`,
          helper:
            'Actualizado al recibir cada formulario del Responsable · La aprobación del Gerente mejora la calidad pero no bloquea el consolidado',
          badge: `${areasInConsolidado}/${totalAreas} formularios`,
          badgeTone: areasInConsolidado > 0 ? 'success' : 'muted',
          actionLabel: 'Ver consolidado',
          actionHref: input.consolidadoHref,
          actionVariant: input.consolidadoActionVariant ?? 'outline',
        };

  const sac = input.sacSubmission ?? null;
  let sacRow: SprReportStatusRow;
  if (isSprSacSubmissionSent(sac?.status)) {
    const sentLabel = formatIsoToDayMonthYear(sac?.sentAt ?? sac?.reportReadyAt);
    sacRow = {
      title: `Envío al SAC completado · ${sentLabel}`,
      helper:
        sac?.status === SprCycleSacSubmissionStatus.REPORT_READY
          ? 'El consolidado fue enviado al SAC. El registro de envío está en el sistema (artefacto del reporte pendiente de integración).'
          : 'El consolidado fue enviado al SAC. El registro de envío está en el sistema.',
      badge: 'Completado',
      badgeTone: 'success',
      actionLabel: null,
      actionHref: null,
    };
  } else if (!input.day9) {
    sacRow = {
      title: 'Envío al SAC',
      helper: 'Cargando fecha del día 9 desde el ciclo…',
      badge: '…',
      badgeTone: 'muted',
      actionLabel: null,
      actionHref: null,
    };
  } else if (input.day9.daysUntil > 0) {
    sacRow = {
      title: `Envío automático programado · día 9 · ${input.day9.day9Label}`,
      helper:
        'AurelIA enviará el consolidado al SAC en esa fecha (con o sin todas las firmas de Gerente). Aún no hay registro de envío en el sistema.',
      badge: 'Pendiente',
      badgeTone: 'muted',
      actionLabel: null,
      actionHref: null,
    };
  } else {
    sacRow = {
      title: 'Día 9 cumplido · envío al SAC no registrado aún',
      helper: `La fecha de envío automático era el ${input.day9.day9Label}. No hay registro de envío al SAC en el sistema.`,
      badge: 'Pendiente',
      badgeTone: 'muted',
      actionLabel: null,
      actionHref: null,
    };
  }

  return [consolidadoRow, sacRow, FIRMA_PENDING_ROW];
}
