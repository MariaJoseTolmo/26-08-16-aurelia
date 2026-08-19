# ARCHITECTURE

## Visión general

Monorepo con `pnpm workspaces` + `Turborepo`. Cuatro aplicaciones desplegables de forma independiente y un package compartido de contratos.

```txt
/apps
  /api                  NestJS + TypeORM + PostgreSQL (API central)
  /web                  React + Vite (web por roles)
  /mobile-inspecciones  React Native + Expo (inspecciones en terreno)
  /mobile-incidentes    React Native + Expo (incidentes en terreno)
/packages
  /contracts            @aurelia/contracts (enums, types, interfaces, DTOs, schemas)
/docs                   Documentación de equipos
docker-compose.yml      PostgreSQL local
turbo.json              Orquestación de tareas
pnpm-workspace.yaml     Definición del workspace
tsconfig.base.json      Config TypeScript compartida (strict)
```

## Stack

| Capa | Tecnología |
| --- | --- |
| Monorepo | pnpm workspaces, Turborepo |
| Backend | NestJS 11, TypeScript, TypeORM 0.3, PostgreSQL |
| Web | React 18.3, Vite 6, TypeScript |
| Mobile inspecciones | Expo SDK 54, React Native 0.81, React 19.1, TypeScript |
| Mobile incidentes | Expo SDK 52, React Native 0.76, React 18.3, TypeScript |
| Contratos | TypeScript puro (dual build ESM + CJS) |
| Estado (web) | TanStack Query + Zustand (ver STATE_MANAGEMENT.md) |

Todo el código es **TypeScript en modo estricto** (`tsconfig.base.json`).

## Estado funcional por app (2026-07)

- `apps/web`: desarrollo activo principalmente en módulo de inspecciones.
- `apps/mobile-inspecciones`: desarrollo activo (flujo principal de inspecciones).
- `apps/mobile-incidentes`: base técnica y placeholders; no es foco actual de implementación funcional.
- `apps/api`: evolución por fases, con módulos en diferentes niveles de madurez según dominio.

## Flujo de datos

```txt
  Web (React)          Mobile (Expo)
       \                   /
        \                 /   HTTP (JSON)
         v               v
            API (NestJS)
                 |
                 v
          PostgreSQL (TypeORM)

  Todos tipan sus requests/responses con @aurelia/contracts
```

- Web y móviles hablan con la API por HTTP usando los **request/response types** de `@aurelia/contracts`.
- La API valida la entrada con `class-validator` en DTOs que **implementan** las interfaces del contrato.
- Las entidades TypeORM viven **solo** en `apps/api` y nunca se comparten.

## Por qué un monorepo

Las apps comparten conceptos transversales (MUE, áreas, roles, estados, tipos, niveles de riesgo, evidencias, flujos de aprobación) y **los contratos HTTP**. El monorepo permite compartir esos contratos en tiempo de desarrollo/build, evitando duplicar enums, interfaces y tipos de request/response entre web, móviles y API.

Principio de desacople: **frontend y móviles no dependen de NestJS, TypeORM ni `class-validator`.** Solo consumen tipos agnósticos desde `@aurelia/contracts`.

## El package de contratos (dual build)

`@aurelia/contracts` se compila en dos formatos para que cada consumidor use el adecuado sin acoplarse a una versión de Node ni a un bundler concreto:

```jsonc
// packages/contracts/package.json
"exports": {
  ".": {
    "types":   "./dist/types/index.d.ts",
    "import":  "./dist/esm/index.js",   // bundlers: Vite (web), Metro (mobile)
    "require": "./dist/cjs/index.js"    // NestJS (CommonJS)
  }
}
```

- **ESM** (`dist/esm`) → lo consumen los bundlers de web/móvil; permite que Rollup/Metro tracen los named exports estáticamente.
- **CJS** (`dist/cjs`) → lo consume NestJS vía `require`.
- **Types** (`dist/types`) → declaraciones `.d.ts` compartidas.

> Por esto, `@aurelia/contracts` debe compilarse antes de levantar las apps: `pnpm build:contracts`.

Detalle de uso en [CONTRACTS_GUIDELINES.md](CONTRACTS_GUIDELINES.md).

## Orquestación con Turborepo

- `build` depende de `^build` (las apps se construyen después de `@aurelia/contracts`).
- `dev` levanta las apps; durante el desarrollo conviene tener `@aurelia/contracts` en watch.
- CI/CD puede construir/probar **solo lo afectado** por un cambio (`--filter='...[origin/main]'`). Ver [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md).

## Límites de dependencia (reglas duras)

| Regla | Estado |
| --- | --- |
| `@aurelia/contracts` no depende de NestJS, TypeORM, React, Expo, class-validator ni class-transformer | ✅ obligatorio |
| Entidades TypeORM solo en `apps/api` | ✅ obligatorio |
| Web/móvil solo importan tipos y enums desde contracts | ✅ obligatorio |
| Cada app tiene su propio `package.json` y se levanta sola | ✅ |
| El `package.json` raíz solo coordina workspace, scripts y tooling | ✅ |
