# Fase 3 - Notificaciones internas

## Objetivo

Cerrar la brecha pendiente de la Fase 3 del roadmap incorporando notificaciones internas asociadas a workflows.

## Cambios implementados

Se agregó el módulo:

```txt
apps/api/src/modules/notifications
```

Con:

```txt
NotificationEntity
NotificationRecipientEntity
NotificationsService
NotificationsController
NotificationsModule
```

## Tablas agregadas

```txt
notifications
notification_recipients
```

Migraciones:

```txt
1782500000000-CreateNotifications.ts
1782501000000-SeedNotificationPermissions.ts
```

## Endpoints disponibles

```txt
GET /api/notifications
GET /api/notifications?unreadOnly=true
PATCH /api/notifications/:id/read
POST /api/notifications
```

## Permisos

```txt
notifications:read
notifications:write
```

Asignación inicial:

```txt
ADMIN: notifications:read, notifications:write
SUPERVISOR: notifications:read
INSPECTOR: notifications:read
APPROVER: notifications:read
VIEWER: notifications:read
```

## Integración con workflow

Al iniciar un workflow mediante:

```txt
POST /api/workflows/start
```

se crea una notificación interna de categoría `workflow` para el usuario que inicia el flujo, cuando el request incluye `startedByUserId`.

## Smoke test

Se agregó:

```txt
apps/api/src/test/api-notifications-smoke.ts
```

Comando:

```powershell
pnpm --filter api exec ts-node src/test/api-notifications-smoke.ts
```

El smoke test valida:

```txt
login real
creación de workflow
creación automática de notificación
consulta de notificaciones no leídas
marcado como leído
```

## Estado

Con esta iteración, la Fase 3 queda cerrada a nivel backend/API para workflow y notificaciones internas básicas.

Queda pendiente para una etapa posterior:

```txt
notificaciones por email
notificaciones por cola/eventos
plantillas avanzadas
preferencias por usuario
notificaciones a roles/grupos completos
```
