# Rate limit iteration - 2026-06-29

## Objetivo

Permitir trabajar localmente con rate limit simple en memoria y preparar producción para rate limit persistente y compartido entre instancias.

## Cambios aplicados

Se agregó la migración:

```txt
apps/api/src/database/migrations/1782490000000-CreateRateLimitBuckets.ts
```

La migración crea la tabla:

```txt
rate_limit_buckets
```

Se actualizó:

```txt
apps/api/src/shared/security/http-security.ts
apps/api/src/config/configuration.ts
apps/api/src/main.ts
```

## Modos disponibles

### Dev/local

Por defecto se usa memoria:

```txt
API_RATE_LIMIT_STORE=memory
```

Este modo no requiere migración ni servicios externos. Sirve para desarrollo local y smoke tests.

### Producción

Para producción se puede usar Postgres como storage compartido:

```txt
API_RATE_LIMIT_STORE=database
```

Este modo usa `rate_limit_buckets` y permite que varias instancias de la API compartan el mismo contador.

## Variables

```txt
API_RATE_LIMIT_STORE=memory|database
API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX=180
```

## Comportamiento

La llave del contador se calcula por:

```txt
ip + method + path
```

La respuesta incluye:

```txt
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
```

Cuando el contador supera el máximo configurado, responde:

```txt
429 Too many requests
```

## Nota de producción

Para producción real también puede evaluarse Redis si la infraestructura lo ofrece, pero esta iteración deja una alternativa persistente con Postgres y una alternativa local liviana en memoria.
