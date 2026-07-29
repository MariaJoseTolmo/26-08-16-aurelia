import { CallHandler, ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { lastValueFrom, of } from 'rxjs';
import type { AccessTokenPayload } from '../auth/jwt-token.service';
import type { IncidentEntity } from '../incidents/entities/incident.entity';
import type { InspectionEntity } from '../inspections/entities/inspection.entity';
import { ResourceScopeInterceptor } from './resource-scope.interceptor';
import type { ResourceScopeService } from './resource-scope.service';

const user: AccessTokenPayload = {
  sub: 'user-1',
  email: 'supervisor@contratista.cl',
  fullName: 'Supervisor Contratista',
  roles: ['SUPERVISOR'],
  permissions: ['inspections:read', 'inspections:create'],
  iat: 1,
  exp: 9_999_999_999,
};

function executionContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

function callHandler(body: unknown): CallHandler {
  return {
    handle: jest.fn(() => of(body)),
  };
}

function createInterceptor(input: {
  canCreateInspection?: boolean;
  canAccessInspection?: boolean;
}) {
  const resourceScope = {
    canCreateInspection: jest.fn().mockResolvedValue(input.canCreateInspection ?? true),
    canAccessInspection: jest.fn().mockResolvedValue(input.canAccessInspection ?? true),
    canAccess: jest.fn().mockResolvedValue(true),
    filterAllowedInspections: jest.fn(),
    filterAllowed: jest.fn(),
  } as unknown as ResourceScopeService;
  const inspections = {
    findOneBy: jest.fn().mockResolvedValue(null),
  } as unknown as Repository<InspectionEntity>;
  const incidents = {
    findOneBy: jest.fn().mockResolvedValue(null),
  } as unknown as Repository<IncidentEntity>;

  return {
    interceptor: new ResourceScopeInterceptor(resourceScope, inspections, incidents),
    resourceScope,
  };
}

describe('ResourceScopeInterceptor inspection creation', () => {
  it('usa el scope específico de creación para request y response', async () => {
    const { interceptor, resourceScope } = createInterceptor({
      canCreateInspection: true,
      canAccessInspection: false,
    });
    const requestBody = { companyId: 'company-1', areaId: 'area-2' };
    const responseBody = { id: 'inspection-1', companyId: 'company-1', areaId: 'area-2' };
    const next = callHandler(responseBody);

    const result = await lastValueFrom(interceptor.intercept(executionContext({
      user,
      method: 'POST',
      originalUrl: '/api/inspections',
      body: requestBody,
    }), next));

    expect(result).toEqual(responseBody);
    expect(resourceScope.canCreateInspection).toHaveBeenNthCalledWith(1, user, requestBody);
    expect(resourceScope.canCreateInspection).toHaveBeenNthCalledWith(2, user, responseBody);
    expect(resourceScope.canAccessInspection).not.toHaveBeenCalled();
    expect(next.handle).toHaveBeenCalledTimes(1);
  });

  it('bloquea la creación cuando la empresa está fuera del scope', async () => {
    const { interceptor } = createInterceptor({ canCreateInspection: false });
    const next = callHandler({ id: 'inspection-1' });

    await expect(lastValueFrom(interceptor.intercept(executionContext({
      user,
      method: 'POST',
      originalUrl: '/api/inspections',
      body: { companyId: 'company-2', areaId: 'area-1' },
    }), next))).rejects.toBeInstanceOf(ForbiddenException);

    expect(next.handle).not.toHaveBeenCalled();
  });

  it('mantiene el scope general para respuestas de otros endpoints de inspecciones', async () => {
    const { interceptor, resourceScope } = createInterceptor({
      canCreateInspection: true,
      canAccessInspection: true,
    });
    const responseBody = { companyId: 'company-1', areaId: 'area-1' };

    await lastValueFrom(interceptor.intercept(executionContext({
      user,
      method: 'GET',
      originalUrl: '/api/inspections/dashboard/summary',
      body: undefined,
    }), callHandler(responseBody)));

    expect(resourceScope.canAccessInspection).toHaveBeenCalledWith(user, responseBody);
    expect(resourceScope.canCreateInspection).not.toHaveBeenCalled();
  });
});
