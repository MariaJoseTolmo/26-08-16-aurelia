# 07 - Mobile Sync DDL

## Propósito

Este documento deja formalizado el DDL de soporte para sincronización offline/mobile.

La tabla principal agregada en esta iteración es:

```txt
mobile_sync_operations
```

Su objetivo es permitir idempotencia persistente y resolver dependencias entre identificadores locales generados por mobile y registros reales en la base central.

## Contexto funcional

Las apps mobile pueden generar operaciones offline como:

```txt
CREATE_INSPECTION
UPSERT_INSPECTION_ANSWER
CREATE_INSPECTION_FINDING
CLOSE_INSPECTION
CREATE_INCIDENT
UPLOAD_ATTACHMENT
```

Cada operación viaja dentro de un batch enviado a:

```txt
POST /api/mobile/sync
```

El backend debe poder recibir reintentos sin duplicar registros. Para eso se persiste el resultado de cada operación por `idempotency_key`.

## Tabla: mobile_sync_operations

### Responsabilidad

Registrar cada operación recibida desde mobile con su estado de sincronización, payload original y `remote_id` resultante.

Permite:

- reintentar la misma operación sin duplicar datos;
- devolver el mismo resultado si llega el mismo `idempotency_key`;
- resolver `localId -> remoteId` después de reiniciar la API;
- auditar operaciones mobile pendientes, exitosas o fallidas;
- preparar el paso futuro hacia Service Bus / outbox.

## DDL PostgreSQL

```sql
CREATE TABLE IF NOT EXISTS mobile_sync_operations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  batch_id varchar(120) NOT NULL,
  local_id varchar(160) NOT NULL,
  idempotency_key varchar(220) NOT NULL,
  device_id varchar(160) NOT NULL,
  device_session_id varchar(160) NOT NULL,
  operation_type varchar(80) NOT NULL,
  entity_type varchar(80) NOT NULL,
  status varchar(40) NOT NULL,
  remote_id varchar(160),
  error_code varchar(120),
  error_message text,
  payload jsonb,
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_mobile_sync_operations PRIMARY KEY (id),
  CONSTRAINT uq_mobile_sync_operations_idempotency_key UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_mobile_sync_operations_device_local
  ON mobile_sync_operations (device_id, local_id);

CREATE INDEX IF NOT EXISTS idx_mobile_sync_operations_batch
  ON mobile_sync_operations (batch_id);
```

## Campos

| Campo | Tipo | Descripción |
|---|---:|---|
| `id` | uuid | Identificador interno del registro de sincronización. |
| `batch_id` | varchar(120) | Identificador del batch mobile. |
| `local_id` | varchar(160) | Identificador local generado por la app. |
| `idempotency_key` | varchar(220) | Clave única para evitar reprocesar la misma operación. |
| `device_id` | varchar(160) | Identificador del dispositivo. |
| `device_session_id` | varchar(160) | Sesión offline/mobile usada para enviar la operación. |
| `operation_type` | varchar(80) | Tipo de operación mobile. |
| `entity_type` | varchar(80) | Tipo lógico de entidad afectada. |
| `status` | varchar(40) | Estado de la operación: `PROCESSING`, `SYNCED`, `ERROR`, etc. |
| `remote_id` | varchar(160) | ID real creado en la base central, cuando aplica. |
| `error_code` | varchar(120) | Código de error si falló la materialización. |
| `error_message` | text | Mensaje técnico/funcional del error. |
| `payload` | jsonb | Payload original enviado por mobile. |
| `synced_at` | timestamptz | Fecha/hora en que se marcó como sincronizada. |
| `created_at` | timestamptz | Fecha/hora de recepción. |
| `updated_at` | timestamptz | Última actualización del registro. |

## Índices y restricciones

### Idempotencia

```sql
UNIQUE (idempotency_key)
```

Garantiza que una operación reenviada no cree registros duplicados.

### Resolución local -> remoto

```sql
INDEX (device_id, local_id)
```

Permite resolver dependencias como:

```txt
inspectionLocalId -> inspectionId real
findingLocalId -> findingId real
localEvidenceId -> evidenceId real/dev
```

### Consulta por batch

```sql
INDEX (batch_id)
```

Permite auditar o reconstruir el resultado de un batch.

## Relación con tablas de negocio

`mobile_sync_operations.remote_id` no tiene FK directa porque puede apuntar a distintas entidades según `entity_type`:

```txt
inspection
inspection_answer
inspection_finding
inspection_close
incident
evidence
```

La validación y materialización se resuelve en `MobileSyncService`.

## Estados esperados

```txt
PENDING
PROCESSING
SYNCED
ERROR
CONFLICT
CANCELLED
```

En el worker dev actual, las operaciones soportadas deberían terminar normalmente como `SYNCED` o `ERROR`.

## Operaciones soportadas actualmente

```txt
CREATE_INSPECTION -> inspections
UPSERT_INSPECTION_ANSWER -> inspection_item_responses
CREATE_INSPECTION_FINDING -> inspection_findings
CLOSE_INSPECTION -> inspections.status = CLOSED
UPLOAD_ATTACHMENT -> metadata dev marcada como SYNCED
CREATE_INCIDENT -> PROCESSING pendiente de materialización mobile-incidentes
```

## Migración TypeORM

La migración correspondiente es:

```txt
apps/api/src/database/migrations/1782460000000-CreateMobileSyncOperations.ts
```

La entidad correspondiente es:

```txt
apps/api/src/modules/mobile-sync/entities/mobile-sync-operation.entity.ts
```

## Notas de arquitectura

Esta tabla es un paso intermedio entre el broker in-memory dev y una arquitectura productiva con outbox / Service Bus.

En producción, esta tabla puede complementarse con:

```txt
mobile_sync_batches
mobile_sync_dead_letters
mobile_sync_operation_logs
```

Por ahora `mobile_sync_operations` cubre el dolor principal:

```txt
reintento seguro + idempotencia + resolución localId -> remoteId
```
