# FIGMA_MAKE_BRIEF — Instrucciones para generar diseños del repo Aurelia

> **Este documento se adjunta en cada solicitud a Figma Make.** El repo `Aurelia` está clonado en el chat. Antes de generar cualquier código, **lee este brief completo** y respétalo sin excepción.

---

## 0. Pregunta obligatoria antes de generar nada

**Antes de producir ningún diseño o código, pregunta al usuario:**

1. **¿A cuál app del monorepo va este diseño?**
   - `apps/web` — Web central por roles (React 18 + Vite + Tailwind v4 + shadcn/ui).
  - `apps/mobile-inspecciones` — App móvil de inspecciones (React Native + Expo SDK 54).
   - `apps/mobile-incidentes` — App móvil de incidentes (React Native + Expo SDK 52).

2. **¿A qué módulo de negocio pertenece?** (`dashboard`, `inspections`, `incidents`, `critical-controls`, `evidences`, `workflows`, `reports`, `admin`).

3. **¿Es una pantalla nueva, una modificación, o un componente reutilizable?**

No asumas. Si falta contexto, pide más antes de generar.

---

## 1. Reglas duras (no se negocian)

### 1.1 Stack obligatorio por app

| App | Framework | Estilos | Componentes base |
| --- | --- | --- | --- |
| `apps/web` | React 18.3 + Vite 6 + TS estricto | **Tailwind CSS v4** (tokens en `src/styles/theme.css`) | **shadcn/ui** instalado en `src/app/components/ui` |
| `apps/mobile-inspecciones` | React Native 0.81 + Expo SDK 54 + TS estricto | StyleSheet de RN | Componentes propios en `src/modules` y `src/shared/components` |
| `apps/mobile-incidentes` | React Native 0.76 + Expo SDK 52 + TS estricto | StyleSheet de RN | Componentes propios en `src/screens` y `src/shared/components` |

### 1.2 Layout responsive (REQUISITO CRÍTICO)

**Prohibido** generar layouts con posiciones absolutas y anchos fijos en píxeles (estilo export pixel-perfect de Figma). Esto rompió ya una vez la integración.

**Obligatorio en web:**

- Usar **Tailwind grid/flex** para layouts (`grid`, `flex`, `grid-cols-*`, `gap-*`).
- Anchos relativos: `w-full`, `max-w-*`, `min-w-*`, breakpoints (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`).
- Cards/widgets dentro de un grid responsive (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- Sidebar fijo con altura `h-screen` o `min-h-screen`; contenido principal con `flex-1` y `overflow-auto`.
- **Nada** de `position: absolute` con `left: 220px; w: 1060px;` para layouts principales.

**Obligatorio en mobile:**

- `flex` de RN, dimensiones relativas (`flex: 1`, `'100%'`).
- Usar `useWindowDimensions()` cuando se necesite el ancho real.
- Targets táctiles mínimo 44pt; tipografía legible al sol.

### 1.3 Contratos compartidos — `@aurelia/contracts`

**Es la única fuente de verdad de tipos** entre web, móvil y API. Vive en `packages/contracts`.

Reglas:

- **Toda interface de dominio, enum o tipo de request/response** debe importarse desde `@aurelia/contracts`. Nunca redefinir tipos localmente.
- Si necesitas un tipo que no existe en contracts: **propón agregarlo en `packages/contracts/src`** (carpeta correspondiente: `enums/`, `interfaces/`, `dtos/<dominio>/`) en vez de duplicarlo.
- Importar como **`import type`** cuando solo se usa el tipo (mejor tree-shaking). Los enums que se usan como valor van con `import` normal.
- **Prohibido** importar nada de `apps/api`, NestJS, TypeORM, `class-validator` ni `class-transformer` desde web/mobile.

**Lo que ya existe en contracts (NO redefinir):**

```
enums/
  role.enum.ts                  → Role (ADMIN, SUPERVISOR, INSPECTOR, APPROVER, VIEWER)
  inspection-status.enum.ts     → InspectionStatus
  inspection-type.enum.ts       → InspectionType
  incident-status.enum.ts       → IncidentStatus
  incident-type.enum.ts         → IncidentType
  incident-risk-level.enum.ts   → IncidentRiskLevel (LOW, MEDIUM, HIGH, CRITICAL)
  area-type.enum.ts             → AreaType
  mue-type.enum.ts              → MueType
  evidence-type.enum.ts         → EvidenceType
  workflow-status.enum.ts       → WorkflowStatus, ApprovalDecision

interfaces/
  entity.interface.ts           → BaseEntity
  user.interface.ts             → User
  mue.interface.ts              → Mue
  area.interface.ts             → Area
  critical-control.interface.ts → CriticalControl
  inspection.interface.ts       → Inspection
  incident.interface.ts         → Incident
  evidence.interface.ts         → Evidence
  workflow.interface.ts         → WorkflowStep

dtos/
  auth/ areas/ mue/ inspections/ incidents/ evidences/ workflows/ reports/
  (cada carpeta: create-*.request.ts, *.response.ts)
```

---

## 2. Arquitectura por app

### 2.1 `apps/web` — estructura obligatoria

```
apps/web/src
  /app
    App.tsx                       Shell (layout + providers)
    /components/ui                shadcn/ui (NO editar, ya instalado)
    /components/figma             helpers de assets (ImageWithFallback)
  /routes/router.tsx              Definición de rutas (react-router v7)
  /modules
    /<modulo>                     Un folder por módulo de negocio
      <Modulo>Page.tsx            Página principal del módulo
      /components                 Componentes específicos del módulo
      /hooks                      Hooks específicos del módulo
  /shared
    /components                   Componentes reutilizables transversales
    /hooks                        Hooks reutilizables (incluye los de TanStack Query)
    /services                     Acceso HTTP (http-client + un service por dominio)
    /stores                       Stores de Zustand (UI/cliente)
    /utils                        Utilidades puras (incluye roles.ts)
  /styles                         Tailwind + tokens (theme.css)
  /imports                        Código generado de Figma Make (NO editar, excluido del lint)
  main.tsx
```

**Alias `@/` → `src/`** (configurado en `vite.config.ts` y `tsconfig.json`).

### 2.2 `apps/mobile-*` — estructura obligatoria

```
apps/mobile-*/src
  App.tsx
  /screens                        Pantallas (InspectionFormScreen.tsx, etc.)
  /shared
    /services                     http-client + *.api.ts
    /storage                      Persistencia local (placeholder, AsyncStorage/SQLite/MMKV)
    /sync                         Cola de sincronización (placeholder)
    /components                   Componentes reutilizables transversales
    /hooks                        Hooks reutilizables
```

---

## 3. Patrones obligatorios

### 3.1 Manejo de estado (web y mobile)

**Separar siempre server state vs client state.** No mezclar.

| Tipo | Herramienta | Para |
| --- | --- | --- |
| Server state | **TanStack Query** | Datos de la API (inspecciones, incidentes, catálogos). Usa `useQuery` y `useMutation`. |
| Client/UI state | **Zustand** | Filtros activos, layout, sidebar colapsado, módulo activo, estado de formularios. |

Reglas:

- **Nunca llamar `fetch` directo desde un componente.** Siempre vía service (`shared/services`) envuelto en un hook (`shared/hooks` o `modules/<x>/hooks`).
- Query keys estables: `['inspections', { areaId, status }]`.
- Tras una mutación: `queryClient.invalidateQueries(...)` en `onSuccess`.
- **Prohibido duplicar datos del servidor en stores de Zustand.** Zustand solo guarda estado de cliente/UI.
- **No usar Redux.** Solo si aparece una necesidad real que las dos anteriores no cubran.

### 3.2 Capa HTTP (services)

- Un `http-client` base por app (web y cada móvil tienen el suyo en `shared/services/http-client.ts`).
- Un service por dominio (`inspections.service.ts`, `incidents.service.ts`, ...) que exporta funciones tipadas con `@aurelia/contracts`.
- En web la URL base sale de `import.meta.env.VITE_API_URL`.

Ejemplo (web):

```ts
import type { CreateInspectionRequest, InspectionResponse } from '@aurelia/contracts';
import { httpGet, httpPost } from './http-client';

export const listInspections = (filters?: InspectionFilters) =>
  httpGet<InspectionResponse[]>('/inspections', { params: filters });

export const createInspection = (input: CreateInspectionRequest) =>
  httpPost<InspectionResponse>('/inspections', input);
```

### 3.3 Hooks de query (un wrapper por endpoint)

```ts
// shared/hooks/useInspections.ts
export function useInspections(filters: InspectionFilters) {
  return useQuery({
    queryKey: ['inspections', filters],
    queryFn: () => listInspections(filters),
  });
}

export function useCreateInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInspectionRequest) => createInspection(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inspections'] }),
  });
}
```

### 3.4 Estados de UI obligatorios

Cada vista que consume datos contempla **los cuatro estados** explícitamente:

| Estado | Qué generar |
| --- | --- |
| **Loading** | `<Skeleton />` o spinner. Nunca pantalla en blanco. |
| **Empty** | Mensaje + acción sugerida (ej. "Crear inspección"). |
| **Error** | Mensaje claro + botón "Reintentar". |
| **Success** | Datos + confirmaciones de acciones. |

Aprovechar `isLoading`, `isError`, `data` de TanStack Query.

### 3.5 Roles y permisos

- Importar `Role` desde `@aurelia/contracts`.
- Helpers de presentación/permisos en `shared/utils/roles.ts`.
- Rutas y acciones se renderizan condicionalmente por rol.
- No hardcodear strings de rol; usar siempre el enum.

### 3.6 Mapeo visual de estados de dominio

Estados de dominio (`InspectionStatus`, `IncidentStatus`, `IncidentRiskLevel`, etc.) tienen representación visual **consistente entre web y móvil**. Centralizar el mapeo color/label en un util reutilizable. No replicar la tabla en cada componente.

Sugerencia de intención de color para `IncidentRiskLevel`:

| Nivel | Color |
| --- | --- |
| `LOW` | verde/neutro |
| `MEDIUM` | amarillo |
| `HIGH` | naranja |
| `CRITICAL` | rojo |

---

## 4. UI kit shadcn/ui — componentes disponibles (web)

**Ya están instalados** en `apps/web/src/app/components/ui/`. **Reutilizar, no recrear. Recrear solo en caso de que esta sea la primera iteracion y no existan**

```
accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button,
calendar, card, carousel, chart, checkbox, collapsible, command, context-menu,
dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar,
navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area,
select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs,
textarea, toggle, toggle-group, tooltip
```

Helpers: `cn()` (clsx + tailwind-merge) en `components/ui/utils.ts`.

**Para charts**: usar `components/ui/chart.tsx` (basado en recharts, ya viene con tokens del tema). No reimplementar.

**Para sidebar**: usar `components/ui/sidebar.tsx` (no maquetar uno propio desde cero).

**Para forms**: usar `components/ui/form.tsx` + `react-hook-form` + validación contra `schemas` de `@aurelia/contracts`.

**Iconografía**: `lucide-react` (ya instalado).

**Tokens visuales**: variables CSS en `src/styles/theme.css` (`--primary`, `--sidebar`, charts, radios). Usarlas vía clases Tailwind (`bg-primary`, `text-sidebar-foreground`, etc.), nunca hardcodear hex.

---

## 5. Convenciones de nombres

| Tipo | Convención |
| --- | --- |
| Componentes | `PascalCase.tsx` (`InspectionsPage.tsx`) |
| Hooks | `useX.ts` |
| Utilidades | `kebab-case.ts` |
| Services | `<dominio>.service.ts` (web) / `<dominio>.api.ts` (mobile) |
| Stores Zustand | `<dominio>.store.ts` |
| Enums (contracts) | `*.enum.ts`, valores `UPPER_SNAKE` |
| Requests (contracts) | `create-x.request.ts` → `CreateXRequest` |
| Responses (contracts) | `x.response.ts` → `XResponse` |

---

## 6. TypeScript

- **Modo estricto** en todo el repo (`tsconfig.base.json`).
- Sin `any` implícito. Si necesitas un tipo nuevo en la frontera HTTP → va a contracts.
- `import type` para tipos puros; `import` para enums usados como valor.

---

## 7. Checklist obligatorio antes de entregar el código

Antes de devolver el código generado, verifica que cumple TODO esto:

- [ ] Confirmé con el usuario a qué app del monorepo va (`web`, `mobile-inspecciones`, `mobile-incidentes`).
- [ ] El código usa el UI kit ya instalado (shadcn en web) y **no** recrea componentes que ya existen.
- [ ] El layout es **responsive con Tailwind grid/flex** (no posiciones absolutas con anchos fijos).
- [ ] Todo tipo de dominio (interfaces, enums, request/response) viene de `@aurelia/contracts`. Si falta uno, lo propongo agregar en `packages/contracts/src`.
- [ ] El acceso a datos va por **service en `shared/services`**, envuelto en un **hook de TanStack Query** (`useQuery` / `useMutation`).
- [ ] El estado de UI/cliente va en un store de **Zustand**; no duplico datos del servidor.
- [ ] Contemplé los **4 estados de UI**: loading, empty, error, success.
- [ ] No importé nada de `apps/api`, NestJS, TypeORM, `class-validator` ni `class-transformer`.
- [ ] Reutilicé `cn()`, tokens del theme y componentes ya existentes en lugar de crear paralelos.
- [ ] Si es móvil, contemplé conectividad pobre y captura de evidencia (foto/GPS) si aplica.
- [ ] Si toca representar un estado de dominio (status/riskLevel), uso el mapeo centralizado.

---

## 8. Qué NO hacer (errores comunes ya vistos)

- ❌ Generar dashboards con `position: absolute` y `w-[1280px]` (no es responsive).
- ❌ Redefinir un `enum Role` localmente cuando ya existe en `@aurelia/contracts`.
- ❌ Hacer `fetch('/api/...')` directo desde un componente sin pasar por service + hook.
- ❌ Guardar la lista de inspecciones en un store de Zustand (eso es server state → TanStack Query).
- ❌ Hardcodear colores hex (usar tokens del `theme.css` vía clases Tailwind).
- ❌ Crear un nuevo `<Sidebar>` cuando ya existe `components/ui/sidebar.tsx`.
- ❌ Generar código con anchos en pixeles para los charts (usar `ResponsiveContainer` o el wrapper de `components/ui/chart.tsx`).
- ❌ Importar tipos de NestJS o TypeORM en la web/móvil.
- ❌ Dejar la pantalla en blanco mientras carga (siempre skeleton/loader).

---

## 9. Referencias rápidas

Si necesitas más contexto, los siguientes documentos viven en `/docs/`:

| Documento | Contenido |
| --- | --- |
| `PROJECT_CONTEXT.md` | Dominio funcional, roles, módulos. |
| `ARCHITECTURE.md` | Stack, monorepo, dual-build de contracts. |
| `CONTRACTS_GUIDELINES.md` | Cómo extender `@aurelia/contracts` y patrón `DTO implements Request`. |
| `FRONTEND_GUIDELINES.md` | Convenciones web (incluye nota sobre UI kit). |
| `UI_UX_GUIDELINES.md` | Principios de diseño, estados, accesibilidad. |
| `STATE_MANAGEMENT.md` | TanStack Query + Zustand. |
| `MOBILE_OFFLINE_STRATEGY.md` | Estrategia offline-first móvil (previsión). |
| `API_GUIDELINES.md` | Backend (NestJS). Solo relevante si el diseño implica un endpoint nuevo. |
| `DEVELOPMENT_WORKFLOW.md` | Setup y comandos. |

---

## 10. Estado del proyecto (importante)

El desarrollo funcional avanza **por fases** y no todos los modulos tienen la misma madurez.

- Foco activo actual: `apps/web` en inspecciones y `apps/mobile-inspecciones`.
- `apps/mobile-incidentes` y el modulo web de incidentes estan en estado parcial / placeholder y no deben recibir expansion funcional nueva sin autorizacion explicita.
- Mantener prioridad en lo ya implementado y en lo que existe hoy en `@aurelia/contracts`.

Esto significa que el diseño o cambio que generes debe respetar la madurez real del modulo. Si el foco es `incidents`, asume mantenimiento tecnico o preparacion estructural salvo indicacion funcional explicita. Si un campo no existe en el contrato, propón agregarlo antes de inventarlo en el componente.
