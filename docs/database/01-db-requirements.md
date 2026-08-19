# 01 - Requerimientos de Base de Datos Aurelia

**Proyecto:** Aurelia  
**Documento:** Requerimientos funcionales y técnicos para modelado de datos  
**Versión:** 0.1 - borrador inicial  
**Objetivo:** servir como base para construir el ERD, el DDL PostgreSQL, las entidades TypeORM y las migraciones iniciales del backend NestJS.

---

## 1. Propósito del documento

Este documento consolida los requerimientos de datos identificados en la documentación funcional, flujos visuales y archivos de referencia del proyecto Aurelia.

Su finalidad es dejar claramente definidos:

- dominios funcionales principales;
- entidades candidatas;
- atributos relevantes;
- relaciones esperadas;
- reglas de negocio;
- requerimientos de reportabilidad;
- dependencias transversales;
- dudas abiertas antes de generar el ERD/DDL definitivo.

Este documento **no es todavía el DDL final**. Es una etapa previa para evitar generar entidades TypeORM prematuramente sin validar el modelo de datos.

---

## 2. Fuentes consideradas

Se revisaron las siguientes fuentes funcionales y visuales:

- Guía Maestra de referencias para la creación de la base de datos.
- MPV AurelIA.
- Flujos de incidentes ambientales.
- Flujos de inspecciones.
- Dashboard de incidentes.
- Dashboard de inspecciones.
- Flash Report.
- Registro de incidentes mobile.
- Gestión de inspecciones desktop.
- Administración de usuarios.
- Exportación PDF.
- Acciones y seguimientos de inspecciones.
- Archivos de MUE y controles críticos.
- Autoevaluación de controles críticos.
- Self Assessment Evidences.

---

## 3. Alcance funcional de la base de datos

La base de datos debe soportar una plataforma ambiental centralizada compuesta por:

- aplicación web central por roles;
- dos aplicaciones móviles de terreno;
- API central;
- gestión de usuarios y permisos;
- gestión de áreas, gerencias, empresas y sectores;
- controles críticos asociados a MUE;
- autoevaluaciones de controles críticos;
- inspecciones ambientales;
- hallazgos y seguimientos;
- incidentes ambientales;
- Flash Report;
- investigaciones ICAM;
- análisis 5 Por Qué;
- evidencias y documentos;
- flujos de validación, aprobación, devolución y cierre;
- reportabilidad mediante dashboards;
- exportación a PDF;
- notificaciones;
- integración futura con IA, clasificación automática, validación visual, análisis documental y predicción.

---

## 4. Principios de diseño de datos

### 4.1 Base de datos modular pero centralizada

La solución debe tener una única base de datos transaccional, organizada por dominios funcionales:

- core organizacional;
- usuarios y permisos;
- MUE / controles críticos;
- inspecciones;
- incidentes;
- SPR;
- impuesto verde / emisiones;
- evidencias;
- workflow;
- auditoría;
- notificaciones;
- reportabilidad.

### 4.2 Tablas transversales reutilizables

Se deben evitar tablas duplicadas por módulo cuando el concepto sea transversal. Ejemplos:

- usuarios;
- empresas;
- áreas;
- gerencias;
- sectores;
- ubicaciones;
- archivos;
- evidencias;
- comentarios;
- historial de estados;
- workflow;
- notificaciones.

### 4.3 Evidencias centralizadas

Las evidencias deben manejarse como un componente transversal, ya que pueden estar asociadas a:

- controles críticos;
- respuestas de autoevaluación;
- inspecciones;
- hallazgos;
- seguimientos;
- incidentes;
- Flash Reports;
- acciones correctivas;
- registros SPR;
- registros de emisiones;
- investigaciones ICAM;
- análisis 5 Por Qué.

### 4.4 Workflow transversal

El proyecto tiene múltiples flujos de revisión, aprobación, devolución y cierre. Conviene modelar un workflow genérico que pueda ser reutilizado por inspecciones, incidentes, controles críticos y SPR.

### 4.5 No usar enums rígidos para catálogos de negocio cambiantes

Algunos valores pueden partir como catálogos base, pero deben modelarse como tablas si se espera que el negocio los administre:

- tipos de incidente;
- tipos de inspección;
- sectores;
- empresas;
- gerencias;
- áreas;
- tipos de fuente fija;
- contaminantes;
- parámetros SPR;
- checklists específicos;
- tipos de evidencia;
- estados de workflow.

---

## 5. Convenciones propuestas

### 5.1 Nombres de tablas

Usar nombres en inglés, snake_case y plural:

- `users`
- `companies`
- `areas`
- `incidents`
- `inspections`
- `evidences`

### 5.2 Campos comunes

Todas las tablas principales deberían incluir:

```sql
id uuid primary key
created_at timestamptz not null
updated_at timestamptz not null
deleted_at timestamptz null
created_by uuid null
updated_by uuid null
```

En entidades críticas también considerar:

```sql
code varchar unique null
is_active boolean default true
metadata jsonb null
```

### 5.3 Soft delete

Usar `deleted_at` en tablas de negocio importantes para trazabilidad, evitando borrado físico.

### 5.4 Auditoría

Las acciones importantes deben generar registros en `audit_logs`:

- creación;
- edición;
- cambio de estado;
- aprobación;
- rechazo;
- devolución;
- cierre;
- carga/eliminación de evidencia;
- exportación de PDF;
- envío de reporte;
- reasignación de responsable.

---

## 6. Dominios principales

## 6.1 Core organizacional

### Objetivo

Representar la estructura organizacional que permite segmentar información por unidad de negocio, gerencia, área, empresa, sector, ubicación y responsable.

### Entidades candidatas

#### `business_units`

Representa unidades como Salares Norte, Exploraciones u otras futuras.

Campos sugeridos:

- `id`
- `code`
- `name`
- `description`
- `is_active`

Relaciones:

- una unidad de negocio tiene muchas gerencias;
- una unidad de negocio puede tener muchas empresas asociadas;
- una unidad de negocio puede aparecer en filtros de dashboards.

---

#### `management_units`

Representa gerencias o macroáreas: Mina, Planta, Construcción, Servicios Generales, Exploraciones, Medio Ambiente, Sustentabilidad, Legal, Finanzas, etc.

Campos sugeridos:

- `id`
- `business_unit_id`
- `code`
- `name`
- `description`
- `is_active`

Relaciones:

- pertenece a una unidad de negocio;
- puede tener muchas áreas;
- se vincula con incidentes, inspecciones, fuentes fijas y registros SPR.

---

#### `areas`

Representa áreas funcionales o superintendencias.

Campos sugeridos:

- `id`
- `management_unit_id`
- `code`
- `name`
- `description`
- `is_active`

Relaciones:

- pertenece a una gerencia;
- puede ser responsable de MUE, controles críticos, inspecciones, incidentes, SPR o fuentes fijas.

---

#### `sectors`

Representa ubicaciones operacionales específicas.

Campos sugeridos:

- `id`
- `area_id`
- `code`
- `name`
- `description`
- `latitude`
- `longitude`
- `altitude`
- `is_active`

Relaciones:

- pertenece a un área;
- puede asociarse a inspecciones, incidentes y fuentes fijas.

---

#### `companies`

Representa Gold Fields y empresas colaboradoras/contratistas.

Campos sugeridos:

- `id`
- `code`
- `name`
- `tax_id`
- `company_type`
- `is_contractor`
- `is_active`

Relaciones:

- puede tener usuarios;
- puede estar asociada a incidentes;
- puede estar asociada a inspecciones;
- puede ser responsable de cierres, hallazgos o acciones.

---

#### `locations`

Representa ubicaciones geográficas específicas, con posibilidad de usar GPS.

Campos sugeridos:

- `id`
- `business_unit_id`
- `management_unit_id`
- `area_id`
- `sector_id`
- `name`
- `description`
- `latitude`
- `longitude`
- `altitude`
- `geohash`
- `metadata`

Uso:

- incidentes;
- inspecciones;
- fuentes fijas;
- evidencias con GPS;
- dashboards geográficos futuros.

---

## 6.2 Usuarios, roles y permisos

### Objetivo

Gestionar usuarios internos, usuarios de empresas contratistas y perfiles de acceso por módulo/acción.

### Roles funcionales identificados

- Administrador.
- Generador / Operador.
- Inspector.
- Empresa / Proveedor / Contratista.
- Verificador de cierre.
- Validador Medio Ambiente.
- Superintendente.
- Gerente.
- Viewer / consulta.
- Responsable de área.
- Responsable de dato SPR.

### Entidades candidatas

#### `users`

Campos sugeridos:

- `id`
- `company_id`
- `area_id`
- `email`
- `first_name`
- `last_name`
- `full_name`
- `position`
- `phone`
- `employee_code`
- `is_internal`
- `is_active`
- `last_login_at`

Relaciones:

- pertenece opcionalmente a empresa;
- pertenece opcionalmente a área;
- tiene roles;
- puede crear incidentes, inspecciones, evidencias y aprobaciones.

---

#### `roles`

Campos sugeridos:

- `id`
- `code`
- `name`
- `description`
- `is_system_role`
- `is_active`

---

#### `permissions`

Campos sugeridos:

- `id`
- `code`
- `name`
- `module`
- `action`
- `description`

Ejemplos:

- `incidents.create`
- `incidents.validate`
- `incidents.close`
- `inspections.create`
- `inspections.verify_closure`
- `controls.self_assess`
- `spr.approve`
- `users.manage`

---

#### `user_roles`

Campos sugeridos:

- `id`
- `user_id`
- `role_id`
- `business_unit_id`
- `area_id`
- `company_id`
- `valid_from`
- `valid_to`
- `is_active`

Uso:

Permite que un mismo usuario tenga distintos roles por área, empresa o unidad de negocio.

---

#### `role_permissions`

Campos sugeridos:

- `id`
- `role_id`
- `permission_id`

---

## 6.3 MUE y controles críticos

### Objetivo

Modelar los Material Unwanted Events y sus controles críticos, elementos verificables, evidencias esperadas, responsables y autoevaluaciones.

### MUE identificados inicialmente

- MUE1: Pérdida de contención.
- MUE2: Voladuras no controladas.
- MUE3: Impactos sobre flora y fauna.
- MUE4: Uso insostenible del agua.
- MUE5: Emisiones no controladas.
- MUE6: Incumplimiento normativo.

### Entidades candidatas

#### `mues`

Campos sugeridos:

- `id`
- `code`
- `name`
- `description`
- `predominant_control_type`
- `expected_main_evidence`
- `is_active`

Relaciones:

- tiene muchos controles críticos;
- se asocia a áreas responsables;
- puede vincularse a inspecciones, incidentes y reportabilidad.

---

#### `mue_area_assignments`

Campos sugeridos:

- `id`
- `mue_id`
- `area_id`
- `management_unit_id`
- `responsible_user_id`
- `responsible_name`
- `is_primary`
- `notes`

Uso:

Permite representar que un mismo MUE puede aplicar a múltiples áreas y responsables.

---

#### `critical_controls`

Campos sugeridos:

- `id`
- `mue_id`
- `code`
- `name`
- `description`
- `control_type`
- `is_active`

Valores posibles para `control_type`:

- `preventive`
- `mitigating`
- `systemic`
- `mixed`

---

#### `control_verification_items`

Campos sugeridos:

- `id`
- `critical_control_id`
- `code`
- `description`
- `verification_type`
- `required_evidence_description`
- `sort_order`
- `is_required`
- `is_active`

Valores posibles para `verification_type`:

- `document`
- `field`
- `system`
- `field_system`
- `mixed`

---

#### `control_self_assessments`

Representa una instancia de autoevaluación de controles críticos.

Campos sugeridos:

- `id`
- `mue_id`
- `area_id`
- `management_unit_id`
- `company_id`
- `period_year`
- `period_month`
- `status`
- `started_at`
- `submitted_at`
- `validated_at`
- `closed_at`
- `created_by`

Estados posibles:

- `draft`
- `submitted`
- `under_review`
- `returned`
- `validated`
- `closed`

---

#### `control_self_assessment_answers`

Campos sugeridos:

- `id`
- `self_assessment_id`
- `verification_item_id`
- `compliance_status`
- `comment`
- `answered_by`
- `answered_at`
- `validated_by`
- `validated_at`

Valores posibles para `compliance_status`:

- `yes`
- `no`
- `partial`
- `not_applicable`
- `not_answered`

Equivalencias de fuente:

- S/Y = yes;
- N = no;
- P = partial;
- NA = not_applicable.

---

## 6.4 Inspecciones ambientales

### Objetivo

Gestionar inspecciones en terreno, checklists, hallazgos, seguimientos, acciones correctivas, evidencias y cierre.

### Entidades candidatas

#### `inspection_types`

Campos sugeridos:

- `id`
- `code`
- `name`
- `description`
- `is_active`

Tipos iniciales:

- `checklist`
- `finding`

---

#### `inspections`

Representa el encabezado de una inspección.

Campos sugeridos:

- `id`
- `inspection_number`
- `inspection_type_id`
- `business_unit_id`
- `management_unit_id`
- `area_id`
- `sector_id`
- `company_id`
- `inspector_user_id`
- `inspection_date`
- `title`
- `description`
- `global_status`
- `opened_at`
- `closed_at`
- `closure_days`
- `total_findings`
- `open_findings`
- `closed_findings`
- `closure_percentage`
- `created_from`
- `metadata`

Estados sugeridos para `global_status`:

- `draft`
- `open`
- `in_followup`
- `pending_verification`
- `closed`
- `cancelled`

Reglas:

- la inspección se considera cerrada solo cuando todos sus hallazgos están cerrados/verificados;
- `closure_days` se calcula entre `inspection_date` y `closed_at`;
- el dashboard debe calcular porcentaje de observaciones cerradas y pendientes.

---

#### `inspection_checklist_templates`

Campos sugeridos:

- `id`
- `code`
- `name`
- `description`
- `version`
- `is_active`
- `applies_to_area_id`
- `applies_to_mue_id`

Tipos de checklist identificados:

- Almacenamiento SUSPEL general.
- Almacenamiento SUSPEL bodegas.
- Cianuro.
- Mercurio.
- Equipos nucleares.
- RESPEL.
- PTAS.
- Otros futuros.

---

#### `inspection_checklist_sections`

Campos sugeridos:

- `id`
- `template_id`
- `code`
- `title`
- `description`
- `sort_order`

---

#### `inspection_checklist_items`

Campos sugeridos:

- `id`
- `section_id`
- `code`
- `question`
- `requirement_reference`
- `is_required`
- `sort_order`
- `expected_evidence_type`

---

#### `inspection_checklist_answers`

Campos sugeridos:

- `id`
- `inspection_id`
- `checklist_item_id`
- `answer_status`
- `comment`
- `answered_by`
- `answered_at`

Valores sugeridos para `answer_status`:

- `complies`
- `does_not_comply`
- `partially_complies`
- `not_applicable`
- `not_answered`

Equivalencia visual:

- Cumple.
- No cumple.
- Cumple parcialmente.
- No aplica.

---

#### `inspection_findings`

Representa hallazgos u observaciones derivados de una inspección.

Campos sugeridos:

- `id`
- `inspection_id`
- `checklist_answer_id`
- `finding_number`
- `description`
- `corrective_measure`
- `risk_criticality`
- `responsible_user_id`
- `responsible_company_id`
- `sla_days`
- `due_date`
- `status`
- `initial_photo_file_id`
- `closed_at`
- `closure_verified_by`
- `closure_verified_at`

Valores sugeridos para `risk_criticality`:

- `low`
- `medium`
- `high`
- `critical`

Estados sugeridos:

- `open`
- `in_progress`
- `pending_evidence`
- `pending_verification`
- `closed`
- `rejected`

---

#### `inspection_followups`

El sistema debe permitir hasta tres seguimientos por hallazgo.

Campos sugeridos:

- `id`
- `finding_id`
- `followup_number`
- `followup_date`
- `observation`
- `progress_status`
- `closure_photo_file_id`
- `actual_closure_date`
- `created_by`

Restricción:

- `followup_number` debe estar entre 1 y 3.

---

#### `inspection_actions`

Campos sugeridos:

- `id`
- `finding_id`
- `description`
- `responsible_user_id`
- `responsible_company_id`
- `due_date`
- `status`
- `completed_at`
- `verified_at`
- `verified_by`

Uso:

Permite separar acciones correctivas del hallazgo cuando un hallazgo requiere más de una acción.

---

#### `inspection_exports`

Campos sugeridos:

- `id`
- `inspection_id`
- `export_type`
- `file_id`
- `generated_by`
- `generated_at`
- `language`
- `metadata`

Uso:

Registra PDFs exportables por inspección.

---

## 6.5 Incidentes ambientales

### Objetivo

Gestionar el registro, clasificación, validación, difusión, investigación, acciones correctivas, evidencias y cierre de incidentes ambientales.

### Entidades candidatas

#### `incident_types`

Campos sugeridos:

- `id`
- `code`
- `name`
- `description`
- `default_mue_id`
- `requires_dynamic_checklist`
- `is_active`

Tipos iniciales:

- pérdida de contención;
- fauna/flora;
- emisiones al aire;
- gestión de residuos;
- ruido y vibraciones;
- disturbio de suelo;
- patrimonio;
- cianuro;
- TSF;
- agua;
- otro.

---

#### `incident_levels`

Campos sugeridos:

- `id`
- `level_number`
- `name`
- `description`
- `notification_sla_hours`
- `requires_icam`
- `requires_high_management_alert`
- `is_active`

Reglas iniciales:

- Nivel 0: insignificante o cuasi-incidente, SLA 24 h.
- Nivel 1: menor con impacto mínimo, SLA 24 h.
- Nivel 2: incumplimiento con impacto a corto plazo, SLA 12 h.
- Nivel 3: grave, SLA 12 h, ICAM obligatorio.
- Nivel 4: grave/muy grave, SLA 6 h, ICAM obligatorio.
- Nivel 5: catastrófico, SLA 2 h, ICAM obligatorio.

---

#### `incidents`

Campos sugeridos:

- `id`
- `incident_reference`
- `business_unit_id`
- `management_unit_id`
- `area_id`
- `sector_id`
- `company_id`
- `location_id`
- `incident_type_id`
- `incident_level_id`
- `status`
- `event_occurred_at`
- `detected_at`
- `reported_at`
- `title`
- `description`
- `immediate_impact_description`
- `material_damage_description`
- `environmental_receptor`
- `volume`
- `volume_unit`
- `is_spie`
- `is_tsf_related`
- `is_cyanide_related`
- `requires_icam`
- `requires_five_why`
- `created_from`
- `created_by`
- `closed_at`
- `closed_by`

Estados sugeridos:

- `draft`
- `reported`
- `flash_report_pending`
- `under_validation`
- `returned`
- `validated`
- `disseminated`
- `under_investigation`
- `action_plan_open`
- `pending_closure_validation`
- `closed`
- `cancelled`

---

#### `incident_involved_people`

Campos sugeridos:

- `id`
- `incident_id`
- `user_id`
- `company_id`
- `full_name`
- `position`
- `age`
- `seniority_months`
- `role_in_incident`
- `notes`

---

#### `incident_immediate_actions`

Campos sugeridos:

- `id`
- `incident_id`
- `description`
- `performed_at`
- `performed_by_user_id`
- `performed_by_name`
- `effectiveness_comment`

Uso:

Registra medidas tomadas dentro de las primeras horas.

---

#### `incident_flash_reports`

Campos sugeridos:

- `id`
- `incident_id`
- `report_number`
- `status`
- `generated_at`
- `generated_by`
- `validated_at`
- `validated_by`
- `pdf_file_id`
- `summary`
- `root_description_snapshot`
- `metadata`

Reglas:

- debe generarse o completarse dentro del SLA definido;
- puede ser devuelto por Medio Ambiente;
- una vez validado, puede ser difundido a destinatarios definidos.

---

#### `incident_validations`

Campos sugeridos:

- `id`
- `incident_id`
- `validator_user_id`
- `validation_status`
- `comment`
- `validated_at`

Valores:

- `approved`
- `returned`
- `rejected`
- `requires_more_information`

---

#### `incident_disseminations`

Campos sugeridos:

- `id`
- `incident_id`
- `flash_report_id`
- `sent_at`
- `sent_by`
- `recipient_scope`
- `email_subject`
- `email_body`
- `status`

Uso:

Registra envío del Flash Report a superintendencias, gerencias o listas corporativas.

---

#### `incident_investigations`

Representa investigación ICAM o investigación simplificada.

Campos sugeridos:

- `id`
- `incident_id`
- `investigation_type`
- `status`
- `started_at`
- `completed_at`
- `leader_user_id`
- `summary`
- `conclusion`
- `requires_icam`
- `requires_five_why`

Valores para `investigation_type`:

- `icam`
- `five_why`
- `simplified`
- `none`

---

#### `incident_investigation_team_members`

Campos sugeridos:

- `id`
- `investigation_id`
- `user_id`
- `full_name`
- `role`
- `company_id`
- `participation_notes`

---

#### `incident_peepo_analysis`

Campos sugeridos:

- `id`
- `investigation_id`
- `people_analysis`
- `equipment_analysis`
- `environment_analysis`
- `procedures_analysis`
- `organization_analysis`

Uso:

Modela PEEPO para ICAM.

---

#### `incident_timeline_events`

Campos sugeridos:

- `id`
- `investigation_id`
- `event_time`
- `title`
- `description`
- `sort_order`
- `created_by`

---

#### `incident_five_why_analysis`

Campos sugeridos:

- `id`
- `investigation_id`
- `why_1`
- `why_2`
- `why_3`
- `why_4`
- `why_5`
- `root_cause`
- `conclusion`
- `created_by`

---

#### `incident_contributing_factors`

Campos sugeridos:

- `id`
- `investigation_id`
- `factor_type`
- `description`
- `category`
- `is_root_cause`

Categorías sugeridas:

- `failed_defense`
- `task_condition`
- `human_factor`
- `equipment_factor`
- `environment_factor`
- `organizational_factor`
- `procedure_factor`

---

#### `incident_action_plans`

Campos sugeridos:

- `id`
- `incident_id`
- `investigation_id`
- `description`
- `responsible_user_id`
- `responsible_company_id`
- `due_date`
- `status`
- `completed_at`
- `verified_by`
- `verified_at`

Estados:

- `open`
- `in_progress`
- `completed`
- `verified`
- `rejected`
- `overdue`

Regla:

- un incidente no puede cerrarse si tiene acciones abiertas o sin evidencia requerida.

---

## 6.6 SPR - Sustainability Performance Reporting

### Objetivo

Centralizar la recopilación, validación, consolidación y almacenamiento de parámetros ambientales y operacionales mensuales para reportabilidad corporativa.

### Entidades candidatas

#### `spr_measure_groups`

Campos sugeridos:

- `id`
- `code`
- `name`
- `description`

Ejemplo:

- Environment.

---

#### `spr_units`

Campos sugeridos:

- `id`
- `code`
- `name`
- `description`

Unidades iniciales:

- TON.
- KG.
- KLT.
- MWH.
- MLT.
- KM.
- USD.
- LC.

---

#### `spr_parameters`

Campos sugeridos:

- `id`
- `gri_code`
- `company_code`
- `measure_group_id`
- `name`
- `description`
- `unit_id`
- `is_sox`
- `requires_evidence`
- `is_active`
- `sort_order`

Reglas:

- existen 51 parámetros mensuales;
- 11 parámetros SOX requieren evidencia documental estricta;
- algunos parámetros pueden recibir aportes desde múltiples áreas.

---

#### `spr_parameter_area_assignments`

Campos sugeridos:

- `id`
- `parameter_id`
- `area_id`
- `management_unit_id`
- `responsible_user_id`
- `manager_user_id`
- `is_required`
- `is_active`

---

#### `spr_reporting_periods`

Campos sugeridos:

- `id`
- `year`
- `month`
- `quarter`
- `semester`
- `status`
- `opened_at`
- `closed_at`

Estados sugeridos:

- `open`
- `data_requested`
- `data_submitted`
- `under_review`
- `approved`
- `closed`

---

#### `spr_monthly_records`

Campos sugeridos:

- `id`
- `period_id`
- `parameter_id`
- `area_id`
- `management_unit_id`
- `reported_by`
- `value`
- `unit_id`
- `source_information`
- `validation_status`
- `submitted_at`
- `approved_by_responsible_at`
- `approved_by_manager_at`
- `is_final`

Estados de validación:

- `pending`
- `draft`
- `submitted`
- `returned`
- `elaborated`
- `approved_by_responsible`
- `approved_by_management`
- `final`

Reglas:

- un dato SOX no puede aprobarse sin evidencia;
- ningún dato se considera final sin aprobación/firma del responsable y gerente;
- el día 1-3 se solicitan datos, día 10 entrega, día 15 carga en plataforma corporativa.

---

#### `spr_record_approvals`

Campos sugeridos:

- `id`
- `record_id`
- `approver_user_id`
- `approval_role`
- `status`
- `comment`
- `approved_at`

---

#### `spr_consolidation_rules`

Campos sugeridos:

- `id`
- `parameter_id`
- `rule_type`
- `expression`
- `description`
- `is_active`

Uso:

Permite consolidar indicadores que suman aportes de varias áreas.

---

## 6.7 Impuesto verde y emisiones

### Objetivo

Soportar catastro de fuentes fijas, captura mensual de actividad, cálculo de emisiones, reportabilidad RFP/SISAT/RUEA e impuesto verde.

### Entidades candidatas

#### `emission_source_types`

Campos sugeridos:

- `id`
- `code`
- `name`
- `description`

Ejemplos:

- grupo electrógeno;
- motor de generación eléctrica;
- horno;
- caldera.

---

#### `emission_sources`

Campos sugeridos:

- `id`
- `rfp_identifier`
- `internal_tag`
- `serial_number`
- `source_type_id`
- `category`
- `management_unit_id`
- `area_id`
- `sector_id`
- `location_id`
- `installed_power_kw`
- `thermal_power_mwt`
- `nominal_consumption_lh`
- `thermal_efficiency_percentage`
- `abatement_efficiency_percentage`
- `operational_status`
- `brand`
- `model`
- `manufacturing_year`
- `useful_life_hours`
- `chimney_internal_diameter`
- `chimney_external_diameter`
- `chimney_height`
- `gas_velocity`
- `gas_temperature`
- `is_active`

Estados operativos:

- `active`
- `inactive`
- `decommissioned`

Reglas:

- SISAT aplica si potencia térmica > 500 kWt;
- RUEA aplica si potencia >= 20 kW o 25 kVA.

---

#### `pollutants`

Campos sugeridos:

- `id`
- `code`
- `name`
- `unit`

Contaminantes iniciales:

- MP.
- SO2.
- NOx.
- CO2.

---

#### `emission_factors`

Campos sugeridos:

- `id`
- `source_type_id`
- `pollutant_id`
- `value`
- `unit`
- `valid_from`
- `valid_to`
- `source_reference`
- `is_active`

---

#### `emission_activity_levels`

Campos sugeridos:

- `id`
- `emission_source_id`
- `year`
- `month`
- `quarter`
- `fuel_consumption_liters`
- `operation_hours`
- `processed_tons`
- `reported_by`
- `reported_at`
- `validation_status`
- `notes`

Regla:

- si una fuente activa no operó, debe existir registro mensual con valor 0.

---

#### `emission_stoppages`

Campos sugeridos:

- `id`
- `emission_source_id`
- `activity_level_id`
- `started_at`
- `ended_at`
- `duration_days`
- `reason`

Regla:

- registrar paralizaciones si duración >= 15 días.

---

#### `emission_calculations`

Campos sugeridos:

- `id`
- `activity_level_id`
- `pollutant_id`
- `emission_factor_id`
- `calculated_value`
- `formula`
- `calculated_at`

Fórmula base:

```txt
E = factor_emision * nivel_actividad * (1 - eficiencia_abatimiento)
```

---

#### `green_tax_thresholds`

Campos sugeridos:

- `id`
- `pollutant_id`
- `threshold_value`
- `unit`
- `period`
- `description`
- `is_active`

Umbrales referenciales:

- CO2: 25.000 t/año.
- MP: 100 t/año.

---

## 6.8 Evidencias, archivos y documentos

### Objetivo

Unificar la gestión de archivos, documentos, fotos, PDFs, pantallazos, videos y evidencias de cierre.

### Entidades candidatas

#### `files`

Campos sugeridos:

- `id`
- `storage_provider`
- `bucket_or_container`
- `path`
- `original_filename`
- `mime_type`
- `size_bytes`
- `checksum`
- `uploaded_by`
- `uploaded_at`
- `metadata`

---

#### `evidences`

Campos sugeridos:

- `id`
- `evidence_type`
- `title`
- `description`
- `file_id`
- `captured_at`
- `captured_by`
- `latitude`
- `longitude`
- `source`
- `validation_status`
- `validated_by`
- `validated_at`
- `ai_validation_status`
- `ai_validation_summary`

Tipos sugeridos:

- `photo`
- `video`
- `document`
- `pdf`
- `spreadsheet`
- `screenshot`
- `signature`
- `audio`
- `gps`
- `other`

---

#### `evidence_links`

Relación genérica entre evidencia y entidad de negocio.

Campos sugeridos:

- `id`
- `evidence_id`
- `entity_type`
- `entity_id`
- `relation_type`
- `is_required`
- `created_by`

Valores sugeridos para `entity_type`:

- `inspection`
- `inspection_finding`
- `inspection_followup`
- `incident`
- `incident_action_plan`
- `incident_flash_report`
- `incident_investigation`
- `control_self_assessment`
- `control_self_assessment_answer`
- `spr_monthly_record`
- `emission_activity_level`

Nota:

Esta opción entrega flexibilidad, pero sacrifica integridad referencial estricta a nivel DB. Si se quiere máxima integridad, se deben crear tablas puente específicas por dominio.

---

## 6.9 Workflow, estados y aprobaciones

### Objetivo

Modelar flujos de revisión, validación, devolución, aprobación y cierre sin duplicar estructuras por módulo.

### Entidades candidatas

#### `workflow_definitions`

Campos sugeridos:

- `id`
- `code`
- `name`
- `entity_type`
- `description`
- `is_active`

Ejemplos:

- `incident_validation_workflow`
- `inspection_closure_workflow`
- `control_self_assessment_workflow`
- `spr_record_approval_workflow`

---

#### `workflow_steps`

Campos sugeridos:

- `id`
- `workflow_definition_id`
- `code`
- `name`
- `sort_order`
- `required_role_id`
- `is_final_step`

---

#### `workflow_instances`

Campos sugeridos:

- `id`
- `workflow_definition_id`
- `entity_type`
- `entity_id`
- `current_step_id`
- `status`
- `started_at`
- `completed_at`
- `created_by`

---

#### `workflow_transitions`

Campos sugeridos:

- `id`
- `workflow_instance_id`
- `from_step_id`
- `to_step_id`
- `action`
- `comment`
- `performed_by`
- `performed_at`

Acciones:

- `submit`
- `approve`
- `return`
- `reject`
- `close`
- `reopen`
- `cancel`

---

## 6.10 Notificaciones

### Objetivo

Registrar notificaciones por correo, alertas internas y eventos pendientes de envío.

### Entidades candidatas

#### `notifications`

Campos sugeridos:

- `id`
- `entity_type`
- `entity_id`
- `notification_type`
- `subject`
- `body`
- `status`
- `scheduled_at`
- `sent_at`
- `error_message`
- `created_by`

Tipos:

- `email`
- `system`
- `push`
- `webhook`

---

#### `notification_recipients`

Campos sugeridos:

- `id`
- `notification_id`
- `user_id`
- `email`
- `recipient_type`
- `delivery_status`
- `delivered_at`

---

## 6.11 Auditoría y comentarios

### Entidades candidatas

#### `audit_logs`

Campos sugeridos:

- `id`
- `entity_type`
- `entity_id`
- `action`
- `old_value`
- `new_value`
- `performed_by`
- `performed_at`
- `ip_address`
- `user_agent`

---

#### `comments`

Campos sugeridos:

- `id`
- `entity_type`
- `entity_id`
- `comment`
- `visibility`
- `created_by`
- `created_at`

Uso:

- devoluciones;
- observaciones de validación;
- comentarios de hallazgos;
- notas internas.

---

## 7. Reglas de negocio principales

## 7.1 Reglas de incidentes

1. Todo incidente debe tener referencia única.
2. Todo incidente debe tener fecha/hora del evento y fecha/hora de detección.
3. Todo incidente debe asociarse a empresa, gerencia/área y ubicación cuando aplique.
4. El nivel del incidente define SLA de notificación.
5. Nivel 0 y 1 tienen SLA de 24 horas.
6. Nivel 2 tiene SLA de 12 horas.
7. Nivel 3 tiene SLA de 12 horas y requiere ICAM.
8. Nivel 4 tiene SLA de 6 horas y requiere ICAM.
9. Nivel 5 tiene SLA máximo de 2 horas y requiere ICAM.
10. Los niveles 3 a 5 requieren investigación ICAM obligatoria.
11. Los niveles 0 a 2 pueden usar 5 Por Qué.
12. El Flash Report debe poder validarse, devolverse y difundirse.
13. Un incidente no puede cerrarse sin evidencias de cumplimiento de planes de acción.
14. Si el incidente es TSF, cianuro o nivel alto, puede requerir alerta a alta dirección.
15. La BD debe permitir identificar reincidencias por área, tipo de incidente y empresa contratista.

---

## 7.2 Reglas de inspecciones

1. Una inspección puede ser tipo checklist o hallazgo.
2. Una inspección puede tener múltiples hallazgos.
3. Cada hallazgo puede tener hasta tres seguimientos.
4. Cada hallazgo debe tener responsable de cierre.
5. Cada hallazgo puede tener criticidad y SLA.
6. La inspección se cierra solo si todos sus hallazgos están cerrados.
7. El sistema debe calcular días de cierre.
8. El sistema debe calcular porcentaje de observaciones cerradas y pendientes.
9. Debe existir exportación PDF por inspección.
10. Mina debe poder filtrarse/segmentarse de forma independiente.

---

## 7.3 Reglas de controles críticos

1. Cada MUE puede tener múltiples controles críticos.
2. Cada control crítico puede tener múltiples elementos verificables.
3. Cada elemento verificable puede requerir evidencia documental, de campo o de sistema.
4. Las respuestas de autoevaluación deben registrar S/N/P/NA o equivalentes.
5. Las autoevaluaciones deben asociarse a área, responsable y periodo.
6. Debe existir trazabilidad de comentarios, evidencias y validaciones.
7. La información debe poder segmentarse por área y MUE.

---

## 7.4 Reglas de SPR

1. Cada parámetro se reporta mensualmente.
2. Cada parámetro debe tener unidad de medida.
3. Algunos parámetros son SOX y requieren evidencia obligatoria.
4. Algunos parámetros pueden consolidarse desde múltiples áreas.
5. Ningún dato final debe quedar sin firma/aprobación del responsable y gerente.
6. Debe existir tracking de evidencias SOX.
7. Debe soportar reportes mensuales y KPIs de intensidad.

---

## 7.5 Reglas de impuesto verde

1. Cada fuente fija debe tener catastro técnico.
2. Cada fuente activa debe tener registro mensual de actividad, incluso si el valor es 0.
3. SISAT aplica para fuentes con potencia térmica mayor a 500 kWt.
4. RUEA aplica para fuentes con potencia mayor o igual a 20 kW o 25 kVA.
5. El cálculo de emisiones debe considerar factor de emisión, nivel de actividad y eficiencia de abatimiento.
6. Deben registrarse paralizaciones de duración mayor o igual a 15 días.
7. Debe permitir reportar emisiones anuales y estimación de costos.

---

## 8. Requerimientos de reportabilidad

La BD debe soportar dashboards y reportes con filtros por:

- año;
- mes;
- trimestre;
- semestre;
- unidad de negocio;
- gerencia;
- área;
- sector;
- empresa;
- tipo de incidente;
- nivel de incidente;
- estado;
- MUE;
- control crítico;
- responsable;
- criticidad;
- estado de cierre;
- estado de validación;
- parámetros SOX;
- fuentes fijas;
- contaminantes.

### Métricas mínimas para incidentes

- total de incidentes histórico;
- total de incidentes por año;
- incidentes abiertos vs cerrados;
- incidentes por nivel 0-5;
- incidentes por tipo;
- incidentes por gerencia;
- incidentes por empresa;
- incidentes por mes;
- incidentes CAT <= 2 vs CAT >= 3;
- cumplimiento SLA;
- reincidencias por área/empresa/tipo.

### Métricas mínimas para inspecciones

- total de inspecciones;
- inspecciones abiertas vs cerradas;
- observaciones abiertas vs cerradas;
- días promedio de cierre;
- hallazgos por empresa;
- hallazgos por área;
- hallazgos por criticidad;
- seguimientos pendientes;
- porcentaje de cierre.

### Métricas mínimas para controles críticos

- cumplimiento por MUE;
- cumplimiento por área;
- controles con respuesta parcial/no;
- evidencias faltantes;
- avance por responsable;
- brechas críticas.

### Métricas mínimas para SPR

- registros mensuales por parámetro;
- parámetros pendientes;
- parámetros aprobados;
- evidencias SOX faltantes;
- consolidado mensual;
- KPIs de intensidad.

### Métricas mínimas para emisiones

- consumo mensual;
- horas de operación;
- emisiones por contaminante;
- acumulado anual;
- comparación contra umbrales;
- fuentes activas sin reporte;
- registros en cero.

---

## 9. Requerimientos para mobile / offline

Las apps móviles deben poder registrar información en terreno y sincronizar posteriormente.

La base de datos central debe soportar:

- identificadores UUID generados por cliente;
- estado de sincronización;
- timestamps de creación offline;
- metadata de origen;
- evidencias con GPS;
- carga de fotos/videos/audio;
- resolución de duplicados;
- trazabilidad de usuario/dispositivo.

Campos sugeridos en entidades creadas desde móvil:

```sql
client_generated_id uuid null
source_device_id varchar null
created_from varchar null
offline_created_at timestamptz null
synced_at timestamptz null
sync_status varchar null
```

No necesariamente todos estos campos deben ir en cada tabla; se puede resolver mediante tablas de sincronización.

---

## 10. Requerimientos para IA futura

Aunque la IA no debe condicionar el diseño inicial, la BD debe guardar datos suficientes para habilitar:

- clasificación sugerida de incidentes;
- nivel probable;
- validación visual de evidencias;
- sugerencia de acciones correctivas;
- detección de reincidencias;
- predicción de riesgo por área/temporada;
- análisis de causas ICAM;
- generación de Flash Report;
- actualización automática de SPR.

### Entidades futuras posibles

#### `ai_suggestions`

Campos sugeridos:

- `id`
- `entity_type`
- `entity_id`
- `suggestion_type`
- `input_snapshot`
- `suggested_value`
- `confidence`
- `model_name`
- `status`
- `reviewed_by`
- `reviewed_at`

#### `ai_validation_results`

Campos sugeridos:

- `id`
- `evidence_id`
- `validation_type`
- `result`
- `confidence`
- `summary`
- `raw_response`
- `created_at`

---

## 11. Entidades priorizadas para primer ERD

Para una primera versión usable, se recomienda modelar en este orden:

### Fase 1 - Core transversal

- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `business_units`
- `management_units`
- `areas`
- `sectors`
- `companies`
- `locations`
- `files`
- `evidences`
- `evidence_links`
- `audit_logs`
- `comments`

### Fase 2 - Inspecciones

- `inspection_types`
- `inspections`
- `inspection_checklist_templates`
- `inspection_checklist_sections`
- `inspection_checklist_items`
- `inspection_checklist_answers`
- `inspection_findings`
- `inspection_followups`
- `inspection_actions`
- `inspection_exports`

### Fase 3 - Incidentes

- `incident_types`
- `incident_levels`
- `incidents`
- `incident_involved_people`
- `incident_immediate_actions`
- `incident_flash_reports`
- `incident_validations`
- `incident_disseminations`
- `incident_investigations`
- `incident_investigation_team_members`
- `incident_peepo_analysis`
- `incident_timeline_events`
- `incident_five_why_analysis`
- `incident_contributing_factors`
- `incident_action_plans`

### Fase 4 - MUE / Controles críticos

- `mues`
- `mue_area_assignments`
- `critical_controls`
- `control_verification_items`
- `control_self_assessments`
- `control_self_assessment_answers`

### Fase 5 - SPR

- `spr_measure_groups`
- `spr_units`
- `spr_parameters`
- `spr_parameter_area_assignments`
- `spr_reporting_periods`
- `spr_monthly_records`
- `spr_record_approvals`
- `spr_consolidation_rules`

### Fase 6 - Impuesto verde

- `emission_source_types`
- `emission_sources`
- `pollutants`
- `emission_factors`
- `emission_activity_levels`
- `emission_stoppages`
- `emission_calculations`
- `green_tax_thresholds`

---

## 12. Dudas abiertas antes de DDL definitivo

### Organizacional

1. ¿La jerarquía oficial es Unidad de Negocio > Gerencia > Área > Sector?
2. ¿Las empresas contratistas pertenecen a una gerencia/área o se vinculan solo por registros?
3. ¿Los usuarios contratistas deben tener visibilidad solo de su empresa?
4. ¿Se requiere multi-unidad desde el inicio o solo Salares Norte?

### Usuarios y permisos

5. ¿El login será con usuario/password local, Microsoft Entra ID o ambos?
6. ¿Los roles se asignan globalmente o por área/empresa?
7. ¿Quién puede cerrar definitivamente una inspección?
8. ¿Quién puede cerrar definitivamente un incidente?

### Inspecciones

9. ¿Los checklists se administrarán dinámicamente desde la plataforma?
10. ¿Los checklists deben versionarse?
11. ¿Un hallazgo puede pertenecer a varios responsables?
12. ¿El límite de tres seguimientos es regla rígida?
13. ¿La inspección tipo “hallazgo” usa checklist vacío o flujo separado?
14. ¿La exportación PDF debe guardar snapshot exacto del contenido?

### Incidentes

15. ¿El número de referencia del incidente lo genera el sistema o viene desde formato externo?
16. ¿Puede cambiar el nivel del incidente después de la validación?
17. ¿El Flash Report tiene versiones?
18. ¿La investigación ICAM debe tener sesiones/visitas como entidades separadas?
19. ¿El 5 Por Qué es obligatorio para todos los niveles 0-2 o solo discrecional?
20. ¿El cierre requiere aprobación de Medio Ambiente, Superintendencia o ambos?

### Controles críticos

21. ¿Los controles críticos vienen de Excel inicial y luego se administran en la app?
22. ¿Se requiere versionado de controles y elementos verificables?
23. ¿La autoevaluación es mensual, trimestral, anual o bajo demanda?
24. ¿Debe existir ponderación de controles para calcular score?

### SPR

25. ¿Los 51 parámetros serán cargados inicialmente como catálogo?
26. ¿Los parámetros SOX son fijos o pueden cambiar?
27. ¿La firma digital será simple aprobación en sistema o firma electrónica formal?
28. ¿Los datos SPR se integrarán automáticamente desde incidentes y otros módulos?

### Impuesto verde

29. ¿El catastro de fuentes fijas se cargará manualmente o desde RFP?
30. ¿Los factores de emisión cambian por periodo?
31. ¿La estimación de impuesto debe quedar persistida o calcularse en vistas?
32. ¿Se requiere almacenar trazabilidad de carga en SISAT/RUEA?

### Evidencias

33. ¿Se requiere integridad FK estricta por módulo o se acepta `entity_type/entity_id`?
34. ¿Las evidencias eliminadas deben conservarse por auditoría?
35. ¿Se debe registrar geolocalización obligatoria para fotos mobile?
36. ¿Se debe almacenar hash/checksum para no repudio?

---

## 13. Próximos documentos recomendados

A partir de este documento, se recomienda generar:

```txt
/docs/database/02-domain-model.md
/docs/database/03-erd-conceptual.mmd
/docs/database/04-ddl-postgres-draft.sql
/docs/database/05-typeorm-entities-plan.md
```

---

## 14. Criterio para avanzar a ERD

Se puede avanzar al ERD cuando estén validadas al menos estas decisiones:

1. Jerarquía organizacional.
2. Alcance de MVP: inspecciones + incidentes + usuarios + evidencias.
3. Si MUE/controles críticos entran en MVP o fase 2.
4. Modelo de permisos por rol/área/empresa.
5. Estrategia de evidencias: relación polimórfica o tablas puente.
6. Estados oficiales de inspecciones e incidentes.
7. Versionado de checklists y Flash Reports.
8. Integración inicial o futura con SPR.
