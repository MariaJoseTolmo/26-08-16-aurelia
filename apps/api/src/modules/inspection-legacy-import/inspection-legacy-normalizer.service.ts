import { Injectable } from '@nestjs/common';
import { InspectionStatus } from '@aurelia/contracts';
import { InspectionLegacyMode } from './entities/inspection-legacy-import.entity';
import {
  LegacyInspectionRawRow,
  LegacyInspectionWarning,
  LegacyInspectionWarningCode,
  LegacyMilestoneSequence,
  NormalizedLegacyInspection,
  NormalizedLegacyMilestone,
} from './inspection-legacy-import.types';

const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const DAY_IN_MS = 86_400_000;

const HEADERS = {
  legacyNumber: ['Nº', 'N°', 'Número', 'Numero'],
  inspectionDate: ['Fecha'],
  inspectorName: ['Realizada por'],
  areaName: ['Área', 'Area'],
  companyName: ['Empresa'],
  mode: ['Tipo'],
  sectorName: ['Sector'],
  detail: ['Detalle'],
  findingsCount: ['Nº Observaciones', 'N° Observaciones'],
  initialClosed: ['Nº Obs Cerradas', 'N° Obs Cerradas'],
  initialPending: ['Nº Obs  Pendientes', 'Nº Obs Pendientes', 'N° Obs Pendientes'],
  initialClosedPercentage: ['% Obs Cerradas'],
  initialPendingPercentage: ['% Obs Pendientes'],
  finalClosed: ['Obs Cerradas'],
  legacyYear: ['AÑO', 'Año', 'Ano'],
  status: ['Estado'],
} as const;

interface MilestoneHeaders {
  date: readonly string[];
  closed: readonly string[];
  pending: readonly string[];
  closedPercentage: readonly string[];
  pendingPercentage: readonly string[];
}

const MILESTONE_HEADERS: Record<LegacyMilestoneSequence, MilestoneHeaders> = {
  1: {
    date: ['Fecha S1'],
    closed: ['Nº Obs Cerradas S1', 'N° Obs Cerradas S1'],
    pending: ['Nº Obs Pendientes S1', 'N° Obs Pendientes S1'],
    closedPercentage: ['% Obs Cerradas S1'],
    pendingPercentage: ['% Obs Pendientes S1'],
  },
  2: {
    date: ['Fecha S2'],
    closed: ['Nº Obs Cerradas S2', 'N° Obs Cerradas S2'],
    pending: ['Nº Obs Pendientes S2', 'N° Obs Pendientes S2'],
    closedPercentage: ['% Obs Cerradas S2'],
    pendingPercentage: ['% Obs Pendientes S2'],
  },
  3: {
    date: ['Fecha S3'],
    closed: ['Nº Obs Cerradas S3', 'N° Obs Cerradas S3'],
    pending: ['Nº Obs Pendientes S3', 'N° Obs Pendientes S3'],
    closedPercentage: ['% Obs Cerradas S3'],
    pendingPercentage: ['% Obs Pendientes S3'],
  },
};

@Injectable()
export class InspectionLegacyNormalizerService {
  normalize(rawPayload: LegacyInspectionRawRow, sourceRow: number): NormalizedLegacyInspection {
    const warnings: LegacyInspectionWarning[] = [];
    let mustQuarantine = false;

    const legacyYear = this.parseInteger(this.read(rawPayload, HEADERS.legacyYear));
    const legacyNumber = this.parseInteger(this.read(rawPayload, HEADERS.legacyNumber));

    if (!legacyYear || !legacyNumber) {
      mustQuarantine = true;
      warnings.push({
        code: LegacyInspectionWarningCode.MISSING_LEGACY_KEY,
        message: 'AÑO y Nº deben existir y ser enteros positivos',
        field: 'AÑO + Nº',
      });
    }

    const inspectionDateRaw = this.read(rawPayload, HEADERS.inspectionDate);
    const inspectionDate = this.parseDateOnly(inspectionDateRaw);
    if (!inspectionDate) {
      mustQuarantine = true;
      warnings.push({
        code: LegacyInspectionWarningCode.INVALID_INSPECTION_DATE,
        message: 'La fecha de inspección está vacía o no tiene un formato válido',
        field: 'Fecha',
        rawValue: inspectionDateRaw,
      });
    } else if (legacyYear && Number(inspectionDate.slice(0, 4)) !== legacyYear) {
      warnings.push({
        code: LegacyInspectionWarningCode.YEAR_DATE_MISMATCH,
        message: 'El año declarado no coincide con el año de la fecha de inspección',
        field: 'AÑO',
        rawValue: legacyYear,
      });
    }

    const modeRaw = this.text(this.read(rawPayload, HEADERS.mode));
    const mode = this.resolveMode(modeRaw);
    if (!mode) {
      mustQuarantine = true;
      warnings.push({
        code: LegacyInspectionWarningCode.UNKNOWN_MODE,
        message: 'El tipo histórico debe ser Hallazgo o Checklist',
        field: 'Tipo',
        rawValue: modeRaw,
      });
    }

    const statusRaw = this.text(this.read(rawPayload, HEADERS.status));
    const status = this.resolveStatus(statusRaw);
    if (!status) {
      mustQuarantine = true;
      warnings.push({
        code: LegacyInspectionWarningCode.UNKNOWN_STATUS,
        message: 'El estado histórico debe ser Abierto o Cerrado',
        field: 'Estado',
        rawValue: statusRaw,
      });
    }

    const findingsRaw = this.read(rawPayload, HEADERS.findingsCount);
    const findingsCount = this.parseNonNegativeInteger(findingsRaw);
    if (findingsCount === null) {
      mustQuarantine = true;
      warnings.push({
        code: LegacyInspectionWarningCode.MISSING_TOTAL_FINDINGS,
        message: 'Nº Observaciones debe existir y ser un entero no negativo',
        field: 'Nº Observaciones',
        rawValue: findingsRaw,
      });
    }

    const initialClosedRaw = this.read(rawPayload, HEADERS.initialClosed);
    const initialPendingRaw = this.read(rawPayload, HEADERS.initialPending);
    const finalClosedRaw = this.read(rawPayload, HEADERS.finalClosed);
    let initialClosed = this.parseNonNegativeInteger(initialClosedRaw);
    let initialPending = this.parseNonNegativeInteger(initialPendingRaw);
    let sourceFinalClosed = this.parseNonNegativeInteger(finalClosedRaw);

    if (initialClosedRaw !== null && initialClosedRaw !== undefined && initialClosed === null) {
      warnings.push(this.invalidCounterWarning('Nº Obs Cerradas', initialClosedRaw));
    }
    if (initialPendingRaw !== null && initialPendingRaw !== undefined && initialPending === null) {
      warnings.push(this.invalidCounterWarning('Nº Obs Pendientes', initialPendingRaw));
    }
    if (finalClosedRaw !== null && finalClosedRaw !== undefined && sourceFinalClosed === null) {
      warnings.push(this.invalidCounterWarning('Obs Cerradas', finalClosedRaw));
    }
    if (
      findingsCount !== null
      && sourceFinalClosed !== null
      && sourceFinalClosed > findingsCount
    ) {
      warnings.push({
        code: LegacyInspectionWarningCode.COUNTER_RECONCILIATION_MISMATCH,
        message: 'Obs Cerradas no puede superar Nº Observaciones',
        field: 'Obs Cerradas',
        rawValue: {
          findingsCount,
          sourceFinalClosed,
        },
      });
      sourceFinalClosed = null;
    }

    initialClosed ??= 0;
    if (initialPending === null && findingsCount !== null) {
      initialPending = Math.max(findingsCount - initialClosed, 0);
    }

    const milestones = this.normalizeMilestones(
      rawPayload,
      inspectionDate,
      warnings,
    );

    const lastMilestone = milestones.at(-1) ?? null;
    const milestoneOpenFindingsCount = lastMilestone?.pendingAfter ?? initialPending;
    const openFindingsCount = findingsCount !== null && sourceFinalClosed !== null
      ? findingsCount - sourceFinalClosed
      : milestoneOpenFindingsCount;
    const incrementalClosed = milestones.reduce(
      (total, milestone) => total + milestone.closedIncrement,
      initialClosed,
    );
    const closedFindingsCount = sourceFinalClosed
      ?? (findingsCount !== null && openFindingsCount !== null
        ? Math.max(findingsCount - openFindingsCount, 0)
        : incrementalClosed);

    if (
      findingsCount !== null
      && openFindingsCount !== null
      && incrementalClosed + openFindingsCount !== findingsCount
    ) {
      warnings.push({
        code: LegacyInspectionWarningCode.COUNTER_RECONCILIATION_MISMATCH,
        message: 'Cerradas iniciales + incrementos S1-S3 + pendientes finales no coincide con Nº Observaciones',
        field: 'contadores',
        rawValue: {
          findingsCount,
          incrementalClosed,
          openFindingsCount,
          sourceFinalClosed,
        },
      });
    }

    if (status === InspectionStatus.CLOSED && openFindingsCount !== null && openFindingsCount !== 0) {
      warnings.push({
        code: LegacyInspectionWarningCode.STATUS_COUNTER_MISMATCH,
        message: 'La inspección figura Cerrada, pero conserva observaciones pendientes',
        field: 'Estado',
        rawValue: openFindingsCount,
      });
    }
    if (status === InspectionStatus.IN_PROGRESS && openFindingsCount === 0) {
      warnings.push({
        code: LegacyInspectionWarningCode.STATUS_COUNTER_MISMATCH,
        message: 'La inspección figura Abierta, pero no conserva observaciones pendientes',
        field: 'Estado',
        rawValue: openFindingsCount,
      });
    }

    const closedAt = this.resolveClosedAt(
      status,
      inspectionDate,
      initialPending,
      milestones,
    );

    return {
      sourceRow,
      legacyYear,
      legacyNumber,
      inspectionDate,
      inspectorName: this.text(this.read(rawPayload, HEADERS.inspectorName)),
      areaName: this.text(this.read(rawPayload, HEADERS.areaName)),
      companyName: this.text(this.read(rawPayload, HEADERS.companyName)),
      sectorName: this.text(this.read(rawPayload, HEADERS.sectorName)),
      detail: this.text(this.read(rawPayload, HEADERS.detail)),
      mode,
      status,
      findingsCount,
      openFindingsCount,
      closedFindingsCount,
      completedAt: inspectionDate,
      closedAt,
      milestones,
      warnings,
      disposition: mustQuarantine
        ? 'QUARANTINE'
        : warnings.length > 0
          ? 'WARNING'
          : 'READY',
      rawPayload,
    };
  }

  normalizeMany(
    rows: LegacyInspectionRawRow[],
    firstSourceRow = 5,
  ): NormalizedLegacyInspection[] {
    return rows.map((row, index) => this.normalize(row, firstSourceRow + index));
  }

  normalizeCatalogText(value: unknown): string {
    return (this.text(value) ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private normalizeMilestones(
    row: LegacyInspectionRawRow,
    inspectionDate: string | null,
    warnings: LegacyInspectionWarning[],
  ): NormalizedLegacyMilestone[] {
    const milestones: NormalizedLegacyMilestone[] = [];
    let previousDate = inspectionDate;

    ([1, 2, 3] as LegacyMilestoneSequence[]).forEach((sequenceNumber) => {
      const headers = MILESTONE_HEADERS[sequenceNumber];
      const dateRaw = this.read(row, headers.date);
      const closedRaw = this.read(row, headers.closed);
      const pendingRaw = this.read(row, headers.pending);
      const closedPercentageRaw = this.read(row, headers.closedPercentage);
      const pendingPercentageRaw = this.read(row, headers.pendingPercentage);
      const occurredAt = this.parseDateOnly(dateRaw);

      if (!occurredAt) {
        if (this.hasMeaningfulMilestoneValue([
          closedRaw,
          pendingRaw,
          closedPercentageRaw,
          pendingPercentageRaw,
        ])) {
          warnings.push({
            code: dateRaw === null || dateRaw === undefined || dateRaw === ''
              ? LegacyInspectionWarningCode.ORPHAN_MILESTONE_VALUES
              : LegacyInspectionWarningCode.INVALID_MILESTONE_DATE,
            message: `S${sequenceNumber} contiene valores, pero no una fecha válida`,
            field: `Fecha S${sequenceNumber}`,
            rawValue: dateRaw,
          });
        }
        return;
      }

      if (inspectionDate && occurredAt < inspectionDate) {
        warnings.push({
          code: LegacyInspectionWarningCode.MILESTONE_BEFORE_INSPECTION,
          message: `La fecha S${sequenceNumber} es anterior a la inspección y fue descartada`,
          field: `Fecha S${sequenceNumber}`,
          rawValue: dateRaw,
        });
        return;
      }

      if (previousDate && occurredAt < previousDate) {
        warnings.push({
          code: LegacyInspectionWarningCode.MILESTONE_OUT_OF_SEQUENCE,
          message: `La fecha S${sequenceNumber} rompe la secuencia cronológica y fue descartada`,
          field: `Fecha S${sequenceNumber}`,
          rawValue: dateRaw,
        });
        return;
      }

      const closedIncrement = this.parseNonNegativeInteger(closedRaw) ?? 0;
      const pendingAfter = this.parseNonNegativeInteger(pendingRaw);
      if (pendingAfter === null) {
        warnings.push(this.invalidCounterWarning(`Nº Obs Pendientes S${sequenceNumber}`, pendingRaw));
        return;
      }
      if (closedRaw !== null && closedRaw !== undefined && this.parseNonNegativeInteger(closedRaw) === null) {
        warnings.push(this.invalidCounterWarning(`Nº Obs Cerradas S${sequenceNumber}`, closedRaw));
        return;
      }

      milestones.push({
        sequenceNumber,
        occurredAt,
        closedIncrement,
        pendingAfter,
        closedPercentage: this.parsePercentage(closedPercentageRaw),
        pendingPercentage: this.parsePercentage(pendingPercentageRaw),
        rawPayload: {
          date: dateRaw,
          closed: closedRaw,
          pending: pendingRaw,
          closedPercentage: closedPercentageRaw,
          pendingPercentage: pendingPercentageRaw,
        },
      });
      previousDate = occurredAt;
    });

    return milestones;
  }

  private resolveClosedAt(
    status: InspectionStatus | null,
    inspectionDate: string | null,
    initialPending: number | null,
    milestones: NormalizedLegacyMilestone[],
  ): string | null {
    if (status !== InspectionStatus.CLOSED) return null;
    if (initialPending === 0) return inspectionDate;
    return milestones.find((milestone) => milestone.pendingAfter === 0)?.occurredAt ?? null;
  }

  private resolveMode(value: string | null): InspectionLegacyMode | null {
    const normalized = this.normalizeCatalogText(value);
    if (normalized === 'hallazgo') return InspectionLegacyMode.FINDING;
    if (normalized === 'checklist') return InspectionLegacyMode.CHECKLIST;
    return null;
  }

  private resolveStatus(value: string | null): InspectionStatus | null {
    const normalized = this.normalizeCatalogText(value);
    if (normalized === 'cerrado') return InspectionStatus.CLOSED;
    if (normalized === 'abierto') return InspectionStatus.IN_PROGRESS;
    return null;
  }

  private read(row: LegacyInspectionRawRow, aliases: readonly string[]): unknown {
    for (const alias of aliases) {
      if (Object.prototype.hasOwnProperty.call(row, alias)) return row[alias];
    }

    const normalizedAliases = new Set(aliases.map((alias) => this.normalizeHeader(alias)));
    const entry = Object.entries(row).find(([key]) => normalizedAliases.has(this.normalizeHeader(key)));
    return entry?.[1];
  }

  private normalizeHeader(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[º°]/g, '')
      .toLocaleLowerCase('es')
      .replace(/[^a-z0-9%]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private text(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    const normalized = String(value).trim().replace(/\s+/g, ' ');
    return normalized.length > 0 ? normalized : null;
  }

  private parseInteger(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const numeric = typeof value === 'number'
      ? value
      : Number(String(value).trim().replace(',', '.'));
    if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) return null;
    return numeric;
  }

  private parseNonNegativeInteger(value: unknown): number | null {
    const parsed = this.parseInteger(value);
    return parsed !== null && parsed >= 0 ? parsed : null;
  }

  private parsePercentage(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const numeric = typeof value === 'number'
      ? value
      : Number(String(value).trim().replace('%', '').replace(',', '.'));
    if (!Number.isFinite(numeric)) return null;
    const percentage = numeric >= 0 && numeric <= 1 ? numeric * 100 : numeric;
    if (percentage < 0 || percentage > 100) return null;
    return Math.round(percentage * 100) / 100;
  }

  private parseDateOnly(value: unknown): string | null {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
    }

    if (typeof value === 'number') {
      return this.excelSerialToDate(value);
    }

    const text = this.text(value);
    if (!text) return null;

    if (/^\d+(?:\.\d+)?$/.test(text)) {
      return this.excelSerialToDate(Number(text));
    }

    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
    if (isoMatch) return this.validIsoDate(isoMatch[1], isoMatch[2], isoMatch[3]);

    const localMatch = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(text);
    if (localMatch) return this.validIsoDate(localMatch[3], localMatch[2], localMatch[1]);

    return null;
  }

  private excelSerialToDate(serial: number): string | null {
    if (!Number.isFinite(serial) || serial <= 0) return null;
    const value = new Date(EXCEL_EPOCH_UTC + Math.floor(serial) * DAY_IN_MS);
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }

  private validIsoDate(year: string, month: string, day: string): string | null {
    const value = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (
      value.getUTCFullYear() !== Number(year)
      || value.getUTCMonth() !== Number(month) - 1
      || value.getUTCDate() !== Number(day)
    ) {
      return null;
    }
    return value.toISOString().slice(0, 10);
  }

  private hasMeaningfulMilestoneValue(values: unknown[]): boolean {
    return values.some((value) => {
      if (value === null || value === undefined || value === '') return false;
      const numeric = Number(String(value).replace('%', '').replace(',', '.'));
      return Number.isFinite(numeric) ? numeric !== 0 : true;
    });
  }

  private invalidCounterWarning(field: string, rawValue: unknown): LegacyInspectionWarning {
    return {
      code: LegacyInspectionWarningCode.INVALID_COUNTER,
      message: `${field} debe ser un entero no negativo`,
      field,
      rawValue,
    };
  }
}
