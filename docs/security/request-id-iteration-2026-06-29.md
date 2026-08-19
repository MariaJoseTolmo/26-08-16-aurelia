# Request ID / Correlation ID iteration - 2026-06-29

## Objetivo

Permitir rastrear una operación entre respuesta HTTP, logs internos y auditoría sin exponer detalles sensibles al usuario.

## Cambios aplicados

Se agregó:

```txt
apps/api/src/shared/security/request-id.middleware.ts
```

Se actualizó:

```txt
apps/api/src/main.ts
apps/api/src/shared/security/sanitized-exception.filter.ts
apps/api/src/modules/audit/audit-http.interceptor.ts
```

## Comportamiento

Cada request recibe un identificador en:

```txt
request.requestId
```

La API responde siempre con:

```txt
X-Request-Id
```

Si el cliente envía `X-Request-Id` y cumple el formato permitido, se reutiliza. Si no, se genera uno nuevo con UUID.

## Formato permitido

```txt
[a-zA-Z0-9._:-]
longitud 8 a 120 caracteres
```

## Errores sanitizados

Las respuestas de error incluyen `requestId` cuando está disponible:

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error",
  "path": "/api/example",
  "timestamp": "2026-06-29T00:00:00.000Z",
  "requestId": "..."
}
```

## Auditoría

El `requestId` queda guardado en `audit_logs.metadata.requestId` para eventos críticos.

## Logs internos

Los errores 5xx se registran incluyendo el `requestId`, para cruzar lo que ve el usuario con el log interno sin revelar stack trace ni detalles técnicos en la respuesta HTTP.

## Nota

Este bloque no reemplaza trazabilidad distribuida completa. Deja la base para integrar después OpenTelemetry, tracing distribuido o logs estructurados JSON.
