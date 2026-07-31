# Swagger / OpenAPI — Autenticación e Inspecciones

## Objetivo

Esta es la tercera iteración de documentación ejecutable de la API de AurelIA.
El documento OpenAPI generado incluye:

- `AuthModule`;
- `InspectionsModule`.

Además de rutas, filtros y cuerpos de entrada, la documentación contiene modelos explícitos para las respuestas principales y secundarias del módulo de Inspecciones.

Estas clases son exclusivamente documentales: implementan los contratos de `@aurelia/contracts`, pero no modifican los payloads ni la lógica del backend.

## Acceso local

Con la API levantada en el puerto `3000`:

- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/docs-json`
- OpenAPI YAML: `http://localhost:3000/api/docs-yaml`

La ruta puede cambiarse mediante `SWAGGER_PATH`. El valor se interpreta relativo al prefijo global `/api`.

## Configuración

```env
SWAGGER_ENABLED=true
SWAGGER_PATH=docs
```

Reglas:

- En ambientes distintos de producción, Swagger se habilita por defecto.
- En producción, Swagger se deshabilita por defecto.
- Para habilitarlo en producción debe configurarse explícitamente `SWAGGER_ENABLED=true`.
- Para deshabilitarlo en cualquier ambiente usar `SWAGGER_ENABLED=false`.

## Autenticación desde Swagger

El tag **Autenticación** permite obtener el token sin salir de Swagger UI.

1. Ejecutar `POST /api/auth/login`.
2. Enviar correo, contraseña y aplicación cliente.
3. Copiar el campo `token` de la respuesta.
4. Presionar **Authorize**.
5. Ingresar el JWT como Bearer token.
6. Ejecutar las operaciones protegidas de Inspecciones.

Ejemplo de login:

```json
{
  "email": "inspector@goldfields.com",
  "password": "********",
  "client": "web"
}
```

La documentación también incluye:

- renovación mediante refresh token;
- generación y canje de tickets para iframe;
- cierre de la sesión actual;
- cierre de todas las sesiones;
- consulta del usuario autenticado mediante `GET /api/me`.

Swagger conserva temporalmente la autorización en el navegador mediante `persistAuthorization`.
No deben guardarse tokens reales dentro del repositorio, ejemplos versionados ni capturas públicas.

## Cobertura funcional de Inspecciones

El documento incluye:

- creación, consulta, actualización y cierre de inspecciones;
- tipos de inspección y plantillas de checklist;
- usuarios responsables disponibles;
- observaciones, respuestas de checklist y seguimientos;
- reasignación de SLA y sus hitos;
- reenvío de evidencias;
- evaluaciones y decisiones asistidas por IA;
- KPIs, tablas, gráficos y análisis por empresa;
- historial de inspecciones cerradas;
- evidencias, relaciones y comentarios;
- payload consolidado para informes;
- exportaciones PDF y XLSX;
- catálogos de hallazgos, severidades, probabilidades y consecuencias;
- parámetros UUID, filtros principales y formatos binarios;
- validaciones de cuerpos DTO mediante el plugin de Swagger y `class-validator`.

## Modelos principales

Las interfaces de `@aurelia/contracts` no existen en runtime. Por esta razón se agregaron clases OpenAPI que reflejan los contratos vigentes y permiten generar schemas anidados.

Los modelos principales son:

- `InspectionOpenApiModel`;
- `InspectionFindingOpenApiModel`;
- `InspectionAssignmentScopeOpenApiModel`;
- `InspectionDashboardSummaryOpenApiModel`;
- `InspectionManagementTableOpenApiModel`;
- `InspectionDetailOpenApiModel`;
- `InspectionFindingSlaReassignmentOpenApiModel`;
- `LoginOpenApiRequest`;
- `LoginOpenApiResponse`;
- `MeOpenApiResponse`;
- `HttpErrorOpenApiModel`.

### Detalle de inspección

`InspectionDetailOpenApiModel` documenta:

- header y contadores;
- observaciones agrupadas por estado;
- responsables;
- evidencias antes y después;
- seguimientos;
- eventos de reasignación de SLA;
- datos generales;
- resultados y secciones de checklist;
- resumen y disponibilidad de información legacy.

### Tabla de gestión e historial

`InspectionManagementTableOpenApiModel` documenta:

- paginación;
- filas;
- resumen de observaciones;
- criticidad;
- datos legacy y modo de sólo lectura;
- opciones disponibles para los filtros.

El mismo contrato se utiliza para la tabla de gestión y la tabla histórica.

## Modelos secundarios incorporados

### Catálogos y asignación

- `InspectionTypeCatalogOpenApiModel`;
- `InspectionChecklistTemplateCatalogOpenApiModel`;
- `InspectionChecklistSectionCatalogOpenApiModel`;
- `InspectionChecklistItemCatalogOpenApiModel`;
- `InspectionResponsibleUserOpenApiModel`;
- `InspectionFindingTypeCatalogOpenApiModel`;
- `InspectionFindingSeverityCatalogOpenApiModel`;
- `InspectionRiskProbabilityCatalogOpenApiModel`;
- `InspectionRiskConsequenceCatalogOpenApiModel`.

### Operación de inspecciones

- `InspectionChecklistAnswerOpenApiModel`;
- `InspectionFollowupOpenApiModel`;
- `InspectionProcessRequestOpenApiModel`;
- `InspectionAiAssessmentOpenApiModel`.

### Dashboard e historial

- `InspectionManagementKpisOpenApiModel`;
- `InspectionHistoryKpisOpenApiModel`;
- `InspectionDashboardChartsOpenApiModel`;
- `InspectionDashboardCompanyAnalysisOpenApiModel`;
- `InspectionDashboardOpenFindingsOpenApiModel`.

### Evidencias, comentarios e informes

- `EvidenceOpenApiModel`;
- `EvidenceLinkOpenApiModel`;
- `InspectionCommentOpenApiModel`;
- `InspectionExportPayloadOpenApiModel`.

El payload de exportación describe completamente sus grupos superiores y su resumen. Algunos objetos internos del informe permanecen abiertos porque combinan entidades enriquecidas exclusivamente para la generación PDF.

## Operaciones secundarias tipadas

La tercera iteración asigna respuestas explícitas a:

```text
GET  /api/inspections/types
GET  /api/inspections/templates
GET  /api/inspections/responsible-users
POST /api/inspections/:id/answers
POST /api/inspections/findings/:findingId/followups
PATCH /api/inspections/followups/:followupId

GET  /api/inspections/dashboard/management-kpis
GET  /api/inspections/dashboard/charts
GET  /api/inspections/dashboard/company-analysis
GET  /api/inspections/dashboard/open-findings
GET  /api/inspections/history/kpis

GET  /api/inspections/:id/evidences
POST /api/inspections/:id/evidences/:evidenceId/link
GET  /api/inspections/:id/comments
POST /api/inspections/:id/comments
GET  /api/inspections/:id/export

POST  /api/inspections/findings/:findingId/evidence-resubmissions
POST  /api/inspections/:inspectionId/ai/pre-validation
GET   /api/inspections/:inspectionId/ai/assessments
PATCH /api/inspections/ai/assessments/:assessmentId/decision

GET /api/inspections/finding-catalogs
GET /api/inspections/finding-catalogs/types
GET /api/inspections/finding-catalogs/severities
GET /api/inspections/finding-catalogs/risk-probabilities
GET /api/inspections/finding-catalogs/risk-consequences
```

## Errores comunes

Las respuestas `400`, `401`, `403` y `404` documentadas utilizan la forma real emitida por `SanitizedExceptionFilter`:

```json
{
  "statusCode": 400,
  "message": "Bad request",
  "error": "Bad Request",
  "path": "/api/inspections",
  "timestamp": "2026-07-30T20:45:00.000Z",
  "requestId": "c577705d-88cb-439d-a494-c58d9f041a61"
}
```

`requestId` es opcional y se incorpora cuando el middleware de correlación lo generó o recibió.

## Organización

Los endpoints se agrupan en los tags:

- `Autenticación`;
- `Inspecciones`;
- `Inspecciones · Procesos`;
- `Inspecciones · Dashboard`;
- `Inspecciones · Historial`;
- `Inspecciones · Evidencias y comentarios`;
- `Inspecciones · Catálogos`.

La configuración global se encuentra en:

```text
apps/api/src/config/swagger.ts
```

Los metadatos y modelos se encuentran en:

```text
apps/api/src/modules/auth/auth-openapi.metadata.ts
apps/api/src/modules/auth/auth-openapi.models.ts
apps/api/src/modules/inspections/inspection-openapi.metadata.ts
apps/api/src/modules/inspections/inspection-openapi.models.ts
apps/api/src/modules/inspections/inspection-openapi.responses.ts
apps/api/src/modules/inspections/inspection-openapi-secondary.models.ts
apps/api/src/modules/inspections/inspection-openapi-secondary.responses.ts
apps/api/src/openapi/http-error-openapi.model.ts
```

Los controllers no contienen imports repetidos de Swagger. Los archivos de metadatos aplican los decoradores antes de generar el documento.

## Validación

Desde la raíz del repositorio:

```bash
pnpm install --frozen-lockfile
pnpm --filter @aurelia/contracts build
pnpm --filter api test:swagger
pnpm --filter api build
pnpm --filter api lint
```

Validación manual:

1. Crear `apps/api/.env` con `SWAGGER_ENABLED=true`.
2. Ejecutar `pnpm --filter api dev`.
3. Abrir `http://localhost:3000/api/docs`.
4. Confirmar que aparezcan los tags Autenticación e Inspecciones.
5. Ejecutar `POST /api/auth/login` con un usuario de desarrollo.
6. Autorizar Swagger con el JWT retornado.
7. Abrir `GET /api/inspections/{id}/detail` y comprobar schemas anidados, SLA y datos legacy.
8. Revisar los schemas de catálogos, evidencias, comentarios y seguimientos.
9. Revisar KPIs, gráficos, análisis por empresa y observaciones abiertas.
10. Confirmar que las evaluaciones de IA y solicitudes de reenvío tengan respuestas tipadas.
11. Confirmar que PDF y XLSX aparezcan como descargas binarias.
12. Confirmar que las rutas de otros módulos todavía no aparezcan.

## Limitaciones actuales

- Algunos subobjetos del payload consolidado de exportación son estructuras enriquecidas y permanecen abiertos mediante `additionalProperties`.
- Los arreglos opcionales de roles, empresas y áreas dentro de usuarios responsables se documentan como objetos genéricos porque pertenecen a contratos organizacionales transversales.
- La documentación todavía no contiene ejemplos completos anonimizados para cada escenario de éxito y error.
- El documento OpenAPI todavía no se versiona como artefacto estático de CI ni se compara automáticamente para detectar breaking changes.
- Los módulos Incidentes, SPR, Residuos y otros módulos todavía no forman parte del documento.

## Próximas iteraciones sugeridas

1. Agregar ejemplos anonimizados por operación y escenarios de error.
2. Exportar y versionar el OpenAPI JSON como artefacto de CI.
3. Incorporar validación automática de breaking changes del contrato.
4. Modelar completamente los subobjetos enriquecidos del payload de exportación.
5. Documentar gradualmente Incidentes, SPR, Residuos y los demás módulos.
