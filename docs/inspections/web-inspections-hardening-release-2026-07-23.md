# Release note · Cierre de hardening de procesos de inspecciones

Fecha: 2026-07-23  
Rama: `feature/inspecciones/carlo`

## Resumen ejecutivo

1. La API mantiene autoridad final mediante capacidades granulares y scope por compañía/área.
2. No quedan hallazgos Críticos de autorización o deep links abiertos en el código revisado.
3. El deep link web abre inspección, grupo o hallazgo por identificadores y estado React/API, sin polling ni búsqueda de texto.
4. `inspections:write` dejó de habilitar operaciones en web y no habilita mobile cuando falta `inspections:create`.
5. Se eliminó el intervalo periódico del banner de borradores.
6. Los bridges DOM restantes no participan en autorización, scope ni mutaciones críticas.
7. Los bridges visuales restantes se aceptan temporalmente con plan de salida explícito.
8. No se encontraron workflows temporales de validación activos; solo permanece `deploy-dev.yml`.
9. No se habilitó Superadmin, prórroga, disputa ni SLA escalonado.
10. El cierre definitivo requiere ejecutar los gates completos en el entorno local/integración.

## Hallazgos por severidad

| Severidad | Hallazgo | Estado | Evidencia / decisión |
| --- | --- | --- | --- |
| Crítico | Deep link basado en `setInterval`, búsqueda de labels y click programático | **Corregido** | `InspectionNotificationDeepLinkModal.tsx` ya no consulta el DOM. `InspectionNotificationContextModal.tsx` resuelve `inspectionId`, `findingId` y `group` contra `/inspections/:id/detail`. |
| Crítico | Posible autorización visual por permiso legacy `inspections:write` | **Corregido** | Web solo reconoce capabilities canónicas. Mobile elimina `inspections:write` cuando la sesión no contiene `inspections:create`. La API ya exige capabilities granulares. |
| Medio | Polling cada 500 ms del banner de borradores | **Corregido** | `IncompleteInspectionDraftBridge.tsx` usa eventos de navegación/almacenamiento y `MutationObserver`; se eliminó `setInterval`. |
| Medio | Bridges DOM para composición e interacción visual del módulo | **Aceptado Temporal** | No deciden permisos, scope ni transiciones. Impacto: fragilidad ante cambios de clases/estructura. Riesgo residual: degradación visual o de interacción, sin bypass de API. Plan de salida: reemplazar en entregas pequeñas `ChecklistResultBridge`, banner de borradores y overlays visuales por componentes declarativos montados desde las vistas propietarias, retirando luego sus imports de `main.tsx`. |
| Medio | Reanudación web del borrador aún localiza el botón “Nueva inspección” por texto | **Aceptado Temporal** | Justificación: abrir el modal requiere mover el control de apertura al árbol declarativo de `InspectionsManagementView`; hacerlo ahora ampliaría el refactor. Impacto: un cambio de copy puede impedir reanudar desde el banner. Riesgo residual: UX, no pérdida del borrador ni bypass de permisos. Siguiente acción: exponer callback/evento tipado en la vista propietaria y retirar `clickNewInspectionButton`. |
| Bajo | Workflows temporales de aplicación/validación | **Corregido / no presente** | La búsqueda del repositorio solo identifica `.github/workflows/deploy-dev.yml`, que es operativo y no temporal. |

## Cambios aplicados por archivo y propósito

### Seguridad y compatibilidad

- `apps/web/src/shared/auth/inspection-capabilities.ts`
  - Retira el fallback de `inspections:write`.
  - Mantiene excepción únicamente para el rol administrativo ya soportado.
  - La UI web refleja exactamente los claims granulares emitidos por backend.

- `apps/mobile-inspecciones/src/modules/auth/mobileSession.store.ts`
  - Sanitiza sesiones persistidas y nuevas.
  - Conserva el string legacy como alias interno únicamente cuando existe `inspections:create`.
  - Elimina el alias cuando el token solo contiene `inspections:write`.

### Deep links

- `apps/web/src/modules/inspections/components/InspectionNotificationContextModal.tsx`
  - Nueva vista declarativa y de solo lectura para el contexto exacto de la notificación.
  - Resuelve el grupo real del hallazgo desde los datos de API, incluso si el parámetro `group` quedó desactualizado.
  - No utiliza selectores DOM, labels, timers ni clicks sintéticos.
  - Respeta el scope porque consume el endpoint de detalle protegido.

- `apps/web/src/modules/inspections/components/InspectionNotificationDeepLinkModal.tsx`
  - Retira `useEffect`, polling y búsqueda de botones.
  - Abre contexto exacto cuando existe `findingId` o `group`.
  - Conserva el modal general existente cuando el enlace solo identifica la inspección.
  - Limpia los parámetros de notificación al cerrar.

### Bridges y borradores

- `apps/web/src/modules/inspections/components/IncompleteInspectionDraftBridge.tsx`
  - Retira consulta periódica cada 500 ms.
  - Sincroniza mediante `MutationObserver`, `storage`, `focus`, `popstate` y evento de borradores.
  - Mantiene temporalmente la localización del botón por texto; queda documentada como aceptación temporal.

### Documentación

- `docs/inspections/web-inspections-hardening-baseline-2026-07-23.md`
  - Declara que `inspections:write` no es una capability válida de autorización.
  - Incorpora la regla de deep links declarativos.
  - Limita explícitamente los bridges a compatibilidad visual sin autoridad de negocio.

- `docs/inspections/web-inspections-hardening-release-2026-07-23.md`
  - Registra auditoría final, correcciones, aceptaciones temporales, riesgos y gates.

## Alcance implementado previamente y conservado

### Seguridad y roles

- Capacidades canónicas: `read`, `create`, `execute`, `review`, `reassign` y `admin`.
- Guard declarativo para endpoints que admiten capacidades alternativas.
- Autorización backend-first para creación, ejecución, revisión, reasignación y cancelación.
- Scope uniforme por compañía y área en listados, detalle, dashboard, historial y exportaciones.
- Bloqueo de acceso cruzado entre EECC y de recursos sin scope para usuarios restringidos.
- Usuarios Gold Fields pueden cruzar compañías, pero conservan restricciones de área cuando están asignadas.

### Workflow y trazabilidad

- Máquina de estados explícita para inspecciones y hallazgos.
- Cierre reservado a revisión; cancelación reservada a administración del módulo.
- Reenvío de evidencia de hallazgo rechazado con historial de iteraciones.
- Operación de reenvío atómica: enlaces de evidencia, cambio de estado y registro de iteración en una transacción.
- Auditoría transversal de mutaciones con actor, request ID, duración, cambios solicitados y resultado sanitizado.

### Notificaciones e IA asistiva

- Tracking de entrega `in_app` y correo, con reintento y backoff.
- Deep links firmados con expiración configurable y fallback a login.
- Prevalidación explicable, posible duplicado y score de similitud.
- Decisión humana obligatoria y override auditado.

## Alcance diferido a segunda iteración

No se habilitaron flujos operativos ni UI para:

- Superadmin.
- Solicitudes o resolución de prórroga.
- Disputa de hallazgos.
- Recordatorios, vencimientos y escalamiento escalonado de SLA.

Los modelos preliminares existentes pueden permanecer en contratos y migración, pero no constituyen funcionalidad activa.

## Configuración

```dotenv
NOTIFICATION_DEEP_LINK_SECRET=<secreto-aleatorio-de-produccion>
NOTIFICATION_DEEP_LINK_MINUTES=1440
```

`NOTIFICATION_DEEP_LINK_SECRET` puede usar `JWT_SECRET` como fallback, pero se recomienda un secreto dedicado.

## Migración

```powershell
pnpm --filter @aurelia/contracts build
pnpm --filter api migration:run
```

## Resultado de validaciones

Estos comandos son obligatorios para el cierre. **No se marcaron como exitosos desde el conector**, porque no existe ejecución de Node/PostgreSQL sobre el entorno local del desarrollador.

| Comando | Resultado registrado |
| --- | --- |
| `pnpm --filter @aurelia/contracts build` | Pendiente de nueva ejecución local tras los commits de cierre |
| `pnpm --filter api build` | Pendiente de nueva ejecución local |
| `pnpm --filter api lint` | Pendiente de nueva ejecución local |
| `pnpm --filter api test` | Pendiente de nueva ejecución local y BD de integración |
| `pnpm --filter api test:scope` | Pendiente de nueva ejecución local y BD de integración |
| `pnpm --filter api test:roles` | Pendiente de nueva ejecución local y BD de integración |
| `pnpm --filter web typecheck` | Pendiente de nueva ejecución local |
| `pnpm --filter web lint` | Pendiente de nueva ejecución local |
| `pnpm --filter mobile-inspecciones typecheck` | Pendiente de nueva ejecución local |
| `pnpm --filter mobile-inspecciones lint` | Pendiente de nueva ejecución local |
| `pnpm --filter mobile-inspecciones test:smoke` | Pendiente de nueva ejecución local |

### Validación manual requerida

- Inspector: crea y continúa borradores; no revisa ni reasigna.
- Responsable EECC: ejecuta y reenvía evidencia dentro de su compañía/área.
- Verificador: aprueba/rechaza y ve acciones de revisión.
- Viewer: detalle e historial en solo lectura.
- Admin del módulo: cancelación y alcance administrativo esperado.
- Deep link: enlace general abre inspección; enlace con `findingId` abre el hallazgo exacto; enlace con `group` abre el grupo solicitado.

## Riesgos conocidos y aceptaciones temporales

1. Tokens emitidos antes de actualizar permisos pueden conservar claims antiguos hasta renovar sesión. Acción: cerrar sesión y volver a autenticar después de migrar permisos.
2. Registros históricos sin compañía o área quedan ocultos para usuarios restringidos. Acción: saneamiento de datos previo a producción.
3. Los bridges visuales restantes dependen de la estructura generada de algunas vistas. No controlan autorización ni mutaciones, pero pueden degradarse tras cambios UI.
4. La reanudación del banner web todavía depende del texto “Nueva inspección”. El borrador permanece almacenado aunque falle la apertura automática.
5. La detección de duplicados es asistiva y nunca debe rechazar automáticamente.

## Rollback

### Código

Revertir los commits del bloque en orden inverso. No reutilizar una base migrada con binarios anteriores sin revisar compatibilidad de esquema.

### Base de datos

Ejecutar el `down` solo si no existen datos operativos que deban conservarse:

```powershell
pnpm --filter api migration:revert
```

Antes de revertir, exportar:

1. `inspection_process_requests`.
2. `notification_deliveries`.
3. `inspection_ai_assessments`.

## Decisión final

**No listo para cerrar administrativamente hasta ejecutar los gates completos.**

No existen bloqueadores Críticos abiertos identificados en la revisión de código. El único bloqueador de cierre es la falta de evidencia de ejecución de build, lint, smoke tests y pruebas con base de integración después de los commits finales. Los hallazgos Medios restantes están aceptados temporalmente con impacto, riesgo residual y plan de salida documentados.
