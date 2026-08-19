# Resource scope iteration - 2026-06-29

## Objetivo

Agregar autorización fina por recurso para evitar que un usuario con permiso general pueda consultar o modificar registros fuera de su alcance operacional.

## Alcance de esta iteración

Se protege inicialmente el alcance de:

```txt
inspections
incidents
```

La política usa:

```txt
companyId
areaId
```

## Archivos agregados

```txt
apps/api/src/modules/access-control/resource-scope.service.ts
apps/api/src/modules/access-control/resource-scope.interceptor.ts
apps/api/src/modules/access-control/access-control.module.ts
```

## Archivos actualizados

```txt
apps/api/src/main.ts
```

## Reglas

`ADMIN` mantiene acceso global.

Los demás usuarios quedan limitados por las empresas y áreas asociadas en:

```txt
users.company_id
users.area_id
user_companies
user_areas
```

Si el usuario tiene empresas asociadas, un recurso con `companyId` solo es visible si pertenece a una de esas empresas.

Si el usuario tiene áreas asociadas, un recurso con `areaId` solo es visible si pertenece a una de esas áreas.

Los recursos sin `companyId` o sin `areaId` se mantienen visibles para no romper registros históricos, catálogos o datos creados antes de esta política.

## Comportamiento aplicado

Para listados:

```txt
GET /api/inspections
GET /api/incidents
```

se filtran los resultados fuera de alcance.

Para detalle o subrutas con id:

```txt
/api/inspections/:id
/api/incidents/:id
```

se valida el recurso padre antes de continuar.

Para creación:

```txt
POST /api/inspections
POST /api/incidents
```

si el body incluye `companyId` o `areaId`, se valida contra el alcance del usuario.

## Pendiente

Extender la misma política a subrecursos que entran por ids secundarios, por ejemplo:

```txt
/api/inspections/findings/:findingId
/api/incidents/immediate-actions/:actionId
/api/incidents/investigations/:investigationId
/api/incidents/action-plans/:actionPlanId
```

También queda pendiente evaluar si algunos roles supervisores Gold Fields deben tener alcance global por empresa principal o solo por áreas asignadas.
