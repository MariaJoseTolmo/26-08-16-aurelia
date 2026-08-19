# Fase 5 - Incidentes MVP

## Objetivo

Implementar el módulo de incidentes ambientales siguiendo el roadmap formal: registro, clasificación por nivel, Flash Report, acciones inmediatas, validación, investigación, planes de acción, cierre, exportación y dashboard.

## División propuesta

### Fase 5A - Modelo de datos y contratos

Alcance:

- Catálogos `incident_types` e `incident_levels`.
- Modelo principal `incidents`.
- Tablas de soporte para personas involucradas, acciones inmediatas, Flash Report, validaciones, investigación, equipo investigador, análisis PEEPO, línea de tiempo, 5 Por Qué, planes de acción, evidencias de acciones, historial de estado y difusión.
- Contratos compartidos en `@aurelia/contracts`.
- Migraciones y seed base.

Estado: completada.

### Fase 5B - API operativa mínima + Flash Report base

Alcance:

- `GET /api/incidents/types`
- `GET /api/incidents/levels`
- `POST /api/incidents`
- `GET /api/incidents`
- `GET /api/incidents/:id`
- `PATCH /api/incidents/:id`
- `PATCH /api/incidents/:id/status`
- `POST /api/incidents/:id/flash-report`
- `GET /api/incidents/:id/flash-report`

Objetivo:

- Crear y consultar incidentes.
- Exponer catálogos base para formularios.
- Calcular `sla_due_at` según nivel.
- Registrar historial de estado en cambios relevantes.
- Crear o actualizar un Flash Report base asociado 1:1 al incidente.

Estado: completada.

### Fase 5C - Flujo operativo de investigación y planes de acción

Alcance implementado:

- `GET /api/incidents/dashboard/summary`
- `POST /api/incidents/:id/immediate-actions`
- `GET /api/incidents/:id/immediate-actions`
- `PATCH /api/incidents/immediate-actions/:actionId`
- `POST /api/incidents/:id/investigations`
- `GET /api/incidents/:id/investigations`
- `PATCH /api/incidents/investigations/:investigationId`
- `POST /api/incidents/investigations/:investigationId/five-why`
- `POST /api/incidents/investigations/:investigationId/peepo`
- `POST /api/incidents/:id/action-plans`
- `GET /api/incidents/:id/action-plans`
- `PATCH /api/incidents/action-plans/:actionPlanId`
- `POST /api/incidents/:id/close`

Objetivo:

- Registrar acciones inmediatas.
- Crear investigación por método ICAM / 5 Por Qué / PEEPO.
- Registrar análisis 5 Por Qué y PEEPO.
- Crear y cerrar planes de acción.
- Bloquear cierre de incidente si existen planes abiertos o en progreso.
- Exponer un dashboard summary inicial.

Estado: completada.

### Fase 5D - Integración transversal y exportables

Alcance implementado:

- `GET /api/incidents/:id/evidences`
- `POST /api/incidents/:id/evidences/:evidenceId/link`
- `GET /api/incidents/:id/comments`
- `POST /api/incidents/:id/comments`
- `GET /api/incidents/:id/export`
- `GET /api/incidents/:id/export/pdf`
- Evidencias vinculadas a incidente mediante `evidence_links`.
- Comentarios de incidente mediante el módulo transversal `comments`.
- Auditoría explícita para vinculación de evidencias, comentarios y acciones críticas.
- Exportable JSON/PDF básico de incidente.

Estado: completada.

### Fase 5E - Estabilización final

Alcance ejecutado:

- Auditoría de mapeos TypeORM vs migraciones de incidentes.
- Colección HTTP completa en `docs/api/phase5.http`.
- Validación de flujo de cierre con bloqueo por planes abiertos.
- Revisión de consistencia de estados principales.
- Cobertura smoke/e2e en `apps/api/src/test/api-smoke.ts`.
- Checklist final de endpoints en `docs/api/phase5-validation-checklist.md`.

Estado: completada.

## Reglas principales

- El nivel del incidente define SLA.
- Nivel 0-1: 24 horas.
- Nivel 2: 12 horas.
- Nivel 3: 12 horas.
- Nivel 4: 6 horas.
- Nivel 5: 2 horas.
- Nivel >= 3 activa investigación obligatoria.
- El incidente no puede cerrarse si tiene planes de acción abiertos o en progreso.
- Las evidencias se vinculan con `evidence_links`, salvo evidencias específicas de planes de acción, que usan `incident_action_evidences`.
- El historial de estado debe registrar cada transición relevante.

## Validación obligatoria

Antes de continuar con el siguiente módulo, ejecutar:

```bash
cd C:\Users\carlo\Desktop\aurelia\Aurelia
pnpm build --force
pnpm lint --force
cd apps/api
pnpm migration:run
pnpm test
```

Resultado esperado:

- Build sin errores.
- Lint sin errores.
- `No migrations are pending`.
- `api smoke tests passed`.

## Fuera de Fase 5 inicial

- Mobile offline.
- Notificaciones automáticas.
- Integración real con email.
- Dashboard visual frontend.
- IA de clasificación automática.
