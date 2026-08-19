import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AreaEntity } from '../organization/entities/area.entity';
import { CompanyEntity } from '../organization/entities/company.entity';
import { SectorEntity } from '../organization/entities/sector.entity';
import { UserEntity } from '../users/entities/user.entity';
import masterDataJson from './config/inspection-master-data.json';
import sourceManifest from './config/source-manifest.json';
import { InspectionLegacyImportEntity } from './entities/inspection-legacy-import.entity';
import { NormalizedLegacyInspection } from './inspection-legacy-import.types';
import {
  LegacyCatalogResolution,
  ResolvedLegacyInspection,
} from './inspection-legacy-resolution.types';
import { InspectionLegacyNormalizerService } from './inspection-legacy-normalizer.service';

interface MasterArea {
  code: string;
  name: string;
  sourceValues: string[];
}

interface MasterSector {
  code: string;
  areaCode: string;
  name: string;
  sourceValues?: string[];
}

interface MasterCompany {
  code: string;
  name: string;
  sourceValues: string[];
}

interface MasterUser {
  email: string;
  firstName: string;
  lastName: string;
  companyCode: string;
  roleCode: string;
  sourceValues: string[];
}

interface MasterInspectorGroup {
  sourceValue: string;
  members: string[];
}

interface InspectionMasterData {
  areas: MasterArea[];
  sectors: MasterSector[];
  companies: MasterCompany[];
  users: MasterUser[];
  inspectorGroups: MasterInspectorGroup[];
}

interface ResolutionContext {
  areasByName: Map<string, AreaEntity[]>;
  areasByCode: Map<string, AreaEntity>;
  companiesByName: Map<string, CompanyEntity[]>;
  companiesByCode: Map<string, CompanyEntity>;
  sectorsByCode: Map<string, SectorEntity>;
  usersByName: Map<string, UserEntity[]>;
  usersByEmail: Map<string, UserEntity>;
  importedByLegacyKey: Map<string, InspectionLegacyImportEntity>;
}

@Injectable()
export class InspectionLegacyResolverService {
  private readonly masterData = masterDataJson as InspectionMasterData;

  constructor(
    @InjectRepository(AreaEntity)
    private readonly areas: Repository<AreaEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
    @InjectRepository(SectorEntity)
    private readonly sectors: Repository<SectorEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(InspectionLegacyImportEntity)
    private readonly legacyImports: Repository<InspectionLegacyImportEntity>,
    private readonly normalizer: InspectionLegacyNormalizerService,
  ) {}

  async resolveMany(rows: NormalizedLegacyInspection[]): Promise<ResolvedLegacyInspection[]> {
    const context = await this.loadContext();
    return rows.map((row) => this.resolve(row, context));
  }

  private resolve(
    normalized: NormalizedLegacyInspection,
    context: ResolutionContext,
  ): ResolvedLegacyInspection {
    const legacyKey = this.legacyKey(normalized.legacyYear, normalized.legacyNumber);
    const imported = legacyKey ? context.importedByLegacyKey.get(legacyKey) ?? null : null;
    const area = this.resolveArea(normalized.areaName, context);
    const sectors = this.resolveSectors(normalized.areaName, normalized.sectorName, context);
    const inspectors = this.resolveInspectors(normalized.inspectorName, context);

    return {
      normalized: imported
        ? { ...normalized, disposition: 'ALREADY_IMPORTED' }
        : normalized,
      sourceSystem: sourceManifest.sourceSystem,
      alreadyImportedInspectionId: imported?.inspectionId ?? null,
      area,
      company: this.resolveCompany(normalized.companyName, context),
      sector: this.summarizeMany(normalized.sectorName, sectors, 'sectores'),
      sectors,
      inspector: this.summarizeMany(normalized.inspectorName, inspectors, 'inspectores'),
      inspectors,
    };
  }

  private async loadContext(): Promise<ResolutionContext> {
    const [areas, companies, sectors, users, legacyImports] = await Promise.all([
      this.areas.find(),
      this.companies.find(),
      this.sectors.find(),
      this.users.find(),
      this.legacyImports.find(),
    ]);

    return {
      areasByName: this.groupByNormalized(areas, (area) => area.name),
      areasByCode: new Map(areas.map((area) => [area.code, area])),
      companiesByName: this.groupByNormalized(companies, (company) => company.name),
      companiesByCode: companies.reduce<Map<string, CompanyEntity>>((indexed, company) => {
        if (company.code) indexed.set(company.code, company);
        return indexed;
      }, new Map()),
      sectorsByCode: new Map(sectors.map((sector) => [sector.code, sector])),
      usersByName: this.groupByNormalized(users, (user) => `${user.firstName} ${user.lastName}`),
      usersByEmail: new Map(users.map((user) => [user.email.toLocaleLowerCase('es'), user])),
      importedByLegacyKey: new Map(
        legacyImports.map((legacyImport) => [
          this.legacyKey(legacyImport.legacyYear, legacyImport.legacyNumber) as string,
          legacyImport,
        ]),
      ),
    };
  }

  private resolveArea(
    sourceValue: string | null,
    context: ResolutionContext,
  ): LegacyCatalogResolution {
    if (!sourceValue) return this.blocked(sourceValue, 'Área vacía en la fuente');
    const normalized = this.normalizer.normalizeCatalogText(sourceValue);
    const direct = context.areasByName.get(normalized) ?? [];
    if (direct.length === 1) return this.match('DIRECT_MATCH', sourceValue, direct[0]);
    if (direct.length > 1) return this.manualReview(sourceValue, 'Más de un área coincide por nombre');

    const master = this.masterData.areas.find((candidate) => (
      candidate.sourceValues.some((value) => this.normalizer.normalizeCatalogText(value) === normalized)
    ));
    if (!master) return this.blocked(sourceValue, 'Área sin resolución en el catálogo maestro actual');

    const existing = context.areasByCode.get(master.code);
    if (existing) return this.match('ALIAS_MATCH', sourceValue, existing);

    return {
      status: 'CREATE_ACTIVE',
      sourceValue,
      entityId: null,
      entityName: master.name,
      proposedCode: master.code,
      message: 'El área se creará como catálogo activo antes de importar las inspecciones',
    };
  }

  private resolveCompany(
    sourceValue: string | null,
    context: ResolutionContext,
  ): LegacyCatalogResolution {
    if (!sourceValue) return this.blocked(sourceValue, 'Empresa vacía en la fuente');
    const normalized = this.normalizer.normalizeCatalogText(sourceValue);
    const direct = context.companiesByName.get(normalized) ?? [];
    if (direct.length === 1) return this.match('DIRECT_MATCH', sourceValue, direct[0]);
    if (direct.length > 1) return this.manualReview(sourceValue, 'Más de una empresa coincide por nombre');

    const master = this.masterData.companies.find((candidate) => (
      candidate.sourceValues.some((value) => this.normalizer.normalizeCatalogText(value) === normalized)
    ));
    if (!master) return this.blocked(sourceValue, 'Empresa sin resolución en el catálogo maestro actual');

    const existing = context.companiesByCode.get(master.code);
    if (existing) return this.match('ALIAS_MATCH', sourceValue, existing);

    return {
      status: 'CREATE_ACTIVE',
      sourceValue,
      entityId: null,
      entityName: master.name,
      proposedCode: master.code,
      message: 'La empresa se creará como catálogo activo antes de importar las inspecciones',
    };
  }

  private resolveSectors(
    areaSourceValue: string | null,
    sectorSourceValue: string | null,
    context: ResolutionContext,
  ): LegacyCatalogResolution[] {
    if (!sectorSourceValue) {
      return [this.keepTextOnly(null, 'La fuente no informa sector')];
    }

    const masterArea = this.findMasterArea(areaSourceValue);
    if (!masterArea) {
      return [this.blocked(sectorSourceValue, 'No se pudo resolver el área requerida para relacionar el sector')];
    }

    return sectorSourceValue
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((sourceValue) => {
        const normalized = this.normalizeSectorText(sourceValue);
        const master = this.masterData.sectors.find((candidate) => (
          candidate.areaCode === masterArea.code
          && [candidate.name, ...(candidate.sourceValues ?? [])]
            .some((value) => this.normalizeSectorText(value) === normalized)
        ));
        if (!master) {
          return this.blocked(
            sourceValue,
            `Sector sin resolución para el área ${masterArea.name}`,
          );
        }

        const existing = context.sectorsByCode.get(master.code);
        if (existing) {
          return {
            status: this.normalizeSectorText(existing.name) === normalized ? 'DIRECT_MATCH' : 'ALIAS_MATCH',
            sourceValue,
            entityId: existing.id,
            entityName: existing.name,
          };
        }

        return {
          status: 'CREATE_ACTIVE',
          sourceValue,
          entityId: null,
          entityName: master.name,
          proposedCode: master.code,
          message: `El sector se creará como catálogo activo dentro de ${masterArea.name}`,
        };
      });
  }

  private resolveInspectors(
    sourceValue: string | null,
    context: ResolutionContext,
  ): LegacyCatalogResolution[] {
    if (!sourceValue) return [this.keepTextOnly(null, 'La fuente no informa inspector')];
    const normalized = this.normalizer.normalizeCatalogText(sourceValue);
    const group = this.masterData.inspectorGroups.find(
      (candidate) => this.normalizer.normalizeCatalogText(candidate.sourceValue) === normalized,
    );
    if (group) {
      return group.members.map((email) => this.resolveMasterUserByEmail(email, sourceValue, context));
    }

    const direct = context.usersByName.get(normalized) ?? [];
    if (direct.length === 1) return [this.userMatch('DIRECT_MATCH', sourceValue, direct[0])];
    if (direct.length > 1) return [this.manualReview(sourceValue, 'Más de un usuario coincide por nombre')];

    const master = this.masterData.users.find((candidate) => (
      candidate.sourceValues.some((value) => this.normalizer.normalizeCatalogText(value) === normalized)
    ));
    if (!master) return [this.blocked(sourceValue, 'Inspector sin resolución en el catálogo maestro actual')];

    return [this.resolveMasterUser(master, sourceValue, context)];
  }

  private resolveMasterUserByEmail(
    email: string,
    sourceValue: string,
    context: ResolutionContext,
  ): LegacyCatalogResolution {
    const master = this.masterData.users.find(
      (candidate) => candidate.email.toLocaleLowerCase('es') === email.toLocaleLowerCase('es'),
    );
    return master
      ? this.resolveMasterUser(master, sourceValue, context)
      : this.blocked(sourceValue, `El grupo de inspectores apunta a un correo no definido: ${email}`);
  }

  private resolveMasterUser(
    master: MasterUser,
    sourceValue: string,
    context: ResolutionContext,
  ): LegacyCatalogResolution {
    const existing = context.usersByEmail.get(master.email.toLocaleLowerCase('es'));
    if (existing) return this.userMatch('ALIAS_MATCH', sourceValue, existing);

    return {
      status: 'CREATE_ACTIVE',
      sourceValue,
      entityId: null,
      entityName: `${master.firstName} ${master.lastName}`,
      proposedEmail: master.email,
      proposedCompanyCode: master.companyCode,
      proposedRoleCode: master.roleCode,
      message: master.email.includes('@pending-directory.')
        ? 'Se creará un usuario activo y seleccionable, sin contraseña, pendiente de confirmar correo corporativo'
        : 'Se creará el usuario activo antes de importar las inspecciones',
    };
  }

  private findMasterArea(sourceValue: string | null): MasterArea | null {
    if (!sourceValue) return null;
    const normalized = this.normalizer.normalizeCatalogText(sourceValue);
    return this.masterData.areas.find((candidate) => (
      candidate.sourceValues.some((value) => this.normalizer.normalizeCatalogText(value) === normalized)
    )) ?? null;
  }

  private normalizeSectorText(value: string): string {
    const normalized = this.normalizer.normalizeCatalogText(value);
    const aliases: Record<string, string> = {
      'plataforma eecc': 'plataformas eecc',
      'planta de procesos': 'planta procesos',
      'planta de proceso': 'planta procesos',
    };
    return aliases[normalized] ?? normalized;
  }

  private groupByNormalized<T>(values: T[], getName: (value: T) => string): Map<string, T[]> {
    const grouped = new Map<string, T[]>();
    values.forEach((value) => {
      const normalized = this.normalizer.normalizeCatalogText(getName(value));
      const current = grouped.get(normalized) ?? [];
      current.push(value);
      grouped.set(normalized, current);
    });
    return grouped;
  }

  private legacyKey(year: number | null, number: number | null): string | null {
    return year && number ? `${sourceManifest.sourceSystem}:${year}:${number}` : null;
  }

  private summarizeMany(
    sourceValue: string | null,
    resolutions: LegacyCatalogResolution[],
    label: string,
  ): LegacyCatalogResolution {
    if (resolutions.length === 0) return this.keepTextOnly(sourceValue, `No se resolvieron ${label}`);
    if (resolutions.length === 1) return resolutions[0];
    const status = resolutions.some((resolution) => resolution.status === 'BLOCKED')
      ? 'BLOCKED'
      : resolutions.some((resolution) => resolution.status === 'MANUAL_REVIEW')
        ? 'MANUAL_REVIEW'
        : resolutions.some((resolution) => resolution.status === 'CREATE_ACTIVE')
          ? 'CREATE_ACTIVE'
          : 'ALIAS_MATCH';
    return {
      status,
      sourceValue,
      entityId: null,
      entityName: resolutions.map((resolution) => resolution.entityName).filter(Boolean).join(' | '),
      message: `La fuente contiene ${resolutions.length} ${label}; se conservarán todas las relaciones`,
    };
  }

  private match(
    status: 'DIRECT_MATCH' | 'ALIAS_MATCH',
    sourceValue: string,
    entity: AreaEntity | CompanyEntity,
  ): LegacyCatalogResolution {
    return {
      status,
      sourceValue,
      entityId: entity.id,
      entityName: entity.name,
    };
  }

  private userMatch(
    status: 'DIRECT_MATCH' | 'ALIAS_MATCH',
    sourceValue: string,
    user: UserEntity,
  ): LegacyCatalogResolution {
    return {
      status,
      sourceValue,
      entityId: user.id,
      entityName: `${user.firstName} ${user.lastName}`.trim(),
      proposedEmail: user.email,
    };
  }

  private keepTextOnly(sourceValue: string | null, message: string): LegacyCatalogResolution {
    return {
      status: 'KEEP_TEXT_ONLY',
      sourceValue,
      entityId: null,
      entityName: sourceValue,
      message,
    };
  }

  private blocked(sourceValue: string | null, message: string): LegacyCatalogResolution {
    return {
      status: 'BLOCKED',
      sourceValue,
      entityId: null,
      entityName: null,
      message,
    };
  }

  private manualReview(sourceValue: string, message: string): LegacyCatalogResolution {
    return {
      status: 'MANUAL_REVIEW',
      sourceValue,
      entityId: null,
      entityName: null,
      message,
    };
  }
}
