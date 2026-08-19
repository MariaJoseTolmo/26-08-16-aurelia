# Paridad chatbot mobile-inspecciones hacia web

Fecha: 2026-07-06
Modulo destino: `apps/web/src/modules/inspections/new-inspection/steps/AssistantChatStep.tsx`
Modulo referencia: `apps/mobile-inspecciones/src/modules/inspection/InspectionChatScreenV2.tsx`

## Objetivo

Llevar el flujo web de nueva inspeccion con asistente AurelIA a una paridad progresiva con el chatbot actual de `mobile-inspecciones`, evitando que el usuario sea derivado al flujo manual y reduciendo diferencias funcionales, visuales y de copy.

## Criterio rector

El asistente no debe comportarse como un wizard con pantallas. Debe comportarse como una conversacion basada en mensajes, igual que mobile:

- `messages`: historial real de mensajes y widgets.
- `resolvedMessages`: bloqueo de decisiones ya tomadas.
- `waiting`: input textual activo solo cuando el bot espera texto.
- `push()`: agrega mensajes o widgets al historial.
- `markResolved()`: congela widgets ya usados.
- `pushError()`: agrega error contextual con retry.
- `renderMessage()`: renderiza cada unidad del historial segun su tipo.

## Auditoria de brechas detectadas

| Prioridad | Brecha | Estado mobile | Estado web antes de iterar | Accion requerida |
| --- | --- | --- | --- | --- |
| Alta | Motor conversacional | Usa `messages`, `resolvedMessages`, `waiting`, `push`, `markResolved` | Usaba `stage` global y estados locales | Reemplazar por motor de mensajes |
| Alta | Input textual | `ChatInput` inferior habilitado cuando `waiting !== null` | Textareas inline dentro del historial | Implementar input inferior equivalente |
| Alta | Borradores | Persiste draft y estado de chat, permite continuar o reiniciar | Sin reanudacion de chat | Migrar persistencia en iteracion posterior |
| Alta | Checklist question card | Tarjeta con seccion, codigo, indice, guidance y botones SÍ/NO/N/A | Burbuja simple + quick options | Crear componente web equivalente |
| Alta | Foto general y evidencia | `PhotoStepWidget` con recibo, nombre, GPS y hora | Input file basico | Crear widget web equivalente |
| Alta | IA medida correctiva | `suggestCorrectiveMeasure` + `AiProposalCard` | Medida manual directa | Integrar propuesta IA |
| Alta | Criticidad y SLA | Criticidad + `SlaConfirmWidget` antes de guardar observacion | Criticidad guarda directo | Agregar confirmacion SLA |
| Alta | Sugerencia de empresa | `suggestCompany` + `CompanySuggestionCard` | Lista directa de empresas | Agregar sugerencia y confirmacion |
| Media | Personal responsable | `PersonnelPicker` con sugerido | Chips simples | Crear selector equivalente |
| Media | Errores | `ErrorBubble` con retry contextual | Mensajes inline sin retry | Implementar error como mensaje |
| Media | Catalogos | Local-first/bootstrap en mobile | Endpoints directos en web | Revisar fallback y orden |
| Media | Tipo inspeccion | Mobile consulta catalogo y valida id | Web hardcodea opciones | Consultar tipos reales |
| Media | Resumen | Tarjetas separadas por tipo y boton especifico | Resumen generico | Migrar resumen por tipo |
| Media | Guardado y exito | Guarda y navega a success mobile | Guarda y muestra `SavedStep` web | Definir success web equivalente |
| Baja | Componentes visuales | Componentes dedicados del chat | Componentes inline | Extraer componentes web incrementales |
| Baja | Footer | ChatInput inferior | Footer con volver/texto | Reemplazar por input inferior |

## Plan de iteraciones

### Iteracion 1 - Base conversacional

Estado: completada.

Incluye:

- `messages`, `resolvedMessages`, `waiting`, `photoReceiptByMessageId`.
- `push`, `clearTyping`, `markResolved`, `pushError`.
- `renderMessage` por tipo.
- Flujo base dentro del chat para area, sector, tipo, fecha, ubicacion, plantilla/hallazgo, foto, preguntas, responsables y resumen.
- Input inferior habilitado cuando el bot espera texto.

### Iteracion 2 - Widgets visuales de checklist y fotografia

Estado: parcialmente completada.

- `QuestionCard` web equivalente inicial.
- `PhotoStepWidget` web con recibo de foto, hora y metadata.
- Widgets resueltos congelados con `resolvedMessages`.
- Primera pasada visual global para header, fondo, tarjetas, chips, upload e input inferior.
- Segunda pasada sobre `PhotoStepWidget`: tarjeta dashed centrada, icon box, skip link y receipt verde claro.
- Tercera pasada sobre `QuestionCard`: header compacto, numero de pregunta, botones SÍ/NO/N/A y jerarquia visual mas cercana a mobile.

Pendiente:

- Paridad pixel-perfect contra Figma o nodos mobile.
- Extraccion a componentes pequeños para reducir el tamaño de `AssistantChatStep.tsx`.

### Iteracion 3 - Rama hallazgo IA

Estado: completada funcionalmente.

- Integrar `suggestCorrectiveMeasure`.
- Crear `AiProposalCard` web.
- Permitir aceptar o editar medida.
- Mantener fallback local si `/ai/suggest` falla.
- Segunda pasada visual: borde dorado, header crema con spark, label uppercase, acciones estilo mobile y sombra dorada.

### Iteracion 4 - Criticidad y SLA

Estado: parcialmente completada.

- Card de criticidad con descripcion.
- `SlaConfirmWidget` web.
- Guardado de observacion despues de confirmar SLA.
- Primera pasada visual de cards via stylesheet del modal.
- Segunda pasada visual de SLA: card compacta, input numerico de 55x30 y boton verde estilo mobile.
- Tercera pasada sobre `CriticalityCard`: opciones tipo lista, icono visual, borde y texto mas alineados al selector mobile.

Pendiente:

- Ajuste visual fino contra mobile/Figma.
- Agregar opciones rapidas 1, 3, 7, 14 dias como mobile.

### Iteracion 5 - Empresa y personal

Estado: parcialmente completada.

- Integrado `suggestCompany`.
- Creado `CompanySuggestionCard` web.
- Permite confirmar empresa sugerida o elegir otra.
- Mantiene fallback local si `/ai/suggest` falla.
- `PersonnelPicker` web con usuario sugerido y seleccion multiple ya existe como version inicial.
- Segunda pasada visual de `CompanySuggestionCard`: header crema, label uppercase, reason row, acciones secundaria/primaria estilo mobile.
- Segunda pasada parcial de `PersonnelPicker`: seleccionados en teal surf y sugeridos con tonos mobile.
- Tercera pasada de `PersonnelPicker`: chips transformados visualmente a filas con avatar, check circular y estado seleccionado.

Pendiente:

- Reemplazar visual CSS por markup real con avatar, cargo, badge sugerido y check circular.
- Mejorar heuristica de matching cuando la IA devuelve texto largo y no solo el nombre de empresa.

### Iteracion 6 - Resumen y guardado

Estado: parcialmente completada.

- Resumen diferenciado inicial.
- Botones `Guardar hallazgo` y `Guardar checklist`.
- Pantalla final enriquecida con resumen de area, sector, fecha, registro, empresa y observaciones.
- Correccion: `Nueva inspeccion` desde guardado limpia el draft antes de volver al inicio.
- Tercera pasada visual de `SummaryCard`: cards con sombra, badge teal y boton guardar en teal.

Pendiente:

- Ajustar detalle visual fino contra success mobile.
- Incorporar numero/id de inspeccion creada si el submit expone ese dato al controller.

### Iteracion 7 - Persistencia y reanudacion

Estado: parcialmente completada.

- Persistencia local del draft conversacional en `localStorage`.
- Los objetos `File` no se persisten; solo se conserva el nombre de la evidencia para poder reanudar el contexto.
- La pantalla inicial detecta borrador AurelIA disponible.
- Permite `Continuar borrador` o `Descartar borrador`.
- Al guardar, cancelar o crear otra inspeccion se limpia el snapshot local.
- `AssistantChatStep` reconstruye el punto pendiente desde el draft y continúa en el chat.

Pendiente:

- Persistir historial completo de `messages` si se requiere recuperar visualmente toda la conversación, no solo el siguiente paso.
- Definir comportamiento de evidencias si el usuario reanuda tras recargar y el objeto `File` ya no existe.

### Iteracion 8 - Paridad visual fina

Estado: en curso.

- Agregado `assistant-chat-visual-parity.css` acotado al panel de nueva inspeccion.
- Aplicado ajuste visual a header, fondo del chat, sombras de burbujas/cards, estados hover de chips, upload e input inferior.
- Se agregó clase `new-inspection-modal-panel` para evitar estilos globales fuera del modal.
- Auditados componentes mobile `AiProposalCard`, `CompanySuggestionCard`, `PhotoStepWidget`, `SlaConfirmWidget` y `PersonnelPicker`.
- Segunda pasada aplicada sobre cards IA, empresa, foto, SLA y selección de responsables.
- Tercera pasada aplicada sobre `QuestionCard`, `CriticalityCard`, `SummaryCard`, boton guardar y selector de responsables.

Pendiente:

- Reemplazar selectores CSS de transición por componentes extraídos.
- Validar contra capturas/nodos de Figma para medidas exactas.
- Extraer clases reales por componente para evitar dependencia de selectores Tailwind generados.

## Validacion por iteracion

Comandos esperados:

```bash
pnpm --filter web typecheck
pnpm --filter web build
```

Criterios minimos:

- El asistente nunca navega al flujo manual.
- Cada decision ya tomada queda congelada.
- El historial mantiene orden cronologico real.
- El input textual solo se habilita cuando corresponde.
- No se introduce `any`.
- No se rompen `NewInspectionModalController`, `useSubmitNewInspection` ni stores existentes.
