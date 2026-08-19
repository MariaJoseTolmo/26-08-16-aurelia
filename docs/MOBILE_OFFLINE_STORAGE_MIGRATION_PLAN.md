# MOBILE_OFFLINE_STORAGE_MIGRATION_PLAN

Plan tecnico ejecutable para migrar persistencia offline mobile desde `localStorage`/memoria a almacenamiento nativo durable en Expo.

## 1) Contexto y brecha actual

Estado observado en `mobile-inspecciones`:

- Driver actual: `src/shared/storage/local-storage.ts`.
- En web: usa `localStorage`.
- En native (Android/iOS): al no existir `localStorage`, cae a memoria (`MemoryLocalStorageDriver`).

Impacto:

- La data offline se pierde al cerrar la app en dispositivos reales.
- Riesgo operacional alto para formularios de inspecciones/incidentes y cola de sync.

## 2) Objetivo

Garantizar persistencia offline durable en dispositivos Expo nativos, con seguridad por tipo de dato y sin romper el flujo actual de sincronización (`/api/mobile/sync`).

## 3) Matriz de decision de almacenamiento

| Tipo de dato | Durabilidad | Sensibilidad | Volumen | Tecnologia recomendada |
| --- | --- | --- | --- | --- |
| Sesion de dispositivo offline (`deviceId`, `deviceSessionId`) | Alta | Media/Alta | Bajo | `expo-secure-store` |
| Tokens/credenciales futuras | Alta | Alta | Bajo | `expo-secure-store` |
| Catálogos bootstrap (`areas`, `templates`, etc.) | Alta | Baja/Media | Medio | `SQLite` |
| Formularios borrador y registros locales | Alta | Media | Medio/Alto | `SQLite` |
| Cola de sincronización (`sync-queue`) | Alta | Media | Medio | `SQLite` |
| Auditoría local de sync/reintentos | Alta | Baja | Medio | `SQLite` |
| Evidencias binarias (imagenes/adjuntos) | Alta | Media/Alta | Alto | `FileSystem` + metadata en `SQLite` |
| Flags efímeros de UI | Baja | Baja | Bajo | memoria o Zustand (no durable) |

Regla general:

- No usar `AsyncStorage` como storage principal de cola/formularios si se espera alto volumen o consultas por estado/dependencias.
- `AsyncStorage` puede usarse como puente temporal de compatibilidad de lectura durante migración.

## 4) Arquitectura target (Fase 8 en iteraciones)

```txt
storage/
  storage-driver.ts              (contrato unificado)
  adapters/
    web-local-storage.adapter.ts
    native-sqlite.adapter.ts
    secure-store.adapter.ts
  repositories/
    catalogs.repository.ts
    inspections.repository.ts
    sync-queue.repository.ts
    evidence.repository.ts
```

Principios:

- Repositorio por agregado funcional (no key-value global sin esquema).
- Idempotencia preservada (`localId`, `idempotencyKey`) en persistencia local.
- Upgrade de esquema local versionado (`schema_version`) y migraciones de DB local.

## 5) Plan de implementación por iteraciones

### Iteración 8.x.1 - Base de storage nativo

Alcance:

1. Agregar dependencias:
   - `expo-sqlite`
   - `expo-secure-store`
2. Introducir contrato `StorageDriver` agnóstico por plataforma.
3. Implementar adaptador:
   - web: `localStorage`
   - native: `SQLite` + `SecureStore`
4. Mantener fallback a memoria solo para tests/entornos sin storage disponible.

Criterio de salida:

- En Android/iOS, reiniciar app y mantener `offline_device_session` persistida.

### Iteración 8.x.2 - Migración de datos críticos

Alcance:

1. Migrar `offline-device-session` a `SecureStore`.
2. Migrar `local-catalogs`, `local-inspections`, `sync-queue` a `SQLite`.
3. Agregar bootstrap de migración one-shot:
   - si existe data en storage anterior, copiar a SQLite.
   - marcar `migration_completed_at`.

Criterio de salida:

- Catálogos, inspecciones locales y cola sobreviven cierre/reapertura en device.

### Iteración 8.x.3 - Integridad de sincronización

Alcance:

1. Índices SQLite para cola por `status`, `nextRetryAt`, `localId`.
2. Lock de procesamiento para evitar doble worker local.
3. Persistir historial de reintentos y errores locales.

Criterio de salida:

- Reintentos siguen funcionando tras cierre/reapertura sin duplicar envíos.

### Iteración 8.x.4 - Evidencias nativas

Alcance:

1. Guardar binarios en `FileSystem` local.
2. Guardar metadata de evidencia en SQLite.
3. Asociar evidencia a operación en cola y resolver `remoteId` tras sync.

Criterio de salida:

- Evidencias capturadas offline no se pierden al cerrar app.

## 6) Cambios técnicos mínimos por archivo (orientativo)

- `apps/mobile-inspecciones/src/shared/storage/local-storage.ts`
  - reemplazar export único por factory multiplataforma.
- `apps/mobile-inspecciones/src/shared/offline/offline-device-session.ts`
  - mover persistencia a `SecureStore`.
- `apps/mobile-inspecciones/src/shared/offline/local-catalogs.ts`
  - migrar a repositorio SQLite.
- `apps/mobile-inspecciones/src/shared/offline/local-inspections.ts`
  - migrar a repositorio SQLite.
- `apps/mobile-inspecciones/src/shared/sync/sync-queue.ts`
  - migrar a repositorio SQLite con índices.

## 7) Riesgos y mitigaciones

- Riesgo: corrupción o pérdida durante migración local.
  - Mitigación: migración idempotente con backup temporal y flag de versión.

- Riesgo: degradación de performance por queries no indexadas.
  - Mitigación: índices y límites por batch de sync.

- Riesgo: divergencia entre web y native.
  - Mitigación: contrato único + tests de conformidad por driver.

## 8) Criterios de aceptación (DoD)

1. Persistencia durable validada en Android/iOS tras reinicio de app.
2. Cola y formularios offline no se pierden al matar proceso.
3. Sync mantiene idempotencia y estados contractuales.
4. Estrategia documentada en:
   - `MOBILE_OFFLINE_STRATEGY.md`
   - `database/06-implementation-roadmap.md`

## 9) No objetivo de esta migración

- Reemplazar el backend de sync.
- Cambiar contratos HTTP mobile sync.
- Introducir cifrado de payload completo en SQLite (se evalúa posterior según cumplimiento).
