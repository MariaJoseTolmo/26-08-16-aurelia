# Baseline de hardening del módulo de inspecciones

Fecha: 2026-07-23  
Ámbito: `apps/api`, `apps/web`, `apps/mobile-inspecciones`, `packages/contracts`

## Alcance de esta iteración

Esta iteración prioriza autorización por capacidades, alcance de datos, trazabilidad, reenvío de evidencia, notificaciones confiables e IA asistiva con decisión humana.

Se difieren expresamente:

- operación de Superadmin;
- solicitud y resolución de prórrogas;
- disputa de hallazgos;
- recordatorios y vencimientos escalonados de SLA.

Los modelos preliminares de esas materias pueden permanecer en contratos o migraciones, pero no deben exponerse como flujo operativo ni habilitarse en UI durante esta iteración.

## Capacidades canónicas

| Capability | Propósito | Perfiles esperados |
| --- | --- | --- |
| `inspections:read` | Consultar catálogos, listados, detalle, historial y exportaciones dentro del scope | Todos los perfiles del módulo |
| `inspections:create` | Crear inspecciones, respuestas iniciales y hallazgos de levantamiento | Inspector |
| `inspections:execute` | Ejecutar medidas, cargar evidencias y registrar seguimientos | Inspector y responsable EECC |
| `inspections:review` | Aprobar o rechazar ejecuciones y cerrar hallazgos | Verificador de cierre Gold Fields |
| `inspections:reassign` | Cambiar responsables, empresa, área o fecha operativa permitida | Verificador autorizado Gold Fields |
| `inspections:admin` | Cancelaciones y configuración crítica reservada | Administrador del módulo |

`inspections:write` no constituye una capacidad válida de autorización para esta iteración. La API, web y mobile exigen capacidades granulares. Mobile elimina el permiso legacy al guardar o hidratar la sesión; crear o continuar borradores depende exclusivamente de `inspections:create`, mientras `inspections:execute` permanece independiente.

## Reglas de scope

1. `ADMIN` puede consultar todos los registros.
2. Usuario Gold Fields puede consultar registros de la compañía principal; si tiene áreas asignadas, queda restringido a esas áreas.
3. Usuario EECC solo puede consultar inspecciones de sus compañías asignadas y, cuando corresponda, de sus áreas asignadas.
4. Un recurso sin compañía ni área no se entrega a usuarios restringidos.
5. La API valida el scope antes de leer o mutar inspecciones, hallazgos y seguimientos.
6. Listados, KPIs, historial y exportaciones deben aplicar el mismo conjunto de IDs permitidos que el detalle.

## Matriz de endpoints críticos

| Endpoint | Capability | Scope | Transición / efecto |
| --- | --- | --- | --- |
| `GET /inspections` | `read` | filtra resultados | sin transición |
| `GET /inspections/:id` | `read` | inspección | sin transición |
| `GET /inspections/:id/detail` | `read` | inspección | sin transición |
| `GET /inspections/:id/findings` | `read` | inspección | sin transición |
| `POST /inspections` | `create` | compañía y área del payload | crea `DRAFT` |
| `POST /inspections/:id/findings` | `create` | inspección y compañía responsable | crea hallazgo `OPEN` |
| `POST /inspections/:id/answers` | `execute` | inspección | registra respuesta checklist |
| `PATCH /inspections/:id/status` | dinámica | inspección | operación: `execute`; cierre: `review`; cancelación: `admin` |
| `PATCH /inspections/:id` | dinámica | inspección y nuevo scope | contenido: `execute`; scope: `reassign`; cierre: `review`; cancelación: `admin` |
| `POST /inspections/findings/:id/followups` | `execute` | hallazgo | crea seguimiento |
| `PATCH /inspections/findings/:id` | dinámica | hallazgo | ejecución: `execute`; aprobación/rechazo: `review`; responsables/dueAt: `reassign` |
| `PATCH /inspections/followups/:id` | `execute` | seguimiento | actualiza seguimiento |
| `POST /inspections/:id/close` | `review` | inspección | cierra solo sin hallazgos abiertos |
| `GET /inspections/dashboard/*` | `read` | conjunto permitido | agregaciones y exportación filtradas |
| `GET /inspections/history/*` | `read` | conjunto permitido | historial y KPIs filtrados |
| `GET /inspections/:id/export/pdf` | `read` | inspección | exporta contexto autorizado |

## Transiciones vigentes

### Inspección

- `DRAFT -> IN_PROGRESS`: requiere `execute`; dispara asignación una sola vez.
- `IN_PROGRESS -> SUBMITTED/UNDER_REVIEW`: requiere `execute`.
- cualquier estado operativo -> `CLOSED`: requiere `review` y no puede mantener hallazgos activos.
- cualquier estado no terminal -> `CANCELLED`: requiere `admin`.
- cierre automático: ocurre cuando todos los hallazgos activos quedan `CLOSED`.

### Hallazgo

- `OPEN -> IN_PROGRESS`: requiere `execute` y evidencia/acción según DTO del flujo.
- `IN_PROGRESS -> CLOSED`: requiere `review` y usuario Gold Fields autorizado.
- `IN_PROGRESS -> REJECTED`: requiere `review`, usuario Gold Fields autorizado y motivo.
- `REJECTED -> IN_PROGRESS`: requiere `execute`; el nuevo envío no elimina evidencias ni auditoría previas.
- cambio de responsables o `dueAt`: requiere `reassign`.

## Trazabilidad mínima obligatoria

Toda mutación crítica debe registrar:

- actor autenticado;
- entidad y ID;
- estado anterior y nuevo;
- fecha de servidor;
- motivo o comentario cuando aplique;
- request ID para correlación;
- metadatos de evidencia sin reemplazar registros históricos.

## Señales mínimas de frontend

La interfaz consume capacidades desde una capa única. Los componentes deben:

- no renderizar acciones que el usuario no puede ejecutar;
- mostrar estado informativo cuando una observación espera revisión;
- no usar búsqueda de texto, `MutationObserver` o reemplazo de nodos DOM para autorización;
- resolver deep links por identificadores y estado React/API, sin polling ni búsqueda de labels;
- tratar `403` como restricción esperada y refrescar permisos/sesión cuando corresponda.

Los bridges DOM restantes solo pueden utilizarse como compatibilidad visual temporal. No pueden decidir permisos, scope, transiciones ni ejecutar mutaciones críticas.

## Gates de validación

```powershell
pnpm --filter @aurelia/contracts build
pnpm --filter api build
pnpm --filter api lint
pnpm --filter api test:scope
pnpm --filter api test:roles
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter mobile-inspecciones typecheck
pnpm --filter mobile-inspecciones lint
```

La validación funcional debe cubrir acceso cruzado entre dos EECC, separación `execute`/`review`, cierre autorizado, rechazo autorizado, reenvío de evidencia e intento de manipulación directa de endpoints.
