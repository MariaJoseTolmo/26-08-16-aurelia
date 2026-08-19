# STATE_MANAGEMENT

Estrategia de manejo de estado para web (y base conceptual para móvil). El principio rector es **separar el estado del servidor del estado del cliente** y no mezclarlos.

## Dos tipos de estado

| Tipo | Qué es | Herramienta |
| --- | --- | --- |
| **Server state** | Datos que viven en la API: inspecciones, incidentes, catálogos, reportes. Asíncronos, cacheables, se invalidan. | **TanStack Query** |
| **Client / UI state** | Estado local del cliente: sesión local, filtros, layout, sidebar, módulo seleccionado, estado temporal de formularios. | **Zustand** |

> **No usar Redux inicialmente.** Solo se considerará si aparece una necesidad real que TanStack Query + Zustand no cubran (p. ej. lógica de estado global muy compleja con time-travel/debugging avanzado). Por defecto, evitarlo.

## Server state — TanStack Query

Responsable de: llamadas HTTP, cache, `loading`/`error`, invalidaciones y sincronización con la API.

Reglas:

- Toda lectura de datos de la API se hace con `useQuery`; toda escritura con `useMutation`.
- Las **query keys** son estables y describen el recurso + filtros: `['inspections', { areaId, status }]`.
- Tras una mutación, **invalidar** las queries afectadas (`queryClient.invalidateQueries`) en vez de mutar cache a mano (salvo updates optimistas puntuales).
- Tipar requests/responses con `@aurelia/contracts`.
- La capa de acceso HTTP vive en `shared/services` (ya existe un `http-client` base y `inspections.service.ts`); los hooks de query envuelven esos services.

Ejemplo conceptual:

```ts
// shared/services/inspections.service.ts  (ya existe)
import type { CreateInspectionRequest, InspectionResponse } from '@aurelia/contracts';

// shared/hooks/useInspections.ts
function useInspections(filters: InspectionFilters) {
  return useQuery({
    queryKey: ['inspections', filters],
    queryFn: () => listInspections(filters),
  });
}

function useCreateInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInspectionRequest) => createInspection(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inspections'] }),
  });
}
```

## Client / UI state — Zustand

Responsable de: sesión local (usuario/rol en memoria), filtros activos, layout, colapso del sidebar, módulo seleccionado y estado temporal de formularios cuando aplique.

Reglas:

- Un store por dominio de UI (`useSessionStore`, `useUiStore`, `useFiltersStore`), no un único store gigante.
- Mantener los stores pequeños y serializables.
- Persistir solo lo necesario (p. ej. preferencias de layout) con el middleware `persist`.

Ejemplo conceptual:

```ts
// shared/stores/ui.store.ts
const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  activeModule: 'dashboard',
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setActiveModule: (m) => set({ activeModule: m }),
}));
```

## Regla de oro: no duplicar

**No copiar en stores de Zustand datos que ya provienen de la API y que TanStack Query puede manejar.** Si el dato vive en el servidor, su fuente de verdad es TanStack Query. Zustand guarda únicamente estado de cliente/UI.

Antipatrón:

```ts
// ❌ MAL: duplicar datos de servidor en un store de cliente
const useInspectionsStore = create((set) => ({ inspections: [], setInspections: ... }));
```

```ts
// ✅ BIEN: los datos de servidor se leen con useQuery; el store solo guarda filtros/UI
const { data: inspections } = useInspections(filters);
const filters = useFiltersStore((s) => s.inspectionFilters);
```

## Móvil — capa offline futura (previsión)

Las apps móviles seguirán el mismo principio (server state vs UI state), **más** una capa offline-first que se implementará después. Hoy quedan previstas las carpetas y placeholders:

- `src/shared/storage` — almacenamiento local (AsyncStorage / SQLite / MMKV).
- `src/shared/sync` — cola de sincronización y `SyncStatus` (`PENDING` / `SYNCED` / `ERROR`).
- Resolución de conflictos al sincronizar con la API.

TanStack Query también funciona en React Native y puede combinarse con persistencia de cache. El detalle vive en [MOBILE_OFFLINE_STRATEGY.md](MOBILE_OFFLINE_STRATEGY.md).

## Dependencias (cuando se implemente)

- Web: `@tanstack/react-query`, `zustand`.
- Mobile: `@tanstack/react-query`, `zustand`, persistencia local (a definir).

> Aún no se instalan; este documento fija la estrategia. La instalación se hará al construir los módulos.
