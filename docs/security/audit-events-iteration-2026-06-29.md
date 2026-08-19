# Audit events iteration - 2026-06-29

## Objetivo

Registrar eventos críticos de seguridad y operación sin bloquear el flujo funcional si el registro de auditoría falla.

## Cambios aplicados

Se reutiliza la tabla existente `audit_logs` y el módulo `AuditModule`.

Se agregó:

```txt
apps/api/src/modules/audit/audit-http.interceptor.ts
```

El interceptor global registra eventos seleccionados después de ejecutar la petición o al capturar un error.

## Eventos auditados

```txt
auth.login.success
auth.login.failed
auth.refresh.success
auth.refresh.failed
auth.logout.success
auth.logout.failed
auth.logout_all.success
auth.logout_all.failed
mobile.sync.success
mobile.sync.failed
inspection.created.success
inspection.created.failed
inspection.updated.success
inspection.updated.failed
incident.created.success
incident.created.failed
incident.updated.success
incident.updated.failed
spr.submitted.success
spr.submitted.failed
spr.approved.success
spr.approved.failed
spr.rejected.success
spr.rejected.failed
evidence.validated.success
evidence.validated.failed
```

## Metadata registrada

```txt
method
path
statusCode
durationMs
errorName
ipAddress
userAgent
actorUserId
entityType
entityId
```

No se registra el cuerpo de las peticiones para evitar almacenar contraseñas, tokens, evidencias u otra información sensible.

## Protección del endpoint de auditoría

`GET /api/audit` queda protegido con `permissions:read`.

## Comportamiento ante fallas

`AuditService.logSafe` encapsula el registro y solo emite warning si la auditoría falla. La operación principal no se revierte por un error al escribir auditoría.

## Pendiente

Validar con negocio si se requiere permiso dedicado `audit:read` en vez de reutilizar `permissions:read`.
