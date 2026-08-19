import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from './authenticated-request';
import { IS_PUBLIC_KEY } from './public.decorator';
import { REQUIRED_ANY_PERMISSIONS_KEY } from './require-any-permissions.decorator';
import { REQUIRED_PERMISSIONS_KEY } from './require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [];
    const requiredAnyPermissions = this.reflector.getAllAndOverride<string[]>(REQUIRED_ANY_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [];

    if (requiredPermissions.length === 0 && requiredAnyPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const permissions = request.user.permissions ?? [];
    const isAdmin = request.user.roles?.includes('ADMIN') ?? false;
    if (isAdmin) return true;

    const hasAllPermissions = requiredPermissions.every((permission) => permissions.includes(permission));
    const hasAnyPermission = requiredAnyPermissions.length === 0
      || requiredAnyPermissions.some((permission) => permissions.includes(permission));

    if (!hasAllPermissions || !hasAnyPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
