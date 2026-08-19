# Handoff IA - Asistente de ejecución de hallazgos

## Objetivo

Este documento deja preparado el contrato funcional para que el equipo IA reemplace el mock del asistente AurelIA usado al ejecutar observaciones desde `Gestión de inspecciones`.

El frontend ya cuenta con un servicio formal:

```text
apps/web/src/shared/services/findingAssistantExecution.service.ts
```

Hoy ese servicio consume:

```text
apps/web/public/mock/finding-assistant-execution-suggestions.json
```

La UI que lo invoca está en:

```text
apps/web/src/modules/inspections/components/FindingAssistantExecutionView.tsx
```

## Flujo actual

1. Usuario abre el detalle de inspección.
2. Presiona `Ejecutar observación`.
3. Selecciona `Iniciar con asistente`.
4. AurelIA muestra contexto real del hallazgo:
   - condición detectada,
   - medida correctiva solicitada,
   - criticidad,
   - SLA,
   - evidencia antes,
   - responsables.
5. Usuario adjunta foto posterior.
6. Frontend llama a `suggestFindingExecutionAction`.
7. Servicio devuelve una descripción sugerida.
8. Usuario acepta o edita la descripción.
9. Al confirmar, se reutiliza la persistencia real del flujo manual.

## Payload sugerido para IA real

Cuando el equipo IA entregue endpoint, el frontend debería enviar un payload equivalente a:

```json
{
  "inspectionId": "string",
  "findingId": "string",
  "areaLabel": "string",
  "condition": "string",
  "proposedCorrectiveAction": "string",
  "severityLabel": "string",
  "dueAt": "ISO_DATE|null",
  "responsibleCompanyName": "string|null",
  "beforeEvidence": [
    {
      "fileId": "string|null",
      "title": "string|null",
      "description": "string|null",
      "capturedAt": "ISO_DATE|null"
    }
  ]
}
```

## Respuesta esperada

Respuesta mínima:

```json
{
  "suggestedActionDescription": "string"
}
```

Respuesta recomendada:

```json
{
  "suggestedActionDescription": "string",
  "confidence": 0.82,
  "model": "string",
  "reasoningSummary": "string",
  "safetyFlags": []
}
```

El frontend solo necesita `suggestedActionDescription` para operar. Los demás campos sirven para auditoría, trazabilidad o analítica futura.

## Reglas de producto

- La sugerencia no debe cerrar ni aprobar la observación automáticamente.
- La sugerencia debe redactarse como acción ya ejecutada por la EECC.
- Debe responder a la medida correctiva solicitada y no inventar evidencia no adjunta.
- Debe poder ser editada por el usuario antes de confirmar.
- El backend debe mantener la ejecución real como fuente de verdad.

## Reemplazo futuro

El cambio esperado debería concentrarse en `findingAssistantExecution.service.ts`:

1. Construir payload real desde `InspectionDetailFindingItemResponse`.
2. Llamar endpoint IA del backend.
3. Validar respuesta.
4. Mantener fallback al JSON mock si el endpoint falla o está deshabilitado.

No debería requerir cambios visuales en `FindingAssistantExecutionView.tsx`.
