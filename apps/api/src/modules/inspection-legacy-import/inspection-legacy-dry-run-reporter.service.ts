import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  InspectionLegacyReconciliationService,
  InspectionLegacyReconciliationSummary,
} from './inspection-legacy-reconciliation.service';
import {
  LegacyCatalogResolution,
  ValidatedLegacyInspection,
} from './inspection-legacy-resolution.types';

export interface InspectionLegacyDryRunArtifacts {
  outputDirectory: string;
  summaryJson: string;
  readyCsv: string;
  warningsCsv: string;
  quarantineCsv: string;
  blockedCsv: string;
  alreadyImportedCsv: string;
  catalogActionsCsv: string;
  reconciliationJson: string;
}

@Injectable()
export class InspectionLegacyDryRunReporterService {
  constructor(
    private readonly reconciliation: InspectionLegacyReconciliationService,
  ) {}

  async write(
    rows: ValidatedLegacyInspection[],
    outputDirectory: string,
  ): Promise<InspectionLegacyDryRunArtifacts> {
    await mkdir(outputDirectory, { recursive: true });
    const summary = this.reconciliation.summarize(rows);
    const artifacts = this.paths(outputDirectory);

    await Promise.all([
      this.writeJson(artifacts.summaryJson, this.buildSummary(summary, rows)),
      this.writeCsv(artifacts.readyCsv, rows.filter((row) => row.finalDisposition === 'READY')),
      this.writeCsv(artifacts.warningsCsv, rows.filter((row) => row.finalDisposition === 'WARNING')),
      this.writeCsv(artifacts.quarantineCsv, rows.filter((row) => row.finalDisposition === 'QUARANTINE')),
      this.writeCsv(artifacts.blockedCsv, rows.filter((row) => row.finalDisposition === 'BLOCKED')),
      this.writeCsv(
        artifacts.alreadyImportedCsv,
        rows.filter((row) => row.finalDisposition === 'ALREADY_IMPORTED'),
      ),
      this.writeCatalogActions(artifacts.catalogActionsCsv, rows),
      this.writeJson(artifacts.reconciliationJson, summary),
    ]);

    return artifacts;
  }

  private paths(outputDirectory: string): InspectionLegacyDryRunArtifacts {
    return {
      outputDirectory,
      summaryJson: join(outputDirectory, 'legacy-inspections-dry-run-summary.json'),
      readyCsv: join(outputDirectory, 'legacy-inspections-ready.csv'),
      warningsCsv: join(outputDirectory, 'legacy-inspections-warnings.csv'),
      quarantineCsv: join(outputDirectory, 'legacy-inspections-quarantine.csv'),
      blockedCsv: join(outputDirectory, 'legacy-inspections-blocked.csv'),
      alreadyImportedCsv: join(outputDirectory, 'legacy-inspections-already-imported.csv'),
      catalogActionsCsv: join(outputDirectory, 'legacy-inspections-catalog-actions.csv'),
      reconciliationJson: join(outputDirectory, 'legacy-inspections-reconciliation.json'),
    };
  }

  private buildSummary(
    reconciliation: InspectionLegacyReconciliationSummary,
    rows: ValidatedLegacyInspection[],
  ): Record<string, unknown> {
    return {
      generatedAt: new Date().toISOString(),
      catalogPolicy: 'ACTIVE_MASTER_DATA',
      onlyInspectionsAreLegacy: true,
      ...reconciliation,
      warningCodes: this.countWarningCodes(rows),
      validationMessages: this.countValidationMessages(rows),
    };
  }

  private countWarningCodes(rows: ValidatedLegacyInspection[]): Record<string, number> {
    const counts: Record<string, number> = {};
    rows.forEach((row) => {
      row.normalized.warnings.forEach((warning) => {
        counts[warning.code] = (counts[warning.code] ?? 0) + 1;
      });
    });
    return counts;
  }

  private countValidationMessages(rows: ValidatedLegacyInspection[]): Record<string, number> {
    const counts: Record<string, number> = {};
    rows.forEach((row) => {
      row.validationMessages.forEach((message) => {
        counts[message] = (counts[message] ?? 0) + 1;
      });
    });
    return counts;
  }

  private async writeJson(filePath: string, value: unknown): Promise<void> {
    await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  }

  private async writeCsv(
    filePath: string,
    rows: ValidatedLegacyInspection[],
  ): Promise<void> {
    const headers = [
      'source_row',
      'legacy_year',
      'legacy_number',
      'inspection_date',
      'mode',
      'status',
      'disposition',
      'inspector_source',
      'inspector_resolution',
      'inspector_ids',
      'inspector_emails',
      'area_source',
      'area_resolution',
      'area_id',
      'area_proposed_code',
      'company_source',
      'company_resolution',
      'company_id',
      'company_proposed_code',
      'sector_source',
      'sector_resolution',
      'sector_ids',
      'sector_proposed_codes',
      'detail',
      'findings_count',
      'closed_findings_count',
      'open_findings_count',
      'closed_at',
      'milestones',
      'warning_codes',
      'validation_messages',
      'already_imported_inspection_id',
    ];

    const body = rows.map((row) => this.csvLine([
      row.normalized.sourceRow,
      row.normalized.legacyYear,
      row.normalized.legacyNumber,
      row.normalized.inspectionDate,
      row.normalized.mode,
      row.normalized.status,
      row.finalDisposition,
      row.inspector.sourceValue,
      row.inspector.status,
      row.inspectors.map((resolution) => resolution.entityId).filter(Boolean).join('|'),
      row.inspectors.map((resolution) => resolution.proposedEmail).filter(Boolean).join('|'),
      row.area.sourceValue,
      row.area.status,
      row.area.entityId,
      row.area.proposedCode,
      row.company.sourceValue,
      row.company.status,
      row.company.entityId,
      row.company.proposedCode,
      row.sector.sourceValue,
      row.sector.status,
      row.sectors.map((resolution) => resolution.entityId).filter(Boolean).join('|'),
      row.sectors.map((resolution) => resolution.proposedCode).filter(Boolean).join('|'),
      row.normalized.detail,
      row.normalized.findingsCount,
      row.normalized.closedFindingsCount,
      row.normalized.openFindingsCount,
      row.normalized.closedAt,
      JSON.stringify(row.normalized.milestones),
      row.normalized.warnings.map((warning) => warning.code).join('|'),
      row.validationMessages.join('|'),
      row.alreadyImportedInspectionId,
    ])).join('\n');

    const contents = `${this.csvLine(headers)}\n${body}${body ? '\n' : ''}`;
    await writeFile(filePath, contents, 'utf8');
  }

  private async writeCatalogActions(
    filePath: string,
    rows: ValidatedLegacyInspection[],
  ): Promise<void> {
    const headers = [
      'catalog',
      'source_value',
      'resolution',
      'entity_id',
      'entity_name',
      'proposed_code',
      'proposed_email',
      'proposed_company_code',
      'proposed_role_code',
      'message',
      'affected_rows',
    ];
    const grouped = new Map<string, {
      catalog: string;
      resolution: LegacyCatalogResolution;
      affectedRows: number;
    }>();

    rows.forEach((row) => {
      this.collectCatalogAction(grouped, 'area', row.area);
      this.collectCatalogAction(grouped, 'company', row.company);
      row.sectors.forEach((resolution) => this.collectCatalogAction(grouped, 'sector', resolution));
      row.inspectors.forEach((resolution) => this.collectCatalogAction(grouped, 'inspector', resolution));
    });

    const body = [...grouped.values()]
      .sort((a, b) => (
        `${a.catalog}:${a.resolution.sourceValue ?? ''}`
          .localeCompare(`${b.catalog}:${b.resolution.sourceValue ?? ''}`, 'es')
      ))
      .map((entry) => this.csvLine([
        entry.catalog,
        entry.resolution.sourceValue,
        entry.resolution.status,
        entry.resolution.entityId,
        entry.resolution.entityName,
        entry.resolution.proposedCode,
        entry.resolution.proposedEmail,
        entry.resolution.proposedCompanyCode,
        entry.resolution.proposedRoleCode,
        entry.resolution.message,
        entry.affectedRows,
      ]))
      .join('\n');

    const contents = `${this.csvLine(headers)}\n${body}${body ? '\n' : ''}`;
    await writeFile(filePath, contents, 'utf8');
  }

  private collectCatalogAction(
    grouped: Map<string, {
      catalog: string;
      resolution: LegacyCatalogResolution;
      affectedRows: number;
    }>,
    catalog: string,
    resolution: LegacyCatalogResolution,
  ): void {
    const key = [
      catalog,
      resolution.status,
      resolution.sourceValue ?? '',
      resolution.entityId ?? '',
      resolution.proposedCode ?? '',
      resolution.proposedEmail ?? '',
    ].join(':');
    const current = grouped.get(key);
    if (current) {
      current.affectedRows += 1;
      return;
    }
    grouped.set(key, {
      catalog,
      resolution,
      affectedRows: 1,
    });
  }

  private csvLine(values: unknown[]): string {
    return values.map((value) => this.csvCell(value)).join(',');
  }

  private csvCell(value: unknown): string {
    if (value === null || value === undefined) return '';
    const text = typeof value === 'string' ? value : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  }
}
