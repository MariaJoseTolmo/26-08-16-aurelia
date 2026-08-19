# Aurelia - Plan de Entidades TypeORM v0.3

## 1. Propósito

Este documento baja el diseño lógico de base de datos de Aurelia a una estrategia de implementación en NestJS + TypeORM.

El objetivo no es crear código definitivo a ciegas, sino definir cómo organizar las entidades, módulos, relaciones, enums, migraciones y convenciones antes de generar las clases TypeScript.

La decisión arquitectónica validada es usar un modelo híbrido:

- Relaciones con FK estricta para el corazón del dominio.
- Relaciones polimórficas controladas para elementos transversales como evidencias, archivos, comentarios, auditoría, workflows y notificaciones.

## 2. Principios de implementación

### 2.1. No compartir entidades TypeORM con frontend/mobile

Las entidades TypeORM viven solo en:

```txt
/apps/api/src/modules/**/entities
```

Frontend y móviles solo deben consumir contratos desde:

```txt
/packages/contracts
```

### 2.2. Contratos públicos separados de persistencia

La API puede usar tipos y enums desde `@aurelia/contracts`, pero las entidades TypeORM deben ser propias del backend.

Ejemplo conceptual:

```txt
@aurelia/contracts
  InspectionStatus
  CreateInspectionRequest
  InspectionResponse

/apps/api
  InspectionEntity
  CreateInspectionDto
  InspectionMapper
```

### 2.3. DTOs con class-validator solo en backend

Los DTOs NestJS pueden implementar interfaces del package de contratos, pero los decoradores de `class-validator` deben estar solo en `/apps/api`.

```txt
contracts = tipos agnósticos
api dto = validación NestJS
api entity = persistencia TypeORM
```

### 2.4. Migraciones obligatorias

No usar `synchronize: true` como mecanismo de evolución real.

Recomendación:

```txt
DB_SYNCHRONIZE=false
```

Usar migraciones TypeORM para crear y modificar estructura.

## 3. Estructura recomendada en NestJS

```txt
/apps/api/src
  /common
    /entities
      base.entity.ts
      auditable.entity.ts
    /enums
    /interfaces
    /types
    /utils
  /database
    data-source.ts
    migrations/
  /modules
    /auth
    /users
    /roles
    /organization
    /files
    /evidences
    /comments
    /audit
    /notifications
    /workflows
    /mue
    /critical-controls
    /inspections
    /incidents
    /spr
    /emissions
    /reports
    /ai
```

## 4. Entidades base

### 4.1. BaseEntity

Entidad abstracta para todas las tablas con UUID y timestamps.

```txt
/common/entities/base.entity.ts
```

Campos sugeridos:

```txt
id: uuid
createdAt: Date
updatedAt: Date
```

### 4.2. AuditableEntity

Entidad abstracta para tablas que requieran trazabilidad básica.

Campos sugeridos:

```txt
createdById?: uuid
updatedById?: uuid
```

No todas las tablas deben heredar esto. Para auditoría fina se usará `audit_logs`.

## 5. Organización por módulos

## 5.1. OrganizationModule

Agrupa estructura organizacional transversal.

```txt
/modules/organization
  /entities
    business-unit.entity.ts
    gerencia.entity.ts
    area.entity.ts
    sector.entity.ts
    location.entity.ts
    company.entity.ts
  /dto
  /controllers
  /services
```

Tablas:

```txt
business_units
gerencias
areas
sectors
locations
companies
```

Relaciones principales:

```txt
BusinessUnit 1:N Gerencia
Gerencia 1:N Area
Area 1:N Sector
Sector 1:N Location
Company 1:N User
```

Notas:

- `gerencias` se mantiene como entidad independiente porque el proyecto filtra por gerencia en reportes, incidentes, inspecciones y dashboards.
- `companies` representa Gold Fields y empresas colaboradoras.

## 5.2. UsersModule / RolesModule

```txt
/modules/users
  /entities
    user.entity.ts
    user-area-assignment.entity.ts
  /dto
  /controllers
  /services

/modules/roles
  /entities
    role.entity.ts
    permission.entity.ts
    user-role.entity.ts
    role-permission.entity.ts
  /dto
  /controllers
  /services
```

Tablas:

```txt
users
roles
permissions
user_roles
role_permissions
user_area_assignments
```

Relaciones:

```txt
User N:M Role
Role N:M Permission
User N:M Area
User N:1 Company
User N:1 Area principal opcional
```

Notas:

- No mezclar autenticación con autorización.
- `auth` gestiona login, tokens y sesión.
- `users/roles` gestiona identidad, perfiles y permisos.

## 5.3. FilesModule

```txt
/modules/files
  /entities
    file.entity.ts
  /dto
  /services
```

Tabla:

```txt
files
```

Responsabilidad:

- Metadatos de archivos.
- Proveedor de almacenamiento.
- URL o path de Blob Storage.
- MIME type, tamaño y nombre original.

No debe conocer el dominio que usa el archivo.

## 5.4. EvidencesModule

```txt
/modules/evidences
  /entities
    evidence.entity.ts
    evidence-link.entity.ts
  /dto
  /services
```

Tablas:

```txt
evidences
evidence_links
entity_reference_types
```

Relación:

```txt
Evidence N:1 File
Evidence 1:N EvidenceLink
EvidenceLink -> entityType + entityId
```

Estrategia:

- `evidence_links` es polimórfica controlada.
- `entity_type` debe existir en `entity_reference_types`.
- La validación de existencia real de `entity_id` se resuelve en servicios, no por FK directa.

Casos soportados:

```txt
inspection
inspection_finding
inspection_followup
incident
incident_flash_report
incident_action_plan
spr_record
emission_activity_level
control_assessment
control_assessment_answer
```

## 5.5. CommentsModule

```txt
/modules/comments
  /entities
    comment.entity.ts
  /dto
  /services
```

Tabla:

```txt
comments
```

Estrategia:

- Polimórfica controlada con `entityType` y `entityId`.
- Permite comentarios en incidentes, hallazgos, controles, SPR, etc.

## 5.6. AuditModule

```txt
/modules/audit
  /entities
    audit-log.entity.ts
  /services
```

Tabla:

```txt
audit_logs
```

Uso:

- Registrar cambios relevantes de negocio.
- No reemplaza `created_at` / `updated_at`.
- Debe registrar acción, entidad, usuario, valores anteriores y nuevos.

Campos clave:

```txt
entityType
entityId
action
oldValue
newValue
userId
createdAt
```

## 5.7. NotificationsModule

```txt
/modules/notifications
  /entities
    notification.entity.ts
    notification-recipient.entity.ts
  /services
```

Tablas:

```txt
notifications
notification_recipients
```

Uso:

- Correos de inspecciones.
- Alertas de incidentes por SLA.
- Difusión Flash Report.
- Recordatorios de workflow.

Estrategia:

- `notifications` puede ser polimórfica contra una entidad de negocio.
- `notification_recipients` guarda destinatarios concretos.
- No enviar correos directamente desde controladores. Usar services y, a futuro, Service Bus.

## 5.8. WorkflowsModule

```txt
/modules/workflows
  /entities
    workflow-definition.entity.ts
    workflow-definition-step.entity.ts
    workflow-instance.entity.ts
    workflow-instance-step.entity.ts
  /services
```

Tablas:

```txt
workflow_definitions
workflow_definition_steps
workflow_instances
workflow_instance_steps
```

Estrategia:

- Definiciones reutilizables por tipo de proceso.
- Instancias asociadas polimórficamente a una entidad de negocio.

Casos:

```txt
validación de inspección
validación de incidente
aprobación Flash Report
aprobación SPR
validación de evidencia
```

## 5.9. MueModule

```txt
/modules/mue
  /entities
    mue.entity.ts
  /dto
  /services
```

Tabla:

```txt
mues
```

Campos principales:

```txt
code
description
predominantControlType
expectedEvidence
status
```

Notas:

- MUE representa eventos mayores no deseados.
- Debe permitir MUE1 a MUE6 y futuros.

## 5.10. CriticalControlsModule

```txt
/modules/critical-controls
  /entities
    critical-control.entity.ts
    critical-control-area-assignment.entity.ts
    control-verification-item.entity.ts
    control-assessment.entity.ts
    control-assessment-answer.entity.ts
  /dto
  /services
```

Tablas:

```txt
critical_controls
critical_control_area_assignments
control_verification_items
control_assessments
control_assessment_answers
```

Relaciones:

```txt
Mue 1:N CriticalControl
CriticalControl N:M Area
CriticalControl 1:N ControlVerificationItem
ControlAssessment 1:N ControlAssessmentAnswer
```

Notas:

- Las respuestas usan valores tipo cumple, no cumple, cumple parcialmente, no aplica.
- Las evidencias se asocian vía `evidence_links`.

## 5.11. InspectionsModule

```txt
/modules/inspections
  /entities
    inspection-checklist-template.entity.ts
    inspection-checklist-section.entity.ts
    inspection-checklist-item.entity.ts
    inspection.entity.ts
    inspection-checklist-answer.entity.ts
    inspection-finding.entity.ts
    inspection-followup.entity.ts
    inspection-status-history.entity.ts
    inspection-export.entity.ts
  /dto
  /services
  /controllers
```

Tablas:

```txt
inspection_checklist_templates
inspection_checklist_sections
inspection_checklist_items
inspections
inspection_checklist_answers
inspection_findings
inspection_followups
inspection_status_history
inspection_exports
```

Relaciones principales:

```txt
InspectionChecklistTemplate 1:N InspectionChecklistSection
InspectionChecklistSection 1:N InspectionChecklistItem
Inspection 1:N InspectionChecklistAnswer
Inspection 1:N InspectionFinding
InspectionFinding 1:N InspectionFollowup
Inspection 1:N InspectionStatusHistory
Inspection 1:N InspectionExport
```

Reglas de dominio:

- Una inspección puede ser checklist o hallazgo.
- Una inspección puede tener múltiples hallazgos.
- Cada hallazgo puede tener seguimientos.
- La inspección se considera cerrada cuando todos sus hallazgos están cerrados.
- El porcentaje cerrado/pendiente se calcula desde hallazgos.
- Las evidencias fotográficas se asocian por `evidence_links`.

Notas TypeORM:

- Usar `@ManyToOne` desde `InspectionFinding` hacia `Inspection`.
- No cargar respuestas/hallazgos por eager loading por defecto.
- Usar queries explícitas o QueryBuilder para dashboards.

## 5.12. IncidentsModule

```txt
/modules/incidents
  /entities
    incident-type.entity.ts
    incident-level-rule.entity.ts
    incident.entity.ts
    incident-involved-person.entity.ts
    incident-immediate-action.entity.ts
    incident-flash-report.entity.ts
    incident-investigation.entity.ts
    incident-investigation-team-member.entity.ts
    incident-peepo-analysis.entity.ts
    incident-timeline-event.entity.ts
    incident-five-why-item.entity.ts
    incident-action-plan.entity.ts
    incident-status-history.entity.ts
    incident-dissemination.entity.ts
  /dto
  /services
  /controllers
```

Tablas:

```txt
incident_types
incident_level_rules
incidents
incident_involved_people
incident_immediate_actions
incident_flash_reports
incident_investigations
incident_investigation_team_members
incident_peepo_analysis
incident_timeline_events
incident_five_why_items
incident_action_plans
incident_status_history
incident_disseminations
```

Relaciones principales:

```txt
IncidentType 1:N Incident
Incident 1:N InvolvedPeople
Incident 1:N ImmediateActions
Incident 1:1 FlashReport
Incident 1:N Investigations
Investigation 1:N TeamMembers
Investigation 1:N PeepoAnalysis
Investigation 1:N TimelineEvents
Investigation 1:N FiveWhyItems
Incident 1:N ActionPlans
Incident 1:N StatusHistory
Incident 1:N Disseminations
```

Reglas de dominio:

- Nivel 0-1: SLA 24 horas.
- Nivel 2: SLA 12 horas.
- Nivel 3: SLA 12 horas.
- Nivel 4: SLA 6 horas.
- Nivel 5: SLA 2 horas.
- Nivel >= 3 activa investigación ICAM obligatoria.
- Nivel < 3 puede usar 5 Por Qué.
- Un incidente solo se cierra cuando sus planes de acción tienen evidencia suficiente.

Notas:

- `incident_level_rules` debe ser catálogo editable o seed controlado.
- La lógica de SLA no debe estar en la entidad; debe vivir en service/domain service.

## 5.13. SprModule

```txt
/modules/spr
  /entities
    measurement-unit.entity.ts
    spr-measure-group.entity.ts
    spr-parameter.entity.ts
    spr-parameter-area-assignment.entity.ts
    spr-monthly-record.entity.ts
    spr-consolidation-rule.entity.ts
  /dto
  /services
  /controllers
```

Tablas:

```txt
measurement_units
spr_measure_groups
spr_parameters
spr_parameter_area_assignments
spr_monthly_records
spr_consolidation_rules
```

Relaciones:

```txt
SprMeasureGroup 1:N SprParameter
MeasurementUnit 1:N SprParameter
SprParameter N:M Area
SprParameter 1:N SprMonthlyRecord
SprMonthlyRecord N:1 Area
SprParameter 1:N ConsolidationRule
```

Reglas:

- Cada parámetro se reporta por mes/año.
- Parámetros SOX requieren evidencia obligatoria.
- Algunos parámetros consolidan valores de varias áreas.
- Un registro no es final hasta aprobación responsable y gerencial.

Notas:

- Para valores numéricos usar `numeric`, en TypeORM mapear como string o transformer a number según precisión requerida.
- Evitar floats para datos financieros o ambientales auditables.

## 5.14. EmissionsModule

```txt
/modules/emissions
  /entities
    pollutant.entity.ts
    emission-source-type.entity.ts
    emission-source.entity.ts
    emission-activity-level.entity.ts
    emission-stoppage.entity.ts
    emission-factor.entity.ts
    emission-calculation.entity.ts
    green-tax-threshold.entity.ts
  /dto
  /services
  /controllers
```

Tablas:

```txt
pollutants
emission_source_types
emission_sources
emission_activity_levels
emission_stoppages
emission_factors
emission_calculations
green_tax_thresholds
```

Relaciones:

```txt
EmissionSourceType 1:N EmissionSource
EmissionSource 1:N ActivityLevel
ActivityLevel 1:N Stoppage
EmissionSourceType 1:N EmissionFactor
Pollutant 1:N EmissionFactor
ActivityLevel 1:N EmissionCalculation
Pollutant 1:N EmissionCalculation
```

Reglas:

- SISAT aplica si potencia térmica > 500 kWt.
- RUEA aplica si potencia >= 20 kW o 25 kVA.
- Si una fuente activa no operó, debe existir registro mensual con valor 0.
- Cálculo: emisión = factor * nivel actividad * (1 - eficiencia abatimiento).

## 6. Estrategia para enums

### 6.1. En PostgreSQL

El DDL define enums para estados y clasificaciones estables.

Ejemplos:

```txt
inspection_global_status
incident_status
validation_status
workflow_step_status
notification_channel
```

### 6.2. En TypeScript

Los enums públicos deben estar en `@aurelia/contracts` cuando sean usados por frontend/mobile.

Ejemplos:

```txt
InspectionStatus
InspectionType
ChecklistAnswerValue
IncidentStatus
IncidentRiskLevel
WorkflowStatus
EvidenceStatus
```

### 6.3. En entidades TypeORM

La entidad debe importar el enum desde contracts cuando sea un contrato público.

Estrategia sugerida:

```txt
@Column({ type: 'enum', enum: InspectionStatus, enumName: 'inspection_global_status' })
```

Pero validar nombres exactos entre enum TS y enum SQL antes de generar migración.

## 7. Estrategia para relaciones polimórficas

### 7.1. Tablas afectadas

```txt
evidence_links
comments
audit_logs
workflow_instances
notifications
```

### 7.2. Implementación TypeORM

No modelar como `@ManyToOne` hacia múltiples entidades.

Usar columnas normales:

```txt
entityType: string
entityId: string
```

### 7.3. Validación en servicios

Crear un servicio común:

```txt
EntityReferenceService
```

Responsabilidades:

```txt
validateEntityType(entityType)
validateEntityExists(entityType, entityId)
getEntityLabel(entityType, entityId)
```

### 7.4. Ventaja

Permite asociar evidencias, comentarios, workflows y auditoría a nuevos módulos sin alterar el modelo físico cada vez.

### 7.5. Riesgo

La base de datos no puede garantizar FK real sobre `entityId`. Por eso la validación debe ser obligatoria a nivel service.

## 8. Orden recomendado de implementación de entidades

No crear todos los módulos funcionales al mismo tiempo. Se recomienda este orden:

### Fase 1: Base transversal

```txt
1. OrganizationModule
2. UsersModule
3. RolesModule
4. FilesModule
5. EvidencesModule
6. AuditModule
```

### Fase 2: Dominios operacionales iniciales

```txt
7. InspectionsModule
8. IncidentsModule
9. NotificationsModule
10. WorkflowsModule
```

### Fase 3: Controles críticos y MUE

```txt
11. MueModule
12. CriticalControlsModule
```

### Fase 4: Reportabilidad avanzada

```txt
13. SprModule
14. EmissionsModule
15. ReportsModule
```

### Fase 5: IA futura

```txt
16. AiModule
```

## 9. Recomendación para el primer MVP técnico

Para comenzar desarrollo sin sobredimensionar, implementar primero:

```txt
OrganizationModule
UsersModule
RolesModule
FilesModule
EvidencesModule
InspectionsModule
IncidentsModule
```

No implementar SPR, emisiones ni controles críticos completos hasta validar modelo con usuarios de negocio.

## 10. Convenciones de nombres

### 10.1. Tablas

Usar snake_case plural:

```txt
inspection_findings
incident_action_plans
spr_monthly_records
```

### 10.2. Entidades

Usar PascalCase singular:

```txt
InspectionFindingEntity
IncidentActionPlanEntity
SprMonthlyRecordEntity
```

### 10.3. Archivos

Usar kebab-case:

```txt
inspection-finding.entity.ts
incident-action-plan.entity.ts
spr-monthly-record.entity.ts
```

### 10.4. DTOs

```txt
create-inspection.dto.ts
update-inspection.dto.ts
inspection-response.dto.ts
```

### 10.5. Services

```txt
inspections.service.ts
incident-sla.service.ts
entity-reference.service.ts
```

## 11. Mappers

Usar mappers para convertir entidades a contratos de salida.

```txt
/modules/inspections/mappers/inspection.mapper.ts
/modules/incidents/mappers/incident.mapper.ts
```

Evitar devolver entidades TypeORM directamente desde controladores.

Patrón:

```txt
Entity -> Mapper -> Response DTO / Contract
```

## 12. Repositorios y QueryBuilder

TypeORM 0.3 recomienda usar repositories mediante DataSource o inyección de `@InjectRepository`.

Para operaciones CRUD simples:

```txt
Repository<Entity>
```

Para dashboards y reportabilidad:

```txt
QueryBuilder
views SQL
materialized views futuras
```

No resolver dashboards complejos cargando árboles completos de relaciones con eager loading.

## 13. Índices y performance

Mantener índices para:

```txt
created_at
status
area_id
gerencia_id
company_id
incident level
period year/month
entity_type + entity_id
```

En TypeORM, agregar índices con:

```txt
@Index()
@Index(['entityType', 'entityId'])
```

Los dashboards deben diseñarse pensando en filtros por:

```txt
fecha
mes/año/trimestre
área
gerencia
empresa
estado
nivel
tipo
MUE
```

## 14. Migración inicial recomendada

Crear una migración inicial manual basada en el DDL validado:

```txt
apps/api/src/database/migrations/0000000000000-initial-schema.ts
```

No generar entidades primero y luego confiar en que TypeORM genere todo automáticamente.

Flujo recomendado:

```txt
1. Validar DDL
2. Crear migración inicial desde DDL
3. Crear entidades TypeORM alineadas al DDL
4. Ejecutar tests de metadata TypeORM
5. Crear seeds mínimos
```

## 15. Seeds mínimos

Crear seeds para:

```txt
roles
permissions
incident_level_rules
entity_reference_types
measurement_units
mues
business_units base
```

No cargar datos productivos reales en seeds de desarrollo.

## 16. Validaciones importantes en services

### 16.1. Inspecciones

```txt
- No cerrar inspección si tiene hallazgos abiertos.
- No cerrar hallazgo sin evidencia de cierre si aplica.
- No permitir más de 3 seguimientos si la regla de negocio queda fija.
- Calcular días de cierre desde fecha inicial hasta cierre real.
```

### 16.2. Incidentes

```txt
- Nivel >= 3 requiere investigación ICAM.
- Nivel 0-2 puede usar 5 Por Qué.
- No cerrar incidente con planes de acción abiertos.
- Calcular SLA según nivel.
- Registrar historial de estado.
```

### 16.3. SPR

```txt
- Parámetro SOX requiere evidencia.
- No marcar final sin aprobación responsable y gerencial.
- Evitar duplicidad por parámetro, área, mes y año.
```

### 16.4. Emisiones

```txt
- Fuente activa debe tener registro mensual, incluso si valor = 0.
- Calcular umbrales SISAT/RUEA según potencia.
- No usar float para emisiones auditables.
```

## 17. Dudas abiertas antes de generar entidades definitivas

1. ¿Los usuarios se autenticarán con credenciales propias, SSO corporativo o ambos?
2. ¿Las empresas contratistas tendrán usuarios autogestionados o creados por administrador?
3. ¿Mina requiere permisos especiales separados del resto de áreas?
4. ¿Los checklists serán configurables por administrador o cargados por migración/seed?
5. ¿Los formularios de incidentes tendrán campos dinámicos según tipo/nivel?
6. ¿El Flash Report será una entidad única por incidente o puede tener versiones?
7. ¿La investigación ICAM puede tener múltiples sesiones/versiones?
8. ¿SPR e impuesto verde entran en el MVP o quedan para fase posterior?
9. ¿Los documentos PDF generados se guardarán como archivo final en Blob Storage?
10. ¿Las apps móviles deben soportar creación offline desde el primer release?

## 18. Prompt recomendado para Claude Code

Usar este prompt cuando se quiera comenzar a generar entidades:

```txt
Actúa como arquitecto backend NestJS + TypeORM. En el monorepo Aurelia, genera solo la Fase 1 de entidades TypeORM siguiendo el documento /docs/database/05-typeorm-entities-plan.md y el DDL /docs/database/04-ddl-postgres-draft.sql.

No generes entidades de módulos no solicitados.
No modifiques contracts salvo que sea estrictamente necesario.
No compartas entidades TypeORM con frontend/mobile.
No uses synchronize como mecanismo de diseño.
Crea entidades, módulos, imports TypeOrmModule.forFeature, DTOs mínimos y services skeleton.
No implementes lógica de negocio avanzada.
No agregues comentarios innecesarios en el código.
Primero explícame el plan y espera confirmación antes de escribir archivos.
```

## 19. Próximo paso recomendado

Antes de generar entidades, conviene crear:

```txt
06-implementation-roadmap.md
```

Ese documento debería definir qué módulos entran en MVP 1, MVP 2 y fases posteriores.
