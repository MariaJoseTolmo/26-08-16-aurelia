import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request';

@Injectable()
export class DatabaseMaintenanceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const roles = request.user?.roles ?? [];

    if (!roles.includes('ADMIN')) {
      throw new ForbiddenException('Database maintenance requires ADMIN role');
    }

    return true;
  }
}
