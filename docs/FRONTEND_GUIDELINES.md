# FRONTEND_GUIDELINES

Convenciones para la web (`apps/web`): React 18 + Vite 6 + TypeScript estricto.

## Estructura

```txt
apps/web/src
  /app          Shell de la aplicación (layout, providers)
  /routes       Definición de rutas (react-router)
  /modules      Un folder por módulo de negocio
    /dashboard
    /inspections
    /incidents
    /critical-controls
    /reports
    /admin
  /shared
    /components  Componentes reutilizables transversales
    /hooks       Hooks reutilizables (incluye hooks de TanStack Query)
    /services    Acceso HTTP (http-client + services por dominio)
    /stores      Stores de Zustand (UI/cliente)
    /utils       Utilidades puras
  main.tsx
```

## UI kit

Aún **no hay UI kit instalado**. Cuando se integre un diseño desde Figma Make u otra fuente, se debe seguir el brief [FIGMA_MAKE_BRIEF.md](FIGMA_MAKE_BRIEF.md) — en particular: layout responsive con Tailwind grid/flex (no posiciones absolutas con anchos fijos) y reutilización de cualquier componente base que se instale.

## Principios

- **Organización por módulo de negocio**, no por tipo de archivo. Cada módulo agrupa sus páginas, componentes y hooks.
- Lo que se comparte entre módulos sube a `shared/`.
- **TypeScript estricto** (heredado de `tsconfig.base.json`): nada de `any` implícito; usa los tipos de `@aurelia/contracts`.
- Componentes en **PascalCase** (`InspectionsPage.tsx`); hooks en `useX.ts`; utilidades en `kebab-case.ts`.

## Datos y estado

- **Server state → TanStack Query**, **UI/cliente → Zustand**. Ver [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md).
- Nunca llamar `fetch` directo desde un componente: usar los services de `shared/services` y envolverlos en hooks de query.
- Tipar todas las llamadas con los request/response de `@aurelia/contracts`.

## Capa HTTP

Existe un `http-client` base ([http-client.ts](../apps/web/src/shared/services/http-client.ts)) y un service de ejemplo ([inspections.service.ts](../apps/web/src/shared/services/inspections.service.ts)).

- La URL base sale de `import.meta.env.VITE_API_URL`.
- Un service por dominio expone funciones tipadas; los hooks de TanStack Query las consumen.

## Roles y permisos

- El rol del usuario usa el enum `Role` de `@aurelia/contracts`.
- Helpers de presentación/permisos en `shared/utils` (ver [roles.ts](../apps/web/src/shared/utils/roles.ts)).
- La UI debe prepararse para **renderizado condicional por rol** (rutas, acciones, navegación). La matriz definitiva de permisos se definirá con las reglas de negocio.

## Rutas

- Definidas en `routes/` con `react-router`. Rutas placeholder ya creadas por módulo.
- Preparar rutas para protección por rol cuando exista auth.

## Contratos: regla de desacople

La web **solo** importa tipos/enums desde `@aurelia/contracts`. **Prohibido** importar nada de `apps/api`, NestJS, TypeORM o `class-validator`. Ver [CONTRACTS_GUIDELINES.md](CONTRACTS_GUIDELINES.md).

## Calidad

- `pnpm --filter web lint` y `pnpm --filter web build` deben pasar.
- Mantener componentes pequeños y con una responsabilidad.
- Estados de carga/vacío/error explícitos (ver [UI_UX_GUIDELINES.md](UI_UX_GUIDELINES.md)).
