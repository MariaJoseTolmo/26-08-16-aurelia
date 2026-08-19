import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { Observable, from, mergeMap } from 'rxjs';
import { Repository } from 'typeorm';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { IncidentEntity } from '../incidents/entities/incident.entity';
import { InspectionEntity } from '../inspections/entities/inspection.entity';
import { ResourceScopeService, ScopedResource } from './resource-scope.service';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

@Injectable()
export class ResourceScopeInterceptor implements NestInterceptor {
  constructor(
    private readonly resourceScope: ResourceScopeService,
    @InjectRepository(InspectionEntity)
    private readonly inspections: Repository<InspectionEntity>,
    @InjectRepository(IncidentEntity)
    private readonly incidents: Repository<IncidentEntity>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest & Request>();

    return from(this.validateRequestScope(request)).pipe(
      mergeMap(() => next.handle()),
      mergeMap(async (body) => this.filterResponse(request, body)),
    );
  }

  private async filterResponse(request: AuthenticatedRequest & Request, body: unknown): Promise<unknown> {
    if (!request.user) return body;
    const path = request.originalUrl.split('?')[0];

    if (request.method === 'GET' && path === '/api/inspections' && Array.isArray(body)) {
      return this.resourceScope.filterAllowedInspections(request.user, body.filter(this.isScopedResource));
    }

    if (request.method === 'GET' && path === '/api/incidents' && Array.isArray(body)) {
      return this.resourceScope.filterAllowed(request.user, body.filter(this.isScopedResource));
    }

    if (this.isScopedResource(body)) {
      const allowed = await this.canAccessResponse(request, body);
      if (!allowed) throw new ForbiddenException('Resource is outside user scope');
    }

    return body;
  }

  private async validateRequestScope(request: AuthenticatedRequest & Request): Promise<void> {
    if (!request.user) return;
    const path = request.originalUrl.split('?')[0];
    const segments = path.split('/').filter(Boolean);
    const resource = segments[1];
    const resourceId = segments[2];

    if (request.method === 'POST' && path === '/api/inspections' && this.isScopedResource(request.body)) {
      const allowed = await this.resourceScope.canCreateInspection(request.user, request.body);
      if (!allowed) throw new ForbiddenException('Resource is outside user scope');
    }

    if (request.method === 'POST' && path === '/api/incidents' && this.isScopedResource(request.body)) {
      const allowed = await this.resourceScope.canAccess(request.user, request.body);
      if (!allowed) throw new ForbiddenException('Resource is outside user scope');
    }

    if (resource === 'inspections' && resourceId && uuidPattern.test(resourceId)) {
      const inspection = await this.inspections.findOneBy({ id: resourceId });
      if (inspection) await this.assertAllowedInspection(request, inspection);
    }

    if (resource === 'incidents' && resourceId && uuidPattern.test(resourceId)) {
      const incident = await this.incidents.findOneBy({ id: resourceId });
      if (incident) await this.assertAllowed(request, incident);
    }
  }

  private async canAccessResponse(request: AuthenticatedRequest & Request, resource: ScopedResource): Promise<boolean> {
    const path = request.originalUrl.split('?')[0];
    if (request.method === 'POST' && path === '/api/inspections') {
      return this.resourceScope.canCreateInspection(request.user, resource);
    }
    if (path.startsWith('/api/inspections')) return this.resourceScope.canAccessInspection(request.user, resource);
    return this.resourceScope.canAccess(request.user, resource);
  }

  private async assertAllowedInspection(request: AuthenticatedRequest & Request, resource: ScopedResource): Promise<void> {
    const allowed = await this.resourceScope.canAccessInspection(request.user, resource);
    if (!allowed) throw new ForbiddenException('Resource is outside user scope');
  }

  private async assertAllowed(request: AuthenticatedRequest & Request, resource: ScopedResource): Promise<void> {
    const allowed = await this.resourceScope.canAccess(request.user, resource);
    if (!allowed) throw new ForbiddenException('Resource is outside user scope');
  }

  private isScopedResource(value: unknown): value is ScopedResource {
    if (!value || Array.isArray(value) || typeof value !== 'object') return false;
    const resource = value as Record<string, unknown>;
    return 'companyId' in resource || 'areaId' in resource;
  }
}
