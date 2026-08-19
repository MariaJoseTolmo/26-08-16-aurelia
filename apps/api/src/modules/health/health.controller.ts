import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { HealthService, SchemaStatusResponse } from './health.service';

interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('schema')
  async schemaStatus(): Promise<SchemaStatusResponse> {
    return this.healthService.getSchemaStatus();
  }
}
