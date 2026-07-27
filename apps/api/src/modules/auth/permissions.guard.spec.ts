import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { REQUIRED_ANY_PERMISSIONS_KEY } from './require-any-permissions.decorator';
import { REQUIRED_PERMISSIONS_KEY } from './require-permissions.decorator';

function contextFor(user: { roles: string[]; permissions: string[] }): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class TestController {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function reflectorFor(input: { required?: string[]; any?: string[]; isPublic?: boolean }): Reflector {
  return {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === 'isPublic') return input.isPublic ?? false;
      if (key === REQUIRED_PERMISSIONS_KEY) return input.required ?? [];
      if (key === REQUIRED_ANY_PERMISSIONS_KEY) return input.any ?? [];
      return undefined;
    }),
  } as unknown as Reflector;
}

describe('PermissionsGuard', () => {
  it('permite cuando se cumplen todos los permisos obligatorios y uno alternativo', () => {
    const guard = new PermissionsGuard(reflectorFor({
      required: ['inspections:read'],
      any: ['inspections:execute', 'inspections:review'],
    }));

    expect(guard.canActivate(contextFor({
      roles: ['INSPECTION_CLOSURE_VERIFIER'],
      permissions: ['inspections:read', 'inspections:review'],
    }))).toBe(true);
  });

  it('rechaza cuando falta la capacidad alternativa', () => {
    const guard = new PermissionsGuard(reflectorFor({
      required: ['inspections:read'],
      any: ['inspections:execute', 'inspections:review'],
    }));

    expect(() => guard.canActivate(contextFor({
      roles: ['VIEWER'],
      permissions: ['inspections:read'],
    }))).toThrow(ForbiddenException);
  });

  it('rechaza cuando existe capacidad alternativa pero falta un permiso obligatorio', () => {
    const guard = new PermissionsGuard(reflectorFor({
      required: ['comments:write'],
      any: ['inspections:execute', 'inspections:review'],
    }));

    expect(() => guard.canActivate(contextFor({
      roles: ['INSPECTION_RESPONSIBLE'],
      permissions: ['inspections:execute'],
    }))).toThrow(ForbiddenException);
  });

  it('permite al rol ADMIN sin enumerar capacidades', () => {
    const guard = new PermissionsGuard(reflectorFor({
      required: ['inspections:read'],
      any: ['inspections:admin'],
    }));

    expect(guard.canActivate(contextFor({ roles: ['ADMIN'], permissions: [] }))).toBe(true);
  });

  it('permite endpoints públicos sin sesión', () => {
    const guard = new PermissionsGuard(reflectorFor({
      isPublic: true,
      required: ['notifications:read'],
    }));

    expect(guard.canActivate(contextFor({ roles: [], permissions: [] }))).toBe(true);
  });
});
