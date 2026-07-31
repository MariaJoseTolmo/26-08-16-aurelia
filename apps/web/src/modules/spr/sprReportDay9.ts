/**
 * Countdown / copy del día 9 a partir de `day9At` del backend (`spr_cycles`).
 *
 * Fuente de verdad: GET /spr/cycles → day9At (DATE) + status.
 * Si hay submission SAC sent/report_ready, el banner debe afirmar el envío (ver resolveSprCycleSacBannerMessage).
 */

import {
  SprCycleSacSubmissionStatus,
  type SprCycleSacSubmissionResponse,
  type SprCycleStatus,
} from '@aurelia/contracts';
import { isSprSacSubmissionSent } from './sprConsolidatedSacLayout';

export type SprReportDay9Countdown = {
  /** Fecha del día 9 (medianoche local). */
  day9Date: Date;
  /** Etiqueta DD-MM-YYYY del día 9. */
  day9Label: string;
  /**
   * Días hasta el día 9 (positivo = futuro, 0 = hoy, negativo = ya pasó).
   * Comparación por calendario local (sin horas).
   */
  daysUntil: number;
  /** Mensaje honesto para UI cuando aún NO hay envío SAC registrado. */
  message: string;
  /** true si hoy es o es después del día 9. */
  isPastOrToday: boolean;
  /** Status del ciclo en backend (Fase 1). */
  cycleStatus: SprCycleStatus;
};

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDayMonthYear(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatIsoToDayMonthYear(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const day = iso.slice(0, 10);
  const [y, m, d] = day.split('-');
  if (!y || !m || !d) return null;
  return `${d}-${m}-${y}`;
}

/** Parsea `YYYY-MM-DD` como fecha local (evita desfase UTC). */
export function parseSprCycleDay9At(day9At: string): Date {
  const [yearRaw, monthRaw, dayRaw] = day9At.slice(0, 10).split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new RangeError(`Invalid day9At: ${day9At}`);
  }
  return new Date(year, month - 1, day);
}

/**
 * Construye el countdown desde `day9At` persistido en `spr_cycles`.
 * No usa submission SAC — para el banner de UI preferir resolveSprCycleSacBannerMessage.
 */
export function buildSprReportDay9CountdownFromCycle(
  day9At: string,
  cycleStatus: SprCycleStatus,
  now: Date = new Date(),
): SprReportDay9Countdown {
  const day9Date = parseSprCycleDay9At(day9At);
  const day9Start = startOfLocalDay(day9Date);
  const todayStart = startOfLocalDay(now);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntil = Math.round((day9Start.getTime() - todayStart.getTime()) / msPerDay);
  const day9Label = formatDayMonthYear(day9Date);

  let message: string;
  if (daysUntil > 1) {
    message = `Faltan ${daysUntil} días para el envío automático (día 9 · ${day9Label}). Aún no hay registro de envío al SAC.`;
  } else if (daysUntil === 1) {
    message = `Falta 1 día para el envío automático (día 9 · ${day9Label}). Aún no hay registro de envío al SAC.`;
  } else if (daysUntil === 0) {
    message = `Hoy es el día 9 del ciclo (${day9Label}). El envío automático está programado; aún no hay registro de envío al SAC en el sistema.`;
  } else {
    message = `Ya pasó el día 9 del ciclo (${day9Label}). El envío automático al SAC no está registrado aún en el sistema.`;
  }

  return {
    day9Date,
    day9Label,
    daysUntil,
    message,
    isPastOrToday: daysUntil <= 0,
    cycleStatus,
  };
}

/**
 * Mensaje del banner ciclo/SAC: si hay envío real, lo afirma; si no, usa countdown día 9.
 */
export function resolveSprCycleSacBannerMessage(
  countdown: SprReportDay9Countdown | null,
  submission: SprCycleSacSubmissionResponse | null,
): string | null {
  if (isSprSacSubmissionSent(submission?.status)) {
    const sentLabel =
      formatIsoToDayMonthYear(submission?.sentAt) ??
      formatIsoToDayMonthYear(submission?.reportReadyAt) ??
      '—';
    if (submission?.status === SprCycleSacSubmissionStatus.REPORT_READY) {
      return `El consolidado fue enviado al SAC el ${sentLabel}. El envío está registrado; el artefacto del reporte aún no está integrado.`;
    }
    return `El consolidado fue enviado al SAC el ${sentLabel}.`;
  }
  return countdown?.message ?? null;
}

/** Copy de “Disponible en / N días” desde day9At real (tabs SAC/Firma pendientes). */
export function buildSprDay9PendingAvailability(countdown: SprReportDay9Countdown | null): {
  dateLabel: string;
  availableLabel: string;
  daysLabel: string;
} | null {
  if (!countdown) return null;
  const { day9Label, daysUntil } = countdown;
  if (daysUntil > 1) {
    return {
      dateLabel: day9Label,
      availableLabel: 'Disponible en',
      daysLabel: `${daysUntil} días`,
    };
  }
  if (daysUntil === 1) {
    return {
      dateLabel: day9Label,
      availableLabel: 'Disponible en',
      daysLabel: '1 día',
    };
  }
  if (daysUntil === 0) {
    return {
      dateLabel: day9Label,
      availableLabel: 'Día 9',
      daysLabel: 'Hoy',
    };
  }
  // Ya pasó el día 9 y aún no hay envío SAC registrado.
  return {
    dateLabel: day9Label,
    availableLabel: 'Envío SAC',
    daysLabel: 'Pendiente',
  };
}
