# Fase SPR - Reportabilidad mensual

SPR se adelanta como siguiente módulo por prioridad funcional, aunque en el roadmap formal aparece después de dashboard operacional y MUE.

## Objetivo

Implementar la base de datos, contratos compartidos y API operativa para reportabilidad mensual SPR, con parámetros, unidades, asignaciones por área, registros mensuales, revisiones y reglas de consolidación.

## SPR-A - Modelo de datos y contratos

### Estado

Completado.

### Incluido

- Grupos de medición.
- Unidades.
- Parámetros SPR.
- Indicadores SOX y obligatoriedad de evidencia.
- Asignación de parámetros a áreas, responsables y revisores.
- Registro mensual por parámetro, área, año y mes.
- Estados de registro mensual.
- Revisión de registro.
- Reglas base de consolidación.
- Contratos compartidos.

### Tablas

```txt
spr_measure_groups
spr_units
spr_parameters
spr_parameter_area_assignments
spr_monthly_records
spr_record_approvals
spr_consolidation_rules
```

### Decisiones

- Las evidencias SPR se vinculan mediante `evidence_links` con `entity_type = spr_record`.
- El seed inicial no carga los 51 parámetros definitivos; deja un catálogo mínimo para validar el modelo.
- Los parámetros SOX se marcan con `is_sox` y `requires_evidence`.
- `period_year` y `period_month` representan el periodo mensual.
- `numeric_value`, `text_value` y `boolean_value` soportan parámetros de distinto tipo.

### Criterios de salida

- `pnpm build --force` pasa.
- `pnpm lint --force` pasa.
- `pnpm migration:run` crea las tablas SPR.
- `pnpm migration:run` repetido queda sin migraciones pendientes.
- El seed de catálogo SPR es idempotente.

## SPR-B - API mínima de registros mensuales

### Estado

Completado.

### Incluido

```txt
GET   /api/spr/groups
GET   /api/spr/measure-groups
GET   /api/spr/units
GET   /api/spr/parameters
GET   /api/spr/assignments
POST  /api/spr/monthly-records
GET   /api/spr/monthly-records
GET   /api/spr/monthly-records/:id
PATCH /api/spr/monthly-records/:id
PATCH /api/spr/monthly-records/:id/status
```

### Reglas

- `POST /api/spr/monthly-records` valida que el parámetro exista.
- Si viene `assignmentId`, valida que la asignación exista y pertenezca al parámetro.
- Un registro mensual no se puede duplicar por `parameterId + areaId + periodYear + periodMonth`.
- El listado soporta filtros por `parameterId`, `areaId`, `status`, `periodYear` y `periodMonth`.
- Al pasar a `submitted`, se registra `submittedAt`.
- Al pasar a `approved`, se registra `approvedAt`.

### Colección HTTP

```txt
docs/api/phase-spr.http
```

### Criterios de salida

- `pnpm build --force` pasa.
- `pnpm lint --force` pasa.
- `pnpm migration:run` queda sin pendientes.
- `pnpm test` cubre el happy path SPR.

## SPR-C - Evidencias, comentarios y validación SOX

### Estado

Implementado.

### Incluido

```txt
GET  /api/spr/monthly-records/:id/evidences
POST /api/spr/monthly-records/:id/evidences/:evidenceId/link
GET  /api/spr/monthly-records/:id/comments
POST /api/spr/monthly-records/:id/comments
GET  /api/spr/monthly-records/:id/approvals
POST /api/spr/monthly-records/:id/submit
POST /api/spr/monthly-records/:id/approve
POST /api/spr/monthly-records/:id/reject
```

### Reglas

- Los respaldos SPR usan el catálogo transversal con `entity_type = spr_record`.
- Si el parámetro tiene `is_sox = true` o `requires_evidence = true`, el registro no puede enviarse ni aprobarse sin evidencia vinculada.
- `submit` solo permite registros en `draft` o `rejected`.
- `approve` y `reject` solo permiten registros en `submitted` o `under_review`.
- `submit` crea o reutiliza una aprobación pendiente en `spr_record_approvals`.
- `approve` cierra la aprobación como `approved` y registra `approvedAt`.
- `reject` cierra la aprobación como `rejected` y deja el registro en estado `rejected`.
- Evidencias, comentarios, submit, approve y reject registran auditoría en `audit_logs`.
- Los registros `approved` o `closed` no pueden editarse por `PATCH /api/spr/monthly-records/:id`.

### Contratos

```txt
CreateSprRecordCommentRequest
LinkSprRecordEvidenceRequest
SprRecordActionRequest
```

### Smoke test

`pnpm test` cubre:

- creación de registro mensual SPR.
- bloqueo de envío SOX sin evidencia.
- creación y vinculación de evidencia.
- comentarios por registro.
- envío a revisión.
- aprobación.
- rechazo en un segundo registro.
- consulta de aprobaciones.

### Criterios de salida

- `pnpm build --force` pasa.
- `pnpm lint --force` pasa.
- `pnpm migration:run` queda sin pendientes.
- `pnpm test` cubre el flujo SPR-C.

## SPR-D - Dashboard y consolidación

Pendiente.

- Resumen mensual por estado.
- Parámetros pendientes por área.
- Parámetros sin evidencia requerida.
- Consolidado mensual básico.
- Export JSON/CSV inicial.

## SPR-E - Smoke tests y documentación final

Pendiente.

- Completar cobertura `pnpm test`.
- Completar `docs/api/phase-spr.http`.
- Checklist final de validación.
