# MOBILE_OFFLINE_STRATEGY

Estrategia offline-first para las apps móviles (`mobile-inspecciones`, `mobile-incidentes`). React Native + Expo + TypeScript.

> **Estado:** arquitectura inicial y primera implementación operativa en `mobile-inspecciones`. El flujo de resumen ya guarda localmente, encola operaciones y llama a `POST /api/mobile/sync` si hay red. Además, `mobile-inspecciones` ya cuenta con bootstrap/cache local-first de catálogos para llenar formularios sin depender de endpoints online. El worker definitivo, DB outbox, auth offline real y storage native cifrado siguen pendientes.

## Objetivo

Permitir el **registro en terreno sin conexión** y sincronizar con la API cuando haya red, sin pérdida de datos y con manejo explícito de conflictos.

## Alcance

Aplica solo a:

- `apps/mobile-inspecciones`
- `apps/mobile-incidentes`

No aplica a la web como flujo offline-first. La web puede seguir usando TanStack Query y API directa.

## Documentos relacionados

- [mobile-offline-service-bus-architecture.md](mobile-offline-service-bus-architecture.md)
- [MOBILE_OFFLINE_STORAGE_MIGRATION_PLAN.md](MOBILE_OFFLINE_STORAGE_MIGRATION_PLAN.md)
- [chat-gpt/mobile-inspecciones/offline_sync_iteration_2026_06_25.md](chat-gpt/mobile-inspecciones/offline_sync_iteration_2026_06_25.md)
- [chat-gpt/mobile-inspecciones/offline_bootstrap_catalog_iteration_2026_06_25.md](chat-gpt/mobile-inspecciones/offline_bootstrap_catalog_iteration_2026_06_25.md)
- [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)
- [CONTRACTS_GUIDELINES.md](CONTRACTS_GUIDELINES.md)

## Capas previstas

```txt
apps/mobile-*/src/shared
  /storage   Almacenamiento local persistente
  /offline   Device session, entidades locales y catálogos cacheados
  /sync      Cola de sincronización + estados de sync
  /services  Acceso HTTP
  /hooks     Hooks compartidos de coordinación mobile/offline
```

### 1. Storage local

Implementado en `mobile-inspecciones`:

```txt
apps/mobile-inspecciones/src/shared/storage/local-storage.ts
```

Estado actual:

- `BrowserLocalStorageDriver` para dev web persistente.
- `MemoryLocalStorageDriver` como fallback.

Pendiente:

- SecureStore/Keychain/Keystore para sesión offline.
- SQLite/MMKV para formularios, catálogos, cola y auditoría en native.
- Filesystem local para evidencias grandes.

Plan ejecutable de implementación:

- Ver [MOBILE_OFFLINE_STORAGE_MIGRATION_PLAN.md](MOBILE_OFFLINE_STORAGE_MIGRATION_PLAN.md).

### 2. Bootstrap/cache local de catálogos

Implementado en API:

```txt
apps/api/src/modules/mobile-bootstrap/mobile-bootstrap.module.ts
apps/api/src/modules/mobile-bootstrap/mobile-bootstrap.controller.ts
apps/api/src/modules/mobile-bootstrap/mobile-bootstrap.service.ts
```

Endpoint:

```txt
GET /api/mobile/bootstrap
```

Devuelve:

```txt
areas
sectors
companies
users
inspectionTypes
inspectionTemplates con sections/items
offlinePolicy
bootstrapVersion
generatedAt
expiresAt
```

El endpoint usa datos reales desde `OrganizationService`, `InspectionsService` y `UsersService`. No debe incorporar mocks hardcodeados de plantillas o catálogos.

Implementado en mobile:

```txt
apps/mobile-inspecciones/src/shared/services/api/mobile-bootstrap.api.ts
apps/mobile-inspecciones/src/shared/offline/local-catalogs.ts
apps/mobile-inspecciones/src/shared/hooks/useMobileBootstrap.ts
```

Regla vigente:

1. Intentar refresh online de `GET /mobile/bootstrap` cuando el runtime no esté explícitamente offline.
2. Guardar respuesta en cache local.
3. Si API falla o no hay red, usar cache local.
4. Si no existe cache, mostrar: `Debe sincronizar catálogos antes de operar offline`.

Hooks migrados:

```txt
apps/mobile-inspecciones/src/modules/inspection/useManualInspectionCatalogs.ts
apps/mobile-inspecciones/src/modules/inspection/hooks/useInspectionChecklistTemplates.ts
apps/mobile-inspecciones/src/modules/inspection/hooks/useManualInspectionCompanies.ts
```

El dashboard inicial dispara `useMobileBootstrap()` desde `useInspectionHomeSummary()` para precalentar catálogos sin bloquear la UI.

Producción/native debe migrar este cache desde `localStorageDriver` dev hacia:

```txt
SQLite       catálogos, formularios, cola y auditoría
SecureStore sesión offline, tokens y device grant
FileSystem   evidencias binarias grandes
```

### 3. Cola de sincronización

Implementado en `mobile-inspecciones`:

```txt
apps/mobile-inspecciones/src/shared/sync/sync-status.ts
apps/mobile-inspecciones/src/shared/sync/sync-queue.ts
```

Estados contractuales:

```txt
LOCAL_DRAFT
PENDING
PROCESSING
SYNCED
ERROR
CONFLICT
CANCELLED
```

Operaciones contractuales:

```txt
CREATE_INSPECTION
UPSERT_INSPECTION_ANSWER
CREATE_INSPECTION_FINDING
CLOSE_INSPECTION
CREATE_INCIDENT
UPLOAD_ATTACHMENT
```

Cada operación guarda:

```txt
localId
operationType
entityType
payload
evidences
createdBy
deviceId
deviceSessionId
schemaVersion
clientCreatedAt
idempotencyKey
dependsOnLocalIds
status
retryCount
lastError
nextRetryAt
```

### 4. Proceso de sincronización

Implementado parcialmente en:

```txt
apps/mobile-inspecciones/src/shared/sync/sync-engine.ts
apps/mobile-inspecciones/src/shared/services/api/mobile-sync.api.ts
```

Flujo actual:

1. Toma operaciones `PENDING` y `ERROR` elegibles.
2. Construye `MobileSyncBatchRequest`.
3. Llama `POST /api/mobile/sync`.
4. Si la API acepta el batch, las operaciones quedan `PROCESSING`.
5. Si la API devuelve `SYNCED`, se marcan `SYNCED`.
6. Si falla, pasan a `ERROR` con retry básico.

El paso 4 es intencional: mientras no exista worker/outbox real, aceptar un batch no significa persistencia definitiva.

### 5. Service Bus en producción

Topología objetivo:

```txt
topic: aurelia.mobile.sync
  subscription: mobile-inspecciones
  subscription: mobile-incidentes
```

La API no debe acoplar el dominio a Azure. Debe usar un puerto:

```txt
MobileSyncMessageBroker
```

Implementaciones previstas:

```txt
InMemoryMobileSyncBroker
DatabaseOutboxMobileSyncBroker
AzureServiceBusMobileSyncBroker
```

Implementado actualmente:

```txt
apps/api/src/shared/messaging/mobile-sync-message.ts
apps/api/src/shared/messaging/in-memory-mobile-sync-broker.ts
apps/api/src/shared/messaging/mobile-sync-topology.ts
```

### 6. Validación en dev

Niveles recomendados:

1. `in-memory`: rápido para TDD/manual local. Ya existe puerto + broker in-memory.
2. `database-outbox`: permite replay y revisión de batches en Postgres. Pendiente.
3. `service-bus`: integración con emulator o namespace cloud de desarrollo. Pendiente.

API implementada para dev:

```txt
apps/api/src/modules/mobile-sync/mobile-sync.module.ts
apps/api/src/modules/mobile-sync/mobile-sync.controller.ts
apps/api/src/modules/mobile-sync/mobile-sync.service.ts
```

Endpoints actuales:

```txt
GET  /api/mobile/bootstrap
POST /api/mobile/sync
GET  /api/mobile/sync
GET  /api/mobile/sync/:batchId
```

### 7. Resolución de conflictos

A definir por entidad. Base recomendada:

- Inspecciones nuevas: idempotencia por `localId` + `idempotencyKey`.
- Evidencias: append-only.
- Catálogos cambiados: bloquear sync con `CONFLICT` si `bootstrapVersion` está obsoleta.
- Cambios de permisos: la API revalida permisos actuales antes de aceptar.

## Flujo `Guardar inspección`

Implementado en:

```txt
apps/mobile-inspecciones/src/modules/inspection/hooks/useSaveManualInspectionOffline.ts
apps/mobile-inspecciones/src/modules/inspection/ManualInspectionSummaryScreen.tsx
```

El botón `Guardar inspección` ahora:

1. Crea inspección local.
2. Encola `CREATE_INSPECTION`.
3. Encola `UPSERT_INSPECTION_ANSWER` por ítem.
4. Encola `CREATE_INSPECTION_FINDING` por respuesta `NO`.
5. Encola `CLOSE_INSPECTION` si no hay hallazgos.
6. Intenta sync si hay red.
7. Navega a `/inspection/manual/saved`.

Regla vigente:

```txt
UI -> local storage -> sync_queue -> mobile-sync API -> broker -> worker -> DB final
```

No debe volver a implementarse guardado mobile directo contra endpoints tradicionales como camino principal.

## Dashboard mobile

Implementado en:

```txt
apps/mobile-inspecciones/src/modules/inspection/hooks/useInspectionHomeData.ts
```

`useMobileInspections()` mezcla registros remotos con inspecciones locales. Si la API falla, devuelve locales.

`useInspectionHomeSummary()` precalienta el cache de bootstrap para que las pantallas de llenado puedan operar offline después de una primera carga online.

## Evidencias en terreno

Estado actual:

- Foto: captura con `expo-image-picker` en el formulario.
- Metadata de evidencia: viaja en `MobileSyncEvidenceRef`.
- Binario real: pendiente.

Pendiente:

- Definir si la evidencia se sube como operación separada, pre-signed upload o multipart.
- Persistir archivos en filesystem native.
- Relacionar evidencia con answer/finding definitivo cuando exista `remoteId`.

## Relación con estado

- **Server state:** TanStack Query.
- **UI/client state:** Zustand.
- **Offline durable state:** storage/sync propio, no TanStack cache ni Zustand puro.

La cola offline y los catálogos durables no se mezclan con el cache de server state. TanStack Query solo coordina refresh/fallback, pero la fuente offline durable es `localStorageDriver` en dev y debe ser SQLite/SecureStore/FileSystem en native.

## Pendientes de implementación

- [ ] Implementar storage native real en móviles.
- [ ] Crear módulo `mobile-auth` en API.
- [x] Crear módulo `mobile-bootstrap` en API.
- [x] Cachear bootstrap en `mobile-inspecciones` con regla local-first dev.
- [ ] Persistir `bootstrapVersion` usada en cada inspección local y enviarla en sync.
- [ ] Crear tablas de device sessions/offline grants.
- [ ] Crear tablas outbox/sync batch/sync operation.
- [ ] Implementar worker de sync.
- [ ] Implementar adaptador Service Bus.
- [x] Crear módulo `mobile-sync` en API para dev/in-memory.
- [x] Migrar `Guardar inspección` para que encole primero y sincronice después.
- [ ] Definir subida binaria de evidencias.
- [ ] Replicar patrón base en `mobile-incidentes`.
