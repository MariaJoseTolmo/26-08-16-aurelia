# API — Aurelia Backend

NestJS API para el sistema Aurelia. Fase 1 cubre organización jerárquica, usuarios y roles.

## Requisitos previos

- Node.js 20+
- pnpm 9+
- Docker (para la base de datos)

## Variables de entorno

Crea `apps/api/.env` copiando el ejemplo:

```bash
cp apps/api/.env.example apps/api/.env
```

El archivo `.env` está en `.gitignore` y nunca se versiona.

## Puerto de la base de datos (importante)

El proyecto usa el puerto **5433** para PostgreSQL (no 5432) para evitar conflictos
con instalaciones locales de PostgreSQL en el host. Si en tu máquina hay un postgres
local corriendo (ej. instalación nativa en Windows/macOS), también usará el 5432 y las
conexiones de Node.js irán al local en lugar del container Docker.

Si en tu equipo no hay postgres local, puedes cambiar a 5432 en `docker-compose.yml`
y `apps/api/.env`, pero 5433 es el valor por defecto del proyecto para evitar el
conflicto silencioso.

## Setup inicial desde cero

```bash
# 1. Levantar la base de datos
docker compose up -d

# 2. Copiar variables de entorno
cp apps/api/.env.example apps/api/.env

# 3. Ejecutar migraciones
cd apps/api
pnpm migration:run

# 4. Insertar datos iniciales
pnpm seed
```

## Comandos de desarrollo

```bash
# Desde la raíz del monorepo
pnpm --filter api dev

# O desde apps/api
pnpm dev
```

## Migraciones (TypeORM)

Todos los comandos se ejecutan desde `apps/api/`.

```bash
# Ejecutar migraciones pendientes
pnpm migration:run

# Revertir la última migración
pnpm migration:revert

# Generar una nueva migración a partir de cambios en entidades
pnpm migration:generate

# Crear una migración vacía
pnpm migration:create
```

La migración `1719100000000-InitPhase1` crea:

| Tabla              | Descripción                              |
|--------------------|------------------------------------------|
| `business_units`   | Unidades de negocio                      |
| `gerencias`        | Gerencias (hijo de business_unit)        |
| `areas`            | Áreas (hijo de gerencia)                 |
| `sectors`          | Sectores (hijo de área)                  |
| `locations`        | Ubicaciones físicas (hijo de sector)     |
| `companies`        | Empresas / contratistas                  |
| `roles`            | Roles del sistema                        |
| `permissions`      | Permisos granulares                      |
| `users`            | Usuarios                                 |
| `user_roles`       | Pivot usuario–rol                        |
| `user_companies`   | Pivot usuario–empresa                    |
| `user_areas`       | Pivot usuario–área                       |
| `role_permissions` | Pivot rol–permiso                        |

## Seeds

Inserta datos iniciales idempotentes — se puede ejecutar múltiples veces sin duplicar:

```bash
pnpm seed
```

El seed crea:

- 5 roles del sistema: `ADMIN`, `SUPERVISOR`, `INSPECTOR`, `APPROVER`, `VIEWER`
- 8 permisos base (ver tabla abajo) asignados al rol `ADMIN`
- 1 empresa principal: código `CORP`
- 1 unidad de negocio: código `BU-001`
- 1 usuario admin: `admin@aurelia.local` con rol `ADMIN`

### Permisos base

| Código               | Módulo       | Acción |
|----------------------|--------------|--------|
| `organization:read`  | organization | read   |
| `organization:write` | organization | write  |
| `users:read`         | users        | read   |
| `users:write`        | users        | write  |
| `roles:read`         | roles        | read   |
| `roles:write`        | roles        | write  |
| `permissions:read`   | permissions  | read   |
| `permissions:write`  | permissions  | write  |

Los roles `SUPERVISOR`, `INSPECTOR`, `APPROVER` y `VIEWER` se crean sin permisos —
se asignarán en fases posteriores cuando se definan los módulos correspondientes.

## Estrategia de `updated_at`

**Estado actual (Fase 1):** todas las tablas tienen `updated_at timestamptz NOT NULL DEFAULT now()`.
El valor se actualiza mediante `@UpdateDateColumn` de TypeORM, que emite `UPDATE … SET updated_at = now()` en cada `save()`.
No existe trigger de BD — TypeORM es la única fuente de verdad para este campo.

**Decisión para Fase 2 (endpoints UPDATE):** seguir con `@UpdateDateColumn`.

Razones:
- La aplicación ya controla todas las escrituras a través del ORM; no hay acceso directo a la BD.
- Un trigger añadiría infraestructura sin beneficio real en este stack.
- Si en el futuro se necesitan escrituras directas (scripts de migración, jobs externos), se añade el trigger en ese momento con una migración puntual.

**Consecuencia práctica:** los endpoints `PATCH`/`PUT` de Fase 2 no requieren ningún cambio adicional en la capa de BD; `@UpdateDateColumn` se dispara automáticamente en cualquier `repository.save()`.

## Build y lint

```bash
pnpm build   # compila a dist/ usando nest build
pnpm lint    # eslint src
```

## Endpoints Fase 1

| Método | Ruta                          | Descripción                         |
|--------|-------------------------------|-------------------------------------|
| GET    | `/api/health`                 | Estado del servicio                 |
| GET    | `/api/me`                     | Usuario actual (placeholder)        |
| GET    | `/api/organization/companies` | Listar empresas                     |
| POST   | `/api/organization/companies` | Crear empresa                       |
| GET    | `/api/organization/business-units` | Listar BUs                     |
| POST   | `/api/organization/business-units` | Crear BU                       |
| GET    | `/api/organization/gerencias` | Listar gerencias                    |
| POST   | `/api/organization/gerencias` | Crear gerencia                      |
| GET    | `/api/organization/areas`     | Listar áreas                        |
| POST   | `/api/organization/areas`     | Crear área                          |
| GET    | `/api/organization/sectors`   | Listar sectores                     |
| POST   | `/api/organization/sectors`   | Crear sector                        |
| GET    | `/api/organization/locations` | Listar ubicaciones                  |
| POST   | `/api/organization/locations` | Crear ubicación                     |
| GET    | `/api/users`                  | Listar usuarios                     |
| POST   | `/api/users`                  | Crear usuario                       |
| POST   | `/api/users/:id/roles`        | Asignar rol a usuario               |
| POST   | `/api/users/:id/companies`    | Asignar empresa a usuario           |
| POST   | `/api/users/:id/areas`        | Asignar área a usuario              |
| GET    | `/api/roles`                  | Listar roles                        |
| POST   | `/api/roles`                  | Crear rol                           |
| GET    | `/api/permissions`            | Listar permisos                     |
| POST   | `/api/permissions`            | Crear permiso                       |
| POST   | `/api/roles/:id/permissions`  | Asignar permiso a rol               |
