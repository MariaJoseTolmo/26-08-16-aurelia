import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MobileBootstrapResponse, UserResponse } from '@aurelia/contracts';
import type { AccessTokenPayload } from '../auth/jwt-token.service';
import { ResourceScopeService } from '../access-control/resource-scope.service';
import { InspectionFindingCatalogService } from '../inspections/inspection-finding-catalog.service';
import { InspectionsService } from '../inspections/inspections.service';
import { OrganizationService } from '../organization/organization.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class MobileBootstrapService {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly inspectionsService: InspectionsService,
    private readonly findingCatalogService: InspectionFindingCatalogService,
    private readonly usersService: UsersService,
    private readonly resourceScope: ResourceScopeService,
    private readonly configService: ConfigService,
  ) {}

  async buildBootstrap(user?: AccessTokenPayload): Promise<MobileBootstrapResponse> {
    const generatedAt = new Date();
    const [areas, sectors, companies, inspectionTypes, inspectionTemplates, findingTypes, findingSeverities] = await Promise.all([
      this.organizationService.findAreas(),
      this.organizationService.findSectors(),
      this.organizationService.findCompanies(),
      this.inspectionsService.findTypes(),
      this.inspectionsService.findTemplates(),
      this.findingCatalogService.findTypes(),
      this.findingCatalogService.findSeverities(),
    ]);
    const users = await this.findAvailableUsers();
    const scoped = await this.applyScope(user, {
      areas,
      sectors,
      companies,
      users,
    });
    const maxOfflineDays = this.getNumber('MOBILE_BOOTSTRAP_MAX_OFFLINE_DAYS', 7);
    const expiresAt = new Date(generatedAt.getTime() + maxOfflineDays * 24 * 60 * 60 * 1000);
    const catalogs = {
      areas: scoped.areas,
      sectors: scoped.sectors,
      companies: scoped.companies,
      users: scoped.users,
      inspectionTypes,
      inspectionTemplates,
      findingTypes,
      findingSeverities,
    };

    return {
      bootstrapVersion: this.createBootstrapVersion(catalogs),
      generatedAt: generatedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      catalogs,
      offlinePolicy: {
        maxOfflineDays,
        requiresBiometricOrPin: this.getBoolean('MOBILE_BOOTSTRAP_REQUIRES_BIOMETRIC_OR_PIN', false),
        maxPendingQueueItems: this.getNumber('MOBILE_BOOTSTRAP_MAX_PENDING_QUEUE_ITEMS', 500),
        maxAttachmentSizeMb: this.getNumber('MOBILE_BOOTSTRAP_MAX_ATTACHMENT_SIZE_MB', 25),
      },
    };
  }

  private async findAvailableUsers(): Promise<UserResponse[]> {
    try {
      return await this.usersService.findAll();
    } catch {
      return [];
    }
  }

  private async applyScope(
    user: AccessTokenPayload | undefined,
    catalogs: Pick<MobileBootstrapResponse['catalogs'], 'areas' | 'sectors' | 'companies' | 'users'>,
  ): Promise<Pick<MobileBootstrapResponse['catalogs'], 'areas' | 'sectors' | 'companies' | 'users'>> {
    if (!user) return catalogs;

    const areas = await this.filterAsync(catalogs.areas, (area) =>
      this.resourceScope.canAccessArea(user, area.id),
    );
    const areaIds = new Set(areas.map((area) => area.id));

    const sectors = await this.filterAsync(catalogs.sectors, (sector) => {
      if (sector.areaId && !areaIds.has(sector.areaId)) return Promise.resolve(false);
      return this.resourceScope.canAccessArea(user, sector.areaId);
    });

    const companies = await this.filterAsync(catalogs.companies, (company) =>
      this.resourceScope.canAccessCompany(user, company.id),
    );
    const companyIds = new Set(companies.map((company) => company.id));

    const users = await this.filterAsync(catalogs.users, (catalogUser) => {
      const primaryCompanyAllowed = catalogUser.companyId ? companyIds.has(catalogUser.companyId) : false;
      const linkedCompanyAllowed = (catalogUser.companies ?? []).some((company) => companyIds.has(company.id));
      const companyAllowed = !catalogUser.companyId && (catalogUser.companies?.length ?? 0) === 0
        ? true
        : primaryCompanyAllowed || linkedCompanyAllowed;

      const areaAllowed = catalogUser.areaId ? areaIds.has(catalogUser.areaId) : true;
      return Promise.resolve(companyAllowed && areaAllowed);
    });

    return { areas, sectors, companies, users };
  }

  private async filterAsync<T>(items: T[], predicate: (item: T) => Promise<boolean>): Promise<T[]> {
    const accepted = await Promise.all(items.map(predicate));
    return items.filter((_, index) => accepted[index]);
  }

  private createBootstrapVersion(catalogs: MobileBootstrapResponse['catalogs']): string {
    const timestamps = [
      ...catalogs.areas.map((item) => item.updatedAt),
      ...catalogs.sectors.map((item) => item.updatedAt),
      ...catalogs.companies.map((item) => item.updatedAt),
      ...catalogs.users.map((item) => item.updatedAt),
      ...catalogs.inspectionTypes.map((item) => item.updatedAt),
      ...catalogs.inspectionTemplates.map((item) => item.updatedAt),
      ...catalogs.inspectionTemplates.flatMap((template) => template.sections.map((section) => section.updatedAt)),
      ...catalogs.inspectionTemplates.flatMap((template) => template.sections.flatMap((section) => section.items.map((item) => item.updatedAt))),
      ...catalogs.findingTypes.map((item) => item.updatedAt),
      ...catalogs.findingSeverities.map((item) => item.updatedAt),
    ].sort();
    const latest = timestamps.length > 0 ? timestamps[timestamps.length - 1] : 'empty';
    const counts = [
      catalogs.areas.length,
      catalogs.sectors.length,
      catalogs.companies.length,
      catalogs.users.length,
      catalogs.inspectionTypes.length,
      catalogs.inspectionTemplates.length,
      catalogs.findingTypes.length,
      catalogs.findingSeverities.length,
    ].join('-');

    return `mobile-bootstrap:${latest}:${counts}`;
  }

  private getNumber(key: string, fallback: number): number {
    const value = this.configService.get<string>(key);
    if (!value) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private getBoolean(key: string, fallback: boolean): boolean {
    const value = this.configService.get<string>(key);
    if (!value) return fallback;
    return ['true', '1', 'yes', 'y'].includes(value.toLowerCase());
  }
}
