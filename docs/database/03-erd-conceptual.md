# 03 - ERD Conceptual Aurelia

**Proyecto:** Aurelia  
**Documento:** Diagrama conceptual de entidades y relaciones  
**Versión:** 0.1 - borrador  

Este documento acompaña el archivo Mermaid `03-erd-conceptual.mmd`.

## Alcance

El ERD conceptual cubre los siguientes dominios:

- core organizacional;
- identity / usuarios / roles / permisos;
- archivos y evidencias;
- MUE y controles críticos;
- inspecciones;
- incidentes ambientales;
- SPR;
- impuesto verde / emisiones;
- workflow;
- notificaciones;
- auditoría;
- reportabilidad;
- IA futura.

## Decisiones de modelado

1. `files`, `evidences` y `evidence_links` son transversales.
2. `workflow_instances`, `workflow_steps` y `workflow_transitions` son transversales.
3. `comments` y `audit_logs` usan relación polimórfica mediante `entity_type` y `entity_id`.
4. `evidence_links` también usa relación polimórfica para permitir evidencias asociadas a inspecciones, hallazgos, incidentes, controles, SPR y emisiones.
5. El dominio de incidentes separa `incidents`, `incident_flash_reports`, `incident_investigations`, `incident_action_plans` y evidencias.
6. El dominio de inspecciones separa encabezado, checklist, respuestas, hallazgos, seguimientos y exportaciones.
7. SPR e impuesto verde quedan modelados como dominios propios para no contaminar incidentes/inspecciones con estructuras de reportabilidad mensual.

## Archivo Mermaid

El diagrama completo está en:

```txt
03-erd-conceptual.mmd
```

Puede visualizarse en herramientas compatibles con Mermaid.

## Pendientes antes de DDL

- Confirmar si se acepta relación polimórfica para evidencias, comentarios, auditoría y workflows.
- Confirmar si todos los dominios entran al MVP o si algunos quedan para fase 2.
- Confirmar catálogos oficiales de áreas, gerencias, empresas, roles, tipos de incidente y checklists.
- Confirmar si MUE, checklists y parámetros SPR requieren versionado formal.
