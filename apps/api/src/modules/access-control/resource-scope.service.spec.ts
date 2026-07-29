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

describe('ResourceScopeService inspection access scope', () => {
  it('mantiene para EECC el acceso general restringido por compañía y área', async () => {
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

  it('rechaza recursos sin compañía o área cuando el scope general las exige', async () => {
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

  it('mantiene para Gold Fields el acceso general entre compañías con scope de área', async () => {
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
});

describe('ResourceScopeService inspection creation scope', () => {
  it('permite a EECC crear en cualquier área de su compañía', async () => {
    const service = serviceWith(userRow({ companyId: 'company-1', areaId: 'area-1' }));

    await expect(service.canCreateInspection(baseToken, {
      companyId: 'company-1',
      areaId: 'area-2',
    })).resolves.toBe(true);
    await expect(service.canCreateInspection(baseToken, {
      companyId: 'company-1',
      areaId: null,
    })).resolves.toBe(true);
  });

  it('rechaza a EECC cuando la empresa solicitada no pertenece a su scope', async () => {
    const service = serviceWith(userRow({ companyId: 'company-1', areaId: 'area-1' }));

    await expect(service.canCreateInspection(baseToken, {
      companyId: 'company-2',
      areaId: 'area-1',
    })).resolves.toBe(false);
  });

  it('permite resolver la empresa primaria cuando el cliente no envía companyId', async () => {
    const service = serviceWith(userRow({ companyId: 'company-1', areaId: 'area-1' }));

    await expect(service.canCreateInspection(baseToken, {
      companyId: null,
      areaId: 'area-2',
    })).resolves.toBe(true);
  });

  it('permite a Gold Fields crear para cualquier empresa y cualquier área', async () => {
    const token: AccessTokenPayload = {
      ...baseToken,
      email: 'supervisor.medioambiente@goldfields.com',
      roles: ['INSPECTOR'],
      permissions: ['inspections:create'],
    };
    const service = serviceWith(userRow({ companyId: 'gold-fields', areaId: 'medio-ambiente', principal: true }));

    await expect(service.canCreateInspection(token, {
      companyId: 'company-2',
      areaId: 'area-99',
    })).resolves.toBe(true);
    await expect(service.canCreateInspection(token, {
      companyId: null,
      areaId: null,
    })).resolves.toBe(true);
  });

  it('rechaza usuarios sin empresa asignada cuando no son Gold Fields ni ADMIN', async () => {
    const service = serviceWith(userRow({ companyId: null, areaId: 'area-1' }));

    await expect(service.canCreateInspection(baseToken, {
      companyId: 'company-1',
      areaId: 'area-1',
    })).resolves.toBe(false);
  });

  it('rechaza usuarios inactivos o inexistentes', async () => {
    const service = serviceWith(null);
    await expect(service.canCreateInspection(baseToken, {
      companyId: 'company-1',
      areaId: 'area-1',
    })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('permite al rol ADMIN sin fila activa', async () => {
    const service = serviceWith(null);
    await expect(service.canCreateInspection({
      ...baseToken,
      roles: ['ADMIN'],
      permissions: [],
    }, {})).resolves.toBe(true);
  });
});
