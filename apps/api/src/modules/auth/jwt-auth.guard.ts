import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { JwtTokenService } from './jwt-token.service';
import { IS_PUBLIC_KEY } from './public.decorator';

type AuthenticatedHttpRequest = Request & { user?: unknown };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedHttpRequest>();
    const token = this.extractBearerToken(request);
    request.user = this.jwtTokenService.verify(token);
    return true;
  }

  private extractBearerToken(request: Request): string {
    const header = request.headers.authorization;
    if (!header) throw new UnauthorizedException('Missing authorization header');
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) throw new UnauthorizedException('Invalid authorization header');
    return token;
  }
}
