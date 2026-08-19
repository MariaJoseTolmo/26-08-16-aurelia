# 02 - Modelo de Dominio de Datos Aurelia

**Proyecto:** Aurelia  
**Documento:** Modelo de dominio funcional para ERD/DDL  
**Versión:** 0.1 - borrador de análisis  
**Objetivo:** traducir los requerimientos de datos del documento `01-db-requirements.md` a un modelo de dominio organizado por módulos, relaciones, responsabilidades y límites de implementación.

---

## 1. Decisión de arquitectura de datos

Aurelia debería usar una **base de datos PostgreSQL centralizada y modular**, no una base por módulo. La razón es que los módulos comparten entidades transversales:

- usuarios;
- roles y permisos;
- empresas contratistas;
- áreas, gerencias y sectores;
- ubicaciones;
- evidencias;
- documentos;
- flujos de aprobación;
- comentarios;
- auditoría;
- notificaciones;
- reportabilidad.

El diseño recomendado es un **modelo relacional por dominios**, donde cada módulo tiene tablas propias, pero reutiliza tablas base comunes.

---

## 2. Dominios principales

El modelo se divide en los siguientes dominios:

```txt
core
identity
organization
files_evidences
workflow
notifications
audit
mue_controls
inspections
incidents
spr
green_tax
reports
ai_assistance
```

---

## 3. Dominio Core / Catálogos transversales

### 3.1 Objetivo

Centralizar catálogos comunes que serán usados por web, API y apps móviles.

### 3.2 Entidades

#### `business_units`

Representa unidades de negocio como Salares Norte o Exploraciones.

Campos sugeridos:

```txt
id
code
name
description
is_active
created_at
updated_at
```

#### `areas`

Representa áreas funcionales amplias.

Ejemplos:

```txt
Mina
Planta
Medio Ambiente
Servicios Técnicos
Servicios Generales
Sustentabilidad
Legal
Finanzas
Exploraciones
```

Campos sugeridos:

```txt
id
business_unit_id
code
name
description
is_active
created_at
updated_at
```

#### `departments`

Representa gerencias, superintendencias o subáreas.

Ejemplos:

```txt
Gerencia Mina
Superintendencia Procesos
Superintendencia Aguas y Relaves
Cumplimiento Ambiental
Permisos
```

Campos sugeridos:

```txt
id
area_id
code
name
description
is_active
created_at
updated_at
```

#### `sectors`

Ubicación operacional específica dentro de un área.

Campos sugeridos:

```txt
id
area_id
name
code
description
is_active
created_at
updated_at
```

#### `locations`

Representa ubicaciones geográficas precisas o puntos de referencia en terreno.

Campos sugeridos:

```txt
id
sector_id
name
description
latitude
longitude
altitude
geofence_geojson
is_active
created_at
updated_at
```

#### `companies`

Representa Gold Fields y empresas colaboradoras/contratistas.

Campos sugeridos:

```txt
id
name
tax_id
company_type
is_contractor
is_active
created_at
updated_at
```

---

## 4. Dominio Identity / Usuarios, roles y permisos

### 4.1 Objetivo

Soportar usuarios internos y contratistas, perfiles por rol y permisos por módulo.

### 4.2 Entidades

#### `users`

Campos sugeridos:

```txt
id
company_id
area_id
department_id
email
full_name
rut_or_identifier
position
phone
is_active
last_login_at
created_at
updated_at
```

#### `roles`

Ejemplos:

```txt
ADMIN
INSPECTOR
CONTRACTOR
ENVIRONMENT_VALIDATOR
SUPERINTENDENT
MANAGER
VIEWER
```

Campos sugeridos:

```txt
id
code
name
description
is_system
is_active
created_at
updated_at
```

#### `permissions`

Campos sugeridos:

```txt
id
code
name
module
action
description
created_at
updated_at
```

Ejemplos de permisos:

```txt
incidents:create
incidents:validate
incidents:close
inspections:create
inspections:followup
controls:self_assess
reports:view
users:manage
```

#### `user_roles`

Tabla puente.

Campos sugeridos:

```txt
id
user_id
role_id
business_unit_id
area_id
company_id
created_at
```

#### `role_permissions`

Tabla puente.

Campos sugeridos:

```txt
id
role_id
permission_id
created_at
```

---

## 5. Dominio Files / Evidencias / Documentos

### 5.1 Objetivo

Guardar metadatos de archivos subidos a Azure Blob Storage y asociarlos a entidades de distintos módulos.

### 5.2 Decisión relevante

Se recomienda separar:

- `files`: archivo físico/lógico almacenado;
- `evidences`: significado funcional de ese archivo como evidencia;
- `evidence_links`: asociación de la evidencia con una entidad de negocio.

Esto permite reutilizar el mismo patrón en incidentes, inspecciones, controles críticos, SPR e impuesto verde.

### 5.3 Entidades

#### `files`

Campos sugeridos:

```txt
id
storage_provider
container_name
blob_path
original_filename
mime_type
file_size_bytes
checksum
uploaded_by_user_id
uploaded_at
created_at
```

#### `evidences`

Campos sugeridos:

```txt
id
file_id
evidence_type
title
description
captured_at
captured_latitude
captured_longitude
captured_altitude
source
created_by_user_id
created_at
updated_at
```

Tipos candidatos de evidencia:

```txt
PHOTO
VIDEO
DOCUMENT
SIGNATURE
AUDIO
GPS_POINT
PDF_REPORT
SCREENSHOT
FORM_ATTACHMENT
```

#### `evidence_links`

Asocia evidencias a entidades de negocio.

Campos sugeridos:

```txt
id
evidence_id
entity_type
entity_id
relation_type
created_at
```

Ejemplos de `entity_type`:

```txt
INSPECTION
INSPECTION_FINDING
INSPECTION_FOLLOWUP
INCIDENT
INCIDENT_ACTION_PLAN
CRITICAL_CONTROL_ASSESSMENT
SPR_RECORD
EMISSION_ACTIVITY_LEVEL
```

### 5.4 Nota sobre integridad referencial

La relación polimórfica `entity_type + entity_id` es flexible, pero no entrega FK estricta a nivel PostgreSQL. Si el proyecto requiere integridad fuerte, se pueden crear tablas puente específicas por módulo:

```txt
inspection_evidences
incident_evidences
spr_record_evidences
control_assessment_evidences
```

Para una primera versión, recomiendo iniciar con `evidence_links` y reforzar integridad desde backend + auditoría.

---

## 6. Dominio Workflow

### 6.1 Objetivo

Soportar flujos de validación, devolución, aprobación, cierre y difusión.

### 6.2 Entidades

#### `workflow_instances`

Campos sugeridos:

```txt
id
entity_type
entity_id
workflow_type
current_status
started_by_user_id
started_at
completed_at
created_at
updated_at
```

Ejemplos de `workflow_type`:

```txt
INCIDENT_FLASH_REPORT_VALIDATION
INCIDENT_ICAM_INVESTIGATION
INSPECTION_CLOSURE
SPR_MONTHLY_APPROVAL
CRITICAL_CONTROL_SELF_ASSESSMENT
```

#### `workflow_steps`

Campos sugeridos:

```txt
id
workflow_instance_id
step_order
step_code
step_name
assigned_role_id
assigned_user_id
status
started_at
completed_at
due_at
created_at
updated_at
```

#### `workflow_transitions`

Campos sugeridos:

```txt
id
workflow_instance_id
from_status
to_status
action
comment
performed_by_user_id
performed_at
```

Estados genéricos sugeridos:

```txt
DRAFT
SUBMITTED
IN_REVIEW
RETURNED
VALIDATED
APPROVED
REJECTED
CLOSED
CANCELLED
```

---

## 7. Dominio MUE / Controles Críticos

### 7.1 Objetivo

Representar eventos mayores no deseados, controles críticos, verificaciones, responsables, autoevaluaciones y evidencias.

### 7.2 Entidades

#### `mues`

Campos sugeridos:

```txt
id
code
name
description
predominant_control_type
expected_main_evidence
is_active
created_at
updated_at
```

Ejemplos:

```txt
MUE1 - Pérdida de contención
MUE2 - Voladuras no controladas
MUE3 - Impactos sobre flora y fauna
MUE4 - Uso insostenible del agua
MUE5 - Emisiones no controladas
MUE6 - Incumplimiento normativo
```

#### `critical_controls`

Campos sugeridos:

```txt
id
mue_id
code
name
description
control_type
objective
is_active
created_at
updated_at
```

#### `control_verification_items`

Campos sugeridos:

```txt
id
critical_control_id
code
question
requirement_text
expected_evidence
sort_order
is_required
is_active
created_at
updated_at
```

#### `control_area_assignments`

Campos sugeridos:

```txt
id
mue_id
critical_control_id
area_id
department_id
company_id
responsible_user_id
responsible_name_snapshot
is_primary
created_at
updated_at
```

#### `control_self_assessments`

Campos sugeridos:

```txt
id
mue_id
critical_control_id
area_id
department_id
period_year
period_month
status
created_by_user_id
submitted_by_user_id
validated_by_user_id
submitted_at
validated_at
created_at
updated_at
```

#### `control_self_assessment_answers`

Campos sugeridos:

```txt
id
assessment_id
verification_item_id
answer
comment
risk_level
action_required
created_at
updated_at
```

Respuestas sugeridas:

```txt
YES
NO
PARTIAL
NOT_APPLICABLE
```

---

## 8. Dominio Inspecciones

### 8.1 Objetivo

Soportar inspecciones de terreno, hallazgos, checklists, seguimientos, cierre, evidencias y exportación PDF.

### 8.2 Entidades

#### `inspection_types`

Campos sugeridos:

```txt
id
code
name
description
is_active
created_at
updated_at
```

Ejemplos:

```txt
CHECKLIST
FINDING
```

#### `inspections`

Campos sugeridos:

```txt
id
inspection_code
inspection_type_id
business_unit_id
area_id
department_id
sector_id
location_id
company_id
inspector_user_id
inspection_date
status
closed_at
closure_days
closed_percentage
pending_percentage
created_at
updated_at
```

Estados sugeridos:

```txt
DRAFT
OPEN
IN_FOLLOWUP
CLOSED
CANCELLED
```

#### `inspection_checklist_templates`

Campos sugeridos:

```txt
id
code
name
description
version
is_active
created_at
updated_at
```

Ejemplos:

```txt
SUSPEL_GENERAL
SUSPEL_BODEGAS
CYANIDE
MERCURY
NUCLEAR_EQUIPMENT
RESPEL
PTAS
```

#### `inspection_checklist_sections`

Campos sugeridos:

```txt
id
template_id
name
description
sort_order
created_at
updated_at
```

#### `inspection_checklist_items`

Campos sugeridos:

```txt
id
template_section_id
code
question
requirement_text
expected_evidence
sort_order
is_required
is_active
created_at
updated_at
```

#### `inspection_checklist_answers`

Campos sugeridos:

```txt
id
inspection_id
checklist_item_id
answer
comment
created_by_user_id
created_at
updated_at
```

Respuestas sugeridas:

```txt
COMPLIES
DOES_NOT_COMPLY
PARTIALLY_COMPLIES
NOT_APPLICABLE
```

#### `inspection_findings`

Campos sugeridos:

```txt
id
inspection_id
finding_code
description_deviation
corrective_measure
risk_criticality
responsible_user_id
responsible_company_id
sla_due_at
status
closed_at
created_at
updated_at
```

Estados sugeridos:

```txt
OPEN
IN_PROGRESS
EVIDENCE_SUBMITTED
VALIDATED
CLOSED
REJECTED
CANCELLED
```

#### `inspection_followups`

Campos sugeridos:

```txt
id
finding_id
followup_number
followup_date
observation
status
created_by_user_id
created_at
updated_at
```

Regla:

```txt
followup_number in 1, 2, 3
```

#### `inspection_exports`

Campos sugeridos:

```txt
id
inspection_id
file_id
export_type
generated_by_user_id
generated_at
created_at
```

---

## 9. Dominio Incidentes Ambientales

### 9.1 Objetivo

Soportar registro inicial, Flash Report, clasificación por nivel, validación, difusión, investigación ICAM, 5 Por Qué, planes de acción, evidencias y cierre.

### 9.2 Entidades

#### `incident_types`

Campos sugeridos:

```txt
id
code
name
description
is_active
created_at
updated_at
```

Ejemplos:

```txt
LOSS_OF_CONTAINMENT
FAUNA_FLORA
AIR_EMISSIONS
WASTE_MANAGEMENT
SOIL_DISTURBANCE
NOISE_VIBRATION
WATER
CYANIDE
TSF
OTHER
```

#### `incidents`

Campos sugeridos:

```txt
id
incident_code
business_unit_id
area_id
department_id
sector_id
location_id
company_id
reported_by_user_id
incident_type_id
incident_level
event_occurred_at
detected_at
reported_at
sla_due_at
status
title
description
is_spie
requires_icam
requires_five_why
is_tsf_related
is_cyanide_related
closed_at
created_at
updated_at
```

Estados sugeridos:

```txt
DRAFT
REPORTED
FLASH_REPORT_IN_REVIEW
FLASH_REPORT_RETURNED
FLASH_REPORT_VALIDATED
UNDER_INVESTIGATION
ACTION_PLAN_IN_PROGRESS
PENDING_CLOSURE_VALIDATION
CLOSED
CANCELLED
```

#### `incident_involved_people`

Campos sugeridos:

```txt
id
incident_id
full_name
position
age
seniority_months
company_id
involvement_type
created_at
updated_at
```

#### `incident_immediate_actions`

Campos sugeridos:

```txt
id
incident_id
action_description
performed_by_user_id
performed_at
created_at
updated_at
```

#### `incident_flash_reports`

Campos sugeridos:

```txt
id
incident_id
reference_code
summary
initial_damage_description
immediate_actions_summary
pdf_file_id
status
submitted_by_user_id
validated_by_user_id
submitted_at
validated_at
created_at
updated_at
```

#### `incident_validations`

Campos sugeridos:

```txt
id
incident_id
validation_type
status
comment
validated_by_user_id
validated_at
created_at
```

#### `incident_investigations`

Campos sugeridos:

```txt
id
incident_id
investigation_type
status
started_at
completed_at
lead_user_id
summary
root_cause
conclusions
created_at
updated_at
```

Tipos:

```txt
ICAM
FIVE_WHY
```

#### `incident_investigation_team`

Campos sugeridos:

```txt
id
investigation_id
user_id
role_in_investigation
created_at
```

#### `incident_peepo_analysis`

Campos sugeridos:

```txt
id
investigation_id
people_analysis
equipment_analysis
environment_analysis
procedures_analysis
organization_analysis
created_at
updated_at
```

#### `incident_timeline_events`

Campos sugeridos:

```txt
id
investigation_id
event_order
event_at
description
created_at
updated_at
```

#### `incident_five_why_analysis`

Campos sugeridos:

```txt
id
investigation_id
why_1
why_2
why_3
why_4
why_5
root_cause
conclusion
created_at
updated_at
```

#### `incident_action_plans`

Campos sugeridos:

```txt
id
incident_id
investigation_id
action_description
responsible_user_id
responsible_company_id
due_at
status
completed_at
validated_by_user_id
validated_at
created_at
updated_at
```

#### `incident_disseminations`

Campos sugeridos:

```txt
id
incident_id
recipient_group
sent_by_user_id
sent_at
channel
created_at
```

---

## 10. Dominio SPR

### 10.1 Objetivo

Soportar reporte mensual corporativo de parámetros ambientales y operacionales, evidencias SOX, validaciones y consolidación.

### 10.2 Entidades

#### `spr_measure_groups`

Campos sugeridos:

```txt
id
code
name
description
created_at
updated_at
```

#### `spr_units`

Campos sugeridos:

```txt
id
code
name
description
created_at
updated_at
```

Ejemplos:

```txt
TON
KG
KLT
MWH
MLT
KM
USD
LC
```

#### `spr_parameters`

Campos sugeridos:

```txt
id
measure_group_id
unit_id
code
company_code
name
description
is_sox
is_active
created_at
updated_at
```

#### `spr_parameter_area_assignments`

Campos sugeridos:

```txt
id
parameter_id
area_id
department_id
responsible_user_id
is_primary
created_at
updated_at
```

#### `spr_monthly_records`

Campos sugeridos:

```txt
id
parameter_id
area_id
department_id
period_year
period_month
value
source_information
status
submitted_by_user_id
approved_by_user_id
submitted_at
approved_at
created_at
updated_at
```

Estados sugeridos:

```txt
PENDING
DRAFT
SUBMITTED
RETURNED
APPROVED_BY_RESPONSIBLE
APPROVED_BY_MANAGER
CONSOLIDATED
```

#### `spr_consolidation_rules`

Campos sugeridos:

```txt
id
parameter_id
rule_type
expression
is_active
created_at
updated_at
```

---

## 11. Dominio Impuesto Verde / Emisiones

### 11.1 Objetivo

Soportar catastro de fuentes fijas, niveles de actividad, factores de emisión, cálculos y reportabilidad normativa.

### 11.2 Entidades

#### `emission_source_types`

Campos sugeridos:

```txt
id
code
name
description
created_at
updated_at
```

Ejemplos:

```txt
GENERATOR_SET
ELECTRIC_GENERATION_ENGINE
FURNACE
BOILER
```

#### `emission_sources`

Campos sugeridos:

```txt
id
rfp_identifier
internal_tag
serial_number
source_type_id
area_id
department_id
company_id
category
installed_power_kw
thermal_power_mwt
nominal_consumption_lh
thermal_efficiency_percentage
abatement_efficiency_percentage
operational_status
macrozone
latitude
longitude
altitude
brand
model
manufacture_year
useful_life_hours
chimney_inner_diameter
chimney_outer_diameter
chimney_height
gas_speed
gas_temperature
created_at
updated_at
```

#### `emission_activity_levels`

Campos sugeridos:

```txt
id
emission_source_id
period_year
period_month
quarter
fuel_consumption_liters
operating_hours
processed_tons
reported_by_user_id
status
created_at
updated_at
```

#### `emission_stoppages`

Campos sugeridos:

```txt
id
emission_source_id
activity_level_id
start_date
end_date
reason
created_at
updated_at
```

#### `pollutants`

Campos sugeridos:

```txt
id
code
name
description
created_at
updated_at
```

Ejemplos:

```txt
MP
SO2
NOX
CO2
```

#### `emission_factors`

Campos sugeridos:

```txt
id
source_type_id
pollutant_id
unit
value
valid_from
valid_to
created_at
updated_at
```

#### `emission_calculations`

Campos sugeridos:

```txt
id
activity_level_id
pollutant_id
emission_factor_id
calculated_value_ton
calculation_formula
calculated_at
created_at
```

#### `green_tax_thresholds`

Campos sugeridos:

```txt
id
pollutant_id
threshold_type
threshold_value
unit
valid_from
valid_to
created_at
updated_at
```

---

## 12. Dominio Notificaciones

### 12.1 Objetivo

Registrar notificaciones enviadas por correo, sistema o futuras integraciones.

### 12.2 Entidades

#### `notifications`

Campos sugeridos:

```txt
id
notification_type
entity_type
entity_id
subject
body
channel
status
scheduled_at
sent_at
created_at
updated_at
```

#### `notification_recipients`

Campos sugeridos:

```txt
id
notification_id
user_id
email
recipient_type
status
sent_at
created_at
```

Canales sugeridos:

```txt
EMAIL
IN_APP
SMS
TEAMS
WHATSAPP_PLACEHOLDER
```

---

## 13. Dominio Auditoría y comentarios

### 13.1 Objetivo

Trazabilidad transversal de cambios, validaciones, devoluciones y observaciones.

### 13.2 Entidades

#### `audit_logs`

Campos sugeridos:

```txt
id
entity_type
entity_id
action
old_value_json
new_value_json
performed_by_user_id
performed_at
ip_address
user_agent
created_at
```

#### `comments`

Campos sugeridos:

```txt
id
entity_type
entity_id
comment_type
body
created_by_user_id
created_at
updated_at
```

---

## 14. Dominio Reportabilidad

### 14.1 Objetivo

Soportar dashboards, exportaciones y consultas consolidadas.

### 14.2 Decisión

Inicialmente, los dashboards pueden generarse desde queries y vistas SQL sobre las tablas operacionales. Si el volumen crece, se puede agregar una capa de tablas agregadas/materialized views.

### 14.3 Entidades candidatas

```txt
report_exports
report_snapshots
dashboard_user_filters
```

#### `report_exports`

Campos sugeridos:

```txt
id
report_type
entity_type
entity_id
file_id
filters_json
generated_by_user_id
generated_at
created_at
```

---

## 15. Dominio IA futura

### 15.1 Objetivo

Dejar trazabilidad para sugerencias, clasificaciones automáticas, validación visual, análisis documental y predicciones.

### 15.2 Entidades candidatas

```txt
ai_suggestions
ai_classifications
ai_validation_results
ai_prediction_runs
```

#### `ai_suggestions`

Campos sugeridos:

```txt
id
entity_type
entity_id
suggestion_type
suggested_value
confidence_score
model_name
model_version
status
reviewed_by_user_id
reviewed_at
created_at
updated_at
```

Estados sugeridos:

```txt
PENDING
ACCEPTED
REJECTED
OVERRIDDEN
```

---

## 16. Relaciones principales resumidas

```txt
business_units 1--N areas
areas 1--N departments
areas 1--N sectors
sectors 1--N locations
companies 1--N users
areas 1--N users
users N--N roles
roles N--N permissions

mues 1--N critical_controls
critical_controls 1--N control_verification_items
critical_controls N--N areas via control_area_assignments
control_self_assessments 1--N control_self_assessment_answers

inspections 1--N inspection_findings
inspections 1--N inspection_checklist_answers
inspection_findings 1--N inspection_followups
inspection_findings 1--N evidence_links

incidents 1--1 incident_flash_reports
incidents 1--N incident_immediate_actions
incidents 1--N incident_involved_people
incidents 1--N incident_investigations
incident_investigations 1--N incident_timeline_events
incident_investigations 1--1 incident_peepo_analysis
incident_investigations 1--1 incident_five_why_analysis
incidents 1--N incident_action_plans

spr_parameters 1--N spr_monthly_records
spr_monthly_records 1--N evidence_links

emission_sources 1--N emission_activity_levels
emission_activity_levels 1--N emission_calculations
emission_source_types 1--N emission_factors
pollutants 1--N emission_factors
```

---

## 17. Reglas de negocio clave para DDL/Backend

### 17.1 Incidentes

```txt
Nivel 0-1: SLA 24 horas
Nivel 2: SLA 12 horas
Nivel 3: SLA 12 horas
Nivel 4: SLA 6 horas
Nivel 5: SLA 2 horas
Nivel >= 3: requiere ICAM obligatorio
Nivel < 3: puede requerir 5 Por Qué según decisión gerencial
Incidente no puede cerrarse sin evidencias de acciones correctivas
```

### 17.2 Inspecciones

```txt
Una inspección puede tener muchos hallazgos
Cada hallazgo puede tener máximo 3 seguimientos
Una inspección se cierra cuando todos sus hallazgos están cerrados/validados
El sistema calcula días de cierre y porcentaje de observaciones cerradas/pendientes
```

### 17.3 Controles críticos

```txt
Cada MUE puede tener múltiples controles críticos
Cada control puede tener múltiples ítems verificables
Las respuestas deben soportar YES, NO, PARTIAL, NOT_APPLICABLE
Las evidencias pueden ser obligatorias según el ítem
```

### 17.4 SPR

```txt
Cada parámetro se reporta por mes/año
Parámetros SOX requieren evidencia obligatoria
Un registro mensual no es final hasta validación/firma del responsable y gerente
Algunos parámetros se consolidan desde múltiples áreas
```

### 17.5 Impuesto verde

```txt
Fuentes activas deben tener registro mensual incluso si reportan valor 0
SISAT aplica si potencia térmica > 500 kWt
RUEA aplica si potencia >= 20 kW o 25 kVA
Cálculo de emisión = factor * nivel actividad * (1 - eficiencia abatimiento)
```

---

## 18. Decisiones pendientes antes del DDL final

1. Confirmar si `evidence_links` polimórfico es aceptable o si se requerirán tablas puente con FK estricta por módulo.
2. Confirmar catálogo oficial de roles y permisos.
3. Confirmar nombres oficiales de áreas, gerencias, sectores y empresas.
4. Confirmar si MUE y controles críticos deben versionarse.
5. Confirmar si los checklists de inspección deben ser 100% configurables desde administración.
6. Confirmar si los formularios ICAM y 5 Por Qué tendrán versión documental auditable.
7. Confirmar si SPR será parte del MVP o fase posterior.
8. Confirmar si Impuesto Verde será parte del MVP o fase posterior.
9. Confirmar si la IA debe tener tablas propias desde el inicio o solo placeholders.
10. Confirmar estrategia de multiambiente y migraciones iniciales.

---

## 19. Recomendación de implementación por fases

### Fase 1 - Base transversal

```txt
users
roles
permissions
areas
departments
companies
sectors
locations
files
evidences
evidence_links
audit_logs
comments
notifications
```

### Fase 2 - Inspecciones

```txt
inspection_types
inspections
inspection_checklist_templates
inspection_checklist_sections
inspection_checklist_items
inspection_checklist_answers
inspection_findings
inspection_followups
inspection_exports
```

### Fase 3 - Incidentes

```txt
incident_types
incidents
incident_involved_people
incident_immediate_actions
incident_flash_reports
incident_validations
incident_investigations
incident_timeline_events
incident_five_why_analysis
incident_action_plans
incident_disseminations
```

### Fase 4 - MUE / Controles críticos

```txt
mues
critical_controls
control_verification_items
control_area_assignments
control_self_assessments
control_self_assessment_answers
```

### Fase 5 - SPR e Impuesto Verde

```txt
spr_parameters
spr_monthly_records
emission_sources
emission_activity_levels
emission_calculations
```

---

## 20. Siguiente documento

El siguiente artefacto debe ser:

```txt
03-erd-conceptual.mmd
```

Luego:

```txt
04-ddl-postgres-draft.sql
05-typeorm-entities-plan.md
```
