import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { setupSwaggerDocumentation } from './config/swagger';
import { ResourceScopeInterceptor } from './modules/access-control/resource-scope.interceptor';
import { ResourceScopeService } from './modules/access-control/resource-scope.service';
import { IncidentEntity } from './modules/incidents/entities/incident.entity';
import { InspectionEntity } from './modules/inspections/entities/inspection.entity';
import { UserEntity } from './modules/users/entities/user.entity';
import {
  createRateLimit,
  DatabaseRateLimitStore,
  MemoryRateLimitStore,
  securityHeaders,
} from './shared/security/http-security';
import { requestIdMiddleware } from './shared/security/request-id.middleware';
import { SanitizedExceptionFilter } from './shared/security/sanitized-exception.filter';

function createRateLimitStore(config: ConfigService, dataSource: DataSource) {
  const store = config.get<'memory' | 'database'>('security.rateLimitStore');
  if (store === 'database') return new DatabaseRateLimitStore(dataSource);
  return new MemoryRateLimitStore();
}

function createResourceScopeInterceptor(dataSource: DataSource): ResourceScopeInterceptor {
  return new ResourceScopeInterceptor(
    new ResourceScopeService(dataSource.getRepository(UserEntity)),
    dataSource.getRepository(InspectionEntity),
    dataSource.getRepository(IncidentEntity),
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.use(requestIdMiddleware);
  app.use(securityHeaders);

  const config = app.get(ConfigService);
  const dataSource = app.get(DataSource);
  const corsOrigins = config.get<string[]>('cors.origins');
  const rateLimitWindowMs = config.get<number>('security.rateLimitWindowMs');
  const rateLimitMax = config.get<number>('security.rateLimitMax');
  const port = config.get<number>('port');

  if (!corsOrigins?.length) throw new Error('Missing validated cors.origins configuration');
  if (!rateLimitWindowMs) throw new Error('Missing validated security.rateLimitWindowMs configuration');
  if (!rateLimitMax) throw new Error('Missing validated security.rateLimitMax configuration');
  if (!port) throw new Error('Missing validated port configuration');

  app.use(createRateLimit({
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
    store: createRateLimitStore(config, dataSource),
  }));

  app.useGlobalFilters(new SanitizedExceptionFilter());
  app.useGlobalInterceptors(createResourceScopeInterceptor(dataSource));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  setupSwaggerDocumentation(app, config);
  await app.listen(port);
}

void bootstrap();
