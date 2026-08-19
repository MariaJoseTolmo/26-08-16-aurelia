# Aurelia - Roadmap de Implementación por Fases v0.4

## Estado operativo actual (2026-06-30)

- Fase 0 a 5: implementadas con base funcional y migraciones activas.
- Fase 6 y 7: implementadas en iteraciones recientes, con ajustes de consolidación documental y de modelo en curso.
- Fase 8 (SPR): fase activa actual, avanzando por iteraciones.
- Fase 9 y 10: planificadas.

### Riesgo transversal crítico abierto

La brecha principal actual para mobile offline es almacenamiento persistente:

- Hoy el modo offline usa `localStorage` en web y, si no existe, cae a memoria.
- En Expo nativo no existe `localStorage`; en Android/iOS esa caída a memoria implica pérdida de datos al cerrar la app.

Acción obligatoria para app real:

- Migrar el driver de persistencia offline a `AsyncStorage`, `SQLite` o `SecureStore` (según criticidad del dato y estrategia de sincronización).
- Definir este cambio como criterio de salida de la iteración móvil correspondiente (no dejarlo como mejora opcional).
- Ejecutar el plan técnico definido en [../MOBILE_OFFLINE_STORAGE_MIGRATION_PLAN.md](../MOBILE_OFFLINE_STORAGE_MIGRATION_PLAN.md).

## 1. Propósito

Este documento define una ruta de implementación incremental para construir Aurelia sin intentar desarrollar todos los dominios al mismo tiempo.

La base documental ya identifica los principales bloques funcionales y de datos:

- estructura organizacional;
- usuarios, roles y permisos;
- MUE y controles críticos;
- inspecciones;
- incidentes ambientales;
- evidencias y archivos;
- workflows, validaciones y aprobaciones;
- notificaciones;
- reportabilidad;
- SPR;
- impuesto verde / emisiones;
- IA futura.

El objetivo de este roadmap es ordenar la creación de migraciones, entidades TypeORM, DTOs, servicios, endpoints y pantallas de forma evolutiva.

---

## 2. Principio rector

Aurelia no debe partir intentando implementar todos los módulos definitivos.

La recomendación es construir primero una **base transversal sólida** y luego habilitar los módulos operativos más visibles:

1. Base técnica y catálogos.
2. Usuarios, roles, permisos y organización.
3. Evidencias, archivos, comentarios, auditoría y workflow transversal.
4. Inspecciones MVP.
5. Incidentes MVP.
6. Dashboard y reportabilidad inicial.
7. MUE / controles críticos.
8. SPR.
9. Impuesto verde / emisiones.
10. IA, automatizaciones avanzadas y analítica predictiva.

---

## 3. Criterio de priorización

La priorización se basa en tres criterios:

### 3.1. Dependencia técnica

Antes de construir módulos como incidentes o inspecciones, se necesitan usuarios, empresas, áreas, evidencias, comentarios, estados y auditoría.

### 3.2. Valor funcional temprano

Los módulos de inspecciones e incidentes son los más visibles para terreno, dashboard, seguimiento y reportabilidad operacional.

### 3.3. Riesgo de modelado

SPR e impuesto verde tienen reglas contables, regulatorias y de consolidación más específicas. Conviene abordarlos cuando la base común ya esté probada.

---

## 4. Fase 0 - Preparación técnica del monorepo

### Objetivo

Dejar el proyecto listo para desarrollo colaborativo, migraciones, CI/CD y generación de entidades.

### Alcance

- Validar monorepo.
- Confirmar importación de `@aurelia/contracts`.
- Configurar PostgreSQL local.
- Configurar TypeORM con migraciones.
- Desactivar `synchronize` por defecto.
- Crear estructura base de módulos NestJS.
- Crear `.env.example` por app.
- Definir convenciones de nombres.

### Entregables

```txt
/apps/api/src/common
/apps/api/src/database
/apps/api/src/modules
/packages/contracts
/docs/database
```

### Criterios de salida

- `pnpm install` funciona.
- `pnpm build:contracts` funciona.
- `pnpm dev:api` levanta.
- `docker compose up -d` levanta PostgreSQL.
- Existe `data-source.ts` para migraciones.
- Existe README con comandos.

---

## 5. Fase 1 - Core organizacional, usuarios y seguridad base

### Objetivo

Crear las tablas y entidades transversales mínimas para que cualquier módulo pueda operar con contexto de usuario, empresa, área, gerencia, sector y permisos.

### Tablas principales

```txt
business_units
areas
departments
sectors
locations
companies
users
roles
permissions
role_permissions
user_roles
user_companies
user_areas
```

### Módulos NestJS

```txt
/modules/organization
/modules/users
/modules/roles
/modules/auth
```

### Contratos compartidos

```txt
/packages/contracts/src/enums/role.enum.ts
/packages/contracts/src/enums/user-status.enum.ts
/packages/contracts/src/types/user.types.ts
/packages/contracts/src/types/organization.types.ts
```

### Endpoints iniciales

```txt
GET /api/health
GET /api/me
GET /api/users
GET /api/roles
GET /api/organization/areas
GET /api/organization/companies
GET /api/organization/sectors
```

### Consideración auth

En esta fase se puede implementar un auth mínimo o simulado para desarrollo, pero sin bloquear el avance si el mecanismo corporativo aún no está definido.

Opciones futuras:

- JWT propio;
- Azure AD / Entra ID;
- SSO corporativo;
- integración mixta.

### Criterios de salida

- Se pueden crear usuarios.
- Se pueden asignar roles.
- Se pueden asociar usuarios a empresas y áreas.
- Existe seed básico de roles.
- Existe seed básico de áreas/gerencias/empresas.

---

## 6. Fase 2 - Archivos, evidencias, comentarios y auditoría transversal

### Objetivo

Crear la base común para que cualquier módulo pueda adjuntar evidencias, registrar comentarios, trazabilidad y cambios.

### Tablas principales

```txt
files
evidences
evidence_links
comments
audit_logs
```

### Decisión de modelado

Usar relación polimórfica controlada para elementos transversales:

```txt
entity_type
entity_id
```

Esto aplica a:

- evidencias;
- comentarios;
- auditoría;
- workflow;
- notificaciones.

### Entity types iniciales

```txt
inspection
inspection_finding
inspection_followup
incident
incident_action_plan
incident_investigation
critical_control_assessment
spr_monthly_record
emission_activity_level
```

### Módulos NestJS

```txt
/modules/files
/modules/evidences
/modules/comments
/modules/audit
```

### Endpoints iniciales

```txt
POST /api/files/upload
GET /api/files/:id
POST /api/evidences
GET /api/evidences?entityType=&entityId=
POST /api/comments
GET /api/comments?entityType=&entityId=
GET /api/audit?entityType=&entityId=
```

### Reglas

- Ningún frontend debe subir archivos directo a la BD.
- La BD almacena metadata y URL/path del archivo.
- El archivo físico vive en Blob Storage o almacenamiento local en desarrollo.
- `entity_type` debe validarse contra catálogo permitido.
- `entity_id` debe validarse a nivel service verificando existencia real en su módulo.

### Criterios de salida

- Un módulo cualquiera puede adjuntar evidencias.
- Se puede listar evidencias por entidad.
- Se pueden agregar comentarios por entidad.
- Se registra auditoría básica de creación/actualización.

---

## 7. Fase 3 - Workflow y notificaciones base

### Objetivo

Crear una capa transversal para estados, revisiones, aprobaciones, devoluciones y notificaciones.

### Tablas principales

```txt
workflow_instances
workflow_steps
workflow_transitions
notifications
notification_recipients
```

### Módulos NestJS

```txt
/modules/workflows
/modules/notifications
```

### Estados genéricos sugeridos

```txt
draft
submitted
under_review
returned
validated
approved
closed
cancelled
```

### Endpoints iniciales

```txt
POST /api/workflows/start
POST /api/workflows/:id/transition
GET /api/workflows?entityType=&entityId=
GET /api/notifications
PATCH /api/notifications/:id/read
```

### Reglas

- El workflow no reemplaza los estados propios de cada módulo.
- El workflow registra trazabilidad de revisión/aprobación.
- Cada módulo mantiene su estado operativo.
- Las notificaciones pueden enviarse por UI, email o cola/evento.

### Criterios de salida

- Se puede iniciar workflow para una inspección o incidente.
- Se puede aprobar/devolver/cerrar una entidad.
- Se registra historial de transiciones.
- Se crean notificaciones internas.

---

## 8. Fase 4 - Inspecciones MVP

### Objetivo

Construir el primer módulo operativo completo para gestión de inspecciones ambientales.

### Por qué primero inspecciones

Es un flujo concreto, visible, con pantallas claras, hallazgos, seguimientos, evidencias, PDF, dashboard y cierre. Además, permite probar el patrón completo de:

```txt
registro -> evidencia -> seguimiento -> validación -> cierre -> dashboard
```

### Tablas principales

```txt
inspection_types
inspection_checklist_templates
inspection_checklist_sections
inspection_checklist_items
inspections
inspection_checklist_answers
inspection_findings
inspection_followups
inspection_actions
inspection_status_history
inspection_exports
```

### Módulo NestJS

```txt
/modules/inspections
```

### Endpoints MVP

```txt
POST /api/inspections
GET /api/inspections
GET /api/inspections/:id
PATCH /api/inspections/:id
POST /api/inspections/:id/findings
PATCH /api/inspections/findings/:findingId
POST /api/inspections/findings/:findingId/followups
POST /api/inspections/:id/close
GET /api/inspections/:id/export/pdf
GET /api/inspections/dashboard/summary
```

### Funcionalidades web MVP

- Listado de inspecciones.
- Filtros por fecha, área, empresa, estado, criticidad.
- Detalle de inspección.
- Registro de hallazgos.
- Evidencias por hallazgo.
- Seguimientos S1/S2/S3.
- Cierre de hallazgo.
- Estado global automático.
- Exportación PDF básica.

### Funcionalidades mobile MVP - inspecciones

- Crear inspección simple.
- Registrar hallazgo.
- Adjuntar foto.
- Guardar GPS.
- Dejar registro pendiente si no hay conexión.
- Sincronización básica posterior.

Requisito técnico para MVP real en dispositivo:

- Persistencia offline en almacenamiento nativo (`AsyncStorage`/`SQLite`/`SecureStore`) y no fallback exclusivo a memoria.

### Reglas

- Una inspección puede tener múltiples hallazgos.
- Un hallazgo puede tener hasta tres seguimientos.
- Una inspección queda cerrada solo si todos sus hallazgos están cerrados.
- El porcentaje cerrado/pendiente se calcula desde hallazgos.
- La criticidad define prioridad y SLA sugerido.

### Criterios de salida

- Flujo inspección end-to-end funcionando.
- Dashboard básico de inspecciones.
- PDF básico exportable.
- Evidencias asociadas a hallazgos.
- Auditoría de cambios.

---

## 9. Fase 5 - Incidentes ambientales MVP

### Objetivo

Construir el módulo de incidentes ambientales, incluyendo Flash Report, clasificación por nivel, SLA, acciones inmediatas, validación y cierre.

### Tablas principales

```txt
incident_types
incident_levels
incidents
incident_involved_people
incident_immediate_actions
incident_flash_reports
incident_validations
incident_investigations
incident_investigation_team
incident_peepo_analysis
incident_timeline_events
incident_five_why_analysis
incident_action_plans
incident_action_evidences
incident_status_history
incident_disseminations
```

### Módulo NestJS

```txt
/modules/incidents
```

### Endpoints MVP

```txt
POST /api/incidents
GET /api/incidents
GET /api/incidents/:id
PATCH /api/incidents/:id
POST /api/incidents/:id/flash-report
POST /api/incidents/:id/immediate-actions
POST /api/incidents/:id/validate
POST /api/incidents/:id/action-plans
PATCH /api/incidents/action-plans/:actionPlanId
POST /api/incidents/:id/close
GET /api/incidents/:id/export/flash-report
GET /api/incidents/dashboard/summary
```

### Funcionalidades web MVP

- Listado de incidentes.
- Filtros por nivel, tipo, estado, empresa, gerencia, año/mes.
- Detalle de incidente.
- Generación/visualización Flash Report.
- Validación por Medio Ambiente.
- Registro de acciones inmediatas.
- Planes de acción.
- Evidencias de cierre.
- Dashboard básico.

### Funcionalidades mobile MVP - incidentes

- Registro rápido de incidente.
- Captura de foto.
- GPS.
- Descripción por texto.
- Tipo de incidente.
- Preclasificación de nivel.
- Sincronización básica.

Requisito técnico para MVP real en dispositivo:

- Persistencia offline en almacenamiento nativo (`AsyncStorage`/`SQLite`/`SecureStore`) y no fallback exclusivo a memoria.

### Reglas SLA

```txt
Nivel 0-1: 24 horas
Nivel 2: 12 horas
Nivel 3: 12 horas
Nivel 4: 6 horas
Nivel 5: 2 horas
```

### Reglas de investigación

- Nivel >= 3 activa investigación ICAM obligatoria.
- Nivel < 3 puede activar 5 Por Qué según criterio gerencial.
- El incidente no puede cerrarse sin evidencias de cumplimiento de acciones.

### Criterios de salida

- Registro de incidente end-to-end.
- Flash Report básico exportable.
- Cálculo de SLA.
- Validación y cierre.
- Dashboard básico de incidentes.

---

## 10. Fase 6 - Dashboard y reportabilidad operacional

### Objetivo

Consolidar reportabilidad inicial sobre inspecciones e incidentes.

### Módulo NestJS

```txt
/modules/reports
```

### Consultas principales

```txt
GET /api/reports/inspections/summary
GET /api/reports/incidents/summary
GET /api/reports/incidents/by-level
GET /api/reports/incidents/by-type
GET /api/reports/incidents/by-company
GET /api/reports/incidents/by-period
GET /api/reports/open-items
```

### Reportes iniciales

- Incidentes abiertos vs cerrados.
- Incidentes por nivel.
- Incidentes por tipo.
- Incidentes por empresa.
- Incidentes por gerencia.
- Tendencia mensual/anual.
- Inspecciones abiertas vs cerradas.
- Observaciones pendientes vs cerradas.
- SLA vencidos.

### Decisión técnica

Al inicio se pueden usar queries SQL y vistas.

Más adelante se puede evolucionar a:

- vistas materializadas;
- tablas resumen;
- jobs de consolidación;
- integración Power BI;
- modelos predictivos.

### Criterios de salida

- Dashboard web inicial con KPIs.
- Consultas por periodo.
- Exportación básica.

---

## 11. Fase 7 - MUE y controles críticos

### Objetivo

Implementar gestión de MUE, controles críticos, verificaciones, autoevaluaciones, responsables y evidencias.

### Tablas principales

```txt
mues
critical_controls
control_verification_items
control_area_assignments
control_responsibles
control_self_assessments
control_self_assessment_answers
control_evidences
```

### Módulos NestJS

```txt
/modules/mue
/modules/critical-controls
```

### Funcionalidades

- Catálogo MUE1-MUE6.
- Asociación MUE ↔ áreas/gerencias/responsables.
- Controles críticos por MUE.
- Ítems de verificación.
- Respuestas Cumple / No cumple / Parcial / No aplica.
- Evidencias por respuesta.
- Estado de evaluación.
- Reportabilidad por MUE, área y responsable.

### Criterios de salida

- Carga y consulta de MUE.
- Autoevaluación de controles.
- Evidencias asociadas.
- Dashboard básico de cumplimiento.

---

## 12. Fase 8 - SPR

### Objetivo

Implementar reportabilidad mensual SPR para 51 parámetros, evidencias SOX, validación y consolidación.

### Tablas principales

```txt
spr_measure_groups
spr_units
spr_parameters
spr_parameter_area_assignments
spr_monthly_records
spr_record_evidences
spr_record_approvals
spr_consolidation_rules
```

### Módulo NestJS

```txt
/modules/spr
```

### Funcionalidades

- Catálogo de parámetros.
- Registro mensual por parámetro.
- Asociación con área responsable.
- Evidencia obligatoria si `flag_sox = true`.
- Validación por responsable y gerencia.
- Reporte mensual consolidado.
- Tracking de evidencias SOX.

### Criterios de salida

- Registro mensual operativo.
- Validación y aprobación.
- Reporte consolidado básico.

### Nota de ejecución de fase

Fase actualmente en curso por iteraciones. Cualquier entrega que involucre captura o edición mobile vinculada a SPR debe heredar el requisito de persistencia offline nativa para evitar pérdida de datos en Android/iOS.

Plan técnico de referencia para ejecución por iteraciones:

- [../MOBILE_OFFLINE_STORAGE_MIGRATION_PLAN.md](../MOBILE_OFFLINE_STORAGE_MIGRATION_PLAN.md)

---

## 13. Fase 9 - Impuesto verde / emisiones

### Objetivo

Implementar catastro de fuentes fijas, niveles de actividad, factores de emisión, cálculo de emisiones y reportabilidad normativa.

### Tablas principales

```txt
emission_source_types
emission_sources
pollutants
emission_factors
emission_activity_levels
emission_calculations
emission_stoppages
green_tax_thresholds
```

### Módulo NestJS

```txt
/modules/emissions
```

### Funcionalidades

- Catastro de fuentes fijas.
- Registro mensual de actividad.
- Consumo de combustible.
- Horas de operación.
- Registro de paralizaciones.
- Factores de emisión.
- Cálculo de emisiones.
- Reportes SISAT/RUEA/Impuesto Verde.

### Criterios de salida

- Fuente fija con actividad mensual.
- Cálculo básico de emisiones.
- Reporte anual y mensual.

---

## 14. Fase 10 - IA, automatizaciones y analítica avanzada

### Objetivo

Agregar asistencia inteligente sin comprometer la estabilidad del core operacional.

### Módulos NestJS

```txt
/modules/ai
/modules/notifications
/modules/workflows
/modules/reports
```

### Casos de uso futuros

- Sugerencia de clasificación de incidentes.
- Priorización de brechas críticas.
- Sugerencias de acciones correctivas.
- Detección de reincidencias por área/empresa.
- Validación visual de evidencias.
- Generación asistida de Flash Report.
- Agente de recordatorios de workflow.

### Tablas candidatas futuras

```txt
ai_suggestions
ai_classification_results
ai_document_analysis_results
ai_visual_validation_results
ai_feedback
```

### Criterios de salida

- IA como apoyo, no como fuente única de verdad.
- Toda sugerencia debe ser confirmada por usuario responsable.
- Guardar feedback para mejora futura.

---

## 15. Roadmap resumido

```txt
Fase 0: Base técnica monorepo
Fase 1: Organización, usuarios, roles
Fase 2: Evidencias, archivos, comentarios, auditoría
Fase 3: Workflow y notificaciones
Fase 4: Inspecciones MVP
Fase 5: Incidentes MVP
Fase 6: Dashboard operacional
Fase 7: MUE y controles críticos
Fase 8: SPR
Fase 9: Impuesto verde / emisiones
Fase 10: IA y automatizaciones avanzadas
```

---

## 16. Propuesta de MVP realista

El MVP más razonable debería incluir:

```txt
Core organizacional
Usuarios y roles básicos
Evidencias y archivos
Comentarios y auditoría
Inspecciones end-to-end
Incidentes end-to-end básico
Dashboard inicial
```

Quedaría fuera del MVP inicial:

```txt
SPR completo
Impuesto verde completo
IA avanzada
Power BI avanzado
integraciones corporativas complejas
```

---

## 17. Orden recomendado de migraciones

```txt
001_core_organization
002_identity_users_roles
003_files_evidences_comments_audit
004_workflows_notifications
005_inspections
006_incidents
007_reports_views
008_mue_critical_controls
009_spr
010_emissions_green_tax
011_ai_future_tables
```

---

## 18. Orden recomendado para entidades TypeORM

```txt
1. Entidades base abstractas
2. Organization entities
3. Users / Roles / Permissions
4. Files / Evidences / Comments / Audit
5. Workflow / Notifications
6. Inspections
7. Incidents
8. MUE / Critical Controls
9. SPR
10. Emissions
11. Reports / AI
```

---

## 19. Convenciones recomendadas

### 19.1. Nombres de tablas

Usar snake_case plural:

```txt
inspection_findings
incident_action_plans
spr_monthly_records
```

### 19.2. Nombres de entidades

Usar PascalCase singular:

```txt
InspectionFindingEntity
IncidentActionPlanEntity
SprMonthlyRecordEntity
```

### 19.3. Enums

Preferir enums compartidos en `@aurelia/contracts` para estados y tipos expuestos a frontend/mobile.

### 19.4. Estados

No mezclar todos los estados en un solo enum global. Usar enums por dominio cuando corresponda:

```txt
InspectionStatus
FindingStatus
IncidentStatus
WorkflowStatus
SprRecordStatus
```

---

## 20. Riesgos si se construye todo al mismo tiempo

- Entidades infladas y difíciles de mantener.
- Migración inicial demasiado grande.
- Módulos sin validación funcional real.
- Acoplamiento innecesario entre dominios.
- Duplicación de lógica de evidencias/workflow.
- Pérdida de foco del MVP.
- Dificultad para probar móviles offline.

---

## 21. Dudas abiertas antes de implementar entidades definitivas

1. ¿El login será propio, Azure AD/Entra ID o mixto?
2. ¿Las empresas contratistas tendrán usuarios propios o carga delegada por Gold Fields?
3. ¿Los roles serán globales o por área/empresa?
4. ¿Las evidencias deben tener versionado?
5. ¿La exportación PDF se genera on-demand o queda almacenada?
6. ¿Los followups de inspección son exactamente máximo 3 o configurable?
7. ¿ICAM será módulo completo desde MVP o solo placeholder?
8. ¿SPR debe estar en MVP o en fase posterior?
9. ¿Impuesto verde depende de integración externa o carga manual?
10. ¿La app móvil operará 100% offline o solo tolerará cortes de red?

---

## 22. Prompt recomendado para Claude Code - Fase 1

```txt
Necesito implementar la Fase 1 del backend Aurelia en NestJS + TypeORM, usando el diseño de datos definido en /docs/database.

Antes de escribir código, revisa:

- 01-db-requirements.md
- 02-domain-model.md
- 03-erd-conceptual.md
- 04-ddl-postgres-draft.sql
- 05-typeorm-entities-plan.md
- 06-implementation-roadmap.md

Implementa solo la Fase 1:

- OrganizationModule
- UsersModule
- RolesModule
- AuthModule básico/simulado si aún no hay proveedor real

Crea entidades TypeORM para:

- business_units
- areas
- departments
- sectors
- locations
- companies
- users
- roles
- permissions
- role_permissions
- user_roles
- user_companies
- user_areas

Reglas:

- No implementar todavía inspecciones, incidentes, SPR, MUE ni emisiones.
- No crear lógica funcional avanzada.
- No usar synchronize como mecanismo principal.
- Crear migración 001.
- Crear seeds básicos.
- Usar enums y tipos públicos desde @aurelia/contracts cuando aplique.
- No compartir entidades TypeORM con frontend/mobile.
- Mantener DTOs con class-validator solo dentro de apps/api.
- Agregar endpoints mínimos de lectura y administración básica.
- Actualizar README con comandos para correr migraciones y seeds.
```

---

## 23. Conclusión

El camino más sostenible es construir Aurelia por capas:

```txt
base común -> módulos operativos -> reportabilidad -> dominios regulatorios -> IA
```

El primer desarrollo real no debería partir por incidentes, inspecciones o IA, sino por la base transversal que todos los módulos usarán.

Una vez terminada la Fase 1, la siguiente implementación natural es Fase 2: evidencias, archivos, comentarios y auditoría, porque inspecciones e incidentes dependen fuertemente de esa capa.
