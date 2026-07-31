import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

function main(): void {
  const packageJson = read('package.json');
  const mainSource = read('src/main.ts');
  const swaggerSource = read('src/config/swagger.ts');
  const envSource = read('src/config/env.ts');
  const nestCli = read('nest-cli.json');
  const metadataSource = read('src/modules/inspections/inspection-openapi.metadata.ts');

  assert(packageJson.includes('"@nestjs/swagger"'), 'API package must depend on @nestjs/swagger');
  assert(packageJson.includes('"test:swagger"'), 'API package must expose the Swagger smoke script');
  assert(mainSource.includes('setupSwaggerDocumentation(app, config)'), 'API bootstrap must mount Swagger');
  assert(swaggerSource.includes('include: [InspectionsModule]'), 'First OpenAPI iteration must be limited to InspectionsModule');
  assert(swaggerSource.includes("addBearerAuth("), 'Swagger document must define Bearer JWT authentication');
  assert(swaggerSource.includes('useGlobalPrefix: true'), 'Swagger UI must respect the /api global prefix');
  assert(envSource.includes("source.NODE_ENV !== 'production'"), 'Swagger must default to disabled in production');
  assert(nestCli.includes('@nestjs/swagger/plugin'), 'Nest Swagger CLI plugin must generate DTO schemas');

  [
    'InspectionsController',
    'InspectionProcessController',
    'InspectionDashboardController',
    'InspectionHistoryController',
    'InspectionTransversalController',
    'InspectionFindingCatalogController',
    'InspectionCriticalityCatalogController',
  ].forEach((controller) => {
    assert(metadataSource.includes(controller), `${controller} must be registered in OpenAPI metadata`);
  });

  assert(metadataSource.includes("'reassignFindingSla'"), 'SLA reassignment endpoint must be documented');
  assert(metadataSource.includes("'exportManagementTableXlsx'"), 'XLSX export endpoint must be documented');
  assert(metadataSource.includes("'getExportPdf'"), 'PDF export endpoint must be documented');
  assert(metadataSource.includes("enum: ['Checklist', 'Hallazgo']"), 'Inspection type filter must be documented');

  console.log('Swagger inspections smoke test passed');
}

main();
