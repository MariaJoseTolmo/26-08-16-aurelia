# Alineación de contratos compartidos - Fase 3 y Fase 6

## Objetivo

Corregir la deuda detectada después de la implementación de Fase 7.2: algunas partes de Fase 3 y Fase 6 funcionaban correctamente a nivel backend/API, pero todavía usaban interfaces locales en `apps/api` o contratos incompletos en `packages/contracts`.

## Fase 6 - Reports

### Estado antes del ajuste

Reports ya usaba parcialmente contratos compartidos:

```txt
ReportFilterRequest
ReportSummaryResponse
```

Pero las respuestas específicas de reportabilidad operacional estaban definidas localmente dentro del service API:

```txt
CountReportRow
PeriodReportRow
InspectionSummaryReport
IncidentSummaryReport
OpenItemsReport
```

### Ajuste realizado

Se ampliaron los contratos compartidos en:

```txt
packages/contracts/src/dtos/reports/report-filter.request.ts
packages/contracts/src/dtos/reports/report-summary.response.ts
```

Contratos agregados:

```txt
CountReportRowResponse
PeriodReportRowResponse
InspectionSummaryReportResponse
IncidentActionPlansSummaryResponse
IncidentSummaryReportResponse
OpenItemsReportResponse
```

También se amplió `ReportFilterRequest` con:

```txt
companyId
status como string compatible con los distintos módulos
```

### API actualizada

```txt
apps/api/src/modules/reports/reports.service.ts
apps/api/src/modules/reports/reports.controller.ts
```

El módulo Reports ahora expone respuestas tipadas desde `@aurelia/contracts`.

## Fase 3 - Notifications

### Estado antes del ajuste

Notifications no tenía contratos compartidos. Las interfaces de respuesta estaban definidas dentro de `NotificationsService`.

### Ajuste realizado

Se agregaron contratos compartidos en:

```txt
packages/contracts/src/interfaces/notification.interface.ts
packages/contracts/src/dtos/notifications/create-notification.request.ts
packages/contracts/src/dtos/notifications/notification.response.ts
packages/contracts/src/dtos/notifications/index.ts
```

Contratos agregados:

```txt
NotificationRecipient
NotificationMessage
MarkAllNotificationsReadResult
CreateNotificationRequest
NotificationResponse
NotificationRecipientResponse
MarkAllNotificationsReadResponse
```

### API actualizada

```txt
apps/api/src/modules/notifications/dto/create-notification.dto.ts
apps/api/src/modules/notifications/notifications.service.ts
apps/api/src/modules/notifications/notifications.controller.ts
```

Los DTOs locales mantienen validaciones con `class-validator`, pero ahora implementan contratos compartidos.

## Resultado

Con este ajuste:

```txt
Fase 3 notifications queda alineada a contracts
Fase 6 reports queda alineada a contracts
Fase 7 MUE/critical-controls ya venía alineada desde el ajuste anterior
```

## Validación recomendada

```powershell
pnpm --filter @aurelia/contracts build
pnpm --filter api build
pnpm --filter api test:smoke
pnpm --filter api test:scope
pnpm --filter api exec ts-node src/test/api-reports-smoke.ts
pnpm --filter api exec ts-node src/test/api-notifications-smoke.ts
pnpm --filter api exec ts-node src/test/api-mue-smoke.ts
```
