# Offline bootstrap catalog iteration - 2026-06-25

## Contexto

La iteración anterior dejó operativo el guardado offline inicial de `mobile-inspecciones`:

```txt
UI -> local storage -> sync_queue -> mobile-sync API -> broker -> worker -> DB final
```

El bloqueo pendiente estaba antes del guardado: el llenado del formulario seguía dependiendo de endpoints online para áreas, sectores, empresas y plantillas.

## Objetivo de esta iteración

Implementar el equivalente al Excel precargado de Survey123 para inspecciones móviles: una descarga inicial de catálogos versionada y reutilizable sin red.

## Backend

Endpoint activo:

```txt
GET /api/mobile/bootstrap
```

Módulo:

```txt
apps/api/src/modules/mobile-bootstrap/mobile-bootstrap.module.ts
apps/api/src/modules/mobile-bootstrap/mobile-bootstrap.controller.ts
apps/api/src/modules/mobile-bootstrap/mobile-bootstrap.service.ts
```

El endpoint devuelve el contrato existente `MobileBootstrapResponse` desde `@aurelia/contracts`:

```txt
bootstrapVersion
generatedAt
expiresAt
catalogs.areas
catalogs.sectors
catalogs.companies
catalogs.users
catalogs.inspectionTypes
catalogs.inspectionTemplates
catalogs.inspectionTemplates.sections.items
offlinePolicy
```

La respuesta se arma desde servicios reales del dominio:

```txt
OrganizationService.findAreas()
OrganizationService.findSectors()
OrganizationService.findCompanies()
InspectionsService.findTypes()
InspectionsService.findTemplates()
UsersService.findAll()
```

No se agregaron plantillas mock ni catálogos hardcodeados.

## Versionado

`bootstrapVersion` se calcula con:

```txt
último updatedAt observado en catálogos + conteos principales
```

Esto deja una versión estable para la misma fotografía de datos y evita depender del timestamp de generación.

## Política offline

`offlinePolicy` queda configurable por variables de entorno:

```txt
MOBILE_BOOTSTRAP_MAX_OFFLINE_DAYS
MOBILE_BOOTSTRAP_REQUIRES_BIOMETRIC_OR_PIN
MOBILE_BOOTSTRAP_MAX_PENDING_QUEUE_ITEMS
MOBILE_BOOTSTRAP_MAX_ATTACHMENT_SIZE_MB
```

Defaults dev actuales:

```txt
maxOfflineDays = 7
requiresBiometricOrPin = false
maxPendingQueueItems = 500
maxAttachmentSizeMb = 25
```

Producción debe revisar estos valores con reglas de seguridad, operación y almacenamiento native.

## Mobile

Cliente HTTP:

```txt
apps/mobile-inspecciones/src/shared/services/api/mobile-bootstrap.api.ts
```

Cache local:

```txt
apps/mobile-inspecciones/src/shared/offline/local-catalogs.ts
```

Hook compartido:

```txt
apps/mobile-inspecciones/src/shared/hooks/useMobileBootstrap.ts
```

El cache usa por ahora `localStorageDriver`, por lo tanto en dev web persiste en `localStorage` y en fallback usa memoria.

## Regla local-first

La regla implementada es:

1. Si el runtime no está explícitamente offline, intenta `GET /mobile/bootstrap`.
2. Si responde, guarda el bootstrap en cache local.
3. Si la API falla, usa el cache local.
4. Si no hay cache local, lanza el mensaje:

```txt
Debe sincronizar catálogos antes de operar offline
```

## Hooks migrados

Ahora leen desde el bootstrap/cache local-first:

```txt
apps/mobile-inspecciones/src/modules/inspection/useManualInspectionCatalogs.ts
apps/mobile-inspecciones/src/modules/inspection/hooks/useInspectionChecklistTemplates.ts
apps/mobile-inspecciones/src/modules/inspection/hooks/useManualInspectionCompanies.ts
```

Los formularios dejan de depender directamente de:

```txt
/organization/areas
/organization/sectors
/organization/companies
/inspections/templates
```

Los services tradicionales se mantienen para web/compatibilidad, pero el flujo manual móvil usa bootstrap local-first.

## Dashboard inicial

`useInspectionHomeSummary()` dispara `useMobileBootstrap()` para precalentar catálogos al entrar al dashboard de inspecciones, sin bloquear la carga de inspecciones ni resumen.

Archivo:

```txt
apps/mobile-inspecciones/src/modules/inspection/hooks/useInspectionHomeData.ts
```

## UI / errores

Se agregó mensaje explícito cuando no existen catálogos disponibles para offline:

```txt
Debe sincronizar catálogos antes de operar offline
```

Se usa en:

```txt
ManualIdentificationConnected.tsx
ManualChecklistTemplateScreen.tsx
```

## Storage native pendiente

El cache actual es válido para dev, pero no es definitivo para producción native.

Producción/native debe migrar a:

```txt
SQLite       catálogos, formularios, cola, auditoría
SecureStore sesión offline, tokens, device grant
FileSystem   evidencias binarias grandes
```

## Pendientes

- Crear `mobile-auth` real con device session/offline grant.
- Persistir `bootstrapVersion` en cada inspección local y enviarlo en sync.
- Crear database outbox para `mobile-sync`.
- Implementar worker que materialice batches en DB final.
- Implementar adaptador Azure Service Bus.
- Crear estrategia native SQLite/SecureStore/FileSystem.
- Definir endpoint o filtro específico de responsables por empresa/área/rol.
- Replicar patrón en `mobile-incidentes`.

## Cómo probar

Terminal API:

```powershell
pnpm --filter api start:dev
```

Terminal mobile:

```powershell
cd apps/mobile-inspecciones
pnpm web -- --clear
```

Flujo online:

1. Entrar al dashboard de inspecciones.
2. Verificar `GET /api/mobile/bootstrap`.
3. Iniciar nueva inspección manual.
4. Seleccionar área, sector, plantilla y empresa desde catálogos reales.

Flujo offline:

1. Con API online, entrar primero al dashboard o formulario para descargar bootstrap.
2. Cortar API/red.
3. Volver a `/inspection/manual/identification`.
4. Seleccionar área y sector desde cache local.
5. Avanzar a checklist.
6. Seleccionar plantilla e ítems desde cache local.
7. Guardar inspección offline.
8. Verla en dashboard local.
9. Reactivar API/red y validar envío por `POST /api/mobile/sync`.
