# Assistant offline iteration - 2026-06-26

## Contexto

La ruta `/inspection/start` ofrece dos caminos:

- `Iniciar con asistente` -> `/inspection/chat`
- `Usar formulario manual` -> `/inspection/manual/identification`

El flujo manual ya quedó conectado al patrón offline-first:

```txt
UI -> storage local -> sync_queue -> POST /api/mobile/sync -> broker -> worker dev -> DB
```

El flujo asistido existía visualmente y se basaba en `docs/references/Levantamiento de inspecciones.html`, pero seguía usando endpoints directos y no la cola offline.

## Diagnóstico funcional

Archivo principal:

```txt
apps/mobile-inspecciones/src/modules/inspection/InspectionChatScreen.tsx
```

Store actual:

```txt
apps/mobile-inspecciones/src/modules/inspection/useInspectionFlow.ts
```

El store existe y se mantiene para el modo conversacional porque modela correctamente:

```txt
area
sector
tipo de inspección
observaciones
foto local
medida IA/manual
probabilidad
consecuencia
criticidad
SLA
empresa
personal
resumen
```

No conviene reemplazarlo todavía por el store del flujo manual. La convergencia debe ocurrir en la capa de guardado/sync, no necesariamente en la UI conversacional.

## Cambios aplicados

### Iteración A: catálogos local-first

Se migraron servicios compartidos del mobile para leer desde `mobile-bootstrap` local-first:

```txt
apps/mobile-inspecciones/src/shared/services/api/organization.api.ts
apps/mobile-inspecciones/src/shared/services/api/inspection-types.api.ts
apps/mobile-inspecciones/src/shared/services/api/users.api.ts
```

El origen real sigue siendo la API/BD mediante:

```txt
GET /api/mobile/bootstrap
```

Pero si la API no está disponible, se usa cache local.

### Iteración B: submit asistido en hook offline dedicado

Se creó:

```txt
apps/mobile-inspecciones/src/modules/inspection/hooks/useSaveAssistantInspectionOffline.ts
```

Y se integró en:

```txt
apps/mobile-inspecciones/src/modules/inspection/InspectionChatScreen.tsx
```

Al enviar, el hook:

```txt
1. construye CREATE_INSPECTION
2. guarda local_inspections:v1
3. construye CREATE_INSPECTION_FINDING por cada observación
4. guarda sync_queue:v1
5. intenta syncPendingOperations si hay red y sesión
6. navega a /inspection/success
```

El `createdBy` usa el usuario autenticado cuando existe; si no hay sesión local, cae a `local-user`.

### Iteración C: foto capturada sin upload directo

En `/inspection/chat`, la captura ahora guarda `fotoUri` local y continúa el flujo sin llamar inmediatamente a `/files/upload`.

La evidencia queda como metadata local asociada al hallazgo. La subida binaria real queda pendiente para FileSystem/SQLite native.

### Iteración D: operación explícita UPLOAD_ATTACHMENT

El contrato ya contiene:

```txt
UPLOAD_ATTACHMENT
```

Se agregó en `useSaveAssistantInspectionOffline` una operación explícita por cada foto adjunta:

```txt
CREATE_INSPECTION
CREATE_INSPECTION_FINDING
UPLOAD_ATTACHMENT
```

La operación `UPLOAD_ATTACHMENT` usa `entityType: evidence`, depende de la inspección y del hallazgo local, y conserva metadata dev:

```txt
inspectionLocalId
findingLocalId
localEvidenceId
sourceUri
remoteFileId
fileName
mimeType
sizeBytes
evidenceType
capturedAt
```

### Iteración E: conteo local de hallazgos

Se agregó soporte para incrementar/establecer contadores locales de hallazgos:

```txt
apps/mobile-inspecciones/src/shared/offline/local-inspections.ts
```

### Iteración F: validación backend de operaciones mobile-sync

`apps/api/src/modules/mobile-sync/mobile-sync.service.ts` reconoce explícitamente:

```txt
CREATE_INSPECTION
UPSERT_INSPECTION_ANSWER
CREATE_INSPECTION_FINDING
CLOSE_INSPECTION
CREATE_INCIDENT
UPLOAD_ATTACHMENT
```

Si llega una operación no soportada, el resultado vuelve con:

```txt
status: ERROR
errorCode: UNSUPPORTED_OPERATION
```

`GET /api/mobile/sync` expone:

```txt
acceptedBatches
operationCounts
materializedOperationCounts
pendingMessages
```

### Iteración G: worker dev de materialización

Se agregó materialización inmediata para el broker in-memory dev en:

```txt
apps/api/src/modules/mobile-sync/mobile-sync.service.ts
apps/api/src/modules/mobile-sync/mobile-sync.module.ts
```

El módulo mobile-sync ahora importa `InspectionsModule` para usar `InspectionsService`.

El worker dev resuelve dependencias locales:

```txt
inspectionLocalId -> inspectionId real
findingLocalId -> findingId real
localEvidenceId -> evidence id dev
```

Operaciones materializadas:

```txt
CREATE_INSPECTION -> inspections
UPSERT_INSPECTION_ANSWER -> inspection_item_responses
CREATE_INSPECTION_FINDING -> inspection_findings
CLOSE_INSPECTION -> inspections.status = CLOSED
UPLOAD_ATTACHMENT -> metadata dev marcada como SYNCED
```

`CREATE_INCIDENT` queda en `PROCESSING` porque pertenece al módulo mobile-incidentes y no se materializa todavía desde este worker.

Cuando una operación se materializa, la respuesta del batch devuelve:

```txt
status: SYNCED
remoteId: <uuid real o id dev>
syncedAt: <iso date>
```

Así la app mobile puede marcar la cola local como sincronizada.

## Estado esperado después de estas iteraciones

### Online

1. Entrar a `/inspection/start`.
2. Elegir `Iniciar con asistente`.
3. Cargar áreas, sectores, tipos, empresas y usuarios desde bootstrap/API.
4. Completar conversación.
5. Enviar inspección.
6. Crear `local_inspections` y `sync_queue`.
7. Si hay foto, `sync_queue` debe incluir `UPLOAD_ATTACHMENT`.
8. `POST /api/mobile/sync` debe materializar en DB.
9. La respuesta debe traer operaciones `SYNCED`.
10. La cola local debe pasar a `SYNCED`.

### Offline con bootstrap previo

1. Entrar a `/inspection/chat` sin API.
2. Cargar catálogos desde cache local.
3. Completar conversación sin depender de `/organization/*` ni `/inspections/types`.
4. Enviar inspección.
5. Guardar local + cola.
6. Si hay foto, encolar `UPLOAD_ATTACHMENT` con metadata local.
7. Al volver al dashboard con API viva, auto-sync debe enviar batch.
8. El worker dev debe materializar en DB y devolver `SYNCED`.

### Offline sin bootstrap

Debe mostrar error claro de catálogos:

```txt
Debe sincronizar catálogos antes de operar offline
```

## Validación inmediata recomendada

### Caso online

```txt
1. Limpiar localStorage de local_inspections y sync_queue.
2. Entrar a /inspection/start.
3. Iniciar con asistente.
4. Completar flujo saltando foto o adjuntando foto.
5. Enviar.
6. Confirmar /inspection/success.
7. Confirmar POST /api/mobile/sync.
8. Confirmar que la respuesta del batch trae SYNCED.
9. Confirmar GET /api/inspections muestra la inspección real.
10. Confirmar GET /api/inspections/:id/findings muestra hallazgos reales.
11. Confirmar GET /api/mobile/sync con materializedOperationCounts.
```

### Caso offline

```txt
1. Cargar bootstrap una vez con API viva.
2. Cortar API o red.
3. Entrar a /inspection/chat.
4. Completar flujo.
5. Enviar.
6. Confirmar éxito visual.
7. Confirmar local_inspections:v1 y sync_queue:v1.
8. Levantar API.
9. Volver a /inspection/dashboard.
10. Confirmar POST /api/mobile/sync.
11. Confirmar operaciones SYNCED.
12. Confirmar inspección y hallazgos en DB/API.
```

## Pendientes secuenciales

### Iteración siguiente 1: QA de materialización e idempotencia

- Probar `/inspection/chat` online.
- Probar `/inspection/chat` offline con bootstrap previo.
- Confirmar que `CREATE_INSPECTION`, `CREATE_INSPECTION_FINDING`, `UPSERT_INSPECTION_ANSWER`, `CLOSE_INSPECTION` y `UPLOAD_ATTACHMENT` responden como corresponde.
- Probar reintento del mismo batch y mismo localId.
- Persistir tabla de idempotencia si se quiere sobrevivir reinicio de API.

### Iteración siguiente 2: evidencias offline completas native

- Persistir binarios en FileSystem en native.
- Agregar hash/checksum y tamaño real.
- En web/dev mantener metadata y sourceUri en localStorage.
- Resolver subida real desde worker/sync.

### Iteración siguiente 3: SQLite native

- Crear driver SQLite para native.
- Mantener localStorage solo en web/dev.
- Migrar catálogos, inspecciones locales y cola.

### Iteración siguiente 4: fidelidad visual 100%

Comparar contra `docs/references/Levantamiento de inspecciones.html`:

- header y status bar
- progress bar
- burbujas bot/usuario
- chips
- quick options
- propuesta IA
- foto card
- criticidad/SLA
- submit widget
- input inferior

Ajustar tokens, spacing, radius, sombras y estados resueltos/deshabilitados.

## Notas importantes

- El worker actual es dev/in-memory y materializa inmediatamente.
- Service Bus real sigue pendiente para producción.
- La idempotencia localId -> remoteId vive en memoria; si se reinicia la API puede duplicar registros ante reenvío.
- El almacenamiento dev sigue en localStorage; SQLite es una iteración posterior para native.
