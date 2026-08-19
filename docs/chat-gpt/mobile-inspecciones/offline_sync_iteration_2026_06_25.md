# Offline sync iteration - 2026-06-25

## Contexto

Se inició la transición del flujo `mobile-inspecciones` desde guardado directo contra API hacia un flujo offline-first similar a Survey123:

1. Captura local primero.
2. Registro visible inmediatamente en dashboard local.
3. Operaciones encoladas en `sync_queue`.
4. Sincronización cuando hay red.
5. API recibe batches mobile/offline y los publica a un broker.
6. En producción el broker será Service Bus.

Esta iteración no cierra todavía el sistema offline completo; deja una base funcional y documentada para que próximas sesiones continúen.

## Archivos creados o modificados

### Mobile storage

```txt
apps/mobile-inspecciones/src/shared/storage/local-storage.ts
```

Implementa un `LocalStorageDriver` con:

- `BrowserLocalStorageDriver` para dev web persistente.
- `MemoryLocalStorageDriver` como fallback.

Pendiente: reemplazar/expandir con SQLite/SecureStore en native.

### Device session dev

```txt
apps/mobile-inspecciones/src/shared/offline/offline-device-session.ts
```

Crea un `deviceId`, `deviceSessionId` y `bootstrapVersion` local de desarrollo. Esto simula la sesión offline hasta que exista `mobile-auth` real.

### Local inspections

```txt
apps/mobile-inspecciones/src/shared/offline/local-inspections.ts
```

Guarda inspecciones locales para que aparezcan inmediatamente en `/inspection/dashboard`, incluso sin API.

Estado local usado:

```txt
PENDING
SYNCED
ERROR
CONFLICT
```

### Sync queue

```txt
apps/mobile-inspecciones/src/shared/sync/sync-status.ts
apps/mobile-inspecciones/src/shared/sync/sync-queue.ts
```

La cola dejó de ser un array en memoria. Ahora persiste operaciones usando `LocalStorageDriver`.

Cada operación incluye:

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

### Sync engine

```txt
apps/mobile-inspecciones/src/shared/sync/sync-engine.ts
```

Construye `MobileSyncBatchRequest` desde operaciones pendientes y llama:

```txt
POST /api/mobile/sync
```

Si la API acepta el batch como `PROCESSING`, las operaciones quedan en ese estado; no se marcan como `SYNCED` hasta que exista worker/outbox real.

### Mobile sync API client

```txt
apps/mobile-inspecciones/src/shared/services/api/mobile-sync.api.ts
```

Cliente HTTP para:

```txt
POST /mobile/sync
GET  /mobile/sync/:batchId
```

### Guardado del resumen

```txt
apps/mobile-inspecciones/src/modules/inspection/hooks/useSaveManualInspectionOffline.ts
apps/mobile-inspecciones/src/modules/inspection/ManualInspectionSummaryScreen.tsx
```

El botón `Guardar inspección` ya no llama directamente a `POST /inspections`, `answers`, `findings` ni `close`.

Ahora:

1. Crea inspección local.
2. Encola `CREATE_INSPECTION`.
3. Encola `UPSERT_INSPECTION_ANSWER` por cada ítem.
4. Encola `CREATE_INSPECTION_FINDING` por cada respuesta `NO`.
5. Encola `CLOSE_INSPECTION` si no hay hallazgos.
6. Intenta sincronizar si hay red.
7. Navega a `/inspection/manual/saved`.

### Dashboard

```txt
apps/mobile-inspecciones/src/modules/inspection/hooks/useInspectionHomeData.ts
```

`useMobileInspections()` ahora mezcla:

- remoto desde API;
- inspecciones locales `PENDING/ERROR/CONFLICT`.

Si la API falla, devuelve solo inspecciones locales.

### API mobile sync

```txt
apps/api/src/modules/mobile-sync/mobile-sync.module.ts
apps/api/src/modules/mobile-sync/mobile-sync.controller.ts
apps/api/src/modules/mobile-sync/mobile-sync.service.ts
```

Nuevo módulo registrado en:

```txt
apps/api/src/app.module.ts
```

Endpoints de dev:

```txt
POST /api/mobile/sync
GET  /api/mobile/sync
GET  /api/mobile/sync/:batchId
```

Por ahora usa `InMemoryMobileSyncBroker`.

### Broker port

```txt
apps/api/src/shared/messaging/mobile-sync-message.ts
apps/api/src/shared/messaging/in-memory-mobile-sync-broker.ts
apps/api/src/shared/messaging/mobile-sync-topology.ts
```

Define el puerto:

```txt
MobileSyncMessageBroker
```

Implementación actual:

```txt
InMemoryMobileSyncBroker
```

Implementaciones futuras:

```txt
DatabaseOutboxMobileSyncBroker
AzureServiceBusMobileSyncBroker
```

## Estado actual del flujo

### Ya implementado

- Contratos mobile/offline en `@aurelia/contracts`.
- Cola persistente dev en `mobile-inspecciones`.
- Inspección local visible en dashboard.
- Guardado del resumen hacia cola local.
- Batch mobile sync hacia API.
- API mobile-sync con broker in-memory.
- Documentación base de Service Bus.

### Aún pendiente

- Storage native real con SQLite/SecureStore.
- Módulo `mobile-auth` real.
- `mobile-bootstrap` real.
- Tablas de outbox/sync batch/sync operations.
- Worker que procese batches y convierta operaciones locales en registros reales.
- Mapeo `localId -> remoteId` posterior al worker.
- Attachments binarios reales.
- Endpoint de responsables por empresa.
- Replicar esta base hacia `mobile-incidentes`.

## Cómo probar en dev

Terminal API:

```powershell
cd C:\Users\carlo\Desktop\aurelia\Aurelia
pnpm --filter api start:dev
```

Terminal mobile:

```powershell
cd C:\Users\carlo\Desktop\aurelia\Aurelia\apps\mobile-inspecciones
pnpm web -- --clear
```

Flujo:

1. Completar `/inspection/manual/identification`.
2. Completar `/inspection/manual/type`.
3. Completar `/inspection/manual/observations`.
4. Ir a resumen.
5. Presionar `Guardar inspección`.
6. Debe navegar a `/inspection/manual/saved`.
7. Volver al dashboard.
8. La inspección debe aparecer aunque la API no devuelva todavía un registro remoto.
9. Revisar `GET /api/mobile/sync` para ver mensajes pendientes en broker in-memory.

## Decisión importante

Desde esta iteración, el flujo correcto es:

```txt
UI -> local storage -> sync_queue -> mobile-sync API -> broker -> worker -> DB final
```

No debe volver a implementarse guardado mobile directo contra endpoints tradicionales como camino principal.
