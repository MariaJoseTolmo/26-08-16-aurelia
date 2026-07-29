import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { InspectionDetailResponse } from '@aurelia/contracts';
import { mergeMap, type Observable } from 'rxjs';
import { InspectionLegacyDetailProjectionService } from './inspection-legacy-detail-projection.service';

interface InspectionDetailRequest {
  method?: string;
  originalUrl?: string;
  params?: Record<string, string | undefined>;
}

@Injectable()
export class InspectionLegacyDetailResponseInterceptor implements NestInterceptor {
  constructor(
    private readonly legacyProjection: InspectionLegacyDetailProjectionService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<InspectionDetailRequest>();
    const inspectionId = request.params?.id ?? null;
    if (!this.isDetailRequest(request, inspectionId)) return next.handle();

    return next.handle().pipe(
      mergeMap(async (detail: InspectionDetailResponse) => ({
        ...detail,
        legacy: await this.legacyProjection.getSummary(inspectionId as string),
      })),
    );
  }

  private isDetailRequest(
    request: InspectionDetailRequest,
    inspectionId: string | null,
  ): inspectionId is string {
    if (request.method?.toUpperCase() !== 'GET') return false;
    if (!inspectionId || !this.isUuid(inspectionId)) return false;
    return /(?:^|\/)inspections\/[^/]+\/detail(?:\?|$)/.test(request.originalUrl ?? '');
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}
