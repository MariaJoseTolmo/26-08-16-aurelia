import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AreaEntity } from '../organization/entities/area.entity';
import { CompanyEntity } from '../organization/entities/company.entity';
import { SectorEntity } from '../organization/entities/sector.entity';
import { UserEntity } from '../users/entities/user.entity';
import { runInspectionsMasterDataSeed } from '../../database/seeds/009-seed-inspections-master-data';
import { InspectionLegacyImportEntity } from '../inspection-legacy-import/entities/inspection-legacy-import.entity';
import { InspectionLegacyApplyService } from '../inspection-legacy-import/inspection-legacy-apply.service';
import { InspectionLegacyNormalizerService } from '../inspection-legacy-import/inspection-legacy-normalizer.service';
import { InspectionLegacyResolverService } from '../inspection-legacy-import/inspection-legacy-resolver.service';
import { InspectionLegacySourceManifestService } from '../inspection-legacy-import/inspection-legacy-source-manifest.service';
import { InspectionLegacyValidatorService } from '../inspection-legacy-import/inspection-legacy-validator.service';
import { InspectionLegacyXlsxReaderService } from '../inspection-legacy-import/inspection-legacy-xlsx-reader.service';

export const LEGACY_INSPECTIONS_WEB_CONFIRMATION = 'IMPORTAR_2308_INSPECCIONES_LEGACY';

export interface LegacyInspectionsUploadedFile {
  originalname: string;
  size: number;
  buffer: Buffer;
}

export interface LegacyInspectionsWebPreview {
  fileName: string;
  sourceSha256: string;
  totalRows: number;
  dispositions: {
    READY: number;
    WARNING: number;
    QUARANTINE: number;
  };
  totals: {
    findingsCount: number;
    closedFindingsCount: number;
    openFindingsCount: number;
    milestoneS1: number;
    milestoneS2: number;
    milestoneS3: number;
  };
  warningCodes: Record<string, number>;
}

export interface LegacyInspectionsWebImportResult {
  fileName: string;
  sourceSha256: string;
  totalRows: number;
  dispositions: Record<string, number>;
  importedRows: number;
  alreadyImportedRows: number;
}

@Injectable()
export class LegacyInspectionsWebImportService {
  private readonly sourceManifest = new InspectionLegacySourceManifestService();
  private readonly normalizer = new InspectionLegacyNormalizerService();

  constructor(private readonly dataSource: DataSource) {}

  async preview(file: LegacyInspectionsUploadedFile | undefined): Promise<LegacyInspectionsWebPreview> {
    return this.withTemporarySource(file, async (filePath) => {
      const verification = await this.sourceManifest.assertValid(filePath);
      const reader = new InspectionLegacyXlsxReaderService(this.sourceManifest);
      const workbook = await reader.read(filePath);
      const rows = this.normalizer.normalizeMany(workbook.rows, workbook.firstDataRow);
      const warningCodes: Record<string, number> = {};
      const dispositions = { READY: 0, WARNING: 0, QUARANTINE: 0 };
      const totals = {
        findingsCount: 0,
        closedFindingsCount: 0,
        openFindingsCount: 0,
        milestoneS1: 0,
        milestoneS2: 0,
        milestoneS3: 0,
      };

      rows.forEach((row) => {
        if (row.disposition === 'READY') dispositions.READY += 1;
        if (row.disposition === 'WARNING') dispositions.WARNING += 1;
        if (row.disposition === 'QUARANTINE') dispositions.QUARANTINE += 1;
        totals.findingsCount += row.findingsCount ?? 0;
        totals.closedFindingsCount += row.closedFindingsCount ?? 0;
        totals.openFindingsCount += row.openFindingsCount ?? 0;
        row.milestones.forEach((milestone) => {
          if (milestone.sequenceNumber === 1) totals.milestoneS1 += 1;
          if (milestone.sequenceNumber === 2) totals.milestoneS2 += 1;
          if (milestone.sequenceNumber === 3) totals.milestoneS3 += 1;
        });
        row.warnings.forEach((warning) => {
          warningCodes[warning.code] = (warningCodes[warning.code] ?? 0) + 1;
        });
      });

      return {
        fileName: verification.actual.fileName,
        sourceSha256: verification.actual.sha256,
        totalRows: rows.length,
        dispositions,
        totals,
        warningCodes,
      };
    });
  }

  async import(
    file: LegacyInspectionsUploadedFile | undefined,
    confirmation: string | undefined,
  ): Promise<LegacyInspectionsWebImportResult> {
    if (confirmation !== LEGACY_INSPECTIONS_WEB_CONFIRMATION) {
      throw new BadRequestException(
        `Confirmación inválida. Escriba ${LEGACY_INSPECTIONS_WEB_CONFIRMATION} para continuar.`,
      );
    }

    return this.withTemporarySource(file, async (filePath) => this.withImportLock(async () => {
      const verification = await this.sourceManifest.assertValid(filePath);
      await runInspectionsMasterDataSeed(this.dataSource);

      const reader = new InspectionLegacyXlsxReaderService(this.sourceManifest);
      const resolver = new InspectionLegacyResolverService(
        this.dataSource.getRepository(AreaEntity),
        this.dataSource.getRepository(CompanyEntity),
        this.dataSource.getRepository(SectorEntity),
        this.dataSource.getRepository(UserEntity),
        this.dataSource.getRepository(InspectionLegacyImportEntity),
        this.normalizer,
      );
      const validator = new InspectionLegacyValidatorService();
      const applyService = new InspectionLegacyApplyService(this.dataSource);

      const workbook = await reader.read(filePath);
      const normalized = this.normalizer.normalizeMany(workbook.rows, workbook.firstDataRow);
      const resolved = await resolver.resolveMany(normalized);
      const validated = validator.validateMany(resolved);
      const dispositions = validated.reduce<Record<string, number>>((counts, row) => {
        counts[row.finalDisposition] = (counts[row.finalDisposition] ?? 0) + 1;
        return counts;
      }, {});

      const blockedRows = dispositions.BLOCKED ?? 0;
      const quarantineRows = dispositions.QUARANTINE ?? 0;
      if (blockedRows > 0 || quarantineRows > 0) {
        throw new BadRequestException(
          `Import legacy rechazado: BLOCKED=${blockedRows}, QUARANTINE=${quarantineRows}`,
        );
      }

      const result = await applyService.apply(validated);
      return {
        fileName: verification.actual.fileName,
        sourceSha256: verification.actual.sha256,
        totalRows: validated.length,
        dispositions,
        importedRows: result.importedRows,
        alreadyImportedRows: result.alreadyImportedRows,
      };
    }));
  }

  private async withTemporarySource<T>(
    file: LegacyInspectionsUploadedFile | undefined,
    action: (filePath: string) => Promise<T>,
  ): Promise<T> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Debe adjuntar el archivo XLSX histórico.');
    }

    const manifest = this.sourceManifest.manifest;
    if (file.size !== manifest.fileSizeBytes) {
      throw new BadRequestException(
        `Tamaño inesperado: ${file.size} bytes; se esperaban ${manifest.fileSizeBytes}.`,
      );
    }

    const directory = await mkdtemp(join(tmpdir(), 'aurelia-legacy-inspections-upload-'));
    const filePath = join(directory, manifest.fileName);
    try {
      await writeFile(filePath, file.buffer, { flag: 'wx' });
      return await action(filePath);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  private async withImportLock<T>(action: () => Promise<T>): Promise<T> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    try {
      await runner.query(`SELECT pg_advisory_lock(hashtext('aurelia_legacy_inspections_web_import'))`);
      return await action();
    } finally {
      try {
        await runner.query(`SELECT pg_advisory_unlock(hashtext('aurelia_legacy_inspections_web_import'))`);
      } finally {
        await runner.release();
      }
    }
  }
}
