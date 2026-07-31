import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { InspectionsModule } from '../modules/inspections/inspections.module';

export function setupSwaggerDocumentation(app: INestApplication, config: ConfigService): void {
  const enabled = config.get<boolean>('swagger.enabled') ?? false;
  if (!enabled) return;

  const path = config.get<string>('swagger.path') ?? 'docs';
  const documentConfig = new DocumentBuilder()
    .setTitle('AurelIA API')
    .setDescription(
      'Documentación técnica de la API de AurelIA. La primera iteración cubre el módulo de Inspecciones.',
    )
    .setVersion('0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token de acceso obtenido mediante el endpoint de autenticación.',
      },
      'bearer',
    )
    .addTag('Inspecciones', 'Creación, consulta, actualización y cierre de inspecciones y observaciones.')
    .addTag('Inspecciones · Procesos', 'Reenvío de evidencias y validaciones asistidas por IA.')
    .addTag('Inspecciones · Dashboard', 'KPIs, tablas, gráficos y exportaciones de gestión.')
    .addTag('Inspecciones · Historial', 'Consulta de inspecciones cerradas e indicadores históricos.')
    .addTag('Inspecciones · Evidencias y comentarios', 'Evidencias, comentarios y exportaciones por inspección.')
    .addTag('Inspecciones · Catálogos', 'Tipos, severidades y catálogos de criticidad.')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, documentConfig, {
    include: [InspectionsModule],
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
