import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { getRequestId } from '../../shared/security/request-id.middleware';

const MUTATION_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const REDACTED_KEYS = new Set([
  'password',
  'credential',
  'token',
  'accessToken',
  'refreshToken',
  'content',
  'base64',
]);

@Injectable()
export class InspectionMutationAuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    if (!this.shouldAudit(request)) return next.handle();

    const startedAt = Date.now();
    const entityId = this.resolveEntityId(request.params);
    const action = this.resolveAction(request.method, request.route?.path, request.path);
    const requestedChanges = this.sanitize(request.body);

    return next.handle().pipe(
      tap((result) => {
        void this.audit.logSafe({
          entityType: this.resolveEntityType(request.path),
          entityId,
          actorUserId: request.user?.sub,
          action,
          newValue: this.sanitize(result),
          metadata: {
            requestId: getRequestId(request),
            method: request.method,
            path: request.originalUrl,
            statusCode: response.statusCode,
            durationMs: Date.now() - startedAt,
            requestedChanges,
          },
        });
      }),
    );
  }

  private shouldAudit(request: AuthenticatedRequest): boolean {
    if (!MUTATION_METHODS.has(request.method.toUpperCase())) return false;
    return request.path.startsWith('/inspections') || request.originalUrl.includes('/api/inspections');
  }

  private resolveEntityId(params: Record<string, string | string[] | undefined>): string | undefined {
    const value = params.findingId
      ?? params.followupId
      ?? params.assessmentId
      ?? params.inspectionId
      ?? params.id;
    return Array.isArray(value) ? value[0] : value;
  }

  private resolveEntityType(path: string): string {
    if (path.includes('/ai/assessments')) return 'inspection_ai_assessment';
    if (path.includes('/findings/')) return 'inspection_finding';
    if (path.includes('/followups/')) return 'inspection_followup';
    return 'inspection';
  }

  private resolveAction(method: string, routePath?: string, requestPath?: string): string {
    const normalizedPath = String(routePath ?? requestPath ?? '')
      .replace(/:[A-Za-z0-9_]+/g, ':id')
      .replace(/\/+/, '/');
    return `inspection.http.${method.toLowerCase()}.${normalizedPath}`;
  }

  private sanitize(value: unknown, depth = 0): Record<string, unknown> | null {
    if (value === null || value === undefined) return null;
    if (depth > 5) return { truncated: true };
    if (Array.isArray(value)) {
      return { items: value.slice(0, 50).map((item) => this.sanitizeValue(item, depth + 1)) };
    }
    if (typeof value !== 'object') return { value };

    const output: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).slice(0, 100).forEach(([key, item]) => {
      output[key] = REDACTED_KEYS.has(key) ? '[REDACTED]' : this.sanitizeValue(item, depth + 1);
    });
    return output;
  }

  private sanitizeValue(value: unknown, depth: number): unknown {
    if (value === null || value === undefined) return value;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value.length > 4000 ? `${value.slice(0, 4000)}…` : value;
    if (typeof value !== 'object') return value;
    return this.sanitize(value, depth);
  }
}
