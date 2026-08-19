import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import sourceManifest from './config/source-manifest.json';
import { ValidatedLegacyInspection } from './inspection-legacy-resolution.types';

export interface InspectionLegacyApplySummary {
  sourceSystem: string;
  sourceSha256: string;
  receivedRows: number;
  importedRows: number;
  alreadyImportedRows: number;
  inspectionIds: string[];
}

interface InsertedInspection {
  id: string;
}

interface ExistingImport {
  inspection_id: string;
}

@Injectable()
export class InspectionLegacyApplyService {
  constructor(private readonly dataSource: DataSource) {}

  async apply(rows: ValidatedLegacyInspection[]): Promise<InspectionLegacyApplySummary> {
    this.assertApplyable(rows);

    return this.dataSource.transaction(async (manager) => {
      const summary: InspectionLegacyApplySummary = {
        sourceSystem: sourceManifest.sourceSystem,
        sourceSha256: sourceManifest.sha256,
        receivedRows: rows.length,
        importedRows: 0,
        alreadyImportedRows: 0,
        inspectionIds: [],
      };

      const inspectionTypeId = await this.resolveEnvironmentalInspectionType(manager);

      for (const row of rows) {
        const existing = await manager.query(
          `SELECT inspection_id
           FROM inspection_legacy_imports
           WHERE source_system = $1
             AND legacy_year = $2
             AND legacy_number = $3
           LIMIT 1`,
          [sourceManifest.sourceSystem, row.normalized.legacyYear, row.normalized.legacyNumber],
        ) as ExistingImport[];

        if (existing.length > 0) {
          summary.alreadyImportedRows += 1;
          summary.inspectionIds.push(existing[0].inspection_id);
          continue;
        }

        const inspectionId = await this.insertInspection(manager, row, inspectionTypeId);
        const legacyImportId = await this.insertLegacyImport(manager, row, inspectionId);
        await this.insertMilestones(manager, row, legacyImportId);
        await this.insertParticipants(manager, row, legacyImportId);
        await this.insertSectorLinks(manager, row, legacyImportId);
        await this.insertStatusHistory(manager, row, inspectionId);

        summary.importedRows += 1;
        summary.inspectionIds.push(inspectionId);
      }

      return summary;
    });
  }

  private assertApplyable(rows: ValidatedLegacyInspection[]): void {
    if (rows.length === 0) {
      throw new Error('El apply requiere al menos una fila validada');
    }

    const invalid = rows.filter((row) => !['READY', 'WARNING', 'ALREADY_IMPORTED'].includes(row.finalDisposition));
    if (invalid.length > 0) {
      throw new Error(`El lote contiene ${invalid.length} filas no aplicables; resuelva BLOCKED/QUARANTINE antes del apply`);
    }

    rows.forEach((row) => {
      const normalized = row.normalized;
      if (
        !normalized.legacyYear
        || !normalized.legacyNumber
        || !normalized.inspectionDate
        || !normalized.mode
        || !normalized.status
        || normalized.findingsCount === null
        || normalized.openFindingsCount === null
      ) {
        throw new Error(`Fila ${normalized.sourceRow}: faltan campos obligatorios normalizados`);
      }

      if (!row.area.entityId || !row.company.entityId) {
        throw new Error(
          `Fila ${normalized.sourceRow}: área y empresa deben existir como maestros activos antes del apply`,
        );
      }

      const unresolvedSectors = row.sectors.filter((resolution) => (
        resolution.status !== 'KEEP_TEXT_ONLY' && !resolution.entityId
      ));
      if (unresolvedSectors.length > 0) {
        throw new Error(`Fila ${normalized.sourceRow}: existen sectores sin UUID maestro`);
      }

      const unresolvedInspectors = row.inspectors.filter((resolution) => (
        resolution.status !== 'KEEP_TEXT_ONLY' && !resolution.entityId
      ));
      if (unresolvedInspectors.length > 0) {
        throw new Error(`Fila ${normalized.sourceRow}: existen inspectores sin UUID maestro`);
      }
    });
  }

  private async resolveEnvironmentalInspectionType(manager: EntityManager): Promise<string> {
    const rows = await manager.query(
      `SELECT id FROM inspection_types WHERE code = 'environmental' AND status = 'active' LIMIT 1`,
    ) as Array<{ id: string }>;
    if (rows.length === 0) {
      throw new Error('No existe el tipo activo environmental requerido por la restauración histórica');
    }
    return rows[0].id;
  }

  private async insertInspection(
    manager: EntityManager,
    row: ValidatedLegacyInspection,
    inspectionTypeId: string,
  ): Promise<string> {
    const normalized = row.normalized;
    const primarySectorId = row.sectors.find((resolution) => resolution.entityId)?.entityId ?? null;
    const primaryInspectorId = row.inspectors.find((resolution) => resolution.entityId)?.entityId ?? null;
    const title = this.buildTitle(row);
    const description = [
      `Inspección restaurada desde ${sourceManifest.fileName}, hoja ${sourceManifest.sheet}.`,
      `Clave histórica ${normalized.legacyYear}-${normalized.legacyNumber}.`,
      normalized.detail ? `Detalle original: ${normalized.detail}` : null,
    ].filter(Boolean).join(' ');
    const notes = [
      'Registro histórico resumido.',
      'No contiene reconstrucción artificial de hallazgos, comentarios, imágenes, evidencias ni respuestas por ítem.',
      'El avance de cierre se conserva mediante hitos agregados S1-S3.',
    ].join(' ');

    const inserted = await manager.query(
      `INSERT INTO inspections (
         inspection_type_id,
         template_id,
         company_id,
         area_id,
         sector_id,
         location_id,
         inspector_user_id,
         title,
         description,
         status,
         scheduled_at,
         started_at,
         completed_at,
         closed_at,
         findings_count,
         open_findings_count,
         score,
         notes
       ) VALUES (
         $1, NULL, $2, $3, $4, NULL, $5,
         $6, $7, $8,
         $9::timestamptz, $9::timestamptz, $10::timestamptz, $11::timestamptz,
         $12, $13, NULL, $14
       )
       RETURNING id`,
      [
        inspectionTypeId,
        row.company.entityId,
        row.area.entityId,
        primarySectorId,
        primaryInspectorId,
        title,
        description,
        normalized.status,
        this.noonUtc(normalized.inspectionDate),
        this.noonUtc(normalized.completedAt),
        this.noonUtc(normalized.closedAt),
        normalized.findingsCount,
        normalized.openFindingsCount,
        notes,
      ],
    ) as InsertedInspection[];

    if (inserted.length === 0) {
      throw new Error(`Fila ${normalized.sourceRow}: no se pudo crear la inspección`);
    }
    return inserted[0].id;
  }

  private async insertLegacyImport(
    manager: EntityManager,
    row: ValidatedLegacyInspection,
    inspectionId: string,
  ): Promise<string> {
    const normalized = row.normalized;
    const inserted = await manager.query(
      `INSERT INTO inspection_legacy_imports (
         inspection_id,
         source_system,
         source_file_name,
         source_sheet,
         source_row,
         legacy_year,
         legacy_number,
         legacy_mode,
         legacy_inspector_name,
         legacy_area_name,
         legacy_company_name,
         legacy_sector_name,
         legacy_detail,
         raw_payload,
         import_warnings
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8,
         $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb
       )
       RETURNING id`,
      [
        inspectionId,
        sourceManifest.sourceSystem,
        sourceManifest.fileName,
        sourceManifest.sheet,
        normalized.sourceRow,
        normalized.legacyYear,
        normalized.legacyNumber,
        normalized.mode,
        normalized.inspectorName,
        normalized.areaName,
        normalized.companyName,
        normalized.sectorName,
        normalized.detail,
        JSON.stringify(normalized.rawPayload),
        JSON.stringify(normalized.warnings),
      ],
    ) as Array<{ id: string }>;

    if (inserted.length === 0) {
      throw new Error(`Fila ${normalized.sourceRow}: no se pudo crear la trazabilidad legacy`);
    }
    return inserted[0].id;
  }

  private async insertMilestones(
    manager: EntityManager,
    row: ValidatedLegacyInspection,
    legacyImportId: string,
  ): Promise<void> {
    for (const milestone of row.normalized.milestones) {
      await manager.query(
        `INSERT INTO inspection_legacy_milestones (
           legacy_import_id,
           sequence_number,
           occurred_at,
           closed_increment,
           pending_after,
           closed_percentage,
           pending_percentage,
           raw_payload
         ) VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8::jsonb)`,
        [
          legacyImportId,
          milestone.sequenceNumber,
          milestone.occurredAt,
          milestone.closedIncrement,
          milestone.pendingAfter,
          milestone.closedPercentage,
          milestone.pendingPercentage,
          JSON.stringify(milestone.rawPayload),
        ],
      );
    }
  }

  private async insertParticipants(
    manager: EntityManager,
    row: ValidatedLegacyInspection,
    legacyImportId: string,
  ): Promise<void> {
    const participants = row.inspectors.filter((resolution) => (
      resolution.entityId || resolution.sourceValue || resolution.entityName
    ));
    for (const [index, participant] of participants.entries()) {
      await manager.query(
        `INSERT INTO inspection_legacy_participants (
           legacy_import_id,
           user_id,
           source_name,
           sequence_number,
           is_primary
         ) VALUES ($1, $2, $3, $4, $5)`,
        [
          legacyImportId,
          participant.entityId,
          participant.entityName ?? participant.sourceValue ?? 'Inspector no informado',
          index + 1,
          index === 0,
        ],
      );
    }
  }

  private async insertSectorLinks(
    manager: EntityManager,
    row: ValidatedLegacyInspection,
    legacyImportId: string,
  ): Promise<void> {
    const sectors = row.sectors.filter((resolution) => (
      resolution.entityId || resolution.sourceValue || resolution.entityName
    ));
    for (const [index, sector] of sectors.entries()) {
      await manager.query(
        `INSERT INTO inspection_legacy_sector_links (
           legacy_import_id,
           sector_id,
           source_name,
           sequence_number,
           is_primary
         ) VALUES ($1, $2, $3, $4, $5)`,
        [
          legacyImportId,
          sector.entityId,
          sector.entityName ?? sector.sourceValue ?? 'Sector no informado',
          index + 1,
          index === 0,
        ],
      );
    }
  }

  private async insertStatusHistory(
    manager: EntityManager,
    row: ValidatedLegacyInspection,
    inspectionId: string,
  ): Promise<void> {
    const normalized = row.normalized;
    await manager.query(
      `INSERT INTO inspection_status_history (
         inspection_id,
         from_status,
         to_status,
         changed_by_user_id,
         reason,
         metadata
       ) VALUES ($1, NULL, $2, NULL, $3, $4::jsonb)`,
      [
        inspectionId,
        normalized.status,
        'historical inspection restoration',
        JSON.stringify({
          sourceSystem: sourceManifest.sourceSystem,
          sourceFile: sourceManifest.fileName,
          sourceSheet: sourceManifest.sheet,
          sourceRow: normalized.sourceRow,
          sourceSha256: sourceManifest.sha256,
          legacyYear: normalized.legacyYear,
          legacyNumber: normalized.legacyNumber,
        }),
      ],
    );
  }

  private buildTitle(row: ValidatedLegacyInspection): string {
    const normalized = row.normalized;
    const fallback = normalized.mode === 'checklist'
      ? 'Checklist ambiental histórico'
      : 'Inspección ambiental histórica';
    const title = [
      normalized.detail || fallback,
      row.area.entityName || normalized.areaName,
      normalized.inspectionDate,
    ].filter(Boolean).join(' · ');
    return title.slice(0, 180);
  }

  private noonUtc(value: string | null): string | null {
    return value ? `${value}T12:00:00.000Z` : null;
  }
}
