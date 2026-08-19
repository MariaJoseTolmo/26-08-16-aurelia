# Roadmap de integración real del detalle de hallazgos

Este documento fija el hilo técnico para pasar desde los mocks visuales del modal de inspecciones a datos reales, sin perder la fidelidad visual ya alcanzada.

## Objetivo

Conectar el modal de detalle de inspecciones con datos persistentes reales, partiendo por el flujo de hallazgos y luego replicando el patrón en checklist normativo.

La decisión base es separar tres niveles de información:

1. Datos generales de la inspección.
2. Hallazgos u observaciones específicos de esa inspección.
3. Evidencias asociadas al contexto correcto.

## Modelo objetivo para hallazgos

Un hallazgo debe tener campos estructurados, no solo texto concatenado en `description`.

Campos persistentes esperados:

```txt
detected_condition
proposed_corrective_action
executed_action_description
rejection_reason
executed_at
executed_by_user_id
rejected_at
rejected_by_user_id
```

El campo `description` queda como compatibilidad o texto libre, pero el frontend no debe depender de parsearlo para construir la UI.

## Estados de hallazgo

Estados operativos usados por diseño:

```txt
open        -> Abierta
in_progress -> Ejecutada / pendiente de aprobación
closed      -> Cerrada
rejected    -> Rechazada
cancelled   -> Cancelada / no visible en gestión normal
```

`rejected` debe existir como estado formal para evitar tratar rechazos como hallazgos abiertos con texto auxiliar.

## Evidencias

La evidencia general de inspección y la evidencia de cada hallazgo no deben compartir el mismo vínculo lógico.

Relaciones acordadas:

```txt
entity_type = inspection
relation_type = general_photo
```

para la fotografía general de la inspección.

```txt
entity_type = inspection_finding
relation_type = before_photo
```

para la evidencia inicial del hallazgo.

```txt
entity_type = inspection_finding
relation_type = after_photo
```

para la evidencia de ejecución o cierre.

```txt
entity_type = inspection_followup
relation_type = followup_photo
```

para soportes propios de seguimientos posteriores.

## Etapas

### Etapa 1 - Modelo, contratos y documentación

Estado: implementada y validada localmente.

Alcance:

```txt
packages/contracts/src/enums/inspection-finding-status.enum.ts
packages/contracts/src/enums/inspection-evidence-relation-type.enum.ts
packages/contracts/src/interfaces/inspection.interface.ts
packages/contracts/src/dtos/inspections/create-inspection-finding.request.ts
packages/contracts/src/dtos/inspections/update-inspection-finding.request.ts
apps/api/src/modules/inspections/entities/inspection-finding.entity.ts
apps/api/src/modules/inspections/dto/create-inspection-finding.dto.ts
apps/api/src/modules/inspections/dto/update-inspection-finding.dto.ts
apps/api/src/database/migrations/*FindingDetailDataModel.ts
```

Criterios de salida:

- El enum `InspectionFindingStatus` incluye `rejected`.
- `inspection_findings` tiene campos estructurados para condición, medida, ejecución y rechazo.
- El contrato compartido expone esos campos.
- Existen relation types estables para evidencias de inspección y hallazgo.
- No se cambia todavía el flujo visual ni el envío desde formularios.

### Etapa 2 - Corrección de creación manual y asistente

Estado: implementada y reforzada.

Alcance:

- Ajustar el flujo manual de Hallazgo para enviar `detectedCondition` y `proposedCorrectiveAction` como campos reales.
- Ajustar el flujo asistido AurelIA para el mismo contrato.
- Subir evidencia general como `inspection/general_photo` cuando corresponda.
- Subir evidencia inicial del hallazgo como `inspection_finding/before_photo` usando el `finding.id` retornado por API.
- Mantener compatibilidad con `description` durante transición.
- Evitar que la carga de responsables dependa de `users:read`; el selector del flujo de inspecciones consume `inspections/responsible-users` con permisos del módulo de inspecciones.

Criterios de salida:

- Una inspección con hallazgos nuevos queda persistida sin parsear texto.
- Cada hallazgo tiene su evidencia inicial vinculada al hallazgo específico.
- Los flujos manual y asistido quedan alineados.
- Los responsables seleccionados quedan disponibles para enviarse como `responsibleUserIds` al crear cada hallazgo.

Archivos tocados:

```txt
apps/api/src/modules/inspections/inspections.controller.ts
apps/api/src/modules/inspections/inspections.module.ts
apps/web/src/shared/services/inspections.service.ts
apps/web/src/modules/inspections/new-inspection/hooks/useSubmitNewInspection.ts
```

### Etapa 3 - Endpoint de detalle para UI

Estado: iniciada.

Alcance:

- Crear contrato compartido `InspectionDetailResponse`.
- Crear `GET /inspections/:id/detail`.
- Devolver inspección, hallazgos agrupados por estado, evidencias por relation type, responsables, seguimientos y datos enriquecidos de área, sector, empresa e inspector.
- Agregar hook y service frontend para consumo con React Query.
- Crear store Zustand solo para estado UI del modal.

Criterios de salida:

- El modal de Hallazgos deja de depender de mocks para header, progreso, acordeones y datos generales.
- Loading y error quedan resueltos sin romper el overlay/modal actual.

Archivos iniciados:

```txt
packages/contracts/src/dtos/inspections/inspection-detail.response.ts
packages/contracts/src/dtos/inspections/index.ts
```

### Etapa 4 - Acciones reales del modal

Alcance:

- Ejecutar observación.
- Aprobar cierre.
- Rechazar cierre con motivo.
- Reasignar responsables.
- Reasignar SLA.
- Vincular evidencia `after_photo` al ejecutar/cerrar.

Criterios de salida:

- Las acciones invalidan queries y refrescan el modal sin recargar la página.
- El estado de la tabla principal refleja los cambios del modal.

### Etapa 5 - Checklist normativo

Alcance:

- Reutilizar el mismo modelo de hallazgo para ítems NO que generan observación.
- Vincular la observación al `checklist_item_id`.
- Reutilizar los mismos grupos de evidencia y acciones.
- Integrar Resultado completo y Datos generales con respuestas reales de checklist.

Criterios de salida:

- Checklist y Hallazgos comparten cards, estados y acciones cuando corresponde.
- El detalle de checklist usa datos reales sin duplicar lógica visual.

## Reglas de implementación

- No parsear `description` salvo fallback temporal.
- No vincular evidencia específica de hallazgo contra `inspection`.
- No guardar `before_photo` ni `after_photo` como columnas; deben ser evidencias enlazadas.
- No mover server state a Zustand; usar React Query para datos remotos.
- Usar Zustand solo para estado local de UI del modal.
- Mantener cambios pequeños y validables por etapa.
