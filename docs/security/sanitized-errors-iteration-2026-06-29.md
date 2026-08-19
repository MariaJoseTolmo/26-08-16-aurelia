# Sanitized errors iteration - 2026-06-29

## Objetivo

Evitar que la API exponga detalles internos o información sensible en respuestas de error.

## Cambios aplicados

Se agregó:

```txt
apps/api/src/shared/security/sanitized-exception.filter.ts
```

Se registró globalmente en:

```txt
apps/api/src/main.ts
```

## Información que no debe exponerse

El filtro evita devolver mensajes que contengan referencias a:

```txt
password
token
secret
hash
authorization
bearer
refresh
jwt
sql
query
database
constraint
duplicate key
violates
stack
```

## Respuestas sanitizadas

Errores no HTTP o errores 5xx se devuelven como:

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error",
  "path": "/api/example",
  "timestamp": "2026-06-29T00:00:00.000Z"
}
```

`404`, `409`, `401` y `403` usan mensajes genéricos:

```txt
Resource not found
Conflict
Unauthorized
Forbidden
```

Los errores de validación `400` pueden conservar mensajes de validación cuando no contienen patrones sensibles.

## Logs internos

Los errores 5xx se registran en logs internos con stack trace. La respuesta HTTP no incluye stack trace ni detalles técnicos.

## Pendiente

Agregar `requestId/correlationId` para poder rastrear errores entre respuesta, logs y auditoría sin exponer detalles internos.
