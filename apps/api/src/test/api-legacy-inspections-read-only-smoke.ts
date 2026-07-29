import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { of } from 'rxjs';
import type { Repository } from 'typeorm';
import { InspectionLegacyImportEntity } from '../modules/inspection-legacy-import/entities/inspection-legacy-import.entity';
import { InspectionLegacyReadOnlyInterceptor } from '../modules/inspection-legacy-import/inspection-legacy-read-only.interceptor';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function contextFor(request: {
  method: string;
  originalUrl: string;
  params: Record<string, string>;
}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}

async function main(): Promise<void> {
  const legacyId = '11111111-1111-4111-8111-111111111111';
  const nativeId = '22222222-2222-4222-8222-222222222222';
  const repository = {
    exists: async ({ where }: { where: { inspectionId: string } }) => where.inspectionId === legacyId,
  } as unknown as Repository<InspectionLegacyImportEntity>;
  const interceptor = new InspectionLegacyReadOnlyInterceptor(repository);
  const next: CallHandler = { handle: () => of('allowed') };

  const read = await interceptor.intercept(contextFor({
    method: 'GET',
    originalUrl: `/api/inspections/${legacyId}/detail`,
    params: { id: legacyId },
  }), next);
  assert(Boolean(read), 'Legacy reads should be allowed');

  const nativeMutation = await interceptor.intercept(contextFor({
    method: 'PATCH',
    originalUrl: `/api/inspections/${nativeId}`,
    params: { id: nativeId },
  }), next);
  assert(Boolean(nativeMutation), 'Native inspection mutations should remain allowed');

  let rejected = false;
  try {
    await interceptor.intercept(contextFor({
      method: 'POST',
      originalUrl: `/api/inspections/${legacyId}/findings`,
      params: { id: legacyId },
    }), next);
  } catch (error) {
    rejected = error instanceof ForbiddenException;
  }
  assert(rejected, 'Legacy inspection mutation should be rejected');

  console.log('Legacy inspections read-only smoke test passed');
}

void main();
