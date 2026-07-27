import { ForbiddenException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { AccessTokenPayload } from '../auth/jwt-token.service';
import type { UserEntity } from '../users/entities/user.entity';
import { ResourceScopeService } from './resource-scope.service';

const baseToken: AccessTokenPayload = {
  sub: 'user-1',
  email: 'responsable@contratista.cl',
  fullName: 'Responsable Contratista',
  roles: ['INSPECTION_RESPONSIBLE'],
  permissions: ['inspections:read', 'inspections:execute'],
  iat: 1,
  exp: 9_999_999_999,
};

function userRow(input: {
  companyId?: string | null;
  areaId?: string | null;
  principal?: boolean;
}): UserEntity {
  const companyId = input.companyId ?? null;
  const areaId = input.areaId ?? null;
  return {
    id: baseToken.sub,
    isActive: true,
    companyId,
    areaId,
    company: companyId ? {
      id: companyId,
      name: input.principal ? 'Gold Fields' : 'Contratista Uno',
      code: input.principal ? 'CORP' : 'EECC-1',
      isContractor: !input.principal,
    } : null,
    userCompanies: [],
    userAreas: areaId ? [{ area: { id: areaId } }] : [],
  } as unknown as UserEntity;
}

function serviceWith(row: UserEntity | null): ResourceScopeService {
  const repository = {
    findOne: jest.fn().mockResolvedValue(row),
  } as unknown as Repository<UserEntity>;
  return new ResourceScopeService(repository);
}

describe('ResourceScopeService inspection scope', () => {
  it('permite a EECC solo su compañía y área asignada', async () => {
    const service = serviceWith(userRow({ companyId: 'company-1', areaId: 'area-1' }));

    await expect(service.canAccessInspection(baseToken, {
      companyId: 'company-1',
      areaId: 'area-1',
    })).resolves.toBe(true);
    await expect(service.canAccessInspection(baseToken, {
      companyId: 'company-2',
      areaId: 'area-1',
    })).resolves.toBe(false);
    await expect(service.canAccessInspection(baseToken, {
      companyId: 'company-1',
      areaId: 'area-2',
    })).resolves.toBe(false);
  });

  it('rechaza recursos sin compañía o área cuando el scope las exige', async () => {
    const service = serviceWith(userRow({ companyId: 'company-1', areaId: 'area-1' }));

    await expect(service.canAccessInspection(baseToken, {
      companyId: null,
      areaId: 'area-1',
    })).resolves.toBe(false);
    await expect(service.canAccessInspection(baseToken, {
      companyId: 'company-1',
      areaId: null,
    })).resolves.toBe(false);
  });

  it('permite a Gold Fields cruzar compañías pero conserva el scope de área', async () => {
    const token: AccessTokenPayload = {
      ...baseToken,
      email: 'verificador@goldfields.com',
      roles: ['INSPECTION_CLOSURE_VERIFIER'],
      permissions: ['inspections:read', 'inspections:review'],
    };
    const service = serviceWith(userRow({ companyId: 'gold-fields', areaId: 'area-1', principal: true }));

    await expect(service.canAccessInspection(token, {
      companyId: 'company-2',
      areaId: 'area-1',
    })).resolves.toBe(true);
    await expect(service.canAccessInspection(token, {
      companyId: 'company-2',
      areaId: 'area-2',
    })).resolves.toBe(false);
  });

  it('rechaza usuarios inactivos o inexistentes', async () => {
    const service = serviceWith(null);
    await expect(service.canAccessInspection(baseToken, {
      companyId: 'company-1',
      areaId: 'area-1',
    })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('permite al rol ADMIN sin fila activa', async () => {
    const service = serviceWith(null);
    await expect(service.canAccessInspection({
      ...baseToken,
      roles: ['ADMIN'],
      permissions: [],
    }, {})).resolves.toBe(true);
  });
});
