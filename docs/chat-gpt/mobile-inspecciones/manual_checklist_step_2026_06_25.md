# Manual checklist step - 2026-06-25

## Figma references

- Selector de plantilla: `633:15088`
- Plantilla seleccionada con ítems: `633:15370`
- Formulario llenado / flujo condicional: `633:16568`

Los tres nodos entregaron `get_design_context`. Además, se usó la imagen de flujo entregada en ChatGPT para interpretar reglas de llenado.

## Ruta

```txt
/inspection/manual/observations
```

Archivo Expo Router:

```txt
apps/mobile-inspecciones/app/inspection/manual/observations.tsx
```

Pantalla:

```txt
apps/mobile-inspecciones/src/modules/inspection/ManualChecklistTemplateScreen.tsx
```

## Datos reales usados

El catálogo de plantillas se carga desde el backend:

```txt
GET /api/inspections/templates
```

Servicio mobile:

```txt
apps/mobile-inspecciones/src/shared/services/api/inspection-templates.api.ts
```

Hook TanStack Query:

```txt
apps/mobile-inspecciones/src/modules/inspection/hooks/useInspectionChecklistTemplates.ts
```

Contratos compartidos:

```txt
InspectionChecklistTemplateResponse
InspectionChecklistItem
InspectionAnswerValue
```

## Cambios implementados

- El texto de `/inspection/manual/type` ya no usa `8 plantillas disponibles` en duro.
- Ahora muestra el conteo real desde `useInspectionChecklistTemplates()`.
- Al seleccionar una plantilla en paso 3 se despliega:
  - progreso `respondidos / total`;
  - foto referencial general obligatoria;
  - lista real de ítems de la plantilla;
  - botones `SÍ`, `NO`, `N/A` por ítem.
- Al adjuntar foto general, el placeholder cambia a una card verde con el nombre del archivo.
- Al marcar `SÍ`, el ítem queda en verde y se abre comentario opcional.
- Al marcar `NO`, el ítem queda en rojo y se abre una card de hallazgo con:
  - condición detectada obligatoria;
  - medida correctiva propuesta obligatoria;
  - adjunto de foto obligatorio;
  - SLA calculado como placeholder visual.
- Al marcar `N/A`, el ítem queda en estado neutral.
- Si existe al menos un `NO`, se muestra bloque de responsables.
- La empresa encargada se carga desde `GET /api/organization/companies?isContractor=true` mediante hook TanStack Query.
- El personal encargado queda bloqueado porque todavía no existe endpoint/modelo claro de responsables por empresa en mobile.
- El botón continuar queda deshabilitado hasta cumplir condiciones mínimas.

## Estado local agregado

Archivo:

```txt
apps/mobile-inspecciones/src/modules/inspection/manualInspection.store.ts
```

Campos:

```txt
templateId
templateName
templateCode
templateItemsCount
answersByItemId
detailsByItemId
generalPhoto
findingCompanyId
findingCompanyName
findingResponsibleIds
```

Acciones:

```txt
setTemplate()
setAnswer()
setItemDetail()
setGeneralPhoto()
setFindingCompany()
setFindingResponsibles()
```

Mapeo UI:

```txt
SÍ  -> COMPLIANT
NO  -> NOT_COMPLIANT
N/A -> NOT_APPLICABLE
```

## Reglas actuales de habilitación

Para continuar desde el paso 3 se requiere:

1. Plantilla seleccionada.
2. Foto referencial general adjunta.
3. Todos los ítems respondidos.
4. Si un ítem es `NO`, debe tener condición detectada, medida correctiva y foto.
5. Si existe al menos un `NO`, debe seleccionarse empresa encargada.

El responsable/persona todavía no se exige por falta de endpoint/modelo operativo.

## Evaluación API vs flujo

La API soporta bien la lectura de plantillas, secciones e ítems.

Para guardar respuestas, la API ya tiene un endpoint por inspección. La parte pendiente es que el flujo mobile todavía no crea la inspección antes de responder; por eso las respuestas quedan primero como borrador local y deben sincronizarse cuando se implemente creación/resumen.

Brechas detectadas para el flujo completo:

1. `InspectionChecklistAnswer` soporta `answerValue`, `answerText`, `notes` y valores numéricos, pero no evidencia adjunta directa por respuesta.
2. `InspectionFinding` soporta `checklistItemId`, `description`, `severity`, `ownerUserId` y `dueAt`, pero no tiene `companyId` del contratista responsable.
3. Falta endpoint mobile para listar usuarios/personas responsables filtrados por empresa/contratista.
4. Falta definir si la evidencia de un `NO` se guarda como attachment de finding, de inspection, o de answer.
5. Falta definir si la criticidad/SLA se calcula en frontend, backend o IA.

## Pendientes

1. Confirmar que los seeds tengan todas las plantillas esperadas por Gold Fields.
2. Implementar captura con cámara además de galería si se requiere en web/native.
3. Crear/sincronizar inspección antes de persistir respuestas.
4. Modelar attachments de respuesta/hallazgo.
5. Agregar endpoint de responsables por empresa.
6. Crear paso 4 / resumen.
7. Evaluar arrastre continuo del pin si tap-to-adjust no basta.

## Prueba local

```powershell
cd C:\Users\carlo\Desktop\aurelia\Aurelia
git pull origin main
pnpm install
pnpm --filter api start:dev
```

En otro terminal:

```powershell
cd C:\Users\carlo\Desktop\aurelia\Aurelia\apps\mobile-inspecciones
pnpm web -- --clear
```

Validar:

1. Paso 2 muestra conteo real de plantillas.
2. Paso 3 carga plantillas desde API.
3. Al seleccionar plantilla aparecen progreso, foto e ítems.
4. Adjuntar foto general desde galería.
5. Marcar un ítem como `SÍ`; debe aparecer comentario opcional.
6. Marcar un ítem como `NO`; debe aparecer card de hallazgo con inputs y foto.
7. Adjuntar foto del hallazgo.
8. Confirmar que aparece bloque de responsables cuando hay al menos un `NO`.
9. Seleccionar empresa responsable desde API.
10. Confirmar que continuar se habilita solo si las reglas obligatorias están completas.
