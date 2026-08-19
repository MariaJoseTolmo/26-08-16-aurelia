import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, catchError, from, mergeMap, throwError } from 'rxjs';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { getRequestId } from '../../shared/security/request-id.middleware';
import { AuditService } from './audit.service';

type AuditRule = {
  method: string;
  pattern: RegExp;
  action: string;
  entityType?: string;
};

const rules: AuditRule[] = [
  { method: 'POST', pattern: /^\/api\/auth\/login$/, action: 'auth.login' },
  { method: 'POST', pattern: /^\/api\/auth\/refresh$/, action: 'auth.refresh' },
  { method: 'POST', pattern: /^\/api\/auth\/logout$/, action: 'auth.logout' },
  { method: 'POST', pattern: /^\/api\/auth\/logout-all$/, action: 'auth.logout_all' },
  { method: 'GET', pattern: /^\/api\/mobile\/sync(?:\/.*)?$/, action: 'mobile.sync' },
  { method: 'POST', pattern: /^\/api\/mobile\/sync$/, action: 'mobile.sync' },
  { method: 'POST', pattern: /^\/api\/inspections(?:\/.*)?$/, action: 'inspection.created', entityType: 'inspection' },
  { method: 'PATCH', pattern: /^\/api\/inspections(?:\/.*)?$/, action: 'inspection.updated', entityType: 'inspection' },
  { method: 'POST', pattern: /^\/api\/incidents(?:\/.*)?$/, action: 'incident.created', entityType: 'incident' },
  { method: 'PATCH', pattern: /^\/api\/incidents(?:\/.*)?$/, action: 'incident.updated', entityType: 'incident' },
  { method: 'POST', pattern: /^\/api\/spr\/monthly-records\/[^/]+\/submit$/, action: 'spr.submitted', entityType: 'spr_record' },
  { method: 'POST', pattern: /^\/api\/spr\/monthly-records\/[^/]+\/approve$/, action: 'spr.approved', entityType: 'spr_record' },
  { method: 'POST', pattern: /^\/api\/spr\/monthly-records\/[^/]+\/reject$/, action: 'spr.rejected', entityType: 'spr_record' },
  { method: 'PATCH', pattern: /^\/api\/evidences\/[^/]+\/validate$/, action: 'evidence.validated' },
];

@Injectable()
export class AuditHttpInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<AuthenticatedRequest & Request>();
    const response = http.getResponse<Response>();
    const rule = this.resolveRule(request);

    if (!rule) return next.handle();

    const startedAt = Date.now();

    return next.handle().pipe(
      mergeMap(async (body) => {
        await this.writeAudit(request, response, rule, 'success', Date.now() - startedAt);
        return body;
      }),
      catchError((err: unknown) => from(
        this.writeAudit(request, response, rule, 'failed', Date.now() - startedAt, err),
      ).pipe(mergeMap(() => throwError(() => err)))),
    );
  }

  private resolveRule(request: Request): AuditRule | null {
    const path = request.originalUrl.split('?')[0];
    return rules.find((rule) => rule.method === request.method && rule.pattern.test(path)) ?? null;
  }

  private async writeAudit(
    request: AuthenticatedRequest & Request,
    response: Response,
    rule: AuditRule,
    outcome: 'success' | 'failed',
    durationMs: number,
    err?: unknown,
  ): Promise<void> {
    const path = request.originalUrl.split('?')[0];
    const requestId = getRequestId(request);
    const userAgentHeader = request.headers['user-agent'];
    const userAgent = Array.isArray(userAgentHeader) ? userAgentHeader[0] : userAgentHeader;
    const statusCode = err instanceof HttpException ? err.getStatus() : response.statusCode;
    const actorUserId = request.user?.sub;
    const entityId = typeof request.params?.id === 'string' ? request.params.id : undefined;
    const errorName = err instanceof Error ? err.constructor.name : null;

    await this.auditService.logSafe({
      entityType: rule.entityType,
      entityId,
      actorUserId,
      action: `${rule.action}.${outcome}`,
      metadata: {
        requestId,
        method: request.method,
        path,
        statusCode,
        durationMs,
        errorName,
      },
      ipAddress: request.ip,
      userAgent,
    });
  }
}
