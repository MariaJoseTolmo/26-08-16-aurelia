# Swagger / OpenAPI — módulo de Inspecciones

## Objetivo

Esta es la primera iteración de documentación ejecutable de la API de AurelIA.
El documento OpenAPI generado incluye únicamente los controllers registrados por `InspectionsModule`.

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

## Autenticación

Los endpoints de Inspecciones utilizan Bearer JWT.

1. Obtener un token mediante el flujo de autenticación de AurelIA.
2. Abrir Swagger UI.
3. Presionar **Authorize**.
4. Ingresar el token sin modificarlo.
5. Ejecutar las operaciones con los permisos y alcance del usuario autenticado.

Swagger conserva temporalmente la autorización en el navegador mediante `persistAuthorization`.

## Cobertura de esta iteración

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
- respuestas estándar 401 y 403;
- validaciones de cuerpos DTO mediante el plugin de Swagger y `class-validator`.

## Limitación conocida

Los contratos de respuesta de `@aurelia/contracts` están definidos principalmente como interfaces TypeScript.
Las interfaces no existen en runtime y Swagger no puede reflejarlas automáticamente.

En esta primera iteración las respuestas quedan documentadas con:

- descripción funcional;
- código HTTP;
- forma genérica de objeto o arreglo;
- formato binario cuando corresponde.

La siguiente iteración debe incorporar modelos OpenAPI explícitos para las respuestas más importantes:

1. `InspectionResponse`;
2. `InspectionDetailResponse`;
3. `InspectionFindingResponse`;
4. `InspectionManagementTableResponse`;
5. `InspectionDashboardSummaryResponse`;
6. respuestas de catálogos y asignación.

## Organización

Los endpoints se agrupan en los tags:

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

Los metadatos específicos de Inspecciones se encuentran en:

```text
apps/api/src/modules/inspections/inspection-openapi.metadata.ts
```

Los controllers no contienen imports repetidos de Swagger; el registro central aplica los decoradores antes de generar el documento.

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
4. Confirmar que sólo aparezcan tags de Inspecciones.
5. Confirmar que **Authorize** muestre Bearer JWT.
6. Revisar que los DTO de creación y actualización tengan propiedades y restricciones.
7. Probar un endpoint de lectura con token válido.
8. Confirmar que PDF y XLSX aparezcan como descargas binarias.

## Próximas iteraciones sugeridas

1. Modelos de respuesta completos para Inspecciones.
2. Ejemplos reales anonimizados de requests y responses.
3. Documentación del módulo de autenticación para obtener el token desde Swagger.
4. Documentación de errores comunes y transiciones de estado.
5. Incorporación gradual de Incidentes, SPR, Residuos y demás módulos.
6. Exportación versionada del documento OpenAPI en CI.
