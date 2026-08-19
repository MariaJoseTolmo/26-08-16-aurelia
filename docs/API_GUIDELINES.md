# API_GUIDELINES

Convenciones para el backend (`apps/api`): NestJS 11 + TypeORM 0.3 + PostgreSQL.

## Estructura modular

```txt
apps/api/src
  /config        Configuración (env → configuration.ts)
  /database      DatabaseModule, DataSource (CLI) y migraciones
  /modules
    /<dominio>
      /dto         DTOs con class-validator (implements del contrato)
      /entities    Entidades TypeORM (PLACEHOLDER por ahora)
      <dominio>.module.ts
      <dominio>.controller.ts
      <dominio>.service.ts
  main.ts
  app.module.ts
```

Un módulo de Nest por dominio. Módulos placeholder ya creados: `auth`, `users`, `roles`, `areas`, `mue`, `critical-controls`, `inspections`, `incidents`, `evidences`, `workflows`, `notifications`, `reports`, `ai`.

## DTOs y validación

- Los DTOs usan `class-validator` / `class-transformer` y **`implements` la interfaz del contrato** correspondiente de `@aurelia/contracts`.
- `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted` y `transform` (ver [main.ts](../apps/api/src/main.ts)).
- Reutilizar enums y `schemas` (constraints) desde `@aurelia/contracts` dentro de los decoradores.

Ejemplo: [create-inspection.dto.ts](../apps/api/src/modules/inspections/dto/create-inspection.dto.ts). Patrón detallado en [CONTRACTS_GUIDELINES.md](CONTRACTS_GUIDELINES.md).

## Respuestas

- Los controllers devuelven los **response types** de `@aurelia/contracts` (p. ej. `InspectionResponse`).
- Mapear entidad → response en el service (no exponer la entidad TypeORM directamente). Ejemplo: `toResponse()` en [inspections.service.ts](../apps/api/src/modules/inspections/inspections.service.ts).

## Entidades (estado actual)

> Las entidades existentes son **PLACEHOLDERS marcados**. El modelo relacional definitivo no está definido. **No** generar migraciones de dominio a partir de ellas todavía. Cada archivo de entidad lleva un banner que lo indica.

Cuando se defina el modelo:

1. Diseñar entidades + relaciones.
2. Generar migración (`migration:generate`).
3. Revisar la migración antes de aplicarla.

## Base de datos y migraciones

- Conexión configurada en [database.module.ts](../apps/api/src/database/database.module.ts) vía `ConfigService`.
- **El esquema se versiona con migraciones, no con `synchronize`.** `synchronize` está en `false` por defecto y solo se habilita con `DB_SYNCHRONIZE=true` (uso de prototipado local).
- DataSource del CLI: [data-source.ts](../apps/api/src/database/data-source.ts). Migraciones en `apps/api/src/database/migrations/`.

```bash
pnpm --filter api migration:generate
pnpm --filter api migration:run
pnpm --filter api migration:revert
```

PostgreSQL local con Docker: `docker compose up -d`.

## Configuración / entorno

- Variables vía `@nestjs/config` + `configuration.ts`. Plantilla en `apps/api/.env.example`.
- Prefijo global `api` y puerto desde `PORT`.

## Límites de dependencia

- Las entidades TypeORM viven **solo** aquí; nunca se exportan a contracts ni a las apps cliente.
- La API puede depender de `@aurelia/contracts`, pero `@aurelia/contracts` **nunca** depende de la API.

## Calidad

- `pnpm --filter api lint` y `pnpm --filter api build` deben pasar.
- No introducir lógica de negocio compleja hasta definir el modelo (fase actual: skeleton).
