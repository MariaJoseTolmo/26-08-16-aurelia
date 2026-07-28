import { Injectable } from '@nestjs/common';
import { LegacyImportDisposition } from './inspection-legacy-import.types';
import {
  LegacyCatalogResolution,
  ResolvedLegacyInspection,
  ValidatedLegacyInspection,
} from './inspection-legacy-resolution.types';

@Injectable()
export class InspectionLegacyValidatorService {
  validateMany(rows: ResolvedLegacyInspection[]): ValidatedLegacyInspection[] {
    return rows.map((row) => this.validate(row));
  }

  validate(row: ResolvedLegacyInspection): ValidatedLegacyInspection {
    const validationMessages: string[] = [];
    const resolutions = [row.area, row.company, row.inspector];

    if (row.alreadyImportedInspectionId) {
      validationMessages.push(`Registro ya importado en inspección ${row.alreadyImportedInspectionId}`);
      return {
        ...row,
        finalDisposition: 'ALREADY_IMPORTED',
        validationMessages,
      };
    }

    if (row.normalized.disposition === 'QUARANTINE') {
      validationMessages.push('La fila contiene errores de fuente que requieren revisión humana');
      return {
        ...row,
        finalDisposition: 'QUARANTINE',
        validationMessages,
      };
    }

    const blocked = resolutions.filter((resolution) => resolution.status === 'BLOCKED');
    if (blocked.length > 0) {
      validationMessages.push(...blocked.map((resolution) => this.messageFor(resolution)));
      return {
        ...row,
        finalDisposition: 'BLOCKED',
        validationMessages,
      };
    }

    const manualReview = resolutions.filter((resolution) => resolution.status === 'MANUAL_REVIEW');
    if (manualReview.length > 0) {
      validationMessages.push(...manualReview.map((resolution) => this.messageFor(resolution)));
      return {
        ...row,
        finalDisposition: 'QUARANTINE',
        validationMessages,
      };
    }

    const catalogActions = resolutions.filter((resolution) => resolution.status === 'CREATE_ARCHIVED');
    if (catalogActions.length > 0) {
      validationMessages.push(...catalogActions.map((resolution) => (
        `${resolution.sourceValue ?? 'Valor vacío'} requiere crear catálogo archivado ${resolution.proposedCode ?? ''}`.trim()
      )));
    }

    if (row.normalized.warnings.length > 0) {
      validationMessages.push(...row.normalized.warnings.map((warning) => warning.message));
    }

    const finalDisposition: LegacyImportDisposition = validationMessages.length > 0
      ? 'WARNING'
      : 'READY';

    return {
      ...row,
      finalDisposition,
      validationMessages,
    };
  }

  private messageFor(resolution: LegacyCatalogResolution): string {
    return resolution.message
      ?? `${resolution.sourceValue ?? 'Valor vacío'} quedó en estado ${resolution.status}`;
  }
}
