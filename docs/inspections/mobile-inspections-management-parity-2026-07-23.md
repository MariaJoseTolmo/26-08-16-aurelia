# Homologación Web → Mobile · Gestión de Inspecciones

Fecha: 2026-07-23  
Rama: `feature/inspecciones/carlo`

## Alcance

Esta fase homologa en `apps/mobile-inspecciones` el flujo operativo existente en Web para Gestión de Inspecciones. Web permanece como fuente de verdad de comportamiento. No se habilitan Superadmin operativo, prórroga, disputa de hallazgo ni vencimientos/escalamiento SLA de segunda iteración.

## Matriz de paridad

| Capacidad Web | Fuente Web | Implementación Mobile | Estado | Decisión |
| --- | --- | --- | --- | --- |
| KPIs de gestión | `InspectionsManagementView.tsx` | `MobileInspectionManagementScreen.tsx` consume `management-kpis` | **Cumple** | Mismos KPIs de total, abiertas, pendientes de aprobación y cierre de observaciones. |
| Listado y priorización | `InspectionsManagementView.tsx` | `MobileInspectionManagementScreen.tsx` consume `management-table` y conserva el orden del backend | **Cumple** | La API sigue siendo la fuente de priorización y scope. |
| Contadores por estado | Tabla y `InspectionDetailRealDataModal.tsx` | Tarjetas y detalle muestran ejecutadas, abiertas, cerradas y rechazadas | **Cumple** | Se utilizan counters reales de API, sin inferir permisos ni datos. |
| Filtros principales | Filtros de tabla Web | `MobileInspectionFiltersSheet.tsx` | **Cumple** | Número, inspector, tipo, estado/urgencia, grupo de observaciones, área y empresa. Los filtros especializados de escritorio permanecen en Web. |
| Paginación y refresco | Tabla Web | Paginación de API y pull-to-refresh | **Cumple** | No se filtra ni pagina solo en memoria. |
| Apertura de detalle | `InspectionDetailModalDataBridge.tsx` | `MobileInspectionDetailModal.tsx` full-screen | **Cumple** | Modal full-screen recomendado para conservar el contexto del dashboard. |
| Observaciones / Ítems No | `InspectionDetailRealDataModal.tsx` | Acordeones por ejecutadas, abiertas, cerradas y rechazadas | **Cumple** | Hallazgo y checklist comparten el contrato de detalle. |
| Ejecutar hallazgo | `useInspectionFindingActions.ts` | Carga foto posterior, crea/vincula evidencia y cambia a `IN_PROGRESS` | **Cumple** | Disponible solo con `inspections:execute`; backend conserva autoridad final. |
| Reenviar evidencia rechazada | `useInspectionFindingActions.ts` | Endpoint de `evidence-resubmissions` | **Cumple** | Mantiene trazabilidad y exige nueva evidencia. |
| Aprobar / rechazar | `useInspectionFindingActions.ts` | Cierre o rechazo con motivo | **Cumple** | Disponible solo con `inspections:review`. |
| Reasignar responsables | Datos generales Web | Selector de usuarios de la empresa responsable | **Cumple** | Disponible solo con `inspections:reassign`; no incluye reasignación de SLA. |
| Seguimientos | Tab Web | Timeline con seguimientos y transiciones del hallazgo | **Cumple** | Muestra los eventos disponibles en `InspectionDetailResponse`. |
| Datos generales | Tab Web | Inspector, empresa, área/sector, fecha, ubicación y responsables | **Cumple** | Usa el endpoint protegido de detalle. |
| Resultado checklist | Tab Resultado Web | Tab Resultado mobile | **Cumple con fuente actual** | La vista Web actual no implementa contenido completo del resultado y el contrato de detalle no expone todas las respuestas. Mobile conserva el tab y el resumen disponible sin crear un contrato paralelo. |
| Historial | `InspectionsHistoryView.tsx` | Pestaña Historial con KPIs, tabla y detalle read-only | **Cumple** | Consume endpoints de historial; ninguna acción de mutación se muestra. |
| Deep link / notificación | `InspectionNotificationDeepLinkModal.tsx` | Ruta Expo con `inspectionId`, `findingId` y `group` | **Cumple** | Abre la inspección y expande el grupo real del hallazgo. |
| Read-only por permisos | `inspection-capabilities.ts` | `mobileInspectionCapabilities.ts` + modal | **Cumple** | `read` permite consultar; `execute`, `review` y `reassign` habilitan solo su acción. |
| Levantamiento existente | Flujo mobile homologado | Borradores, nueva inspección y sincronización offline permanecen conectados | **Cumple** | Se reutilizan stores/rutas existentes, `inspections:create` y `useAutoSyncPendingOperations`; no se reescribe el levantamiento. |

## Mapping de componentes

| Web | Mobile |
| --- | --- |
| `InspectionsManagementView` | `MobileInspectionManagementScreen` |
| `InspectionsHistoryView` | modo `history` de `MobileInspectionManagementScreen` |
| `InspectionDetailModalDataBridge` | `useMobileInspectionDetail` + `MobileInspectionDetailModal` |
| `InspectionDetailRealDataModal` | `MobileInspectionDetailModal` |
| `useInspectionFindingActions` | `useMobileInspectionFindingActions` |
| filtros de tabla | `MobileInspectionFiltersSheet` |
| `InspectionNotificationDeepLinkModal` | `mobileNotificationDeepLink` + parámetros Expo Router |
| `inspection-capabilities` | `mobileInspectionCapabilities` |

## Decisiones de UX

### Opción implementada y recomendada

Detalle como modal full-screen sobre el dashboard.

- Conserva el contexto de Gestión o Historial.
- Es consistente con el modal Web.
- Permite cerrar y volver al mismo listado/filtro.
- Facilita abrir directamente un hallazgo desde notificación.

### Alternativa descartada por ahora

Ruta dedicada por inspección.

- Ventaja: navegación nativa más simple y URLs internas explícitas.
- Desventaja: exige persistir/restaurar modo, página y filtros del dashboard y reduce la fidelidad con el flujo Web actual.

## Capabilities

- `inspections:read`: acceso al dashboard, historial y detalle.
- `inspections:create`: nueva inspección y continuidad de borradores.
- `inspections:execute`: ejecutar o reenviar evidencia.
- `inspections:review`: aprobar o rechazar ejecución.
- `inspections:reassign`: reasignar responsables.
- `inspections:admin`: no agrega funciones nuevas en esta fase.

No se reconoce `inspections:write` ni se deriva `execute` desde `create`.

## Archivos de implementación

- `apps/mobile-inspecciones/src/shared/services/http-client.ts`
  - Soporte PATCH autenticado.
- `apps/mobile-inspecciones/src/shared/services/inspections.api.ts`
  - Endpoints de gestión, historial, detalle, acciones, evidencia y responsables.
- `apps/mobile-inspecciones/src/modules/inspection/hooks/useMobileInspectionManagement.ts`
  - Queries, mutations, invalidación y guards por capability.
- `apps/mobile-inspecciones/src/modules/inspection/MobileInspectionFiltersSheet.tsx`
  - Filtros principales adaptados a mobile.
- `apps/mobile-inspecciones/src/modules/inspection/MobileInspectionDetailModal.tsx`
  - Detalle, acciones, seguimientos, datos generales y read-only.
- `apps/mobile-inspecciones/src/modules/inspection/MobileInspectionManagementScreen.tsx`
  - Dashboard Gestión/Historial, KPIs, listado, borradores y deep link.
- `apps/mobile-inspecciones/src/shared/services/mobileNotificationDeepLink.ts`
  - Preserva contexto de inspección/hallazgo/grupo.
- `apps/mobile-inspecciones/app/inspection/dashboard.tsx`
  - Activa el nuevo flujo y mantiene la sincronización automática offline.

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
9. Borrador previo: continúa por chat o flujo manual sin pérdida de estado.
10. Usuario fuera de scope: recibe `403` del backend y no obtiene información cruzada.

## Riesgos residuales

1. El contrato `InspectionDetailResponse` no incluye el conjunto completo de respuestas afirmativas del checklist. La vista Web actual tampoco implementa contenido real en `ChecklistResultPanel`; por ello no se creó un contrato alternativo en mobile.
2. La confirmación final de layout en Android/iOS requiere prueba sobre dispositivo o emulador con datos reales y evidencias protegidas.
3. Las mutations dependen de conectividad, igual que la gestión Web. El levantamiento offline existente no fue alterado.
