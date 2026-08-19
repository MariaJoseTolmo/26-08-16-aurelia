# Fase 6 - Reportabilidad operacional inicial

## Objetivo

Cerrar la brecha detectada en la Fase 6 del roadmap, reemplazando el módulo de reportes en estado skeleton por consultas operativas reales sobre inspecciones, incidentes y planes de acción.

## Cambios implementados

Se actualizó:

```txt
apps/api/src/modules/reports/reports.service.ts
apps/api/src/modules/reports/reports.controller.ts
apps/api/src/app.module.ts
```

Se agregó:

```txt
apps/api/src/test/api-reports-smoke.ts
```

## Endpoints disponibles

```txt
GET /api/reports/summary
GET /api/reports/inspections/summary
GET /api/reports/incidents/summary
GET /api/reports/incidents/by-level
GET /api/reports/incidents/by-type
GET /api/reports/incidents/by-company
GET /api/reports/incidents/by-period
GET /api/reports/open-items
```

## Métricas cubiertas

```txt
Inspecciones totales
Inspecciones abiertas
Inspecciones cerradas
Inspecciones canceladas
Hallazgos abiertos
Hallazgos vencidos
Incidentes totales
Incidentes abiertos
Incidentes cerrados
Incidentes cancelados
SLA de incidentes vencidos
SLA de incidentes próximos a vencer en 24 horas
Planes de acción totales
Planes de acción abiertos
Planes de acción vencidos
Incidentes por nivel
Incidentes por tipo
Incidentes por empresa
Incidentes por periodo mensual
```

## Filtros soportados

```txt
companyId
areaId
status
from
to
```

## Permisos

Los endpoints de reportes requieren:

```txt
inspections:read
incidents:read
```

## Smoke test

El smoke test de reportabilidad levanta la API, autentica usuario administrador, crea datos mínimos de inspección/incidente/plan de acción y valida la forma de respuesta de los endpoints de reportes.

Comando:

```powershell
pnpm --filter api exec ts-node src/test/api-reports-smoke.ts
```

## Estado

Con esta iteración, la Fase 6 queda implementada a nivel backend/API para reportabilidad operacional inicial.

Queda pendiente conectar estas consultas a las pantallas web definitivas, si el frontend aún no las consume.
