# Aurelia

Plataforma ambiental centralizada para gestión de controles críticos, inspecciones, incidentes, evidencias, flujos de aprobación, reportabilidad, alertas y asistencia con IA.

Monorepo con `pnpm workspaces` + `Turborepo`. Las apps se despliegan de forma independiente pero comparten contratos de tipos en tiempo de desarrollo/build mediante `@aurelia/contracts`.

## Punto de entrada recomendado para IA

Si un desarrollador trabaja con IA, el **README raiz no debe ser la unica lectura**. Este archivo funciona como puerta de entrada y debe llevar a la IA al recorrido correcto segun el foco del dia.

Orden minimo obligatorio despues de leer este archivo:

1. [docs/START_HERE.md](docs/START_HERE.md)
2. [docs/ONBOARDING_PLAYBOOK.md](docs/ONBOARDING_PLAYBOOK.md)
3. [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)
4. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
5. [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md)

## Estado funcional actual (2026-07)

- Foco funcional activo: `apps/web` en modulo de inspecciones y `apps/mobile-inspecciones`.
- `apps/mobile-incidentes` y modulo web de incidentes estan en estado parcial / placeholder.
- API y base de datos evolucionan por fases; cualquier cambio debe mantener consistencia con `@aurelia/contracts`.

## Rutas de lectura por foco de trabajo

Usar estas rutas cuando el desarrollador le diga a su IA algo como: "hoy trabajaremos en el modulo X".

### Foco: inspecciones web

Leer en este orden:

1. [docs/START_HERE.md](docs/START_HERE.md)
2. [docs/ONBOARDING_PLAYBOOK.md](docs/ONBOARDING_PLAYBOOK.md)
3. [docs/FRONTEND_GUIDELINES.md](docs/FRONTEND_GUIDELINES.md)
4. [docs/STATE_MANAGEMENT.md](docs/STATE_MANAGEMENT.md)
5. [docs/UI_UX_GUIDELINES.md](docs/UI_UX_GUIDELINES.md)
6. [docs/CONTRACTS_GUIDELINES.md](docs/CONTRACTS_GUIDELINES.md)

### Foco: mobile-inspecciones

Leer en este orden:

1. [docs/START_HERE.md](docs/START_HERE.md)
2. [docs/ONBOARDING_PLAYBOOK.md](docs/ONBOARDING_PLAYBOOK.md)
3. [docs/MOBILE_OFFLINE_STRATEGY.md](docs/MOBILE_OFFLINE_STRATEGY.md)
4. [docs/MOBILE_OFFLINE_STORAGE_MIGRATION_PLAN.md](docs/MOBILE_OFFLINE_STORAGE_MIGRATION_PLAN.md)
5. [docs/CONTRACTS_GUIDELINES.md](docs/CONTRACTS_GUIDELINES.md)

### Foco: incidentes web o mobile

Leer en este orden:

1. [docs/START_HERE.md](docs/START_HERE.md)
2. [docs/ONBOARDING_PLAYBOOK.md](docs/ONBOARDING_PLAYBOOK.md)
3. [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)
4. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
5. [docs/CONTRACTS_GUIDELINES.md](docs/CONTRACTS_GUIDELINES.md)
6. [docs/FRONTEND_GUIDELINES.md](docs/FRONTEND_GUIDELINES.md) o [docs/MOBILE_OFFLINE_STRATEGY.md](docs/MOBILE_OFFLINE_STRATEGY.md), segun app

Restriccion actual:

- Incidentes no esta habilitado para expansion funcional nueva sin autorizacion explicita.
- Solo se permiten hoy tareas de mantenimiento tecnico, alineacion de contratos, calidad, sync, docs o deuda critica.

### Foco: API / contratos / DB

Seguir la ruta indicada en [docs/START_HERE.md](docs/START_HERE.md) segun el tipo de cambio.

## Regla de cierre documental

Cada cambio implementado debe cerrar con:

1. Reporte de archivos tocados.
2. Comandos ejecutados y resultado.
3. Riesgos o pendientes.
4. Si hay drift o decision nueva, actualizar documentacion relevante o registrar la deuda en [docs/DOCS_CLEANUP_BACKLOG.md](docs/DOCS_CLEANUP_BACKLOG.md).

## Estructura

```txt
/apps
  /api                  NestJS + TypeORM + PostgreSQL (API central)
  /web                  React + Vite (web por roles)
  /mobile-inspecciones  React Native + Expo (registro de inspecciones en terreno)
  /mobile-incidentes    React Native + Expo (registro de incidentes en terreno)
/packages
  /contracts            @aurelia/contracts: enums, interfaces, types, DTOs, schemas (agnóstico)
```

## Arquitectura de contratos compartidos

`@aurelia/contracts` es la **única fuente de verdad** para la forma de los datos. No depende de NestJS, TypeORM ni `class-validator`.

- **`enums/`** — valores compartidos (`InspectionStatus`, `IncidentRiskLevel`, `Role`, etc.). Emiten JS, usables como valor y como tipo.
- **`interfaces/` y `types/`** — modelos de dominio y utilidades. Solo tipos: se eliminan al compilar (cero peso en web/móvil).
- **`dtos/`** — `*.request.ts` y `*.response.ts` agnósticos (request/response HTTP).
- **`schemas/`** — restricciones de validación compartidas (longitudes/límites) como objetos planos, sin dependencias.

### ¿Cómo conviven con los DTOs de NestJS y `class-validator`?

Los DTOs del backend viven **solo** en `apps/api` y `implements` la interfaz del contrato:

```ts
// @aurelia/contracts (agnóstico)
export interface CreateInspectionRequest { title: string; type: InspectionType; areaId: string; ... }

// apps/api (acoplado a Nest, alineado por el compilador)
export class CreateInspectionDto implements CreateInspectionRequest {
  @IsString() @MinLength(InspectionConstraints.title.minLength) title: string;
  @IsEnum(InspectionType) type: InspectionType;   // enum importado de contracts
  @IsUUID() areaId: string;
}
```

- El `implements` hace que **TypeScript falle en build** si el DTO se desvía del contrato.
- Los decoradores de `class-validator` viven solo en el backend; el contrato nunca los ve.
- Frontend/móviles importan únicamente tipos y enums → no se acoplan a NestJS.
- Las entidades TypeORM viven solo en `apps/api`; **nunca** se comparten.

### Import esperado (funciona en las 4 apps)

```ts
import { InspectionStatus, CreateInspectionRequest } from '@aurelia/contracts';
```

`@aurelia/contracts` se compila a `dist/` (CommonJS + `.d.ts`); las apps lo resuelven vía symlink del workspace. **Por eso hay que compilarlo al menos una vez antes de levantar las apps.**

## Requisitos

- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm`)
- PostgreSQL (para la API)
- Expo Go o un emulador (para las apps móviles)

## Instalación

```bash
pnpm install
pnpm build:contracts   # compila @aurelia/contracts una vez (requerido antes de dev)
```

> `@aurelia/contracts` se publica como **dual package**: ESM (`dist/esm`, condición `import`) para los bundlers de web/móvil y CommonJS (`dist/cjs`, condición `require`) para NestJS. Por eso debe compilarse antes de levantar las apps.

## Base de datos (Docker)

Levanta PostgreSQL local con Docker:

```bash
docker compose up -d        # postgres en localhost:5433
docker compose down         # detener
docker compose down -v      # detener y borrar datos
```

Los valores se toman de variables de entorno (con defaults): `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`.

## Migraciones (TypeORM)

El esquema se gestiona con **migraciones**, no con `synchronize`. `synchronize` está deshabilitado por defecto y solo se activa de forma explícita con `DB_SYNCHRONIZE=true` (útil para prototipar en local).

```bash
# Genera una migración a partir del diff entre entidades y BD
pnpm --filter api migration:generate

# Crea una migración vacía
pnpm --filter api migration:create

# Aplica / revierte
pnpm --filter api migration:run
pnpm --filter api migration:revert
```

El DataSource del CLI está en [apps/api/src/database/data-source.ts](apps/api/src/database/data-source.ts) y las migraciones en `apps/api/src/database/migrations/`.

## Levantar cada app

```bash
# Contratos en modo watch (recomendado en una terminal aparte durante el desarrollo)
pnpm --filter @aurelia/contracts dev

# API (configura apps/api/.env a partir de apps/api/.env.example)
pnpm dev:api                  # http://localhost:3000/api

# Web
pnpm dev:web                  # http://localhost:5173

# Móvil inspecciones
pnpm dev:mobile-inspecciones  # abre Expo

# Móvil incidentes
pnpm dev:mobile-incidentes    # abre Expo
```

Para levantar todo en paralelo con Turborepo:

```bash
pnpm dev
```

## Compilar

```bash
pnpm build          # turbo build (respeta el orden: contracts primero)
pnpm lint
pnpm test
```

## Variables de entorno

| App                  | Archivo               | Variables                                  |
| -------------------- | --------------------- | ------------------------------------------ |
| api                  | `apps/api/.env`       | `PORT`, `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` |
| web                  | `apps/web/.env`       | `VITE_API_URL`                             |
| mobile-inspecciones  | `apps/mobile-inspecciones/.env` | `EXPO_PUBLIC_API_URL`            |
| mobile-incidentes    | `apps/mobile-incidentes/.env`   | `EXPO_PUBLIC_API_URL`            |

Copia cada `.env.example` a `.env` y ajusta los valores.

## Endpoints de ejemplo (API)

- `GET  /api/inspections`
- `POST /api/inspections`
- `PATCH /api/inspections/:id/status`
- `GET  /api/incidents`
- `POST /api/incidents`
- `GET  /api/reports/summary`

> La API no depende de `synchronize`. El esquema se versiona con migraciones de TypeORM (ver sección anterior).

## CI/CD por app afectada

Turborepo permite construir/probar solo lo afectado por un cambio:

```bash
pnpm turbo run build --filter='...[origin/main]'
pnpm turbo run lint test --filter='...[origin/main]'
```

Esto habilita pipelines que despliegan `api`, `web`, `mobile-inspecciones` y `mobile-incidentes` de forma independiente según los paquetes modificados (incluyendo cambios en `@aurelia/contracts`, que afecta a todos sus consumidores).
