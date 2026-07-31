import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Observable } from 'rxjs';
import { Repository } from 'typeorm';
import { InspectionLegacyImportEntity } from './entities/inspection-legacy-import.entity';

interface InspectionMutationRequest {
  method?: string;
  originalUrl?: string;
  params?: Record<string, string | undefined>;
}

@Injectable()
export class InspectionLegacyReadOnlyInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(InspectionLegacyImportEntity)
    private readonly legacyImports: Repository<InspectionLegacyImportEntity>,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<InspectionMutationRequest>();
    if (!this.isInspectionMutation(request)) return next.handle();

    const inspectionId = request.params?.inspectionId ?? request.params?.id ?? null;
    if (!inspectionId || !this.isUuid(inspectionId)) return next.handle();

    const isLegacy = await this.legacyImports.exists({ where: { inspectionId } });
    if (isLegacy) {
      throw new ForbiddenException(
        'Las inspecciones restauradas desde fuentes históricas son de sólo lectura',
      );
    }

    return next.handle();
  }

  private isInspectionMutation(request: InspectionMutationRequest): boolean {
    const method = request.method?.toUpperCase() ?? 'GET';
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return false;
    const url = request.originalUrl ?? '';
    return /(?:^|\/)inspections(?:\/|$)/.test(url);
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}
