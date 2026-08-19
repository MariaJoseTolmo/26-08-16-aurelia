# Assistant idempotency iteration - 2026-06-26

## Objetivo

Evitar duplicados cuando mobile reenvía operaciones locales después de una caída, recarga o reinicio de API.

## Cambios aplicados

### Entidad persistente

Se creó:

```txt
apps/api/src/modules/mobile-sync/entities/mobile-sync-operation.entity.ts
```

Tabla esperada:

```txt
mobile_sync_operations
```

Guarda:

```txt
batchId
localId
idempotencyKey
deviceId
deviceSessionId
operationType
entityType
status
remoteId
errorCode
errorMessage
payload
syncedAt
```

La clave `idempotencyKey` es única. Además se indexa `deviceId + localId` para resolver dependencias locales.

### Migración

Se agregó:

```txt
apps/api/src/database/migrations/1782460000000-CreateMobileSyncOperations.ts
```

### Módulo

Se actualizó:

```txt
apps/api/src/modules/mobile-sync/mobile-sync.module.ts
```

Ahora registra el repositorio TypeORM de `MobileSyncOperationEntity`.

### Servicio

Se actualizó:

```txt
apps/api/src/modules/mobile-sync/mobile-sync.service.ts
```

Antes de materializar una operación, ahora busca si ya existe por `idempotencyKey`.

Si existe:

```txt
devuelve el resultado persistido
no vuelve a crear registros
```

Si no existe:

```txt
materializa
persiste status + remoteId + errores
responde al mobile
```

## Resultado esperado

### Reintento con la misma operación

Si vuelve a llegar el mismo `idempotencyKey`, la API debe responder el mismo `remoteId` sin duplicar inspecciones ni hallazgos.

### Dependencias después de reinicio

Si el backend reinicia, puede resolver:

```txt
inspectionLocalId -> inspectionId real
```

leyendo `mobile_sync_operations` por `deviceId + localId`.

## Validación recomendada

1. Ejecutar migración o usar `DB_SYNCHRONIZE=true` en entorno dev.
2. Crear una inspección asistida.
3. Confirmar que `POST /api/mobile/sync` responde `SYNCED`.
4. Confirmar que existe registro en `mobile_sync_operations`.
5. Reenviar la misma cola o el mismo batch.
6. Confirmar que no aparece una segunda inspección duplicada.
7. Reiniciar API y repetir el reenvío.
8. Confirmar que tampoco duplica.

## Pendientes siguientes

1. Confirmar scripts reales de migración en `apps/api/package.json`.
2. Persistir batches completos si se necesita conservar `GET /api/mobile/sync/:batchId` tras reinicio.
3. Llevar evidencias a FileSystem native.
4. Llevar storage offline a SQLite native.
5. Luego hacer fidelidad visual 100% contra el HTML de referencia.
