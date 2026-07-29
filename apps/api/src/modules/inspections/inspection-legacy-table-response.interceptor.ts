import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { InspectionManagementTableResponse } from '@aurelia/contracts';
import { mergeMap, type Observable } from 'rxjs';
import { InspectionLegacyTableProjectionService } from './inspection-legacy-table-projection.service';

interface InspectionTableRequest {
  method?: string;
  originalUrl?: string;
}

@Injectable()
export class InspectionLegacyTableResponseInterceptor implements NestInterceptor {
  constructor(
    private readonly legacyProjection: InspectionLegacyTableProjectionService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<InspectionTableRequest>();
    if (!this.isTableRequest(request)) return next.handle();

    return next.handle().pipe(
      mergeMap((response: InspectionManagementTableResponse) => this.legacyProjection.project(response)),
    );
  }

  private isTableRequest(request: InspectionTableRequest): boolean {
    if (request.method?.toUpperCase() !== 'GET') return false;
    const url = request.originalUrl ?? '';
    return /(?:^|\/)inspections\/(?:dashboard\/management-table|history\/table)(?:\?|$)/.test(url);
  }
}
