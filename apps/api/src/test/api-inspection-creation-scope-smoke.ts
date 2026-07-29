import { ForbiddenException } from '@nestjs/common';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import type { Repository } from 'typeorm';
import type { AccessTokenPayload } from '../modules/auth/jwt-token.service';
import { ResourceScopeInterceptor } from '../modules/access-control/resource-scope.interceptor';
import { ResourceScopeService } from '../modules/access-control/resource-scope.service';
import type { IncidentEntity } from '../modules/incidents/entities/incident.entity';
import type { InspectionEntity } from '../modules/inspections/entities/inspection.entity';
import type { UserEntity } from '../modules/users/entities/user.entity';

const contractorToken: AccessTokenPayload = {
  sub: 'user-1',
  email: 'supervisor@contratista.cl',
  fullName: 'Supervisor Contratista',
  roles: ['SUPERVISOR'],
  permissions: ['inspections:read', 'inspections:create'],
  iat: 1,
  exp: 9_999_999_999,
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function userRow(input: {
  companyId?: string | null;
  areaId?: string | null;
  principal?: boolean;
}): UserEntity {
  const companyId = input.companyId ?? null;
  const areaId = input.areaId ?? null;

  return {
    id: contractorToken.sub,
    isActive: true,
    companyId,
    areaId,
    company: companyId
      ? {
          id: companyId,
          name: input.principal ? 'Gold Fields' : 'Contratista Uno',
          code: input.principal ? 'CORP' : 'EECC-1',
          isContractor: !input.principal,
        }
      : null,
    userCompanies: [],
    userAreas: areaId ? [{ area: { id: areaId } }] : [],
  } as unknown as UserEntity;
}

function serviceWith(row: UserEntity | null): ResourceScopeService {
  const users = {
    findOne: async () => row,
  } as unknown as Repository<UserEntity>;

  return new ResourceScopeService(users);
}

async function expectForbidden(operation: Promise<unknown>, message: string): Promise<void> {
  try {
    await operation;
  } catch (error) {
    assert(error instanceof ForbiddenException, `${message}: expected ForbiddenException`);
    return;
  }

  throw new Error(`${message}: expected operation to be rejected`);
}

async function verifyCreationScopeService(): Promise<void> {
  const contractorService = serviceWith(userRow({ companyId: 'company-1', areaId: 'area-1' }));

  assert(
    await contractorService.canCreateInspection(contractorToken, {
      companyId: 'company-1',
      areaId: 'area-2',
    }),
    'A contractor supervisor must be able to create an inspection in another area of the same company',
  );

  assert(
    !(await contractorService.canCreateInspection(contractorToken, {
      companyId: 'company-2',
      areaId: 'area-2',
    })),
    'A contractor supervisor must not be able to create an inspection for another company',
  );

  assert(
    !(await contractorService.canAccessInspection(contractorToken, {
      companyId: 'company-1',
      areaId: 'area-2',
    })),
    'General inspection access must continue enforcing the assigned area',
  );

  await expectForbidden(
    contractorService.assertCanCreateInspection(contractorToken, {
      companyId: 'company-2',
      areaId: 'area-2',
    }),
    'Creation outside the contractor company scope',
  );

  const goldFieldsToken: AccessTokenPayload = {
    ...contractorToken,
    email: 'supervisor@goldfields.com',
  };
  const goldFieldsService = serviceWith(userRow({
    companyId: 'gold-fields',
    areaId: 'environment',
    principal: true,
  }));

  assert(
    await goldFieldsService.canCreateInspection(goldFieldsToken, {
      companyId: 'any-company',
      areaId: 'any-area',
    }),
    'A Gold Fields user must be able to create an inspection for any company and area',
  );

  const inactiveService = serviceWith(null);
  await expectForbidden(
    inactiveService.canCreateInspection(contractorToken, {
      companyId: 'company-1',
      areaId: 'area-1',
    }),
    'Inactive user creation scope',
  );
}

async function verifyCreationScopeInterceptor(): Promise<void> {
  let creationChecks = 0;
  let generalInspectionChecks = 0;

  const scope = {
    canCreateInspection: async () => {
      creationChecks += 1;
      return true;
    },
    canAccessInspection: async () => {
      generalInspectionChecks += 1;
      return false;
    },
    canAccess: async () => true,
    filterAllowed: async (_user: AccessTokenPayload, resources: unknown[]) => resources,
    filterAllowedInspections: async (_user: AccessTokenPayload, resources: unknown[]) => resources,
  } as unknown as ResourceScopeService;

  const inspections = {
    findOneBy: async () => null,
  } as unknown as Repository<InspectionEntity>;
  const incidents = {
    findOneBy: async () => null,
  } as unknown as Repository<IncidentEntity>;

  const interceptor = new ResourceScopeInterceptor(scope, inspections, incidents);
  const request = {
    user: contractorToken,
    method: 'POST',
    originalUrl: '/api/inspections',
    body: { companyId: 'company-1', areaId: 'area-2' },
  };
  const response = {
    id: 'inspection-1',
    companyId: 'company-1',
    areaId: 'area-2',
  };
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
  const next = {
    handle: () => of(response),
  } as CallHandler;

  const result = await lastValueFrom(interceptor.intercept(context, next));

  assert(result === response, 'The interceptor must preserve the inspection creation response');
  assert(creationChecks === 2, 'The interceptor must apply creation scope to request and response');
  assert(generalInspectionChecks === 0, 'The interceptor must not apply general area scope to inspection creation');
}

async function main(): Promise<void> {
  await verifyCreationScopeService();
  await verifyCreationScopeInterceptor();
  console.log('Inspection creation scope smoke test passed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
