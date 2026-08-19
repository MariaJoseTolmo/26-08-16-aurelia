# Assistant checklist normativo parity - 2026-06-26

## Objetivo

Hacer que el flujo conversacional de `/inspection/chat` para `Checklist normativo` construya la misma estructura que el formulario manual.

## Principio de diseño

El asistente no debe guardar un modelo libre cuando el usuario elige `Checklist normativo`.

Debe llenar el mismo draft usado por el flujo manual:

```txt
useManualInspectionDraft
```

Y debe guardar con el mismo hook:

```txt
useSaveManualInspectionOffline
```

## Cambios aplicados

Se agregó la implementación conversacional en:

```txt
apps/mobile-inspecciones/src/modules/inspection/InspectionChatScreenV2.tsx
```

Se delegó el componente anterior hacia V2 en:

```txt
apps/mobile-inspecciones/src/modules/inspection/InspectionAssistantChatScreen.tsx
```

La ruta sigue entrando por:

```txt
apps/mobile-inspecciones/app/inspection/chat.tsx
```

## Ruta conversacional implementada

El chat pide y guarda, en orden:

```txt
1. Área
2. Sector
3. Tipo de inspección
4. Fecha de inspección
5. Ubicación obligatoria
6. Plantilla normativa
7. Foto general obligatoria
8. Respuestas de cada ítem real de la plantilla
9. Si hay ítem NO: condición detectada
10. Si hay ítem NO: medida correctiva
11. Si hay ítem NO: foto del hallazgo
12. Si hay hallazgos: empresa responsable
13. Si hay hallazgos: responsables sugeridos
14. Resumen
15. Guardar inspección
```

## Paridad funcional con manual

El asistente ahora usa:

```txt
useManualInspectionDraft.setArea
useManualInspectionDraft.setSector
useManualInspectionDraft.setInspectionDate
useManualInspectionDraft.setLocation
useManualInspectionDraft.setInspectionType
useManualInspectionDraft.setTemplate
useManualInspectionDraft.setGeneralPhoto
useManualInspectionDraft.setAnswer
useManualInspectionDraft.setItemDetail
useManualInspectionDraft.setFindingCompany
useManualInspectionDraft.setFindingResponsibles
```

Al guardar, usa:

```txt
useSaveManualInspectionOffline.mutateAsync({
  draft,
  template,
  items,
  trySyncNow
})
```

Por lo tanto genera las mismas operaciones offline que el manual:

```txt
CREATE_INSPECTION
UPSERT_INSPECTION_ANSWER
CREATE_INSPECTION_FINDING cuando hay respuestas NO
CLOSE_INSPECTION cuando no hay respuestas NO
```

## Segunda iteración aplicada

Se corrigió la carga de catálogos para evitar depender del resultado directo de `refetch()` de React Query, porque ese `refetch()` pertenece al bootstrap completo y no solo al arreglo derivado de plantillas o empresas.

Ahora `InspectionChatScreenV2` carga directamente desde:

```txt
getMobileBootstrapLocalFirst()
```

para:

```txt
inspectionTemplates
companies.filter(isContractor)
```

Esto evita fallos donde el chat intentaba leer `length`, `find` o `map` sobre el objeto bootstrap completo en vez de sobre un arreglo.

También se ajustó el submit para volver a resolver la plantilla desde bootstrap si el hook todavía no alcanzó a hidratar `templatesQuery.data`.

## Tercera iteración aplicada

Se reemplazó la presentación resumida de cada ítem:

```txt
SÍ · ORDEN-LIMPIEZA
NO · ORDEN-LIMPIEZA
N/A · ORDEN-LIMPIEZA
```

por una tarjeta conversacional equivalente al formulario manual:

```txt
header con sección y código del ítem
número del ítem
pregunta completa desde checklistItem.question
guía si existe
botones SÍ / NO / N/A
```

Esto mantiene la conversación, pero muestra la pregunta real del checklist y no solo el código.

## Estado de Hallazgo

`Hallazgo` sigue pendiente. Si el usuario lo selecciona, el chat muestra un aviso y no intenta guardar un payload incompleto.

## Validación recomendada

1. Entrar a `/inspection/chat`.
2. Seleccionar `Checklist normativo`.
3. Completar área, sector, fecha y ubicación.
4. Seleccionar plantilla.
5. Adjuntar foto general.
6. Responder todos los ítems.
7. Marcar al menos un ítem como NO.
8. Completar condición, medida y foto para ese ítem.
9. Confirmar empresa y responsables.
10. Guardar.
11. Verificar en `mobile_sync_operations`:

```sql
select operation_type, status, local_id, remote_id, error_code, error_message
from mobile_sync_operations
order by created_at desc
limit 30;
```

12. Deben existir:

```txt
CREATE_INSPECTION
UPSERT_INSPECTION_ANSWER por cada ítem respondido
CREATE_INSPECTION_FINDING por cada ítem NO
```
Si no hay ítems NO, debe existir:

```txt
CLOSE_INSPECTION
```

## Pendientes

1. Mejorar etiqueta del widget de foto general, hoy reutiliza `PhotoStepWidget`.
2. Persistir nombres de responsables además de IDs para success screen.
3. Agregar ownerUserId real en findings cuando el contrato lo permita.
4. Validar compilación local con `pnpm web -- --clear`.
