import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AreaEntity } from '../organization/entities/area.entity';
import { CompanyEntity } from '../organization/entities/company.entity';
import { UserEntity } from '../users/entities/user.entity';
import catalogAliasesJson from './config/catalog-aliases.json';
import historicalDecisionsJson from './config/historical-catalog-decisions.json';
import sourceManifest from './config/source-manifest.json';
import { InspectionLegacyImportEntity } from './entities/inspection-legacy-import.entity';
import { NormalizedLegacyInspection } from './inspection-legacy-import.types';
import {
  LegacyCatalogResolution,
  ResolvedLegacyInspection,
} from './inspection-legacy-resolution.types';
import { InspectionLegacyNormalizerService } from './inspection-legacy-normalizer.service';

interface CatalogAliasConfig {
  areas: Record<string, string>;
  companies: Record<string, string>;
  inspectors: Record<string, string>;
  manualReview: {
    companies: Array<{
      sourceValue: string;
      candidateCompanyId: string;
      candidateName: string;
      sourceRows: number;
      reason: string;
    }>;
  };
}

interface HistoricalCatalogDecision {
  areas: {
    createArchived: Array<{
      sourceValue: string;
      code: string;
      name: string;
      sourceRows: number;
    }>;
  };
  companies: {
    createArchived: Array<{
      sourceValue: string;
      code: string;
      name: string;
      sourceRows: number;
      variants?: string[];
    }>;
    manualReview: Array<{
      sourceValue: string;
      sourceRows: number;
      candidate: string;
      decisionRequired: string;
    }>;
  };
  inspectors: {
    directMatches: Array<{
      sourceValue: string;
      userId: string;
      sourceRows: number;
    }>;
    keepTextOnly: Array<{
      sourceValue: string;
      sourceRows: number;
    }>;
  };
}

interface ResolutionContext {
  areasByName: Map<string, AreaEntity[]>;
  areasById: Map<string, AreaEntity>;
  companiesByName: Map<string, CompanyEntity[]>;
  companiesById: Map<string, CompanyEntity>;
  usersByName: Map<string, UserEntity[]>;
  usersById: Map<string, UserEntity>;
  importedByLegacyKey: Map<string, InspectionLegacyImportEntity>;
}

@Injectable()
export class InspectionLegacyResolverService {
  private readonly aliases = catalogAliasesJson as CatalogAliasConfig;
  private readonly decisions = historicalDecisionsJson as HistoricalCatalogDecision;

  constructor(
    @InjectRepository(AreaEntity)
    private readonly areas: Repository<AreaEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
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

    return {
      normalized: imported
        ? { ...normalized, disposition: 'ALREADY_IMPORTED' }
        : normalized,
      sourceSystem: sourceManifest.sourceSystem,
      alreadyImportedInspectionId: imported?.inspectionId ?? null,
      area: this.resolveArea(normalized.areaName, context),
      company: this.resolveCompany(normalized.companyName, context),
      inspector: this.resolveInspector(normalized.inspectorName, context),
    };
  }

  private async loadContext(): Promise<ResolutionContext> {
    const [areas, companies, users, legacyImports] = await Promise.all([
      this.areas.find(),
      this.companies.find(),
      this.users.find(),
      this.legacyImports.find(),
    ]);

    return {
      areasByName: this.groupByNormalized(areas, (area) => area.name),
      areasById: new Map(areas.map((area) => [area.id, area])),
      companiesByName: this.groupByNormalized(companies, (company) => company.name),
      companiesById: new Map(companies.map((company) => [company.id, company])),
      usersByName: this.groupByNormalized(users, (user) => `${user.firstName} ${user.lastName}`),
      usersById: new Map(users.map((user) => [user.id, user])),
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
    if (!sourceValue) return this.blocked(sourceValue, 'Área histórica vacía');
    const normalized = this.normalizer.normalizeCatalogText(sourceValue);
    const direct = context.areasByName.get(normalized) ?? [];
    if (direct.length === 1) return this.match('DIRECT_MATCH', sourceValue, direct[0]);
    if (direct.length > 1) return this.manualReview(sourceValue, 'Más de un área coincide por nombre');

    const aliasId = this.normalizedAliasLookup(this.aliases.areas, normalized);
    if (aliasId) {
      const alias = context.areasById.get(aliasId);
      return alias
        ? this.match('ALIAS_MATCH', sourceValue, alias)
        : this.blocked(sourceValue, `El alias de área apunta a un UUID inexistente: ${aliasId}`);
    }

    const historical = this.decisions.areas.createArchived.find(
      (candidate) => this.normalizer.normalizeCatalogText(candidate.sourceValue) === normalized,
    );
    if (historical) {
      return {
        status: 'CREATE_ARCHIVED',
        sourceValue,
        entityId: null,
        entityName: historical.name,
        proposedCode: historical.code,
      };
    }

    return this.blocked(sourceValue, 'Área sin resolución en la matriz histórica');
  }

  private resolveCompany(
    sourceValue: string | null,
    context: ResolutionContext,
  ): LegacyCatalogResolution {
    if (!sourceValue) return this.blocked(sourceValue, 'Empresa histórica vacía');
    const normalized = this.normalizer.normalizeCatalogText(sourceValue);
    const direct = context.companiesByName.get(normalized) ?? [];
    if (direct.length === 1) return this.match('DIRECT_MATCH', sourceValue, direct[0]);
    if (direct.length > 1) return this.manualReview(sourceValue, 'Más de una empresa coincide por nombre');

    const aliasId = this.normalizedAliasLookup(this.aliases.companies, normalized);
    if (aliasId) {
      const alias = context.companiesById.get(aliasId);
      return alias
        ? this.match('ALIAS_MATCH', sourceValue, alias)
        : this.blocked(sourceValue, `El alias de empresa apunta a un UUID inexistente: ${aliasId}`);
    }

    const pendingDecision = [
      ...this.aliases.manualReview.companies,
      ...this.decisions.companies.manualReview,
    ].find((candidate) => this.normalizer.normalizeCatalogText(candidate.sourceValue) === normalized);
    if (pendingDecision) {
      return this.manualReview(
        sourceValue,
        'La equivalencia requiere aprobación funcional antes del apply',
      );
    }

    const historical = this.decisions.companies.createArchived.find((candidate) => {
      const values = [candidate.sourceValue, ...(candidate.variants ?? [])];
      return values.some((value) => this.normalizer.normalizeCatalogText(value) === normalized);
    });
    if (historical) {
      return {
        status: 'CREATE_ARCHIVED',
        sourceValue,
        entityId: null,
        entityName: historical.name,
        proposedCode: historical.code,
      };
    }

    return this.blocked(sourceValue, 'Empresa sin resolución en la matriz histórica');
  }

  private resolveInspector(
    sourceValue: string | null,
    context: ResolutionContext,
  ): LegacyCatalogResolution {
    if (!sourceValue) {
      return {
        status: 'KEEP_TEXT_ONLY',
        sourceValue: null,
        entityId: null,
        entityName: null,
        message: 'No existe nombre de inspector histórico',
      };
    }

    const normalized = this.normalizer.normalizeCatalogText(sourceValue);
    const direct = context.usersByName.get(normalized) ?? [];
    if (direct.length === 1) return this.userMatch('DIRECT_MATCH', sourceValue, direct[0]);
    if (direct.length > 1) return this.manualReview(sourceValue, 'Más de un usuario coincide por nombre');

    const aliasId = this.normalizedAliasLookup(this.aliases.inspectors, normalized);
    if (aliasId) {
      const alias = context.usersById.get(aliasId);
      return alias
        ? this.userMatch('ALIAS_MATCH', sourceValue, alias)
        : this.blocked(sourceValue, `El alias de inspector apunta a un UUID inexistente: ${aliasId}`);
    }

    return {
      status: 'KEEP_TEXT_ONLY',
      sourceValue,
      entityId: null,
      entityName: sourceValue,
      message: 'Se conservará como autor histórico sin crear usuario autenticable',
    };
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

  private normalizedAliasLookup(aliases: Record<string, string>, normalizedSource: string): string | null {
    const entry = Object.entries(aliases).find(
      ([sourceValue]) => this.normalizer.normalizeCatalogText(sourceValue) === normalizedSource,
    );
    return entry?.[1] ?? null;
  }

  private legacyKey(year: number | null, number: number | null): string | null {
    return year && number ? `${sourceManifest.sourceSystem}:${year}:${number}` : null;
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
