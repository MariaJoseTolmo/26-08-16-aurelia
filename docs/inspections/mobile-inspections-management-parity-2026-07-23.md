# Homologación Web → Mobile · Gestión de Inspecciones

Fecha: 2026-07-23  
Rama: `feature/inspecciones/carlo`

## Alcance

Esta fase homologa en `apps/mobile-inspecciones` el flujo operativo existente en Web para Gestión de Inspecciones. Web permanece como fuente de verdad de comportamiento y los frames de Figma se utilizan como fuente de verdad visual. No se habilitan Superadmin operativo, prórroga, disputa de hallazgo ni vencimientos/escalamiento SLA de segunda iteración.

## Matriz de paridad

| Capacidad Web | Fuente Web | Implementación Mobile | Estado | Decisión |
| --- | --- | --- | --- | --- |
| KPIs de gestión | `InspectionsManagementView.tsx` | `MobileInspectionManagementScreen.tsx` consume `management-kpis` | **Cumple** | Mismos KPIs de total, abiertas, pendientes de aprobación y cierre de observaciones. |
| Listado y priorización | `InspectionsManagementView.tsx` | `MobileInspectionManagementScreen.tsx` consume `management-table` y conserva el orden del backend | **Cumple** | La API sigue siendo la fuente de priorización y scope. |
| Contadores por estado | Tabla y `InspectionDetailRealDataModal.tsx` | Tarjetas y detalle muestran ejecutadas, abiertas, cerradas y rechazadas | **Cumple** | Se utilizan counters reales de API, sin inferir permisos ni datos. |
| Filtros principales | Filtros de tabla Web | `MobileInspectionFiltersSheet.tsx` | **Cumple** | Número, inspector, tipo, estado/urgencia, grupo de observaciones, área y empresa. |
| Paginación y refresco | Tabla Web | Paginación de API y pull-to-refresh | **Cumple** | No se filtra ni pagina solo en memoria. |
| Apertura de detalle | `InspectionDetailModalDataBridge.tsx` | `MobileInspectionDetailModal.tsx` full-screen | **Cumple** | Conserva el contexto del dashboard y el hallazgo solicitado por deep link. |
| Observaciones / Ítems NO | `InspectionDetailRealDataModal.tsx` | Acordeones por ejecutadas, abiertas, cerradas y rechazadas | **Cumple** | Variantes visuales y acciones se ajustan según el estado real. |
| Ejecutar hallazgo | `useInspectionFindingActions.ts` | Carga foto posterior, crea/vincula evidencia y cambia a `IN_PROGRESS` | **Cumple** | Disponible solo con `inspections:execute`; backend conserva autoridad final. |
| Reenviar evidencia rechazada | `useInspectionFindingActions.ts` | Endpoint de `evidence-resubmissions` | **Cumple** | Mantiene trazabilidad y exige nueva evidencia. |
| Aprobar / rechazar | `useInspectionFindingActions.ts` | Cierre o rechazo con motivo | **Cumple** | Disponible solo con `inspections:review`. |
| Reasignar responsables | Datos generales Web | Selector de usuarios de la empresa responsable | **Cumple** | Disponible solo con `inspections:reassign`; no incluye reasignación de SLA. |
| Seguimientos | Tab Web | Timeline con inspección inicial, seguimientos y transiciones del hallazgo | **Cumple** | Orden cronológico y marcadores equivalentes a Web. |
| Datos generales | Tab Web | Inspector, empresa, área, sector, fecha, tipo, ubicación y responsables | **Cumple** | Usa el endpoint protegido de detalle y conserva reasignación por capability. |
| Resultado checklist | Tab Resultado Web | `MobileInspectionChecklistResultPanel.tsx` | **Cumple** | Consume `checklistResult` desde `InspectionDetailResponse`: resumen, composición y detalle ítem a ítem. |
| Historial | `InspectionsHistoryView.tsx` | Pestaña Historial con KPIs, tabla y detalle read-only | **Cumple** | Consume endpoints de historial; ninguna acción de mutación se muestra. |
| Deep link / notificación | `InspectionNotificationDeepLinkModal.tsx` | Ruta Expo con `inspectionId`, `findingId` y `group` | **Cumple** | Abre la inspección y expande el grupo real del hallazgo. |
| Read-only por permisos | `inspection-capabilities.ts` | `mobileInspectionCapabilities.ts` + modal | **Cumple** | `read` permite consultar; `execute`, `review` y `reassign` habilitan solo su acción. |
| Levantamiento existente | Flujo mobile homologado | Borradores, nueva inspección y sincronización offline permanecen conectados | **Cumple** | No se reescriben stores, rutas ni contratos del levantamiento. |

## Mapping de componentes

| Web | Mobile |
| --- | --- |
| `InspectionsManagementView` | `MobileInspectionManagementScreen` |
| `InspectionsHistoryView` | modo `history` de `MobileInspectionManagementScreen` |
| `InspectionDetailModalDataBridge` | `useMobileInspectionDetail` + `MobileInspectionDetailModal` |
| `InspectionDetailRealDataModal` | `MobileInspectionDetailModal` |
| `InspectionChecklistResultPanel` | `MobileInspectionChecklistResultPanel` |
| `useInspectionFindingActions` | `useMobileInspectionFindingActions` |
| filtros de tabla | `MobileInspectionFiltersSheet` |
| `InspectionNotificationDeepLinkModal` | `mobileNotificationDeepLink` + parámetros Expo Router |
| `inspection-capabilities` | `mobileInspectionCapabilities` |

## Decisiones de UX

### Opción implementada

Detalle como modal full-screen sobre el dashboard.

- Conserva el contexto de Gestión o Historial.
- Mantiene el patrón de modal utilizado en Web.
- Permite cerrar y volver al mismo listado y filtros.
- Facilita abrir directamente un hallazgo desde notificación.

### Fidelización visual de detalle

Fuentes utilizadas:

- Web: `InspectionDetailRealDataModal.tsx`.
- Figma Hallazgo / Observaciones: nodo `517:14363`.
- Figma Hallazgo / Seguimientos: nodo `517:14207`.
- Figma Hallazgo / Datos generales: nodo `517:14292`.
- Figma Checklist / Resultado completo: nodo `718:42706`.

Cambios aplicados:

- Cabecera azul oscuro con número, título, criticidad, plantilla, fecha y cierre.
- Copies exactos de tabs: `Observaciones`, `Ítems NO`, `Resultado completo`, `Seguimientos` y `Datos generales`.
- Acordeones por estado con counters reales.
- Tarjetas diferenciadas por estado con condición, medida, acción tomada, rechazo, responsables, evidencias y SLA.
- Acciones de ejecutar, reenviar, aprobar y rechazar conservadas según capability.
- Timeline declarativo equivalente a Web.
- Datos generales en filas compactas y responsables en sección independiente.
- Resultado checklist con barra de composición, cuatro métricas y respuestas ítem a ítem.

No se agregó un botón mobile de descarga PDF sin un mecanismo autenticado confiable para abrir el archivo fuera de la aplicación. Esto evita introducir un control visualmente correcto pero funcionalmente roto.

## Capabilities

- `inspections:read`: acceso al dashboard, historial y detalle.
- `inspections:create`: nueva inspección y continuidad de borradores.
- `inspections:execute`: ejecutar o reenviar evidencia.
- `inspections:review`: aprobar o rechazar ejecución.
- `inspections:reassign`: reasignar responsables.
- `inspections:admin`: no agrega funciones nuevas en esta fase.

No se reconoce `inspections:write` ni se deriva `execute` desde `create`.

## Archivos de implementación

- `apps/mobile-inspecciones/src/shared/services/http-client.ts`: soporte PATCH autenticado.
- `apps/mobile-inspecciones/src/shared/services/inspections.api.ts`: endpoints de gestión, historial, detalle, acciones, evidencia y responsables.
- `apps/mobile-inspecciones/src/modules/inspection/hooks/useMobileInspectionManagement.ts`: queries, mutations, invalidación y guards por capability.
- `apps/mobile-inspecciones/src/modules/inspection/MobileInspectionFiltersSheet.tsx`: filtros principales adaptados a mobile.
- `apps/mobile-inspecciones/src/modules/inspection/MobileInspectionDetailModal.tsx`: cabecera, observaciones, acciones, timeline, datos generales y read-only fidelizados.
- `apps/mobile-inspecciones/src/modules/inspection/MobileInspectionChecklistResultPanel.tsx`: resultado completo real y detalle ítem a ítem.
- `apps/mobile-inspecciones/src/modules/inspection/MobileInspectionManagementScreen.tsx`: dashboard Gestión/Historial, KPIs, listado, borradores y deep link.
- `apps/mobile-inspecciones/src/shared/services/mobileNotificationDeepLink.ts`: preserva contexto de inspección, hallazgo y grupo.
- `apps/mobile-inspecciones/app/inspection/dashboard.tsx`: activa el flujo y mantiene la sincronización automática offline.

## Validación obligatoria

```powershell
pnpm --filter @aurelia/contracts build
pnpm --filter mobile-inspecciones typecheck
pnpm --filter mobile-inspecciones lint
pnpm --filter mobile-inspecciones test:smoke
```

## Validación funcional mínima

1. Viewer con `read`: consulta Gestión, Historial y detalle sin acciones.
2. Inspector con `create`: inicia y continúa levantamientos, sin adquirir `execute`.
3. Responsable con `execute`: ejecuta abiertas y reenvía rechazadas con foto posterior.
4. Verificador con `review`: aprueba o rechaza ejecutadas.
5. Usuario con `reassign`: cambia responsables sin editar SLA.
6. Deep link de inspección: abre detalle general.
7. Deep link con `findingId`: abre el grupo real del hallazgo.
8. Historial: detalle siempre read-only aunque el usuario tenga capabilities operativas.
9. Checklist: resultado completo muestra totales y respuestas de `InspectionDetailResponse`.
10. Borrador previo: continúa por chat o flujo manual sin pérdida de estado.
11. Usuario fuera de scope: recibe `403` del backend y no obtiene información cruzada.

## Riesgos residuales

1. La confirmación pixel-perfect final requiere capturas comparativas en Android, iOS y React Native Web con la misma inspección y evidencias reales.
2. La descarga PDF mobile queda pendiente hasta disponer de apertura autenticada o URL firmada; la exportación Web no cambia.
3. Las mutaciones de Gestión dependen de conectividad, igual que Web. El levantamiento offline existente no fue alterado.
