import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import '../modules/auth/auth-openapi.metadata';
import { AuthModule } from '../modules/auth/auth.module';
import '../modules/inspections/inspection-openapi.metadata';
import '../modules/inspections/inspection-openapi.responses';
import { InspectionsModule } from '../modules/inspections/inspections.module';

export function setupSwaggerDocumentation(app: INestApplication, config: ConfigService): void {
  const enabled = config.get<boolean>('swagger.enabled') ?? false;
  if (!enabled) return;

  const path = config.get<string>('swagger.path') ?? 'docs';
  const documentConfig = new DocumentBuilder()
    .setTitle('AurelIA API')
    .setDescription(
      'Documentación técnica de la API de AurelIA. Esta iteración cubre autenticación y el módulo de Inspecciones con modelos de respuesta tipados.',
    )
    .setVersion('0.2.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token de acceso obtenido mediante POST /api/auth/login.',
      },
      'bearer',
    )
    .addTag('Autenticación', 'Inicio, renovación y cierre de sesiones, tickets embebidos y usuario autenticado.')
    .addTag('Inspecciones', 'Creación, consulta, actualización y cierre de inspecciones y observaciones.')
    .addTag('Inspecciones · Procesos', 'Reenvío de evidencias y validaciones asistidas por IA.')
    .addTag('Inspecciones · Dashboard', 'KPIs, tablas, gráficos y exportaciones de gestión.')
    .addTag('Inspecciones · Historial', 'Consulta de inspecciones cerradas e indicadores históricos.')
    .addTag('Inspecciones · Evidencias y comentarios', 'Evidencias, comentarios y exportaciones por inspección.')
    .addTag('Inspecciones · Catálogos', 'Tipos, severidades y catálogos de criticidad.')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, documentConfig, {
    include: [AuthModule, InspectionsModule],
    operationIdFactory: (controllerKey, methodKey) => `${controllerKey}_${methodKey}`,
  });

  SwaggerModule.setup(path, app, documentFactory, {
    useGlobalPrefix: true,
    customSiteTitle: 'AurelIA API · Swagger',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
