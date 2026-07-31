# Swagger / OpenAPI — Autenticación e Inspecciones

## Objetivo

Esta es la segunda iteración de documentación ejecutable de la API de AurelIA.
El documento OpenAPI generado incluye:

- `AuthModule`;
- `InspectionsModule`.

Además de rutas, filtros y cuerpos de entrada, esta iteración incorpora modelos explícitos para las respuestas principales de Inspecciones y para el flujo de autenticación.

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

## Cobertura de Inspecciones

El documento incluye:

- creación, consulta, actualización y cierre de inspecciones;
- observaciones, seguimientos y reasignación de SLA;
- respuestas de checklist;
- procesos de evidencia e IA;
- dashboard y tabla de gestión;
- historial;
- exportaciones PDF y XLSX;
- evidencias y comentarios;
- catálogos de hallazgos y criticidad;
- parámetros UUID, filtros principales y formatos binarios;
- validaciones de cuerpos DTO mediante el plugin de Swagger y `class-validator`.

## Modelos tipados incorporados

Las interfaces de `@aurelia/contracts` no existen en runtime. Por esta razón se agregaron clases exclusivamente documentales que reflejan los contratos vigentes sin cambiar las respuestas del backend.

Los schemas principales son:

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
apps/api/src/modules/inspections/inspection-openapi.responses.ts
apps/api/src/modules/inspections/inspection-openapi.models.ts
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
7. Abrir `GET /api/inspections/{id}/detail` y comprobar que muestre schemas anidados, SLA y datos legacy.
8. Abrir las tablas de gestión e historial y comprobar el schema paginado.
9. Confirmar que PDF y XLSX aparezcan como descargas binarias.
10. Confirmar que las rutas de otros módulos todavía no aparezcan.

## Limitaciones actuales

Todavía quedan respuestas secundarias documentadas como objetos genéricos, especialmente:

- catálogos completos;
- comentarios y evidencias;
- evaluaciones de IA;
- respuestas individuales de checklist;
- seguimientos;
- gráficos y análisis por empresa;
- KPIs de gestión e historial.

Esto no cambia el contrato real ni el comportamiento de los endpoints; sólo limita el detalle visual disponible en Swagger para esas operaciones.

## Próximas iteraciones sugeridas

1. Modelar las respuestas secundarias restantes de Inspecciones.
2. Agregar ejemplos anonimizados por operación y escenarios de error.
3. Versionar una copia estática de OpenAPI JSON como artefacto de CI.
4. Incorporar validación de breaking changes del contrato OpenAPI.
5. Documentar gradualmente Incidentes, SPR, Residuos y los demás módulos.
