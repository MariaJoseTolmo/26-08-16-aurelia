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
  const inspectionMetadata = read('src/modules/inspections/inspection-openapi.metadata.ts');
  const inspectionResponses = read('src/modules/inspections/inspection-openapi.responses.ts');
  const inspectionModels = read('src/modules/inspections/inspection-openapi.models.ts');
  const authMetadata = read('src/modules/auth/auth-openapi.metadata.ts');
  const authModels = read('src/modules/auth/auth-openapi.models.ts');
  const errorModel = read('src/openapi/http-error-openapi.model.ts');

  assert(packageJson.includes('"@nestjs/swagger"'), 'API package must depend on @nestjs/swagger');
  assert(packageJson.includes('"test:swagger"'), 'API package must expose the Swagger smoke script');
  assert(mainSource.includes('setupSwaggerDocumentation(app, config)'), 'API bootstrap must mount Swagger');
  assert(
    swaggerSource.includes('include: [AuthModule, InspectionsModule]'),
    'OpenAPI document must include authentication and inspections modules',
  );
  assert(swaggerSource.includes("import '../modules/auth/auth-openapi.metadata'"), 'Swagger must load auth metadata');
  assert(
    swaggerSource.includes("import '../modules/inspections/inspection-openapi.responses'"),
    'Swagger must load typed inspection response metadata',
  );
  assert(swaggerSource.includes("addTag('Autenticación'"), 'Swagger must expose the authentication tag');
  assert(swaggerSource.includes('addBearerAuth('), 'Swagger document must define Bearer JWT authentication');
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
    assert(inspectionMetadata.includes(controller), `${controller} must be registered in OpenAPI metadata`);
  });

  assert(inspectionMetadata.includes("'reassignFindingSla'"), 'SLA reassignment endpoint must be documented');
  assert(inspectionMetadata.includes("'exportManagementTableXlsx'"), 'XLSX export endpoint must be documented');
  assert(inspectionMetadata.includes("'getExportPdf'"), 'PDF export endpoint must be documented');
  assert(inspectionMetadata.includes("enum: ['Checklist', 'Hallazgo']"), 'Inspection type filter must be documented');

  [
    'InspectionOpenApiModel',
    'InspectionFindingOpenApiModel',
    'InspectionAssignmentScopeOpenApiModel',
    'InspectionDashboardSummaryOpenApiModel',
    'InspectionManagementTableOpenApiModel',
    'InspectionDetailOpenApiModel',
    'InspectionFindingSlaReassignmentOpenApiModel',
  ].forEach((model) => {
    assert(inspectionModels.includes(`class ${model}`), `${model} must define a typed OpenAPI schema`);
    assert(inspectionResponses.includes(model), `${model} must be bound to an inspection operation`);
  });

  assert(
    inspectionResponses.includes("'getDetail'")
      && inspectionResponses.includes('type: InspectionDetailOpenApiModel'),
    'Inspection detail endpoint must use the typed detail schema',
  );
  assert(
    inspectionResponses.includes("'getManagementTable'")
      && inspectionResponses.includes('type: InspectionManagementTableOpenApiModel'),
    'Management table endpoint must use the typed paginated schema',
  );
  assert(
    inspectionModels.includes('slaReassignments?: InspectionFindingSlaReassignmentOpenApiModel[]'),
    'Inspection detail schema must expose SLA reassignment milestones',
  );
  assert(
    inspectionModels.includes('legacy?: InspectionDetailLegacySummaryOpenApiModel | null'),
    'Inspection detail schema must describe optional legacy projection data',
  );

  ['login', 'renew', 'createIframeTicket', 'exchangeIframeTicket', 'logout', 'logoutAll', 'getMe'].forEach((method) => {
    assert(authMetadata.includes(`'${method}'`), `AuthController.${method} must be documented`);
  });
  assert(authMetadata.includes('ApiBody({ type: LoginOpenApiRequest })'), 'Login request body must be typed');
  assert(authMetadata.includes('type: LoginOpenApiResponse'), 'Login response must be typed');
  assert(authMetadata.includes("ApiBearerAuth('bearer')"), 'Protected auth operations must declare Bearer JWT');
  assert(authModels.includes('class LoginOpenApiResponse'), 'Login response model must exist');
  assert(authModels.includes('class MeOpenApiResponse'), 'Authenticated user response model must exist');

  ['statusCode', 'message', 'error', 'path', 'timestamp', 'requestId'].forEach((field) => {
    assert(errorModel.includes(field), `Shared OpenAPI error model must expose ${field}`);
  });

  console.log('Swagger authentication and inspections smoke test passed');
}

main();
