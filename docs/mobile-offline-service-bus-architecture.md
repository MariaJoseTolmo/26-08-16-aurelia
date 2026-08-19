# Mobile offline + Service Bus architecture

## Estado

Base técnica inicial para implementar offline-first en las apps móviles de Aurelia:

- `apps/mobile-inspecciones`
- `apps/mobile-incidentes`

La web no opera offline-first. La API debe distinguir tráfico web tradicional de tráfico mobile/offline.

## Principio central

La app móvil no valida identidad contra el servidor cuando está sin señal. El flujo correcto es:

1. Primer inicio online obligatorio.
2. Descarga de catálogos, permisos, usuario y configuración offline.
3. Guardado seguro de la sesión offline autorizada en el dispositivo.
4. Captura local de formularios, evidencias y eventos.
5. Sincronización al recuperar red.
6. Revalidación fuerte en API antes de persistir definitivamente.

## Componentes

```txt
mobile app
  secure storage       sesión offline y device session
  local database       forms, catalogs, queue, audit log
  local filesystem     images and evidence files
  sync engine          retries, status, conflict handling

api
  mobile-auth          login/refresh/offline grant/device session
  mobile-bootstrap     catalog snapshots for offline use
  mobile-sync          validates and accepts sync batches
  sync worker          processes batches
  broker port          abstraction over dev/prod queues

production infra
  Azure Service Bus    durable topic/queues, DLQ, duplicate detection

dev infra
  in-memory broker     fastest unit/dev feedback
  local broker/emulator optional integration testing
```

## Endpoints objetivo

```txt
POST /api/mobile/auth/login
POST /api/mobile/auth/refresh
POST /api/mobile/auth/logout
GET  /api/mobile/bootstrap
POST /api/mobile/sync
GET  /api/mobile/sync/:batchId
```

## Contratos agregados

```txt
packages/contracts/src/dtos/mobile-offline
  mobile-auth.request.ts
  mobile-auth.response.ts
  mobile-bootstrap.response.ts
  mobile-sync.request.ts
  mobile-sync.response.ts
```

Enums agregados:

```txt
MobileSyncOperationType
MobileSyncStatus
```

## Bootstrap offline

`GET /api/mobile/bootstrap` debe entregar catálogos mínimos para operar sin señal:

```txt
areas
sectors
companies
users/responsibles
inspectionTypes
inspectionTemplates
incidentTypes
permissions
offlinePolicy
```

El resultado debe versionarse con `bootstrapVersion`. Cada registro local debe guardar la versión usada.

## Modelo local sugerido

```txt
local_auth_session
local_catalogs
local_inspections
local_inspection_answers
local_inspection_findings
local_incidents
local_evidences
sync_queue
sync_attempts
local_remote_map
audit_log
```

## Sync queue mobile

Cada operación local debe entrar a `sync_queue` con:

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
```

## API sync

`POST /api/mobile/sync` recibe un batch con operaciones y lo procesa de forma idempotente. La API debe:

1. Validar sesión remota o refresh flow.
2. Validar device session.
3. Validar permiso offline vigente.
4. Validar permisos actuales.
5. Validar schema/bootstrap version.
6. Persistir registro de batch.
7. Publicar el batch al broker.
8. Responder tracking del batch.

## Service Bus en producción

Topología propuesta:

```txt
topic: aurelia.mobile.sync
  subscription: mobile-inspecciones
  subscription: mobile-incidentes
```

Propiedades de mensaje:

```txt
messageId        = batchId
sessionId        = deviceSessionId
correlationId    = userId
subject          = appId
applicationProps = appId, deviceId, deviceSessionId, batchId, bootstrapVersion
```

Motivo:

- `messageId` permite idempotencia/deduplicación.
- `sessionId` permite ordenar batches por dispositivo/sesión.
- subscriptions separan procesamiento de inspecciones e incidentes.
- DLQ permite revisar batches fallidos sin perder datos.

## Validación en dev

Tres niveles:

### Nivel 1: in-memory broker

Default local para desarrollo rápido:

```txt
MOBILE_SYNC_BROKER=in-memory
```

La API acepta batches y los deja en memoria para inspección/pruebas.

### Nivel 2: database outbox

Persistencia local/dev usando PostgreSQL:

```txt
mobile_sync_batches
mobile_sync_operations
mobile_sync_attempts
```

Permite validar reintentos, errores y replay sin Azure.

### Nivel 3: broker/emulator o namespace cloud de desarrollo

Para pruebas de integración:

```txt
MOBILE_SYNC_BROKER=service-bus
```

Usar emulator o namespace cloud de desarrollo antes de producción.

## Contratos y API no deben acoplarse a Azure

La API usa un puerto:

```txt
MobileSyncMessageBroker
```

Implementaciones previstas:

```txt
InMemoryMobileSyncBroker
AzureServiceBusMobileSyncBroker
DatabaseOutboxMobileSyncBroker
```

Así mobile y contracts no conocen Azure. Solo la API decide si publica en memoria, DB outbox o Service Bus.

## Flujo de inspección offline

El botón `Guardar inspección` no debe depender de red. Debe:

1. Crear `localInspection`.
2. Crear answers/findings/evidences locales.
3. Crear operaciones en `sync_queue`.
4. Marcar estado visual `PENDING`.
5. Actualizar dashboard local inmediatamente.
6. Intentar sync si hay red.

Si está online, se puede sincronizar inmediatamente, pero usando el mismo motor offline. No debe haber dos caminos de guardado.

## Reglas de consistencia

- Cada operación tiene `idempotencyKey` estable.
- Cada batch tiene `batchId` estable.
- La API debe poder recibir el mismo batch más de una vez sin duplicar datos.
- Las evidencias se procesan como append-only.
- Los conflictos deben volver al dispositivo con estado `CONFLICT` y motivo.

## Pendientes técnicos

1. Crear módulo `mobile-auth` real en API.
2. Crear tablas de device sessions/offline grants.
3. Crear tablas outbox/sync batch/sync operation.
4. Implementar storage local real en móviles.
5. Migrar `Guardar inspección` para que encole primero y sincronice después.
6. Definir manejo de evidencias binarias.
7. Agregar endpoint de responsables por empresa.
8. Crear worker de sync por app.
