import {
  SprCycleSacSubmissionStatus,
  SprCycleSignatureLevel,
  SprCycleSignatureStatus,
  type SprCycleSacSubmissionResponse,
  type SprCycleSignatureResponse,
} from '@aurelia/contracts';
import type { SprConsolidatedTabBadgeTone, SprConsolidatedTimelineStatus } from './spr.constants';
import {
  isSprSacSubmissionSent,
  type SprConsolidatedStatusTabView,
  type SprConsolidatedTimelineStepView,
} from './sprConsolidatedSacLayout';

/**
 * Fases reales del tab Firma (camino SAC enviado).
 * awaiting-sac: aún no hay envío → panel pendiente day9.
 * firma-lista: SAC listo, nadie firmó → Especialista puede firmar.
 * gerente-habilitado: especialista firmó → Gerente MA puede firmar.
 * ambas-firmadas: specialist + environment_manager firmados.
 */
export type SprConsolidatedSignaturePhase =
  | 'awaiting-sac'
  | 'firma-lista'
  | 'gerente-habilitado'
  | 'ambas-firmadas';

function isSigned(
  signatures: SprCycleSignatureResponse[],
  level: SprCycleSignatureLevel,
): boolean {
  return signatures.some(
    (signature) =>
      signature.level === level && signature.status === SprCycleSignatureStatus.SIGNED,
  );
}

export function resolveSprSignaturePhase(args: {
  submission: SprCycleSacSubmissionResponse | null;
  signatures: SprCycleSignatureResponse[];
}): SprConsolidatedSignaturePhase {
  if (!isSprSacSubmissionSent(args.submission?.status)) {
    return 'awaiting-sac';
  }
  const specialistSigned = isSigned(args.signatures, SprCycleSignatureLevel.SPECIALIST);
  const managerSigned = isSigned(args.signatures, SprCycleSignatureLevel.ENVIRONMENT_MANAGER);
  if (specialistSigned && managerSigned) return 'ambas-firmadas';
  if (specialistSigned) return 'gerente-habilitado';
  return 'firma-lista';
}

export function findSignedSignature(
  signatures: SprCycleSignatureResponse[],
  level: SprCycleSignatureLevel,
): SprCycleSignatureResponse | null {
  return (
    signatures.find(
      (signature) =>
        signature.level === level && signature.status === SprCycleSignatureStatus.SIGNED,
    ) ?? null
  );
}

function formatSprTimelineDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const day = iso.slice(0, 10);
  const [y, m, d] = day.split('-');
  if (!y || !m || !d) return '—';
  return `${d}-${m}-${y}`;
}

/**
 * Timeline Figma consolidado-enviado + progreso real de firmas (Fase 3).
 */
export function buildConsolidadoEnviadoTimelineFromSignatures(
  submission: SprCycleSacSubmissionResponse,
  signatures: SprCycleSignatureResponse[],
): SprConsolidatedTimelineStepView[] {
  const phase = resolveSprSignaturePhase({ submission, signatures });
  const sentBadge = formatSprTimelineDate(submission.sentAt ?? submission.reportReadyAt);

  const espStatus: SprConsolidatedTimelineStatus =
    phase === 'firma-lista' ? 'active' : phase === 'awaiting-sac' ? 'upcoming' : 'done';
  const espBadge =
    phase === 'firma-lista' || phase === 'awaiting-sac' ? 'Pendiente' : 'Completado';

  const gteStatus: SprConsolidatedTimelineStatus =
    phase === 'gerente-habilitado'
      ? 'active'
      : phase === 'ambas-firmadas'
        ? 'done'
        : 'upcoming';
  const gteBadge =
    phase === 'gerente-habilitado'
      ? 'En curso'
      : phase === 'ambas-firmadas'
        ? 'Completado'
        : 'Pendiente';

  // Figma 1942:62931 — step Validación "En curso" / active (tab sigue Pendiente).
  const validationStatus: SprConsolidatedTimelineStatus =
    phase === 'ambas-firmadas' ? 'active' : 'upcoming';
  const validationBadge = phase === 'ambas-firmadas' ? 'En curso' : 'Pendiente';

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
      badge: espBadge,
      status: espStatus,
    },
    {
      id: 'gte-ma',
      title: 'Firma\nGerente MA',
      badge: gteBadge,
      status: gteStatus,
    },
    {
      id: 'validation',
      title: 'Validación de\nresponsables',
      badge: validationBadge,
      status: validationStatus,
    },
  ];
}

export function buildConsolidadoEnviadoStatusTabsFromSignatures(
  submission: SprCycleSacSubmissionResponse,
  signatures: SprCycleSignatureResponse[],
): SprConsolidatedStatusTabView[] {
  const phase = resolveSprSignaturePhase({ submission, signatures });
  const sacBadge =
    submission.status === SprCycleSacSubmissionStatus.REPORT_READY ? 'Envío OK' : 'Enviado';

  // Figma 1942:62931 — Firma Completado; Validación tab Pendiente (step timeline En curso).
  const firmaBadge =
    phase === 'ambas-firmadas' ? 'Completado' : phase === 'gerente-habilitado' ? '1/2' : 'Pendiente';
  const firmaTone: SprConsolidatedTabBadgeTone =
    phase === 'ambas-firmadas' ? 'teal' : 'amber';

  const validacionBadge = 'Pendiente';
  const validacionTone: SprConsolidatedTabBadgeTone =
    phase === 'ambas-firmadas' ? 'amber' : 'muted';

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
      badgeTone: 'teal',
    },
    {
      id: 'firma',
      label: 'Firma del reporte',
      badge: firmaBadge,
      badgeTone: firmaTone,
    },
    {
      id: 'validacion',
      label: 'Validación de responsables',
      badge: validacionBadge,
      badgeTone: validacionTone,
    },
  ];
}

export function initialsFromFullName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}
