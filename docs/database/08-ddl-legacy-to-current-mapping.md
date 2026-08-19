# 08 - DDL Legacy to Current Mapping

Objetivo: definir un mapeo oficial entre nombres legacy del DDL draft y nombres actuales usados por entidades/migraciones.

Este documento evita drift semantico y da una referencia unica para futuras intervenciones de IA o equipo.

## Estado de referencia

- Canonico de ejecucion: migraciones TypeORM en `apps/api/src/database/migrations`.
- Canonico de modelo actual: entidades en `apps/api/src/modules/**/entities`.
- DDL de trabajo: [04-ddl-postgres-draft.sql](04-ddl-postgres-draft.sql).

## Mapeo oficial (legacy -> current)

### 1. Usuarios y asignaciones

- `user_area_assignments` -> `user_areas`
  - Motivo: migracion de tabla con PK surrogate (`id`) + unique compuesto.
  - Estado: `user_areas` es current.

- `users.company_id` (relacion 1:N simplificada) -> `user_companies` (N:M)
  - Motivo: soporte multiempresa por usuario.
  - Estado: conviven ambos conceptos; usar `user_companies` como asignacion operativa.

### 2. MUE / Controles

- `critical_control_area_assignments` -> `control_area_assignments`
- `control_assessments` -> `control_self_assessments`
- `control_assessment_answers` -> `control_self_assessment_answers`

Motivo: naming de dominio alineado a autoservicio (self assessment) y consistencia con modulo `mue`.
Estado: tablas `control_*` son current.

### 3. Inspecciones

- `inspection_type` (enum en inspeccion) -> `inspection_types` (catalogo)

Motivo: evolucion de enum rigido a catalogo administrable.
Estado: `inspection_types` es current.

### 4. Incidentes

- `incident_level_rules` -> `incident_levels`
- `incident_investigation_team_members` -> `incident_investigation_team`
- `incident_five_why_items` -> `incident_five_why_analysis`

Motivo: simplificacion de estructuras y alineacion con entidades implementadas.
Estado: tablas `incident_levels`, `incident_investigation_team`, `incident_five_why_analysis` son current.

### 5. SPR

- `measurement_units` -> `spr_units` (para SPR)

Motivo: aislamiento semantico del dominio SPR.
Estado: `spr_units` es current para modulo SPR.
Nota: `measurement_units` puede mantenerse para otros dominios (ej. emisiones).

## Tablas con doble representacion (requiere decision de consolidacion)

Mientras no se ejecute consolidacion formal, se permite coexistencia documental en DDL draft de:

- `control_assessments` y `control_self_assessments`
- `control_assessment_answers` y `control_self_assessment_answers`
- `critical_control_area_assignments` y `control_area_assignments`
- `incident_level_rules` y `incident_levels`
- `incident_investigation_team_members` y `incident_investigation_team`
- `incident_five_why_items` y `incident_five_why_analysis`
- `user_area_assignments` y `user_areas`
- `measurement_units` y `spr_units`

## Regla de uso para nuevas intervenciones

1. Si hay conflicto entre DDL draft y migraciones, manda migraciones.
2. Si hay conflicto entre tabla legacy y tabla current del mismo concepto, usar current.
3. No eliminar tablas legacy del DDL draft sin decision explicita de consolidacion.
4. Registrar cualquier nuevo conflicto en [../DOCS_CLEANUP_BACKLOG.md](../DOCS_CLEANUP_BACKLOG.md).

## Proximo paso recomendado

Crear una iteracion de consolidacion (DDL v0.3) que:
- mueva tablas legacy a seccion `LEGACY/DEPRECATED` dentro del SQL, o
- emita un DDL limpio separado (`04-ddl-postgres-current.sql`) con solo modelo current.
