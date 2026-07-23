# Release note · Hardening de procesos de inspecciones

Fecha: 2026-07-23  
Rama: `feature/inspecciones/carlo`

## Alcance implementado

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
- Operación de reenvío atómica: enlaces de evidencia, cambio de estado y registro de iteración se ejecutan en una transacción.
- Auditoría transversal de mutaciones del módulo con actor, request ID, duración, cambios solicitados y resultado sanitizado.

### Notificaciones

- Tracking de entrega `in_app` y correo.
- Estados pendiente, enviada, fallida, rebotada y reintentando.
- Reintento controlado con máximo de intentos y backoff.
- Deep links firmados con expiración configurable y fallback a login.
- Restauración del destino después de iniciar sesión en web y mobile.

### IA asistiva

- Prevalidación explicable de campos mínimos.
- Detección de posible duplicado con score de similitud.
- Persistencia de recomendación, explicación y score.
- Decisión humana obligatoria con aceptación, rechazo u override; actor, fecha y motivo quedan auditados.

### Frontend

- Capa única de capabilities en web y mobile.
- El frontend bloquea invocaciones no autorizadas y la API conserva la autoridad final.
- Perfiles sin capacidades operativas reciben detalle en modo de solo lectura.
- Se eliminó el bridge DOM utilizado para simular autorización de revisión.
- Mobile protege la ruta de creación y conserva compatibilidad temporal con `inspections:write` exclusivamente para perfiles con `inspections:create`.

## Alcance diferido a segunda iteración

No se habilitaron flujos operativos ni UI para:

- Superadmin.
- Solicitudes o resolución de prórroga.
- Disputa de hallazgos.
- Recordatorios, vencimientos y escalamiento escalonado de SLA.

Los modelos preliminares ya existentes pueden permanecer en contratos y migración, pero no constituyen una funcionalidad activa.

## Configuración nueva

```dotenv
NOTIFICATION_DEEP_LINK_SECRET=<secreto-aleatorio-de-produccion>
NOTIFICATION_DEEP_LINK_MINUTES=1440
```

`NOTIFICATION_DEEP_LINK_SECRET` puede usar `JWT_SECRET` como fallback, pero se recomienda un secreto dedicado.

## Migración

Aplicar:

```powershell
pnpm --filter @aurelia/contracts build
pnpm --filter api migration:run
```

La migración crea las tablas de solicitudes operativas, entregas de notificación y evaluaciones IA. También instala capacidades granulares del módulo.

## Riesgos conocidos

1. Tokens emitidos antes de actualizar permisos pueden conservar claims antiguos hasta renovar sesión.
2. Registros históricos sin compañía o área quedan ocultos para usuarios restringidos y requieren saneamiento de datos.
3. Correos existentes no quedan retroactivamente registrados; el tracking comienza con nuevos destinatarios o intentos registrados.
4. La detección de duplicados es asistiva y determinística; no debe utilizarse para rechazar automáticamente.
5. Los botones internos del detalle real todavía dependen de la capacidad expuesta por el hook de acciones para bloquear la invocación. La API impide el bypass; la separación visual completa por acción debe validarse durante la prueba manual de perfiles.

## Rollback

### Código

Revertir los commits del bloque en orden inverso o volver al commit anterior al hardening. No reutilizar una base de datos migrada con binarios anteriores sin aplicar el rollback de esquema.

### Base de datos

Ejecutar el `down` de la migración solo si no existen datos operativos que deban conservarse:

```powershell
pnpm --filter api migration:revert
```

Antes de revertir:

1. Exportar `inspection_process_requests`.
2. Exportar `notification_deliveries`.
3. Exportar `inspection_ai_assessments`.
4. Confirmar que ningún proceso depende de los nuevos permisos.

### Mitigación sin rollback de esquema

Es preferible mantener el esquema y deshabilitar el uso de endpoints nuevos desde routing/configuración. Las tablas son aditivas y no modifican el contenido histórico de inspecciones.

## Gates de validación

```powershell
pnpm --filter @aurelia/contracts build
pnpm --filter api build
pnpm --filter api lint
pnpm --filter api test
pnpm --filter api test:scope
pnpm --filter api test:roles
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter mobile-inspecciones typecheck
pnpm --filter mobile-inspecciones lint
pnpm --filter mobile-inspecciones test:smoke
```

Además debe ejecutarse una matriz manual con Inspector, Responsable EECC, Verificador de cierre, Viewer y Administrador del módulo.
