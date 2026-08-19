# DOCS_CLEANUP_BACKLOG

Backlog de limpieza y optimizacion documental.

## Prioridad alta

- [ ] Resolver drift entre entidades y DDL draft en [database/04-ddl-postgres-draft.sql](database/04-ddl-postgres-draft.sql).
  - Estado: convergencia estructural completa desde entidades hacia DDL (iteracion 2, 2026-06-30).
  - Pendiente: decidir consolidacion de tablas legacy vs modelo actual para evitar doble representacion.
  - Legacy o no implementadas en entidades (requiere decision):
    - control_assessments / control_assessment_answers / critical_control_area_assignments
    - incident_level_rules / incident_investigation_team_members / incident_five_why_items
    - user_area_assignments
    - measurement_units
    - inspection_exports
    - bloque emisiones: emission_* / pollutants / green_tax_thresholds

- [x] Publicar mapeo canónico legacy -> current.
  - Entregado en [database/08-ddl-legacy-to-current-mapping.md](database/08-ddl-legacy-to-current-mapping.md).

- [x] Separar DDL operativo current-only.
  - Entregado en [database/04-ddl-postgres-current.sql](database/04-ddl-postgres-current.sql).
  - `04-ddl-postgres-draft.sql` queda como referencia extendida (legacy + trazabilidad).

- [ ] Revisar coherencia de estados de fase en [database/06-implementation-roadmap.md](database/06-implementation-roadmap.md) vs documentos de cierre de fase.

- [ ] Definir criterio oficial para documentacion canónica vs iterativa en carpeta [database](database) y [security](security).

## Prioridad media

- [ ] Consolidar documentos de seguridad iterativos en [security](security) y dejar una vista consolidada por tema:
  - request-id
  - rate-limit
  - sanitized-errors
  - resource-scope
  - audit-events

- [ ] Revisar duplicidad potencial entre documentos de fase con fecha cercana en [database](database).

- [ ] Marcar explicitamente documentos historicos o de referencia en [chat-gpt](chat-gpt) y [references](references).

## Prioridad baja

- [ ] Estandarizar naming de nuevos documentos con patron:
  - `phaseN-topic-YYYY-MM-DD.md`
  - `iteration-topic-YYYY-MM-DD.md`
  - `decision-topic-YYYY-MM-DD.md`

- [ ] Crear sumario ejecutivo por fase (1 pagina) para onboarding rapido.

## Regla de ejecucion

Antes de eliminar o archivar documentos:
1. Confirmar owner del dominio (API/Mobile/Web/Security/PMO).
2. Confirmar si el documento es historico requerido para trazabilidad.
3. Registrar la accion (movido, consolidado, eliminado) y motivo.
