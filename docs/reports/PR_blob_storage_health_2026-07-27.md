# Blob Storage Health Check (API)

## Titulo sugerido del PR
feat(api): add real Azure Blob storage health probe for files module

## Resumen
Este PR reemplaza el health de storage basado en filesystem local por un probe real contra Azure Blob Storage.

El endpoint ahora valida conectividad y permisos efectivos sobre Blob mediante una prueba de escritura, lectura y eliminacion de un blob temporal.

## Contexto
- Antes: `GET /api/files/health` validaba solo `uploads` local del hosting.
- Ahora: `GET /api/files/health` valida el storage real de Azure configurado por variables `STORAGE_*`.

## Cambios incluidos
- `apps/api/src/modules/files/files.service.ts`
  - `healthCheck()` ahora usa `BlobServiceClient`.
  - Lee configuracion:
    - `STORAGE_CONNECTION_STRING`
    - `STORAGE_ACCOUNT_NAME`
    - `STORAGE_CONTAINER_DOCUMENTS` (fallback a `STORAGE_CONTAINER_EVIDENCES`)
  - Ejecuta probe real:
    - upload de blob temporal
    - download para validar roundtrip
    - delete del blob temporal
  - Respuesta actualizada con metadatos de Blob:
    - `provider: azure_blob`
    - `accountName`
    - `containerName`
    - `probeBlobPath`
    - `checkedAt`
- `apps/api/package.json`
  - agrega dependencia `@azure/storage-blob`.
- `pnpm-lock.yaml`
  - lockfile sincronizado.

## Resultado esperado
- Si credenciales/permisos de Blob son correctos, responde `200` con `provider: azure_blob`.
- Si falta configuracion o falla acceso al contenedor, responde `503` con detalle del error.

## Riesgo
Bajo a medio.

Afecta solo el endpoint de health de files; no cambia el flujo funcional de upload/download existente.

## Validacion realizada
- Build API: `pnpm --filter api build`.
- Lint API: `pnpm --filter api lint`.
- Typecheck API: `pnpm --filter api exec tsc -p tsconfig.json --noEmit`.
- Lockfile actualizado: `pnpm install --lockfile-only`.

## Como probar manualmente
1. Obtener token:
   - `POST /api/auth/login`
2. Invocar health:
   - `GET /api/files/health`
   - Header `Authorization: Bearer <token>`
3. Verificar respuesta:
   - `status: "ok"`
   - `provider: "azure_blob"`

## Checklist
- [x] Probe real de Blob implementado (write/read/delete)
- [x] Dependencia de Azure agregada
- [x] Lockfile actualizado
- [ ] Confirmar checks de CI y smoke en entorno dev